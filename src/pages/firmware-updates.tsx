import { useCallback, useEffect, useState } from "react";
import { Download01, Edit01, HomeLine, Plus, SearchLg, Trash01, Upload01 } from "@untitledui/icons";
import { Heading as AriaHeading } from "react-aria-components";
import { toast } from "sonner";
import { Breadcrumbs } from "@/components/application/breadcrumbs/breadcrumbs";
import { FileUpload } from "@/components/application/file-upload/file-upload-base";
import { DeleteConfirmationModal } from "@/components/application/modals/delete-confirmation-modal";
import { Dialog, Modal, ModalOverlay } from "@/components/application/modals/modal";
import { IconNotification } from "@/components/application/notifications/notifications";
import { PaginationPageDefault } from "@/components/application/pagination/pagination";
import { Table, TableCard } from "@/components/application/table/table";
import { Button } from "@/components/base/buttons/button";
import { ButtonUtility } from "@/components/base/buttons/button-utility";
import { CloseButton } from "@/components/base/buttons/close-button";
import { Input } from "@/components/base/input/input";
import { FeaturedIcon } from "@/components/foundations/featured-icon/featured-icon";
import Page from "@/components/page";
import { BackgroundPattern } from "@/components/shared-assets/background-patterns";
import { useDebouncedSearch } from "@/hooks/use-debounce";
import useFirmwareUpdates from "@/hooks/use-firmware-update";
import { useLanguage, useTranslations } from "@/lib/LanguageContext";
import type { FirmwareUpdates } from "@/types/firmware-updates";
import type { UploadedFile } from "@/types/uploaded-file";

// Helper functions for formatting
const formatDate = (timestamp: any, locale: string = "en"): string => {
    if (!timestamp) return "--";

    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    if (Number.isNaN(date.getTime())) return "--";

    return date.toLocaleDateString(locale, {
        month: "short",
        day: "numeric",
        year: "numeric",
    });
};

const getFirmwareFileName = (firmware: FirmwareUpdates | null): string => {
    if (!firmware) return "firmware.deb";
    if (firmware.fileName) return firmware.fileName;
    if (!firmware.file) return "firmware.deb";

    return firmware.file.split("/").pop()?.split("?")[0].split("%2F").pop() || "firmware.deb";
};

