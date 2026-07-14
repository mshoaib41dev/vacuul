import { useCallback, useState } from "react";
import { FileIcon } from "@untitledui/file-icons";
import { Eye, HomeLine, SearchLg, Trash01 } from "@untitledui/icons";
import { toast } from "sonner";
import { Breadcrumbs } from "@/components/application/breadcrumbs/breadcrumbs";
import { FileUpload } from "@/components/application/file-upload/file-upload-base";
import { DeleteConfirmationModal } from "@/components/application/modals/delete-confirmation-modal";
import { IconNotification } from "@/components/application/notifications/notifications";
import { PaginationPageDefault } from "@/components/application/pagination/pagination";
import { Table, TableCard } from "@/components/application/table/table";
import { Button } from "@/components/base/buttons/button";
import { ButtonUtility } from "@/components/base/buttons/button-utility";
import { Input } from "@/components/base/input/input";
import Page from "@/components/page";
import { useLanguage, useTranslations } from "@/lib/LanguageContext";
import useContent from "@/hooks/use-content";
import type { Content } from "@/types/content";
import type { UploadedFile } from "@/types/uploaded-file";

// Helper functions for formatting
const formatDate = (timestamp: any, locale: string = "en"): string => {
    if (!timestamp) return "--";

    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString(locale, {
        month: "short",
        day: "numeric",
        year: "numeric",
    });
};

const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
};

