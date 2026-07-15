import { useCallback, useState } from "react";
import { Edit01, HomeLine, Package, Plus, SearchLg, Trash01 } from "@untitledui/icons";
import { Heading as AriaHeading } from "react-aria-components";
import { toast } from "sonner";
import { Breadcrumbs } from "@/components/application/breadcrumbs/breadcrumbs";
import { DeleteConfirmationModal } from "@/components/application/modals/delete-confirmation-modal";
import { Dialog, Modal, ModalOverlay } from "@/components/application/modals/modal";
import { IconNotification } from "@/components/application/notifications/notifications";
import { PaginationPageDefault } from "@/components/application/pagination/pagination";
import { Table, TableCard } from "@/components/application/table/table";
import { TableSkeletonRows } from "@/components/application/table/table-skeleton";
import { Button } from "@/components/base/buttons/button";
import { ButtonUtility } from "@/components/base/buttons/button-utility";
import { CloseButton } from "@/components/base/buttons/close-button";
import { Input } from "@/components/base/input/input";
import { FeaturedIcon } from "@/components/foundations/featured-icon/featured-icon";
import Page from "@/components/page";
import { BackgroundPattern } from "@/components/shared-assets/background-patterns";
import { useDebouncedSearch } from "@/hooks/use-debounce";
import { usePricing } from "@/hooks/use-pricing";
import { useTranslations } from "@/lib/LanguageContext";
import { Pricing } from "@/types/pricing";

