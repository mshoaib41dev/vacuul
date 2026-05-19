import { useCallback, useMemo, useState } from "react";
import { HomeLine, SearchLg } from "@untitledui/icons";
import { Breadcrumbs } from "@/components/application/breadcrumbs/breadcrumbs";
import { PaginationPageDefault } from "@/components/application/pagination/pagination";
import { BadgeWithDot } from "@/components/base/badges/badges";
import { Button } from "@/components/base/buttons/button";
import { Input } from "@/components/base/input/input";
import { Select } from "@/components/base/select/select";
import Page from "@/components/page";
import useMachine from "@/hooks/use-machines";
import useSystemLogs from "@/hooks/use-system-logs";
import useUser from "@/hooks/use-users";
import { useTranslations } from "@/lib/LanguageContext";

// Log Container Component
interface LogItemProps {
    log: {
        machineId: string;
        sessionId?: string;
        error: {
            code: string;
            message: string;
            severity: string;
            timestamp: any;
        };
    };
}

const LogItem = ({ log }: LogItemProps) => {
    const getSeverityColor = (severity: string): "error" | "warning" | "blue" | "gray" => {
        switch (severity.toLowerCase()) {
            case "critical":
            case "fatal":
                return "error";
            case "error":
                return "error";
            case "warning":
            case "warn":
                return "warning";
            case "info":
            case "information":
                return "blue";
            case "debug":
            case "trace":
                return "gray";
            default:
                return "gray";
        }
    };

    const formatTimestamp = (timestamp: any) => {
        if (!timestamp) return "----";
        const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
        return date.toISOString().substring(0, 19).replace("T", " ");
    };

    const getSeverityShort = (severity: string): string => {
        switch (severity.toLowerCase()) {
            case "critical":
            case "fatal":
                return "CRIT";
            case "error":
                return "ERR ";
            case "warning":
            case "warn":
                return "WARN";
            case "info":
            case "information":
                return "INFO";
            case "debug":
                return "DEBG";
            case "trace":
                return "TRAC";
            default:
                return "????";
        }
    };

    return (
        <div className="px-3 py-1 font-mono text-sm transition-colors hover:bg-active">
            <div className="flex items-center gap-3">
                <BadgeWithDot size="sm" color={getSeverityColor(log.error.severity)} type="color">
                    {getSeverityShort(log.error.severity)}
                </BadgeWithDot>
                <span className="min-w-fit text-tertiary">{formatTimestamp(log.error.timestamp)}</span>
                <span className="min-w-fit font-medium text-secondary">[{log.error.code}]</span>
                <span className="flex-1 truncate text-primary">{log.error.message}</span>
            </div>
        </div>
    );
};

