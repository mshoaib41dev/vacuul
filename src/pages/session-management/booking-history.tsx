import { useCallback, useEffect, useMemo, useState } from "react";
import type { DateValue } from "@internationalized/date";
import type { RangeValue } from "@react-types/shared";
import { Calendar, Clock, Eye, HomeLine, SearchLg, Star01 } from "@untitledui/icons";
import type { SortDescriptor } from "react-aria-components";
import { Breadcrumbs } from "@/components/application/breadcrumbs/breadcrumbs";
import { DateRangePicker } from "@/components/application/date-picker/date-range-picker";
import { PaginationPageDefault } from "@/components/application/pagination/pagination";
import { Table, TableCard } from "@/components/application/table/table";
import { TableSkeletonRows } from "@/components/application/table/table-skeleton";
import { Badge } from "@/components/base/badges/badges";
import { Button } from "@/components/base/buttons/button";
import { ButtonUtility } from "@/components/base/buttons/button-utility";
import { Input } from "@/components/base/input/input";
import { Select } from "@/components/base/select/select";
import { BookingDetailModal } from "@/components/booking-detail-modal";
import Page from "@/components/page";
import useBookings from "@/hooks/use-bookings";
import { useDebouncedSearch } from "@/hooks/use-debounce";
import useMachines from "@/hooks/use-machines";
import { useLanguage, useTranslations } from "@/lib/LanguageContext";
import type { BookingFilters, BookingTableRow } from "@/types/booking";
import { timestampToDate } from "@/utils/timestamp";

type DateRangeValue = RangeValue<DateValue>;

type SearchableBookingRow = {
    id?: string;
    objectID?: string;
};

const formatDate = (timestamp: Date, locale: string = "en"): string =>
    timestamp.toLocaleDateString(locale, {
        day: "numeric",
        month: "short",
        year: "numeric",
    });

const formatTime = (timestamp: Date, locale: string = "en"): string =>
    timestamp.toLocaleTimeString(locale, {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
    });

const getStatusColor = (status: string): "success" | "warning" | "error" => {
    switch (status) {
        case "completed":
            return "success";
        case "booked":
            return "warning";
        case "cancelled":
            return "error";
        default:
            return "warning";
    }
};

const getSessionStatusColor = (sessionStatus?: string): "success" | "warning" | "error" | "gray" => {
    switch (sessionStatus) {
        case "done":
            return "success";
        case "started":
        case "running":
            return "warning";
        case "cancelled":
        case "paused":
        case "aborted":
            return "error";
        default:
            return "gray";
    }
};