// Upload Firmware Modal Component
const UploadFirmwareModal = ({
    isOpen,
    onOpenChange,
    onConfirm,
    isLoading = false,
}: {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    onConfirm: (file: File, metadata: { debianRevision: number; upstreamVersion: string }, onProgress: (progress: number) => void) => void;
    isLoading?: boolean;
}) => {
    const t = useTranslations();
    const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
    const [actualFiles, setActualFiles] = useState<File[]>([]);
    const [debianRevision, setDebianRevision] = useState("");
    const [upstreamVersion, setUpstreamVersion] = useState("");

    const handleDropFiles = (files: FileList) => {
        // Prevent file changes during upload
        if (isLoading) return;

        const newFiles = Array.from(files);
        setActualFiles(newFiles);
        setUploadedFiles(
            newFiles.map(
                (file) =>
                    ({
                        name: file.name,
                        size: file.size,
                        type: file.type,
                        progress: 0,
                    }) as UploadedFile,
            ),
        );
    };

    const updateProgress = (progress: number) => {
        setUploadedFiles((prev) => prev.map((file) => ({ ...file, progress })));
    };

    const handleSubmit = () => {
        if (actualFiles.length === 0) {
            toast.custom((toastId) => (
                <IconNotification
                    title={t("common.error")}
                    description={t("firmware.selectFile")}
                    color="error"
                    hideDismissLabel={true}
                    onClose={() => toast.dismiss(toastId)}
                />
            ));
            return;
        }

        if (!debianRevision || !upstreamVersion) {
            toast.custom((toastId) => (
                <IconNotification
                    title={t("common.error")}
                    description={t("firmware.fillRequired")}
                    color="error"
                    hideDismissLabel={true}
                    onClose={() => toast.dismiss(toastId)}
                />
            ));
            return;
        }

        const file = actualFiles[0];

        onConfirm(
            file,
            {
                debianRevision: parseInt(debianRevision),
                upstreamVersion: upstreamVersion,
            },
            updateProgress,
        );

        // Don't reset form here - let the parent component handle it after success/failure
    };

    const resetForm = () => {
        setUploadedFiles([]);
        setActualFiles([]);
        setDebianRevision("");
        setUpstreamVersion("");
    };

    const handleClose = () => {
        if (!isLoading) {
            resetForm();
            onOpenChange(false);
        }
    };

    // Reset form when modal opens/closes
    useEffect(() => {
        if (!isOpen && !isLoading) {
            resetForm();
        }
    }, [isOpen, isLoading]);

    return (
        <ModalOverlay isOpen={isOpen} onOpenChange={handleClose} isDismissable={!isLoading}>
            <Modal className="max-w-2xl" isDismissable={!isLoading}>
                <Dialog>
                    <div className="relative w-full overflow-hidden rounded-2xl bg-primary shadow-xl transition-all">
                        <CloseButton onClick={handleClose} theme="light" size="lg" className="absolute top-3 right-3" isDisabled={isLoading} />
                        <div className="flex flex-col gap-4 px-4 pt-5 sm:px-6 sm:pt-6">
                            <div className="relative w-max">
                                <FeaturedIcon color="brand" size="lg" theme="light" icon={Upload01} />
                                <BackgroundPattern pattern="circle" size="sm" className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                            </div>
                            <div className="z-10 flex flex-col gap-0.5">
                                <AriaHeading slot="title" className="text-md font-semibold text-primary">
                                    {t("firmware.uploadTitle")}
                                </AriaHeading>
                                <p className="text-sm text-tertiary">{t("firmware.uploadDescription")}</p>
                            </div>
                        </div>
                        <div className="space-y-6 px-4 pt-6 sm:px-6">
                            <div>
                                <FileUpload.Root>
                                    <FileUpload.DropZone
                                        onDropFiles={handleDropFiles}
                                        hint={isLoading ? t("firmware.uploadInProgress") : t("firmware.uploadHint")}
                                        maxSize={524288000}
                                        accept=".deb"
                                        allowsMultiple={false}
                                        isDisabled={isLoading}
                                    />
                                    <FileUpload.List className="mt-4">
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
                            </div>

                            <Input
                                label={t("firmware.debianRevision")}
                                placeholder={t("firmware.debianRevisionPlaceholder")}
                                type="number"
                                value={debianRevision}
                                onChange={setDebianRevision}
                                isRequired
                                isDisabled={isLoading}
                            />

                            <Input
                                label={t("firmware.upstreamVersion")}
                                placeholder={t("firmware.upstreamVersionPlaceholder")}
                                value={upstreamVersion}
                                onChange={setUpstreamVersion}
                                isRequired
                                isDisabled={isLoading}
                            />
                        </div>
                        <div className="z-10 flex flex-1 flex-col-reverse gap-3 p-4 pt-6 *:grow sm:grid sm:grid-cols-2 sm:px-6 sm:pt-8 sm:pb-6">
                            <Button color="secondary" size="lg" onClick={handleClose} isDisabled={isLoading}>
                                {t("common.cancel")}
                            </Button>
                            <Button
                                color="primary"
                                size="lg"
                                onClick={handleSubmit}
                                isLoading={isLoading}
                                isDisabled={uploadedFiles.length === 0 || !debianRevision || !upstreamVersion}
                            >
                                {t("firmware.uploadFirmware")}
                            </Button>
                        </div>
                    </div>
                </Dialog>
            </Modal>
        </ModalOverlay>
    );
};