export default function SystemLogs() {
    const t = useTranslations();
    const [selectedMachineId, setSelectedMachineId] = useState<string>("");
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize] = useState(10);
    const [searchQuery, setSearchQuery] = useState("");

    // Load all machines for the dropdown
    const { machines: allMachines, loading: machinesLoading } = useMachine({ limit: 100 });
    const { users } = useUser({ limit: 1000 });

    // Load system logs for selected machine
    const {
        systemLogs,
        loading: logsLoading,
        error: logsError,
        count,
        countLoading,
        totalPages,
        hasNextPage,
        hasPreviousPage,
        searchResults,
        searchLoading,
        searchError,
        searchTotalHits,
        searchSystemLogs,
        clearSearch,
    } = useSystemLogs({
        machineId: selectedMachineId || undefined,
        page: currentPage,
        limit: pageSize,
    });

    // Determine if we're in search mode
    const isSearchMode = searchQuery.trim().length > 0;

    // Create machine options for select component
    const machineOptions = allMachines.map((machine) => ({
        id: machine.id,
        label: `${machine.name} (${machine.commissionId})`,
        supportingText: machine.address,
    }));

    // Handle machine selection
    const handleMachineChange = (machineId: string) => {
        setSelectedMachineId(machineId);
        setCurrentPage(1);
        setSearchQuery("");
        clearSearch();
    };

    // Handle search input changes
    const handleSearchChange = useCallback(
        async (value: string) => {
            setSearchQuery(value);

            if (value.trim().length === 0) {
                clearSearch();
            } else if (value.trim().length >= 2) {
                try {
                    await searchSystemLogs(value.trim());
                } catch (error) {
                    console.error("Search failed:", error);
                }
            }
        },
        [searchSystemLogs, clearSearch],
    );

    // Reset search
    const handleClearSearch = useCallback(() => {
        setSearchQuery("");
        clearSearch();
        setCurrentPage(1);
    }, [clearSearch]);

    // Pagination handlers
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

    // Find selected machine
    const selectedMachine = allMachines.find((machine) => machine.id === selectedMachineId);
    const usersById = useMemo(() => new Map(users.map((user) => [user.id, user])), [users]);
    const selectedMachineCreator = selectedMachine?.createdByUserId ? usersById.get(selectedMachine.createdByUserId) : undefined;
    const selectedMachineCreatorLabel = selectedMachine?.createdByUserId
        ? selectedMachineCreator?.displayName || selectedMachineCreator?.email || selectedMachine.createdByUserId
        : t("common.na");

    // Current logs to display
    const currentLogs = isSearchMode ? searchResults : systemLogs;
    const isLoading = isSearchMode ? searchLoading : logsLoading;
    const currentError = isSearchMode ? searchError : logsError;

    return (
        <Page title={t("systemLogs.title")} className="p-8">
            <Breadcrumbs className="mb-4">
                <Breadcrumbs.Item icon={HomeLine} href="/app" />
                <Breadcrumbs.Item>{t("systemLogs.title")}</Breadcrumbs.Item>
            </Breadcrumbs>

            <div className="mb-6 flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-semibold text-primary">{isSearchMode ? t("common.searchResults") : t("systemLogs.title")}</h1>
                    {isSearchMode ? (
                        <p className="mt-1 text-sm text-tertiary">
                            {t("common.resultsFor", { count: searchTotalHits, query: searchQuery })}
                        </p>
                    ) : selectedMachine ? (
                        <p className="mt-1 text-sm text-tertiary">
                            {t("systemLogs.logsFor", { name: selectedMachine.name })} {!countLoading && count !== null && t("common.countTotal", { count })}
                        </p>
                    ) : (
                        <p className="mt-1 text-sm text-tertiary">{t("systemLogs.selectMachine")}</p>
                    )}
                </div>
            </div>

            <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-end">
                <div className="max-w-sm flex-1">
                    <Select
                        items={machineOptions}
                        placeholder={t("systemLogs.selectMachinePlaceholder")}
                        label={t("systemLogs.machine")}
                        selectedKey={selectedMachineId}
                        onSelectionChange={(key) => handleMachineChange(key as string)}
                        isDisabled={machinesLoading}
                    >
                        {(item) => (
                            <Select.Item key={item.id} id={item.id}>
                                {item.label}
                            </Select.Item>
                        )}
                    </Select>
                </div>

                {selectedMachineId && (
                    <>
                        <Input
                            placeholder={t("systemLogs.searchPlaceholder")}
                            icon={SearchLg}
                            className="max-w-sm"
                            value={searchQuery}
                            onChange={(value) => handleSearchChange(value)}
                        />
                        {isSearchMode && (
                            <Button color="tertiary" onClick={handleClearSearch} className="shrink-0">
                                {t("common.clearSearch")}
                            </Button>
                        )}
                    </>
                )}
            </div>

            {/* Logs Display */}
            <div className="space-y-4">
                {!selectedMachineId ? (
                    <div className="flex items-center justify-center py-12">
                        <div className="text-center">
                            <p className="text-lg font-medium text-secondary">{t("systemLogs.noMachineSelected")}</p>
                            <p className="text-sm text-tertiary">{t("systemLogs.noMachineSelectedDescription")}</p>
                        </div>
                    </div>
                ) : isLoading ? (
                    <div className="flex items-center justify-center py-12">
                        <span className="text-sm text-tertiary">{isSearchMode ? t("common.searchingItem", { item: t("systemLogs.title").toLowerCase() }) : t("common.loadingItem", { item: t("systemLogs.title").toLowerCase() })}</span>
                    </div>
                ) : currentError ? (
                    <div className="flex items-center justify-center py-12">
                        <span className="text-sm text-tertiary">
                            {isSearchMode
                                ? t("common.errorSearching", { item: t("systemLogs.title").toLowerCase(), error: typeof currentError === "string" ? currentError : currentError?.message || t("common.unknownError") })
                                : t("common.errorLoading", { item: t("systemLogs.title").toLowerCase(), error: typeof currentError === "string" ? currentError : currentError?.message || t("common.unknownError") })}
                        </span>
                    </div>
                ) : currentLogs.length === 0 ? (
                    <div className="flex items-center justify-center py-12">
                        <div className="text-center">
                            <p className="text-lg font-medium text-secondary">{t("systemLogs.noLogsFound")}</p>
                            <p className="text-sm text-tertiary">{isSearchMode ? t("common.noResultsFor", { item: t("systemLogs.title").toLowerCase(), query: searchQuery }) : t("systemLogs.noLogsFoundDescription")}</p>
                        </div>
                    </div>
                ) : (
                    <>
                        {/* Terminal-like logs container */}
                        <div className="rounded-lg border border-secondary bg-secondary/10 shadow-xs">
                            {/* Terminal header */}
                            <div className="border-b border-secondary bg-secondary/50 px-4 py-2">
                                <div className="flex flex-wrap items-center gap-2">
                                    <div className="flex gap-1.5">
                                        <div className="h-3 w-3 rounded-full bg-red-500"></div>
                                        <div className="h-3 w-3 rounded-full bg-yellow-500"></div>
                                        <div className="h-3 w-3 rounded-full bg-green-500"></div>
                                    </div>
                                    <span className="font-mono text-sm text-tertiary">
                                        {t("systemLogs.title")} - {selectedMachine?.name} ({count || currentLogs.length} {t("systemLogs.entries")})
                                    </span>
                                    <span className="font-mono text-sm text-tertiary">
                                        {t("systemLogs.machineCreatedBy", { user: selectedMachineCreatorLabel })}
                                    </span>
                                </div>
                            </div>

                            {/* Logs content */}
                            <div className="max-h-96 overflow-y-auto bg-secondary/5">
                                {currentLogs.map((log, index) => (
                                    <LogItem key={`${log.machineId}-${log.error.timestamp}-${index}`} log={log} />
                                ))}
                            </div>
                        </div>

                        {/* Pagination */}
                        {!isSearchMode && totalPages > 1 && (
                            <div className="mt-6">
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
                            </div>
                        )}
                    </>
                )}
            </div>
        </Page>
    );
}