export default function PricingPage() {
    const t = useTranslations();

    // Pagination state
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize] = useState(5);

    const {
        prices,
        loading,
        error,
        count,
        countLoading,
        totalPages,
        hasNextPage,
        hasPreviousPage,
        createPricing,
        updatePricing,
        deletePricing,
        searchResults,
        searchLoading,
        searchTotalHits,
        searchPricing,
        searchError,
        clearSearch,
    } = usePricing({
        page: currentPage,
        limit: pageSize,
    });

    // Search state
    const [searchQuery, setSearchQuery] = useState("");
    const isSearchMode = searchQuery.trim().length > 0;

    useDebouncedSearch({
        query: searchQuery,
        search: searchPricing,
        clearSearch,
    });

    // Modal states
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [selectedPricing, setSelectedPricing] = useState<Pricing | null>(null);
    const [isActionLoading, setIsActionLoading] = useState(false);

    // Create modal form state
    const [createForm, setCreateForm] = useState({
        name: "",
        price: "",
        savings: "",
        sessions: "",
        currency: "USD",
    });

    // Edit modal form state
    const [editForm, setEditForm] = useState({
        name: "",
        price: "",
        savings: "",
        sessions: "",
        currency: "USD",
    });

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

    // Create pricing handler
    const handleCreatePricing = async () => {
        if (!createForm.name || !createForm.price || !createForm.sessions) return;

        try {
            setIsActionLoading(true);
            await createPricing({
                name: createForm.name,
                price: parseFloat(createForm.price),
                savings: parseFloat(createForm.savings) || 0,
                sessions: parseInt(createForm.sessions),
                currency: createForm.currency,
            });

            toast.custom((toastId) => (
                <IconNotification
                    title={t("common.success")}
                    description={t("pricing.createSuccess")}
                    color="success"
                    hideDismissLabel={true}
                    onClose={() => toast.dismiss(toastId)}
                />
            ));

            setIsCreateModalOpen(false);
            setCreateForm({ name: "", price: "", savings: "", sessions: "", currency: "USD" });
        } catch (error) {
            console.error("Failed to create pricing:", error);
            toast.custom((toastId) => (
                <IconNotification
                    title={t("common.error")}
                    description={t("pricing.createFailed")}
                    color="error"
                    hideDismissLabel={true}
                    onClose={() => toast.dismiss(toastId)}
                />
            ));
        } finally {
            setIsActionLoading(false);
        }
    };

    // Edit pricing handler
    const handleEditPricing = async () => {
        if (!selectedPricing || !editForm.name || !editForm.price || !editForm.sessions) return;

        try {
            setIsActionLoading(true);
            await updatePricing(selectedPricing.id, {
                name: editForm.name,
                price: parseFloat(editForm.price),
                savings: parseFloat(editForm.savings) || 0,
                sessions: parseInt(editForm.sessions),
                currency: editForm.currency,
            });

            toast.custom((toastId) => (
                <IconNotification
                    title={t("common.success")}
                    description={t("pricing.updateSuccess")}
                    color="success"
                    hideDismissLabel={true}
                    onClose={() => toast.dismiss(toastId)}
                />
            ));

            setIsEditModalOpen(false);
            setSelectedPricing(null);
        } catch (error) {
            console.error("Failed to update pricing:", error);
            toast.custom((toastId) => (
                <IconNotification
                    title={t("common.error")}
                    description={t("pricing.updateFailed")}
                    color="error"
                    hideDismissLabel={true}
                    onClose={() => toast.dismiss(toastId)}
                />
            ));
        } finally {
            setIsActionLoading(false);
        }
    };

    // Delete pricing handler
    const handleDeletePricing = async () => {
        if (!selectedPricing) return;

        try {
            setIsActionLoading(true);
            await deletePricing(selectedPricing.id);

            toast.custom((toastId) => (
                <IconNotification
                    title={t("common.success")}
                    description={t("pricing.deleteSuccess")}
                    color="success"
                    hideDismissLabel={true}
                    onClose={() => toast.dismiss(toastId)}
                />
            ));

            setIsDeleteModalOpen(false);
            setSelectedPricing(null);

            // If we're on a page that no longer has items, go back to page 1
            if (prices.length === 1 && currentPage > 1) {
                setCurrentPage(1);
            }
        } catch (error) {
            console.error("Failed to delete pricing:", error);
            toast.custom((toastId) => (
                <IconNotification
                    title={t("common.error")}
                    description={t("pricing.deleteFailed")}
                    color="error"
                    hideDismissLabel={true}
                    onClose={() => toast.dismiss(toastId)}
                />
            ));
        } finally {
            setIsActionLoading(false);
        }
    };

    // Open edit modal
    const openEditModal = (pricing: Pricing) => {
        setSelectedPricing(pricing);
        setEditForm({
            name: pricing.name,
            price: pricing.price.toString(),
            savings: pricing.savings.toString(),
            sessions: pricing.sessions.toString(),
            currency: pricing.currency,
        });
        setIsEditModalOpen(true);
    };

    // Open delete modal
    const openDeleteModal = (pricing: Pricing) => {
        setSelectedPricing(pricing);
        setIsDeleteModalOpen(true);
    };

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

    return (
        <Page title={t("nav.pricings")} className="p-8">
            <Breadcrumbs className="mb-4">
                <Breadcrumbs.Item icon={HomeLine} href="/app" />
                <Breadcrumbs.Item>{t("nav.pricings")}</Breadcrumbs.Item>
            </Breadcrumbs>

            <div className="mb-6 flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-semibold text-primary">{isSearchMode ? t("common.searchResults") : t("pricing.allPricing")}</h1>
                    {isSearchMode ? (
                        <p className="mt-1 text-sm text-tertiary">{t("common.resultsFor", { count: searchTotalHits, query: searchQuery })}</p>
                    ) : (
                        !countLoading &&
                        count !== null && <p className="mt-1 text-sm text-tertiary">{t("common.totalCount", { count, item: t("pricing.itemName") })}</p>
                    )}
                </div>
                <Button color="primary" iconLeading={Plus} onClick={() => setIsCreateModalOpen(true)}>
                    {t("pricing.createPricing")}
                </Button>
            </div>

            <div className="mb-6 flex gap-3">
                <Input
                    placeholder={t("pricing.searchPlaceholder")}
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
                <Table aria-label={t("pricing.allPricing")} selectionMode="none">
                    <Table.Header>
                        <Table.Head id="name" label={t("machines.name")} isRowHeader />
                        <Table.Head id="price" label={t("pricing.price")} />
                        <Table.Head id="savings" label={t("pricing.savings")} />
                        <Table.Head id="sessions" label={t("pricing.sessions")} />
                        <Table.Head id="currency" label={t("pricing.currency")} />
                        <Table.Head id="actions" />
                    </Table.Header>

                    <Table.Body items={isSearchMode ? searchResults : prices}>
                        {(isSearchMode ? searchLoading : loading) ? (
                            <TableSkeletonRows columns={6} rows={5} />
                        ) : (isSearchMode ? searchError : error) ? (
                            <Table.Row>
                                <Table.Cell colSpan={6}>
                                    <div className="flex items-center justify-center py-8">
                                        <span className="text-sm text-tertiary">
                                            {t("common.errorItem", {
                                                action: isSearchMode ? t("common.searching") : t("common.loading"),
                                                item: t("pricing.itemName"),
                                            })}
                                            : {isSearchMode ? searchError : (error as any)?.message || t("common.unknownError")}
                                        </span>
                                    </div>
                                </Table.Cell>
                            </Table.Row>
                        ) : (isSearchMode ? searchResults : prices).length === 0 ? (
                            <Table.Row>
                                <Table.Cell colSpan={6}>
                                    <div className="flex items-center justify-center py-8">
                                        <span className="text-sm text-tertiary">
                                            {isSearchMode
                                                ? t("common.noItemsFoundFor", { item: t("pricing.itemName"), query: searchQuery })
                                                : t("common.noItemsFound", { item: t("pricing.itemName") })}
                                        </span>
                                    </div>
                                </Table.Cell>
                            </Table.Row>
                        ) : (
                            (isSearchMode ? searchResults : prices).map((pricing) => {
                                // Handle both Firebase (id) and Algolia (objectID) results
                                const pricingId = pricing.id || (pricing as any).objectID;
                                const pricingData = isSearchMode
                                    ? ({
                                          ...pricing,
                                          id: pricingId,
                                      } as Pricing)
                                    : pricing;

                                return (
                                    <Table.Row key={pricingId} id={pricingId}>
                                        <Table.Cell>
                                            <span className="text-sm font-medium">{pricingData.name || t("common.na")}</span>
                                        </Table.Cell>
                                        <Table.Cell>
                                            <span className="text-sm font-medium">
                                                {pricingData.currency} {pricingData.price.toFixed(2)}
                                            </span>
                                        </Table.Cell>
                                        <Table.Cell>
                                            <span className="text-sm font-medium">
                                                {pricingData.currency} {pricingData.savings.toFixed(2)}
                                            </span>
                                        </Table.Cell>
                                        <Table.Cell>
                                            <span className="text-sm font-medium">{pricingData.sessions}</span>
                                        </Table.Cell>
                                        <Table.Cell>
                                            <span className="text-sm text-tertiary">{pricingData.currency}</span>
                                        </Table.Cell>
                                        <Table.Cell className="px-4">
                                            <div className="flex justify-end gap-0.5">
                                                <ButtonUtility
                                                    size="xs"
                                                    color="tertiary"
                                                    tooltip={t("common.delete")}
                                                    icon={Trash01}
                                                    onClick={() => openDeleteModal(pricingData)}
                                                />
                                                <ButtonUtility
                                                    size="xs"
                                                    color="tertiary"
                                                    tooltip={t("common.edit")}
                                                    icon={Edit01}
                                                    onClick={() => openEditModal(pricingData)}
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

            {/* Create Modal */}
            <ModalOverlay isOpen={isCreateModalOpen} onOpenChange={isActionLoading ? undefined : setIsCreateModalOpen} isDismissable={!isActionLoading}>
                <Modal className="max-w-md" isDismissable={!isActionLoading}>
                    <Dialog>
                        <div className="relative w-full overflow-hidden rounded-2xl bg-primary shadow-xl">
                            <CloseButton
                                onClick={() => setIsCreateModalOpen(false)}
                                theme="light"
                                size="lg"
                                className="absolute top-3 right-3"
                                isDisabled={isActionLoading}
                            />
                            <div className="flex flex-col gap-4 px-4 pt-5 sm:px-6 sm:pt-6">
                                <div className="relative w-max">
                                    <FeaturedIcon color="brand" size="lg" theme="light" icon={Package} />
                                    <BackgroundPattern pattern="circle" size="sm" className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                                </div>
                                <div className="z-10 flex flex-col gap-0.5">
                                    <AriaHeading slot="title" className="text-md font-semibold text-primary">
                                        {t("pricing.createTitle")}
                                    </AriaHeading>
                                    <p className="text-sm text-tertiary">{t("pricing.createDescription")}</p>
                                </div>
                            </div>

                            <div className="space-y-4 px-4 pt-6">
                                <Input
                                    label={t("pricing.planName")}
                                    placeholder={t("pricing.planNamePlaceholder")}
                                    value={createForm.name}
                                    onChange={(value) => setCreateForm({ ...createForm, name: value })}
                                />
                                <Input
                                    label={t("pricing.price")}
                                    placeholder="0.00"
                                    type="number"
                                    value={createForm.price}
                                    onChange={(value) => setCreateForm({ ...createForm, price: value })}
                                />
                                <Input
                                    label={t("pricing.savings")}
                                    placeholder="0.00"
                                    type="number"
                                    value={createForm.savings}
                                    onChange={(value) => setCreateForm({ ...createForm, savings: value })}
                                />
                                <Input
                                    label={t("pricing.sessions")}
                                    placeholder="0"
                                    type="number"
                                    value={createForm.sessions}
                                    onChange={(value) => setCreateForm({ ...createForm, sessions: value })}
                                />
                                <Input
                                    label={t("pricing.currency")}
                                    placeholder="USD"
                                    value={createForm.currency}
                                    onChange={(value) => setCreateForm({ ...createForm, currency: value })}
                                />
                            </div>
                            <div className="z-10 grid gap-3 p-4 pt-6 *:grow sm:grid-cols-2">
                                <Button color="secondary" onClick={() => setIsCreateModalOpen(false)} disabled={isActionLoading}>
                                    {t("common.cancel")}
                                </Button>
                                <Button
                                    color="primary"
                                    onClick={handleCreatePricing}
                                    disabled={isActionLoading || !createForm.name || !createForm.price || !createForm.sessions}
                                    isLoading={isActionLoading}
                                >
                                    {t("pricing.createPricing")}
                                </Button>
                            </div>
                        </div>
                    </Dialog>
                </Modal>
            </ModalOverlay>

            {/* Edit Modal */}
            <ModalOverlay isOpen={isEditModalOpen} onOpenChange={isActionLoading ? undefined : setIsEditModalOpen} isDismissable={!isActionLoading}>
                <Modal className="max-w-md">
                    <Dialog>
                        <div className="relative w-full overflow-hidden rounded-2xl bg-primary shadow-xl">
                            <CloseButton
                                onClick={() => setIsEditModalOpen(false)}
                                theme="light"
                                size="lg"
                                className="absolute top-3 right-3"
                                isDisabled={isActionLoading}
                            />
                            <div className="flex flex-col gap-4 px-4 pt-5 sm:px-6 sm:pt-6">
                                <div className="relative w-max">
                                    <FeaturedIcon color="brand" size="lg" theme="light" icon={Package} />
                                    <BackgroundPattern pattern="circle" size="sm" className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                                </div>
                                <div className="z-10 flex flex-col gap-0.5">
                                    <AriaHeading slot="title" className="text-md font-semibold text-primary">
                                        {t("pricing.editTitle")}
                                    </AriaHeading>
                                    <p className="text-sm text-tertiary">{t("pricing.editDescription")}</p>
                                </div>
                            </div>

                            <div className="space-y-4 px-4 pt-6">
                                <Input
                                    label={t("pricing.planName")}
                                    placeholder={t("pricing.planNamePlaceholder")}
                                    value={editForm.name}
                                    onChange={(value) => setEditForm({ ...editForm, name: value })}
                                />
                                <Input
                                    label={t("pricing.price")}
                                    placeholder="0.00"
                                    type="number"
                                    value={editForm.price}
                                    onChange={(value) => setEditForm({ ...editForm, price: value })}
                                />
                                <Input
                                    label={t("pricing.savings")}
                                    placeholder="0.00"
                                    type="number"
                                    value={editForm.savings}
                                    onChange={(value) => setEditForm({ ...editForm, savings: value })}
                                />
                                <Input
                                    label={t("pricing.sessions")}
                                    placeholder="0"
                                    type="number"
                                    value={editForm.sessions}
                                    onChange={(value) => setEditForm({ ...editForm, sessions: value })}
                                />
                                <Input
                                    label={t("pricing.currency")}
                                    placeholder="USD"
                                    value={editForm.currency}
                                    onChange={(value) => setEditForm({ ...editForm, currency: value })}
                                />
                            </div>
                            <div className="z-10 grid gap-3 p-4 pt-6 *:grow sm:grid-cols-2">
                                <Button color="secondary" onClick={() => setIsEditModalOpen(false)} disabled={isActionLoading}>
                                    {t("common.cancel")}
                                </Button>
                                <Button
                                    color="primary"
                                    onClick={handleEditPricing}
                                    disabled={isActionLoading || !editForm.name || !editForm.price || !editForm.sessions}
                                    isLoading={isActionLoading}
                                >
                                    {t("pricing.updatePricing")}
                                </Button>
                            </div>
                        </div>
                    </Dialog>
                </Modal>
            </ModalOverlay>

            {/* Delete Modal */}
            <DeleteConfirmationModal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                onConfirm={handleDeletePricing}
                isLoading={isActionLoading}
                title={t("pricing.deleteTitle")}
                description={t("pricing.deleteDescription", { name: selectedPricing?.name ?? "" })}
            />
        </Page>
    );
}
