import { useCallback, useMemo, useState } from "react";
import { Edit01, HomeLine, Plus, SearchLg, Trash01 } from "@untitledui/icons";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Breadcrumbs } from "@/components/application/breadcrumbs/breadcrumbs";
import { DeleteConfirmationModal } from "@/components/application/modals/delete-confirmation-modal";
import { IconNotification } from "@/components/application/notifications/notifications";
import { PaginationPageDefault } from "@/components/application/pagination/pagination";
import { Table, TableCard } from "@/components/application/table/table";
import { BadgeWithDot } from "@/components/base/badges/badges";
import { Button } from "@/components/base/buttons/button";
import { ButtonUtility } from "@/components/base/buttons/button-utility";
import { Input } from "@/components/base/input/input";
import Page from "@/components/page";
import { useDebouncedSearch } from "@/hooks/use-debounce";
import useMachine from "@/hooks/use-machines";
import useUser from "@/hooks/use-users";
import { useTranslations } from "@/lib/LanguageContext";
import type { Machine } from "@/types/machine";

export default function Machines() {
    const navigate = useNavigate();
    const t = useTranslations();
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize] = useState(5); // Items per page
    const [searchQuery, setSearchQuery] = useState("");

    const {
        machines,
        loading,
        error,
        count,
        countLoading,
        totalPages,
        hasNextPage,
        hasPreviousPage,
        deleteMachine,
        searchResults,
        searchLoading,
        searchError,
        searchTotalHits,
        searchMachines,
        clearSearch,
    } = useMachine({
        page: currentPage,
        limit: pageSize,
    });
    const { users } = useUser({ limit: 1000 });

    useDebouncedSearch({
        query: searchQuery,
        search: searchMachines,
        clearSearch,
    });

    const usersById = useMemo(() => new Map(users.map((user) => [user.id, user])), [users]);

    const getCreatorLabel = useCallback(
        (createdByUserId?: string) => {
            if (!createdByUserId) return t("common.na");

            const createdByUser = usersById.get(createdByUserId);
            return createdByUser?.displayName || createdByUser?.email || createdByUserId || t("machines.unknownUser");
        },
        [t, usersById],
    );

    const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; machine: Machine | null }>({
        isOpen: false,
        machine: null,
    });
    const [isDeleting, setIsDeleting] = useState(false);

    // Determine if we're in search mode
    const isSearchMode = searchQuery.trim().length > 0;

    // Handle search input changes with debounced search
    const handleSearchChange = useCallback(
        (value: string) => {
            setSearchQuery(value);

            if (value.trim().length < 2) {
                clearSearch();
            }
        },
        [clearSearch],
    );

    // Reset pagination when switching between search and browse modes
    const handleClearSearch = useCallback(() => {
        setSearchQuery("");
        clearSearch();
        setCurrentPage(1);
    }, [clearSearch]);

    const handleEdit = (machine: Machine) => {
        navigate(`/app/machines/edit/${machine.id}`);
    };

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

    const handleDeleteClick = (machine: Machine) => {
        setDeleteModal({ isOpen: true, machine });
    };

    const handleDeleteConfirm = async () => {
        if (!deleteModal.machine) return;

        setIsDeleting(true);
        try {
            await deleteMachine(deleteModal.machine.id);

            toast.custom((toastId) => (
                <IconNotification
                    title={t("common.success")}
                    description={t("machines.deleteSuccess")}
                    color="success"
                    hideDismissLabel={true}
                    onClose={() => toast.dismiss(toastId)}
                />
            ));

            setDeleteModal({ isOpen: false, machine: null });

            // If we're on a page that no longer has items, go back to page 1
            if (machines.length === 1 && currentPage > 1) {
                setCurrentPage(1);
            }
        } catch (error) {
            console.error("Error deleting machine:", error);
            toast.custom((toastId) => (
                <IconNotification
                    title={t("common.error")}
                    description={t("machines.deleteFailed")}
                    color="error"
                    hideDismissLabel={true}
                    onClose={() => toast.dismiss(toastId)}
                />
            ));
        } finally {
            setIsDeleting(false);
        }
    };

    const handleDeleteCancel = () => {
        setDeleteModal({ isOpen: false, machine: null });
    };

    return (
        <Page title={t("machines.allMachines")} className="p-8">
            <Breadcrumbs className="mb-4">
                <Breadcrumbs.Item icon={HomeLine} href="/app" />
                <Breadcrumbs.Item>{t("nav.machines")}</Breadcrumbs.Item>
            </Breadcrumbs>

            <div className="mb-6 flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-semibold text-primary">{isSearchMode ? t("common.searchResults") : t("machines.allMachines")}</h1>
                    {isSearchMode ? (
                        <p className="mt-1 text-sm text-tertiary">{t("common.resultsFor", { count: searchTotalHits, query: searchQuery })}</p>
                    ) : (
                        !countLoading &&
                        count !== null && (
                            <p className="mt-1 text-sm text-tertiary">{t("common.totalCount", { count, item: t("nav.machines").toLowerCase() })}</p>
                        )
                    )}
                </div>
                <Button color="primary" iconLeading={Plus} href="/app/machines/register">
                    {t("machines.registerNew")}
                </Button>
            </div>

            <div className="mb-6 flex gap-3">
                <Input
                    placeholder={t("machines.searchPlaceholder")}
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
            </div>

            <TableCard.Root>
                <Table aria-label={t("nav.machines")} selectionMode="none">
                    <Table.Header>
                        <Table.Head id="commissionId" label={t("machines.commissionId")} isRowHeader />
                        <Table.Head id="name" label={t("machines.name")} />
                        <Table.Head id="address" label={t("machines.address")} />
                        <Table.Head id="status" label={t("machines.status")} />
                        <Table.Head id="createdBy" label={t("machines.createdBy")} />
                        <Table.Head id="actions" />
                    </Table.Header>

                    <Table.Body items={isSearchMode ? searchResults : machines}>
                        {(isSearchMode ? searchLoading : loading) ? (
                            <Table.Row>
                                <Table.Cell colSpan={6}>
                                    <div className="flex items-center justify-center py-8">
                                        <span className="text-sm text-tertiary">
                                            {isSearchMode
                                                ? t("common.searchingItem", { item: t("nav.machines").toLowerCase() })
                                                : t("common.loadingItem", { item: t("nav.machines").toLowerCase() })}
                                        </span>
                                    </div>
                                </Table.Cell>
                            </Table.Row>
                        ) : (isSearchMode ? searchError : error) ? (
                            <Table.Row>
                                <Table.Cell colSpan={6}>
                                    <div className="flex items-center justify-center py-8">
                                        <span className="text-sm text-tertiary">
                                            {isSearchMode
                                                ? t("common.errorSearching", { item: t("nav.machines").toLowerCase(), error: searchError ?? "" })
                                                : t("common.errorLoading", {
                                                      item: t("nav.machines").toLowerCase(),
                                                      error: (error as any)?.message || t("common.unknownError"),
                                                  })}
                                        </span>
                                    </div>
                                </Table.Cell>
                            </Table.Row>
                        ) : (isSearchMode ? searchResults : machines).length === 0 ? (
                            <Table.Row>
                                <Table.Cell colSpan={6}>
                                    <div className="flex items-center justify-center py-8">
                                        <span className="text-sm text-tertiary">
                                            {isSearchMode
                                                ? t("common.noResultsFor", { item: t("nav.machines").toLowerCase(), query: searchQuery })
                                                : t("common.noResults", { item: t("nav.machines").toLowerCase() })}
                                        </span>
                                    </div>
                                </Table.Cell>
                            </Table.Row>
                        ) : (
                            (isSearchMode ? searchResults : machines).map((machine) => {
                                // Handle both Firebase (id) and Algolia (objectID) results
                                const machineId = machine.id || (machine as any).objectID;
                                const machineData = isSearchMode
                                    ? ({
                                          ...machine,
                                          id: machineId,
                                      } as Machine)
                                    : machine;

                                return (
                                    <Table.Row key={machineId} id={machineId}>
                                        <Table.Cell>
                                            <span className="font-mono text-sm">{machineData.commissionId || t("common.na")}</span>
                                        </Table.Cell>
                                        <Table.Cell>
                                            <span className="text-sm font-medium">{machineData.name || t("common.na")}</span>
                                        </Table.Cell>
                                        <Table.Cell>
                                            <span className="text-sm text-tertiary">{machineData.address || t("common.na")}</span>
                                        </Table.Cell>
                                        <Table.Cell>
                                            <BadgeWithDot size="sm" color={machineData.status === "online" ? "success" : "error"} type="modern">
                                                {machineData.status === "online" ? t("common.online") : t("common.offline")}
                                            </BadgeWithDot>
                                        </Table.Cell>
                                        <Table.Cell>
                                            <span className="text-sm text-tertiary">{getCreatorLabel(machineData.createdByUserId)}</span>
                                        </Table.Cell>
                                        <Table.Cell className="px-4">
                                            <div className="flex justify-end gap-0.5">
                                                <ButtonUtility
                                                    size="xs"
                                                    color="tertiary"
                                                    tooltip={t("common.delete")}
                                                    icon={Trash01}
                                                    onClick={() => handleDeleteClick(machineData)}
                                                />
                                                <ButtonUtility
                                                    size="xs"
                                                    color="tertiary"
                                                    tooltip={t("common.edit")}
                                                    icon={Edit01}
                                                    onClick={() => handleEdit(machineData)}
                                                />
                                            </div>
                                        </Table.Cell>
                                    </Table.Row>
                                );
                            })
                        )}
                    </Table.Body>
                </Table>

                {!isSearchMode && (
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
            </TableCard.Root>

            <DeleteConfirmationModal
                isOpen={deleteModal.isOpen}
                onClose={handleDeleteCancel}
                onConfirm={handleDeleteConfirm}
                title={t("machines.deleteTitle", { name: deleteModal.machine?.name || deleteModal.machine?.commissionId || "" })}
                description={t("machines.deleteDescription")}
                isLoading={isDeleting}
            />
        </Page>
    );
}