// Edit Firmware Modal Component
const EditFirmwareModal = ({
    isOpen,
    onOpenChange,
    onConfirm,
    firmware,
    isLoading = false,
}: {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    onConfirm: (updates: { debianRevision: number; upstreamVersion: string }) => void;
    firmware: FirmwareUpdates | null;
    isLoading?: boolean;
}) => {
    const t = useTranslations();
    const [debianRevision, setDebianRevision] = useState("");
    const [upstreamVersion, setUpstreamVersion] = useState("");

    // Initialize form when firmware changes
    useEffect(() => {
        if (firmware) {
            setDebianRevision(firmware.debianRevision.toString());
            setUpstreamVersion(firmware.upstreamVersion);
        }
    }, [firmware]);

    const handleSubmit = () => {
        if (!debianRevision || !upstreamVersion) {
            toast.custom((toastId) => (
                <IconNotification
                    title={t("common.error")}
                    description={t("firmware.fillRequired")}
                    color="error"
                    hideDismissLabel={true}
                    onClose={() => toast.dismiss(toastId)}
                />
            ));
            return;
        }

        onConfirm({
            debianRevision: parseInt(debianRevision),
            upstreamVersion: upstreamVersion,
        });

        // Reset form
        setDebianRevision("");
        setUpstreamVersion("");
    };

    const handleClose = () => {
        if (!isLoading) {
            setDebianRevision("");
            setUpstreamVersion("");
            onOpenChange(false);
        }
    };

    return (
        <ModalOverlay isOpen={isOpen} onOpenChange={handleClose} isDismissable={!isLoading}>
            <Modal className="max-w-md" isDismissable={!isLoading}>
                <Dialog>
                    <div className="relative w-full overflow-hidden rounded-2xl bg-primary shadow-xl transition-all">
                        <CloseButton onClick={handleClose} theme="light" size="lg" className="absolute top-3 right-3" isDisabled={isLoading} />
                        <div className="flex flex-col gap-4 px-4 pt-5 sm:px-6 sm:pt-6">
                            <div className="relative w-max">
                                <FeaturedIcon color="brand" size="lg" theme="light" icon={Edit01} />
                                <BackgroundPattern pattern="circle" size="sm" className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                            </div>
                            <div className="z-10 flex flex-col gap-0.5">
                                <AriaHeading slot="title" className="text-md font-semibold text-primary">
                                    {t("firmware.editTitle")}
                                </AriaHeading>
                                <p className="text-sm text-tertiary">{t("firmware.editDescription")}</p>
                            </div>
                        </div>
                        <div className="space-y-4 px-4 pt-6 sm:px-6">
                            <Input
                                label={t("firmware.debianRevision")}
                                placeholder={t("firmware.debianRevisionPlaceholder")}
                                type="number"
                                value={debianRevision}
                                onChange={setDebianRevision}
                                isRequired
                                isDisabled={isLoading}
                            />

                            <Input
                                label={t("firmware.upstreamVersion")}
                                placeholder={t("firmware.upstreamVersionPlaceholder")}
                                value={upstreamVersion}
                                onChange={setUpstreamVersion}
                                isRequired
                                isDisabled={isLoading}
                            />
                        </div>
                        <div className="z-10 flex flex-1 flex-col-reverse gap-3 p-4 pt-6 *:grow sm:grid sm:grid-cols-2 sm:px-6 sm:pt-8 sm:pb-6">
                            <Button color="secondary" size="lg" onClick={handleClose} isDisabled={isLoading}>
                                {t("common.cancel")}
                            </Button>
                            <Button color="primary" size="lg" onClick={handleSubmit} isLoading={isLoading} isDisabled={!debianRevision || !upstreamVersion}>
                                {t("firmware.updateFirmware")}
                            </Button>
                        </div>
                    </div>
                </Dialog>
            </Modal>
        </ModalOverlay>
    );
};