export default function BookingHistory() {
    const t = useTranslations();
    const { currentLocale } = useLanguage();
    const [sortDescriptor, setSortDescriptor] = useState<SortDescriptor>({
        column: "startTime",
        direction: "descending",
    });

    const [searchQuery, setSearchQuery] = useState("");
    const [dateRange, setDateRange] = useState<DateRangeValue | null>(null);
    const [filters, setFilters] = useState<BookingFilters>({
        status: "all",
        machineId: "all",
        sessionStatus: "all",
    });

    const [selectedBookingId, setSelectedBookingId] = useState<string | null>(null);
    const [currentPage, setCurrentPage] = useState(1);

    // Get machines for filter dropdown
    const { machines, loading: machinesLoading } = useMachines({ limit: 100 });

    const bookingFilters = useMemo(
        () => ({
            ...filters,
            dateRange,
        }),
        [filters, dateRange],
    );

    const sessionStatusItems = useMemo(
        () => [
            { id: "all", label: t("bookings.allSessions") },
            { id: "started", label: t("bookings.started") },
            { id: "done", label: t("bookings.done") },
            { id: "aborted", label: t("bookings.status_aborted") },
        ],
        [t],
    );

    const machineItems = useMemo(
        () => [
            { id: "all", label: t("bookings.allMachines") },
            ...machines.map((machine) => ({
                id: machine.id,
                label: machine.name || machine.commissionId || t("bookings.machineFallback", { id: machine.id.slice(0, 8) }),
            })),
        ],
        [machines, t],
    );

    // Reset pagination when filters change
    useEffect(() => {
        setCurrentPage(1);
    }, [filters.status, filters.sessionStatus, filters.machineId, searchQuery, dateRange]);

    // Use the bookings hook with filters
    const {
        bookings,
        loading,
        error,
        count,
        totalPages,
        searchResults,
        searchLoading,
        searchBookings,
        clearSearch,
        cancelBooking,
        hasNextPage,
        hasPreviousPage,
    } = useBookings({
        limit: 10,
        page: currentPage,
        filters: bookingFilters,
    });

    useDebouncedSearch({
        query: searchQuery,
        search: searchBookings,
        clearSearch,
        minLength: 1,
    });

    // Transform bookings into table row format
    const tableData = useMemo((): BookingTableRow[] => {
        const dataSource = searchQuery ? searchResults : bookings;

        return dataSource
            .map((booking) => {
                const bookingId = booking.id || (booking as SearchableBookingRow).objectID || "";
                const startTime = timestampToDate(booking.startTime);
                const endTime = timestampToDate(booking.endTime);

                return {
                    id: bookingId,
                    bookingId,
                    machineName: booking.machineName || t("bookings.unknownMachine"),
                    machineCommissionId: booking.machineCommissionId || t("common.na"),
                    userName: booking.userName || t("bookings.unknownUser"),
                    userEmail: booking.userEmail || t("common.na"),
                    startTime: startTime ? formatTime(startTime, currentLocale) : t("common.na"),
                    endTime: endTime ? formatTime(endTime, currentLocale) : t("common.na"),
                    date: startTime ? formatDate(startTime, currentLocale) : t("common.na"),
                    duration: t("bookings.durationMin", { duration: booking.duration }),
                    status: booking.status,
                    sessionStatus: booking.sessionStatus,
                    statusColor: getStatusColor(booking.status),
                    sessionStatusColor: getSessionStatusColor(booking.sessionStatus),
                    rating: booking.rating,
                    hasDetails: Boolean(booking.sessionStatus),
                    isPast: booking.isPast,
                    isCurrent: booking.isCurrent,
                    isFuture: booking.isFuture,
                };
            })
            .filter((booking) => booking.id);
    }, [bookings, currentLocale, searchResults, searchQuery, t]);

    // Handle sorting
    const sortedItems = useMemo(() => {
        return [...tableData].sort((a, b) => {
            const first = a[sortDescriptor.column as keyof BookingTableRow];
            const second = b[sortDescriptor.column as keyof BookingTableRow];

            if (typeof first === "string" && typeof second === "string") {
                let cmp = first.localeCompare(second);
                if (sortDescriptor.direction === "descending") {
                    cmp *= -1;
                }
                return cmp;
            }

            return 0;
        });
    }, [tableData, sortDescriptor]);

    // Handle search
    const handleSearch = useCallback(
        (query: string) => {
            setSearchQuery(query);

            if (query.trim()) {
                return;
            }

            clearSearch();
        },
        [clearSearch],
    );

    // Handle pagination
    const handlePageChange = (page: number) => {
        setCurrentPage(page);
    };

    const handleNextPage = () => {
        if (hasNextPage) {
            setCurrentPage(currentPage + 1);
        }
    };

    const handlePreviousPage = () => {
        if (hasPreviousPage) {
            setCurrentPage(currentPage - 1);
        }
    };

    // Handle booking actions
    const handleCancelBooking = async (bookingId: string) => {
        try {
            await cancelBooking(bookingId);
        } catch (error) {
            console.error("Failed to cancel booking:", error);
        }
    };

    if (error) {
        return (
            <Page title={t("bookings.title")} className="p-8">
                <div className="flex items-center justify-center py-8">
                    <span className="text-error text-sm">{t("bookings.errorLoading", { error: error.message })}</span>
                </div>
            </Page>
        );
    }

    return (
        <Page title={t("bookings.title")} className="p-8">
            <Breadcrumbs className="mb-4">
                <Breadcrumbs.Item icon={HomeLine} href="/app" />
                <Breadcrumbs.Item>{t("bookings.sessionManagement")}</Breadcrumbs.Item>
                <Breadcrumbs.Item>{t("bookings.title")}</Breadcrumbs.Item>
            </Breadcrumbs>

            <div className="mb-6 flex items-center justify-between">
                <div className="flex flex-col gap-1">
                    <h1 className="text-2xl font-semibold text-primary">{t("bookings.title")}</h1>
                    <p className="text-sm text-tertiary">
                        {t("bookings.description")}
                        {count !== null && ` ${t("common.countTotal", { count })}`}
                    </p>
                </div>
            </div>

            {/* Filters and Search */}
            <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                    <Input
                        placeholder={t("bookings.searchPlaceholder")}
                        icon={SearchLg}
                        className="w-full sm:w-80"
                        value={searchQuery}
                        onChange={handleSearch}
                    />

                    <div className="flex flex-wrap gap-2">
                        <Select
                            aria-label={t("bookings.sessionStatus")}
                            placeholder={t("bookings.sessionStatus")}
                            selectedKey={filters.sessionStatus}
                            onSelectionChange={(key) => setFilters((prev) => ({ ...prev, sessionStatus: key as BookingFilters["sessionStatus"] }))}
                            items={sessionStatusItems}
                        >
                            {(item) => <Select.Item id={item.id} label={item.label} />}
                        </Select>

                        <Select
                            aria-label={t("bookings.machine")}
                            placeholder={t("bookings.machine")}
                            selectedKey={filters.machineId}
                            onSelectionChange={(key) => setFilters((prev) => ({ ...prev, machineId: key as string }))}
                            items={machineItems}
                            isDisabled={machinesLoading}
                        >
                            {(item) => <Select.Item id={item.id} label={item.label} />}
                        </Select>

                        <DateRangePicker
                            value={dateRange}
                            onChange={setDateRange}
                            onApply={() => {
                                // Apply button clicked
                            }}
                            onCancel={() => {
                                setDateRange(null);
                            }}
                        />
                    </div>
                </div>
            </div>

            {/* Table with Loading / Empty State */}
            <TableCard.Root>
                {loading || searchLoading ? (
                    <Table aria-label={t("bookings.title")}>
                        <Table.Header>
                            <Table.Head id="machineName" label={t("bookings.machine")} isRowHeader />
                            <Table.Head id="userName" label={t("bookings.user")} />
                            <Table.Head id="date" label={t("bookings.date")} />
                            <Table.Head id="startTime" label={t("bookings.startTime")} />
                            <Table.Head id="sessionStatus" label={t("bookings.status")} />
                            <Table.Head id="rating" label={t("bookings.rating")} />
                            <Table.Head id="actions" label={t("bookings.actions")} />
                        </Table.Header>
                        <Table.Body>
                            <TableSkeletonRows columns={7} rows={5} />
                        </Table.Body>
                    </Table>
                ) : sortedItems.length > 0 ? (
                    <>
                        <Table aria-label={t("bookings.title")} sortDescriptor={sortDescriptor} onSortChange={setSortDescriptor}>
                            <Table.Header>
                                <Table.Head id="machineName" label={t("bookings.machine")} isRowHeader allowsSorting />
                                <Table.Head id="userName" label={t("bookings.user")} allowsSorting />
                                <Table.Head id="date" label={t("bookings.date")} allowsSorting />
                                <Table.Head id="startTime" label={t("bookings.startTime")} allowsSorting />
                                <Table.Head id="sessionStatus" label={t("bookings.status")} allowsSorting />
                                <Table.Head id="rating" label={t("bookings.rating")} allowsSorting />
                                <Table.Head id="actions" label={t("bookings.actions")} />
                            </Table.Header>

                            <Table.Body items={sortedItems}>
                                {(booking) => (
                                    <Table.Row id={booking.id}>
                                        <Table.Cell>
                                            <div className="flex flex-col">
                                                <span className="text-sm font-medium">{booking.machineName}</span>
                                                <span className="font-mono text-xs text-tertiary">{booking.machineCommissionId}</span>
                                            </div>
                                        </Table.Cell>
                                        <Table.Cell>
                                            <div className="flex flex-col">
                                                <span className="text-sm">{booking.userName}</span>
                                                <span className="text-xs text-tertiary">{booking.userEmail}</span>
                                            </div>
                                        </Table.Cell>
                                        <Table.Cell>
                                            <div className="flex items-center gap-2">
                                                <Calendar className="size-4 text-tertiary" />
                                                <span className="text-sm">{booking.date}</span>
                                            </div>
                                        </Table.Cell>
                                        <Table.Cell>
                                            <div className="flex items-center gap-2">
                                                <Clock className="size-4 text-tertiary" />
                                                <span className="text-sm">
                                                    {booking.startTime} - {booking.endTime}
                                                </span>
                                            </div>
                                        </Table.Cell>
                                        <Table.Cell>
                                            <Badge color={booking.sessionStatus ? booking.sessionStatusColor : booking.statusColor} size="sm">
                                                {t(`bookings.status_${booking.sessionStatus || booking.status}`)}
                                            </Badge>
                                        </Table.Cell>
                                        <Table.Cell>
                                            {booking.rating ? (
                                                <div className="flex items-center gap-1">
                                                    <Star01 className="size-4 fill-warning-400 text-warning-400" />
                                                    <span className="text-sm">{booking.rating.toFixed(1)}</span>
                                                </div>
                                            ) : (
                                                <span className="text-xs text-tertiary">-</span>
                                            )}
                                        </Table.Cell>
                                        <Table.Cell>
                                            <div className="flex gap-1">
                                                {booking.hasDetails && (
                                                    <ButtonUtility
                                                        size="xs"
                                                        color="tertiary"
                                                        tooltip={t("bookings.viewDetails")}
                                                        icon={Eye}
                                                        onClick={() => setSelectedBookingId(booking.bookingId)}
                                                    />
                                                )}
                                                {booking.status === "booked" && booking.isFuture && (
                                                    <Button size="sm" color="secondary-destructive" onClick={() => handleCancelBooking(booking.bookingId)}>
                                                        {t("common.cancel")}
                                                    </Button>
                                                )}
                                            </div>
                                        </Table.Cell>
                                    </Table.Row>
                                )}
                            </Table.Body>
                        </Table>

                        {!searchQuery && totalPages > 1 && (
                            <PaginationPageDefault
                                page={currentPage}
                                total={totalPages}
                                hasNext={hasNextPage}
                                hasPrevious={hasPreviousPage}
                                onPageChange={handlePageChange}
                                onNext={handleNextPage}
                                onPrevious={handlePreviousPage}
                                className="px-4 py-3 md:px-6 md:pt-3 md:pb-4"
                            />
                        )}
                    </>
                ) : (
                    <div className="flex flex-col items-center justify-center py-16">
                        <div className="flex size-12 items-center justify-center rounded-lg bg-primary">
                            <Calendar className="size-6 text-tertiary" />
                        </div>
                        <h3 className="mt-4 text-lg font-medium text-primary">{t("bookings.noBookingsFound")}</h3>
                        <p className="mt-2 max-w-sm text-center text-sm text-tertiary">
                            {searchQuery ? t("bookings.noSearchResults") : t("bookings.noBookingsYet")}
                        </p>
                    </div>
                )}
            </TableCard.Root>

            {/* Booking Detail Modal */}
            <BookingDetailModal bookingId={selectedBookingId} isOpen={Boolean(selectedBookingId)} onClose={() => setSelectedBookingId(null)} />
        </Page>
    );
}
