import { useCallback, useState } from "react";
import { HomeLine, SearchLg, Trash01 } from "@untitledui/icons";
import { toast } from "sonner";
import { Breadcrumbs } from "@/components/application/breadcrumbs/breadcrumbs";
import { DeleteConfirmationModal } from "@/components/application/modals/delete-confirmation-modal";
import { IconNotification } from "@/components/application/notifications/notifications";
import { PaginationPageDefault } from "@/components/application/pagination/pagination";
import { Table, TableCard } from "@/components/application/table/table";
import { TableSkeletonRows } from "@/components/application/table/table-skeleton";
import { Button } from "@/components/base/buttons/button";
import { ButtonUtility } from "@/components/base/buttons/button-utility";
import { Input } from "@/components/base/input/input";
import Page from "@/components/page";
import useContactResponses from "@/hooks/use-contact-responses";
import { useDebouncedSearch } from "@/hooks/use-debounce";
import { useTranslations } from "@/lib/LanguageContext";
import type { ContactResponses } from "@/types/contact-responses";

export default function ContactResponsesPage() {
    const t = useTranslations();
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize] = useState(5);
    const [searchQuery, setSearchQuery] = useState("");

    const {
        responses,
        loading,
        error,
        count,
        countLoading,
        totalPages,
        hasNextPage,
        hasPreviousPage,
        deleteContactResponse,
        searchResults,
        searchLoading,
        searchError,
        searchTotalHits,
        searchContactResponses,
        clearSearch,
    } = useContactResponses({
        page: currentPage,
        limit: pageSize,
    });

    useDebouncedSearch({
        query: searchQuery,
        search: searchContactResponses,
        clearSearch,
    });

    const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; response: ContactResponses | null }>({
        isOpen: false,
        response: null,
    });
    const [isDeleting, setIsDeleting] = useState(false);

    const isSearchMode = searchQuery.trim().length > 0;

    const handleSearchChange = useCallback(
        (value: string) => {
            setSearchQuery(value);

            if (value.trim().length < 2) {
                clearSearch();
            }
        },
        [clearSearch],
    );

    const handleClearSearch = useCallback(() => {
        setSearchQuery("");
        clearSearch();
        setCurrentPage(1);
    }, [clearSearch]);

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

    const handleDeleteClick = (response: ContactResponses) => {
        setDeleteModal({ isOpen: true, response });
    };

    const handleDeleteConfirm = async () => {
        if (!deleteModal.response) return;

        setIsDeleting(true);
        try {
            await deleteContactResponse(deleteModal.response.id);

            toast.custom((toastId) => (
                <IconNotification
                    title={t("common.success")}
                    description={t("contacts.deleteSuccess")}
                    color="success"
                    hideDismissLabel={true}
                    onClose={() => toast.dismiss(toastId)}
                />
            ));

            setDeleteModal({ isOpen: false, response: null });

            if (responses.length === 1 && currentPage > 1) {
                setCurrentPage(1);
            }
        } catch (error) {
            console.error("Error deleting contact response:", error);
            toast.custom((toastId) => (
                <IconNotification
                    title={t("common.error")}
                    description={t("contacts.deleteFailed")}
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
        setDeleteModal({ isOpen: false, response: null });
    };

    const truncateMessage = (message: string, maxLength: number = 100) => {
        if (message.length <= maxLength) return message;
        return message.substring(0, maxLength) + "...";
    };

    const formatDate = (timestamp: any) => {
        if (!timestamp) return t("common.na");
        const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
        return date.toLocaleDateString() + " " + date.toLocaleTimeString();
    };

    return (
        <Page title={t("contacts.title")} className="p-8">
            <Breadcrumbs className="mb-4">
                <Breadcrumbs.Item icon={HomeLine} href="/app" />
                <Breadcrumbs.Item>{t("contacts.title")}</Breadcrumbs.Item>
            </Breadcrumbs>

            <div className="mb-6 flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-semibold text-primary">{isSearchMode ? t("common.searchResults") : t("contacts.title")}</h1>
                    {isSearchMode ? (
                        <p className="mt-1 text-sm text-tertiary">{t("common.resultsFor", { count: searchTotalHits, query: searchQuery })}</p>
                    ) : (
                        !countLoading &&
                        count !== null && <p className="mt-1 text-sm text-tertiary">{t("common.totalCount", { count, item: t("contacts.itemName") })}</p>
                    )}
                </div>
            </div>

            <div className="mb-6 flex gap-3">
                <Input
                    placeholder={t("contacts.searchPlaceholder")}
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
                <Table aria-label={t("contacts.title")} selectionMode="none">
                    <Table.Header>
                        <Table.Head id="name" label={t("contacts.name")} isRowHeader />
                        <Table.Head id="email" label={t("contacts.email")} />
                        <Table.Head id="message" label={t("contacts.message")} />
                        <Table.Head id="createdAt" label={t("contacts.createdAt")} />
                        <Table.Head id="actions" />
                    </Table.Header>

                    <Table.Body items={isSearchMode ? searchResults : responses}>
                        {(isSearchMode ? searchLoading : loading) ? (
                            <TableSkeletonRows columns={5} rows={5} />
                        ) : (isSearchMode ? searchError : error) ? (
                            <Table.Row>
                                <Table.Cell colSpan={5}>
                                    <div className="flex items-center justify-center py-8">
                                        <span className="text-sm text-tertiary">
                                            {isSearchMode
                                                ? t("common.errorSearching", { item: t("contacts.title").toLowerCase(), error: searchError ?? "" })
                                                : t("common.errorLoading", {
                                                      item: t("contacts.title").toLowerCase(),
                                                      error: (error as any)?.message || t("common.unknownError"),
                                                  })}
                                        </span>
                                    </div>
                                </Table.Cell>
                            </Table.Row>
                        ) : (isSearchMode ? searchResults : responses).length === 0 ? (
                            <Table.Row>
                                <Table.Cell colSpan={5}>
                                    <div className="flex items-center justify-center py-8">
                                        <span className="text-sm text-tertiary">
                                            {isSearchMode
                                                ? t("common.noResultsFor", { item: t("contacts.title").toLowerCase(), query: searchQuery })
                                                : t("common.noResults", { item: t("contacts.title").toLowerCase() })}
                                        </span>
                                    </div>
                                </Table.Cell>
                            </Table.Row>
                        ) : (
                            (isSearchMode ? searchResults : responses).map((response) => {
                                const responseId = response.id || (response as any).objectID;
                                const responseData = isSearchMode
                                    ? ({
                                          ...response,
                                          id: responseId,
                                      } as ContactResponses)
                                    : response;

                                return (
                                    <Table.Row key={responseId} id={responseId}>
                                        <Table.Cell>
                                            <span className="text-sm font-medium">{responseData.name || t("common.na")}</span>
                                        </Table.Cell>
                                        <Table.Cell>
                                            <span className="text-sm text-tertiary">{responseData.email || t("common.na")}</span>
                                        </Table.Cell>
                                        <Table.Cell>
                                            <span className="text-sm text-tertiary" title={responseData.message}>
                                                {truncateMessage(responseData.message || t("common.na"))}
                                            </span>
                                        </Table.Cell>
                                        <Table.Cell>
                                            <span className="text-sm text-tertiary">{formatDate(responseData.createdAt)}</span>
                                        </Table.Cell>
                                        <Table.Cell className="px-4">
                                            <div className="flex justify-end gap-0.5">
                                                <ButtonUtility
                                                    size="xs"
                                                    color="tertiary"
                                                    tooltip={t("common.delete")}
                                                    icon={Trash01}
                                                    onClick={() => handleDeleteClick(responseData)}
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
                title={t("contacts.deleteTitle", { name: deleteModal.response?.name ?? "" })}
                description={t("contacts.deleteDescription")}
                isLoading={isDeleting}
            />
        </Page>
    );
}