export default function FirmwareUpdates() {
    const t = useTranslations();
    const { currentLocale } = useLanguage();
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize] = useState(5); // Items per page
    const [searchQuery, setSearchQuery] = useState("");

    // Modal states using new pattern
    const [showUploadModal, setShowUploadModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [selectedFirmware, setSelectedFirmware] = useState<FirmwareUpdates | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [isUpdating, setIsUpdating] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    const {
        firmwareUpdates,
        loading,
        error,
        count,
        countLoading,
        totalPages,
        hasNextPage,
        hasPreviousPage,
        uploadFirmwareUpdate,
        updateFirmwareUpdate,
        deleteFirmwareUpdate,
        searchResults,
        searchLoading,
        searchError,
        searchTotalHits,
        searchFirmwareUpdates,
        clearSearch,
    } = useFirmwareUpdates({
        page: currentPage,
        limit: pageSize,
    });

    useDebouncedSearch({
        query: searchQuery,
        search: searchFirmwareUpdates,
        clearSearch,
    });

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

    const handleUploadFirmware = async (file: File, metadata: { debianRevision: number; upstreamVersion: string }, onProgress: (progress: number) => void) => {
        setIsUploading(true);
        try {
            await uploadFirmwareUpdate(file, metadata, onProgress);

            toast.custom((toastId) => (
                <IconNotification
                    title={t("common.success")}
                    description={t("firmware.uploadSuccess")}
                    color="success"
                    hideDismissLabel={true}
                    onClose={() => toast.dismiss(toastId)}
                />
            ));

            setShowUploadModal(false);
        } catch (error) {
            console.error("Upload failed:", error);
            toast.custom((toastId) => (
                <IconNotification
                    title={t("common.error")}
                    description={t("firmware.uploadFailed")}
                    color="error"
                    hideDismissLabel={true}
                    onClose={() => toast.dismiss(toastId)}
                />
            ));
        } finally {
            setIsUploading(false);
        }
    };

    const handleEditFirmware = async (updates: { debianRevision: number; upstreamVersion: string }) => {
        if (!selectedFirmware) return;

        setIsUpdating(true);
        try {
            await updateFirmwareUpdate(selectedFirmware.id, updates);

            toast.custom((toastId) => (
                <IconNotification
                    title={t("common.success")}
                    description={t("firmware.updateSuccess")}
                    color="success"
                    hideDismissLabel={true}
                    onClose={() => toast.dismiss(toastId)}
                />
            ));

            setShowEditModal(false);
            setSelectedFirmware(null);
        } catch (error) {
            console.error("Update failed:", error);
            toast.custom((toastId) => (
                <IconNotification
                    title={t("common.error")}
                    description={t("firmware.updateFailed")}
                    color="error"
                    hideDismissLabel={true}
                    onClose={() => toast.dismiss(toastId)}
                />
            ));
        } finally {
            setIsUpdating(false);
        }
    };

    const handleDeleteFirmware = async () => {
        if (!selectedFirmware) return;

        setIsDeleting(true);
        try {
            await deleteFirmwareUpdate(selectedFirmware.id);
            toast.custom((toastId) => (
                <IconNotification
                    title={t("common.success")}
                    description={t("firmware.deleteSuccess")}
                    color="success"
                    hideDismissLabel={true}
                    onClose={() => toast.dismiss(toastId)}
                />
            ));
            setShowDeleteModal(false);
            setSelectedFirmware(null);
        } catch (error) {
            console.error("Delete failed:", error);
            toast.custom((toastId) => (
                <IconNotification
                    title={t("common.error")}
                    description={t("firmware.deleteFailed")}
                    color="error"
                    hideDismissLabel={true}
                    onClose={() => toast.dismiss(toastId)}
                />
            ));
        } finally {
            setIsDeleting(false);
        }
    };

    const handleEditClick = (firmware: FirmwareUpdates) => {
        setSelectedFirmware(firmware);
        setShowEditModal(true);
    };

    const handleDeleteClick = (firmware: FirmwareUpdates) => {
        setSelectedFirmware(firmware);
        setShowDeleteModal(true);
    };

    const handleDownload = (firmware: FirmwareUpdates) => {
        if (firmware.file) {
            window.open(firmware.file, "_blank");
        }
    };

    return (
        <Page title={t("firmware.title")} className="p-8">
            <Breadcrumbs className="mb-4">
                <Breadcrumbs.Item icon={HomeLine} href="/app" />
                <Breadcrumbs.Item>{t("firmware.title")}</Breadcrumbs.Item>
            </Breadcrumbs>

            <div className="mb-6 flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-semibold text-primary">{isSearchMode ? t("common.searchResults") : t("firmware.title")}</h1>
                    {isSearchMode ? (
                        <p className="mt-1 text-sm text-tertiary">{t("common.resultsFor", { count: searchTotalHits, query: searchQuery })}</p>
                    ) : (
                        !countLoading &&
                        count !== null && <p className="mt-1 text-sm text-tertiary">{t("common.totalCount", { count, item: t("firmware.itemName") })}</p>
                    )}
                </div>
                <Button color="primary" iconLeading={Plus} onClick={() => setShowUploadModal(true)}>
                    {t("firmware.uploadFirmware")}
                </Button>
            </div>

            <div className="mb-6 flex gap-3">
                <Input
                    placeholder={t("firmware.searchPlaceholder")}
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
                <Table aria-label={t("firmware.title")} selectionMode="none">
                    <Table.Header>
                        <Table.Head id="file" label={t("firmware.file")} isRowHeader />
                        <Table.Head id="debianRevision" label={t("firmware.debianRevision")} />
                        <Table.Head id="upstreamVersion" label={t("firmware.upstreamVersion")} />
                        <Table.Head id="uploadedBy" label={t("firmware.uploadedBy")} />
                        <Table.Head id="createdAt" label={t("firmware.uploadDate")} />
                        <Table.Head id="actions" />
                    </Table.Header>

                    <Table.Body>
                        {(isSearchMode ? searchLoading : loading) ? (
                            <Table.Row>
                                <Table.Cell colSpan={6}>
                                    <div className="flex items-center justify-center py-8">
                                        <span className="text-sm text-tertiary">
                                            {isSearchMode
                                                ? t("common.searchingItem", { item: t("firmware.title").toLowerCase() })
                                                : t("common.loadingItem", { item: t("firmware.title").toLowerCase() })}
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
                                                ? t("common.errorSearching", { item: t("firmware.title").toLowerCase(), error: searchError ?? "" })
                                                : t("common.errorLoading", {
                                                      item: t("firmware.title").toLowerCase(),
                                                      error: (error as any)?.message || t("common.unknownError"),
                                                  })}
                                        </span>
                                    </div>
                                </Table.Cell>
                            </Table.Row>
                        ) : (isSearchMode ? searchResults : firmwareUpdates).length === 0 ? (
                            <Table.Row>
                                <Table.Cell colSpan={6}>
                                    <div className="flex items-center justify-center py-8">
                                        <span className="text-sm text-tertiary">
                                            {isSearchMode
                                                ? t("common.noResultsFor", { item: t("firmware.title").toLowerCase(), query: searchQuery })
                                                : t("common.noResults", { item: t("firmware.title").toLowerCase() })}
                                        </span>
                                    </div>
                                </Table.Cell>
                            </Table.Row>
                        ) : (
                            (isSearchMode ? searchResults : firmwareUpdates).map((firmware) => {
                                const firmwareId = firmware.id || (firmware as any).objectID;
                                const firmwareData = isSearchMode
                                    ? ({
                                          ...firmware,
                                          id: firmwareId,
                                      } as FirmwareUpdates)
                                    : firmware;

                                const fileName = getFirmwareFileName(firmwareData);

                                return (
                                    <Table.Row key={firmwareId} id={firmwareId}>
                                        <Table.Cell>
                                            <span className="text-sm font-medium">{fileName}</span>
                                        </Table.Cell>
                                        <Table.Cell>
                                            <span className="text-sm">{firmwareData.debianRevision}</span>
                                        </Table.Cell>
                                        <Table.Cell>
                                            <span className="text-sm">{firmwareData.upstreamVersion}</span>
                                        </Table.Cell>
                                        <Table.Cell>
                                            <span className="text-sm">{firmwareData.uploadedBy || t("common.unknown")}</span>
                                        </Table.Cell>
                                        <Table.Cell>
                                            <span className="text-sm text-tertiary">{formatDate(firmwareData.createdAt, currentLocale)}</span>
                                        </Table.Cell>
                                        <Table.Cell className="px-4">
                                            <div className="flex justify-end gap-0.5">
                                                <ButtonUtility
                                                    size="xs"
                                                    color="tertiary"
                                                    tooltip={t("common.download")}
                                                    icon={Download01}
                                                    onClick={() => handleDownload(firmwareData)}
                                                />
                                                <ButtonUtility
                                                    size="xs"
                                                    color="tertiary"
                                                    tooltip={t("common.edit")}
                                                    icon={Edit01}
                                                    onClick={() => handleEditClick(firmwareData)}
                                                />
                                                <ButtonUtility
                                                    size="xs"
                                                    color="tertiary"
                                                    tooltip={t("common.delete")}
                                                    icon={Trash01}
                                                    onClick={() => handleDeleteClick(firmwareData)}
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

            {/* Modals */}
            <UploadFirmwareModal isOpen={showUploadModal} onOpenChange={setShowUploadModal} onConfirm={handleUploadFirmware} isLoading={isUploading} />
            <EditFirmwareModal
                isOpen={showEditModal}
                onOpenChange={setShowEditModal}
                onConfirm={handleEditFirmware}
                firmware={selectedFirmware}
                isLoading={isUpdating}
            />
            <DeleteConfirmationModal
                isOpen={showDeleteModal}
                onClose={() => setShowDeleteModal(false)}
                onConfirm={handleDeleteFirmware}
                title={t("firmware.deleteTitle")}
                description={t("firmware.deleteDescription", { name: getFirmwareFileName(selectedFirmware) })}
                isLoading={isDeleting}
            />
        </Page>
    );
}