export default function Contents() {
    const t = useTranslations();
    const { currentLocale } = useLanguage();

    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize] = useState(5); // Items per page
    const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; content: Content | null }>({
        isOpen: false,
        content: null,
    });
    const [isDeleting, setIsDeleting] = useState(false);

    const {
        contents,
        loading,
        error,
        count,
        countLoading,
        totalPages,
        hasNextPage,
        hasPreviousPage,
        uploadContent,
        deleteContent,
        searchResults,
        searchLoading,
        searchError,
        searchTotalHits,
        searchContents,
        clearSearch,
    } = useContent({
        page: currentPage,
        limit: pageSize,
    });

    const isSearchMode = searchQuery.trim().length > 0;

    // Handle search input changes with debounced search
    const handleSearchChange = useCallback(
        async (value: string) => {
            setSearchQuery(value);

            if (value.trim().length === 0) {
                clearSearch();
            } else if (value.trim().length >= 2) {
                try {
                    await searchContents(value.trim());
                } catch (error) {
                    console.error("Search failed:", error);
                }
            }
        },
        [searchContents, clearSearch],
    );

    // Reset pagination when switching between search and browse modes
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

    const handleDropFiles = (files: FileList) => {
        const newFiles = Array.from(files);

        setUploadedFiles(
            newFiles
                .map(
                    (file) =>
                        ({
                            name: file.name,
                            size: file.size,
                            type: file.type,
                            progress: 0,
                        }) as UploadedFile,
                )
                .concat(uploadedFiles),
        );

        newFiles.forEach((file) => {
            void uploadContent(file, (progress) => {
                setUploadedFiles((prev) => prev.map((uploadedFile) => (uploadedFile.name === file.name ? { ...uploadedFile, progress } : uploadedFile)));
            }).catch((error) => {
                console.error("Upload failed:", error);
                setUploadedFiles((prev) => prev.map((uploadedFile) => (uploadedFile.name === file.name ? { ...uploadedFile, failed: true } : uploadedFile)));
                toast.custom((toastId) => (
                    <IconNotification
                        title={t("common.error")}
                        description={error instanceof Error ? error.message : t("contents.uploadFailed")}
                        color="error"
                        hideDismissLabel={true}
                        onClose={() => toast.dismiss(toastId)}
                    />
                ));
            });
        });
    };

    const handleDeleteClick = (content: Content) => {
        setDeleteModal({ isOpen: true, content });
    };

    const handleDeleteCancel = () => {
        setDeleteModal({ isOpen: false, content: null });
    };

    const handleDeleteConfirm = async () => {
        if (!deleteModal.content) return;
        setIsDeleting(true);
        try {
            await deleteContent(deleteModal.content.id);
            toast.custom((toastId) => (
                <IconNotification
                    title={t("common.success")}
                    description={t("contents.deleteSuccess")}
                    color="success"
                    hideDismissLabel={true}
                    onClose={() => toast.dismiss(toastId)}
                />
            ));
            setDeleteModal({ isOpen: false, content: null });
        } catch (error) {
            console.error("Delete failed:", error);
            toast.custom((toastId) => (
                <IconNotification
                    title={t("common.error")}
                    description={t("contents.deleteFailed")}
                    color="error"
                    hideDismissLabel={true}
                    onClose={() => toast.dismiss(toastId)}
                />
            ));
        } finally {
            setIsDeleting(false);
        }
    };

    const handleView = (content: Content) => {
        if (content.url) {
            window.open(content.url, "_blank");
        }
    };

    return (
        <Page title={t("contents.title")} className="mx-auto flex w-full flex-col gap-y-8 p-8">
            {/* Page header */}
            <div className="flex flex-col gap-y-4">
                <Breadcrumbs>
                    <Breadcrumbs.Item href="/app" icon={HomeLine} />
                    <Breadcrumbs.Item href="/app/content">{t("contents.title")}</Breadcrumbs.Item>
                </Breadcrumbs>
                <div className="flex flex-col justify-between gap-4 lg:flex-row">
                    <div className="flex flex-col gap-y-0.5 lg:gap-y-1">
                        <p className="text-display-xs font-semibold text-primary">{t("contents.title")}</p>
                    </div>
                </div>
            </div>
            <div className="flex flex-col gap-y-6">
                <FileUpload.Root>
                    <FileUpload.DropZone onDropFiles={handleDropFiles} hint={t("contents.uploadHint")} maxSize={524288000} accept="video/*,audio/*" />

                    <FileUpload.List className="hidden lg:flex">
                        {uploadedFiles.map((file) => (
                            <FileUpload.ListItemProgressFill
                                key={file.name}
                                name={file.name}
                                type={file.type}
                                progress={file.progress}
                                failed={file.failed}
                                size={file.size}
                            />
                        ))}
                    </FileUpload.List>
                </FileUpload.Root>

                <TableCard.Root className="-mx-4 border-secondary max-lg:rounded-none max-lg:border-b max-lg:ring-0 lg:mx-0">
                    <div className="flex items-start justify-between border-secondary px-4 max-lg:mb-6 lg:border-b lg:px-6 lg:py-5">
                        <div className="flex flex-col gap-y-0.5">
                            <p className="text-lg font-semibold text-primary">{isSearchMode ? t("common.searchResults") : t("contents.uploadedFiles")}</p>
                            <p className="text-sm text-tertiary">{t("contents.uploadedFilesDescription")}</p>
                            {isSearchMode ? (
                                <p className="mt-1 text-sm text-tertiary">
                                    {t("common.resultsFor", { count: searchTotalHits, query: searchQuery })}
                                </p>
                            ) : (
                                !countLoading &&
                                count !== null && (
                                    <p className="mt-1 text-sm text-tertiary">
                                        {t("common.totalCount", { count, item: t("contents.fileItemName") })}
                                    </p>
                                )
                            )}
                        </div>
                    </div>
                    <div className="flex flex-col justify-between gap-y-4 border-b border-secondary px-4 max-lg:pb-6 lg:flex-row lg:px-6 lg:py-3">
                        <div className="order-first flex gap-x-3 lg:order-none">
                            <Input
                                className="lg:min-w-80"
                                size="sm"
                                placeholder={t("contents.searchPlaceholder")}
                                icon={SearchLg}
                                value={searchQuery}
                                onChange={(value) => handleSearchChange(value)}
                            />
                            {isSearchMode && (
                                <Button color="tertiary" onClick={handleClearSearch} className="shrink-0">
                                    {t("common.clearSearch")}
                                </Button>
                            )}
                        </div>
                    </div>
                    <Table aria-label={t("contents.uploadedFiles")} selectionMode="none" className="bg-primary">
                        <Table.Header>
                            <Table.Head id="name" isRowHeader label={t("contents.fileName")} className="w-full max-lg:min-w-80" />
                            <Table.Head id="size" label={t("contents.fileSize")} />
                            <Table.Head id="createdAt" label={t("contents.dateUploaded")} />
                            <Table.Head id="uploadedBy" label={t("contents.uploadedBy")} />
                            <Table.Head id="actions" />
                        </Table.Header>
                        <Table.Body>
                            {(isSearchMode ? searchLoading : loading) ? (
                                <Table.Row key="loading">
                                    <Table.Cell colSpan={5}>
                                        <div className="flex items-center justify-center py-8">
                                            <span className="text-sm text-tertiary">{isSearchMode ? t("common.searchingItem", { item: t("contents.itemName") }) : t("common.loadingItem", { item: t("contents.itemName") })}</span>
                                        </div>
                                    </Table.Cell>
                                </Table.Row>
                            ) : (isSearchMode ? searchError : error) ? (
                                <Table.Row key="error">
                                    <Table.Cell colSpan={5}>
                                        <div className="flex items-center justify-center py-8">
                                            <span className="text-sm text-tertiary">
                                                {t("common.errorItem", { action: isSearchMode ? t("common.searching") : t("common.loading"), item: t("contents.itemName") })}:{" "}
                                                {isSearchMode ? searchError : (error as any)?.message || t("common.unknownError")}
                                            </span>
                                        </div>
                                    </Table.Cell>
                                </Table.Row>
                            ) : (isSearchMode ? searchResults : contents).length === 0 ? (
                                <Table.Row key="empty">
                                    <Table.Cell colSpan={5}>
                                        <div className="flex items-center justify-center py-8">
                                            <span className="text-sm text-tertiary">
                                                {isSearchMode ? t("common.noItemsFoundFor", { item: t("contents.itemName"), query: searchQuery }) : t("common.noItemsFound", { item: t("contents.itemName") })}
                                            </span>
                                        </div>
                                    </Table.Cell>
                                </Table.Row>
                            ) : (
                                (isSearchMode ? searchResults : contents).map((content) => {
                                    const contentId = content.id || (content as any).objectID;
                                    const contentData = isSearchMode
                                        ? ({
                                              ...content,
                                              id: contentId,
                                          } as Content)
                                        : content;

                                    return (
                                        <Table.Row key={contentId} id={contentId}>
                                            <Table.Cell>
                                                <div className="flex items-center gap-x-3">
                                                    <FileIcon type={contentData.type} theme="light" className="size-10 dark:hidden" />
                                                    <FileIcon type={contentData.type} theme="dark" className="size-10 not-dark:hidden" />

                                                    <div>
                                                        <p className="text-sm font-medium whitespace-nowrap text-primary">{contentData.name}</p>
                                                        <p className="text-sm whitespace-nowrap text-tertiary">{formatFileSize(contentData.size)}</p>
                                                    </div>
                                                </div>
                                            </Table.Cell>
                                            <Table.Cell className="whitespace-nowrap">{formatFileSize(contentData.size)}</Table.Cell>
                                            <Table.Cell className="whitespace-nowrap">{formatDate(contentData.createdAt, currentLocale)}</Table.Cell>
                                            <Table.Cell>
                                                <p className="text-sm font-medium text-primary">{contentData.uploadedBy}</p>
                                            </Table.Cell>
                                            <Table.Cell>
                                                <div className="flex gap-x-2">
                                                    <ButtonUtility
                                                        size="xs"
                                                        color="tertiary"
                                                        tooltip={t("common.delete")}
                                                        icon={Trash01}
                                                        onClick={() => handleDeleteClick(contentData)}
                                                    />
                                                    <ButtonUtility
                                                        size="xs"
                                                        color="tertiary"
                                                        tooltip={t("common.view")}
                                                        icon={Eye}
                                                        onClick={() => handleView(contentData)}
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
            </div>

            <DeleteConfirmationModal
                isOpen={deleteModal.isOpen}
                onClose={handleDeleteCancel}
                onConfirm={handleDeleteConfirm}
                title={t("contents.deleteTitle", { name: deleteModal.content?.name || t("contents.itemName") })}
                description={t("contents.deleteDescription")}
                isLoading={isDeleting}
            />
        </Page>
    );
}
