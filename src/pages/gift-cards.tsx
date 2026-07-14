import { useCallback, useState } from "react";
import { Gift01, HomeLine, Plus, SearchLg, Trash01 } from "@untitledui/icons";
import { Heading as AriaHeading } from "react-aria-components";
import { toast } from "sonner";
import { Breadcrumbs } from "@/components/application/breadcrumbs/breadcrumbs";
import { DeleteConfirmationModal } from "@/components/application/modals/delete-confirmation-modal";
import { Dialog, Modal, ModalOverlay } from "@/components/application/modals/modal";
import { IconNotification } from "@/components/application/notifications/notifications";
import { PaginationPageDefault } from "@/components/application/pagination/pagination";
import { Table, TableCard } from "@/components/application/table/table";
import { BadgeWithDot } from "@/components/base/badges/badges";
import { Button } from "@/components/base/buttons/button";
import { ButtonUtility } from "@/components/base/buttons/button-utility";
import { CloseButton } from "@/components/base/buttons/close-button";
import { Input } from "@/components/base/input/input";
import { FeaturedIcon } from "@/components/foundations/featured-icon/featured-icon";
import Page from "@/components/page";
import { BackgroundPattern } from "@/components/shared-assets/background-patterns";
import { useLanguage, useTranslations } from "@/lib/LanguageContext";
import useGiftCard from "@/hooks/use-gift-cards";
import type { GiftCard } from "@/types/gift-card";

// Generate Gift Card Modal Component
const GenerateGiftCardModal = ({
    isOpen,
    onOpenChange,
    onConfirm,
    isLoading = false,
}: {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    onConfirm: (sessions: number) => void;
    isLoading?: boolean;
}) => {
    const t = useTranslations();
    const [sessions, setSessions] = useState("");

    const handleSubmit = () => {
        const sessionsNum = parseInt(sessions);
        if (sessionsNum && sessionsNum > 0) {
            onConfirm(sessionsNum);
            setSessions("");
        }
    };

    const handleClose = () => {
        if (!isLoading) {
            setSessions("");
            onOpenChange(false);
        }
    };

    return (
        <ModalOverlay isOpen={isOpen} onOpenChange={handleClose} isDismissable={!isLoading}>
            <Modal className="max-w-md" isDismissable={!isLoading}>
                <Dialog>
                    <div className="relative w-full overflow-hidden rounded-2xl bg-primary shadow-xl transition-all sm:max-w-100">
                        <CloseButton onClick={handleClose} theme="light" size="lg" className="absolute top-3 right-3" isDisabled={isLoading} />
                        <div className="flex flex-col gap-4 px-4 pt-5 sm:px-6 sm:pt-6">
                            <div className="relative w-max">
                                <FeaturedIcon color="brand" size="lg" theme="light" icon={Gift01} />
                                <BackgroundPattern pattern="circle" size="sm" className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                            </div>
                            <div className="z-10 flex flex-col gap-0.5">
                                <AriaHeading slot="title" className="text-md font-semibold text-primary">
                                    {t("giftCards.generateTitle")}
                                </AriaHeading>
                                <p className="text-sm text-tertiary">{t("giftCards.generateDescription")}</p>
                            </div>
                        </div>
                        <div className="px-4 pt-6 sm:px-6">
                            <Input
                                label={t("giftCards.numberOfSessions")}
                                placeholder={t("giftCards.numberOfSessionsPlaceholder")}
                                type="number"
                                value={sessions}
                                onChange={setSessions}
                                isRequired
                                isDisabled={isLoading}
                            />
                        </div>
                        <div className="z-10 flex flex-1 flex-col-reverse gap-3 p-4 pt-6 *:grow sm:grid sm:grid-cols-2 sm:px-6 sm:pt-8 sm:pb-6">
                            <Button color="secondary" size="lg" onClick={handleClose} isDisabled={isLoading}>
                                {t("common.cancel")}
                            </Button>
                            <Button color="primary" size="lg" onClick={handleSubmit} isLoading={isLoading} isDisabled={!sessions || parseInt(sessions) <= 0}>
                                {t("giftCards.generate")}
                            </Button>
                        </div>
                    </div>
                </Dialog>
            </Modal>
        </ModalOverlay>
    );
};

export default function GiftCards() {
    const t = useTranslations();
    const { currentLocale } = useLanguage();

    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize] = useState(5);
    const [searchQuery, setSearchQuery] = useState("");
    const [showGenerateModal, setShowGenerateModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [selectedGiftCard, setSelectedGiftCard] = useState<GiftCard | null>(null);
    const [isGenerating, setIsGenerating] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    const {
        giftCards,
        loading,
        error,
        count,
        countLoading,
        totalPages,
        hasNextPage,
        hasPreviousPage,
        createGiftCard,
        deleteGiftCard,
        searchResults,
        searchLoading,
        searchError,
        searchTotalHits,
        searchGiftCards,
        clearSearch,
    } = useGiftCard({
        page: currentPage,
        limit: pageSize,
    });

    // Determine if we're in search mode
    const isSearchMode = searchQuery.trim().length > 0;

    // Handle search input changes with debounced search
    const handleSearchChange = useCallback(
        async (value: string) => {
            setSearchQuery(value);

            if (value.trim().length === 0) {
                clearSearch();
            } else if (value.trim().length >= 2) {
                try {
                    await searchGiftCards(value.trim());
                } catch (error) {
                    console.error("Search failed:", error);
                }
            }
        },
        [searchGiftCards, clearSearch],
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

    const handleGenerateGiftCard = async (sessions: number) => {
        setIsGenerating(true);
        try {
            await createGiftCard(sessions);
            toast.custom((toastId) => (
                <IconNotification
                    title={t("common.success")}
                    description={t("giftCards.generateSuccess")}
                    color="success"
                    hideDismissLabel={true}
                    onClose={() => toast.dismiss(toastId)}
                />
            ));
            setShowGenerateModal(false);
        } catch (error) {
            console.error("Error generating gift card:", error);
            toast.custom((toastId) => (
                <IconNotification
                    title={t("common.error")}
                    description={t("giftCards.generateFailed")}
                    color="error"
                    hideDismissLabel={true}
                    onClose={() => toast.dismiss(toastId)}
                />
            ));
        } finally {
            setIsGenerating(false);
        }
    };

    const handleDeleteGiftCard = async () => {
        if (!selectedGiftCard) return;

        setIsDeleting(true);
        try {
            await deleteGiftCard(selectedGiftCard.code);
            toast.custom((toastId) => (
                <IconNotification
                    title={t("common.success")}
                    description={t("giftCards.deleteSuccess")}
                    color="success"
                    hideDismissLabel={true}
                    onClose={() => toast.dismiss(toastId)}
                />
            ));
            setShowDeleteModal(false);
            setSelectedGiftCard(null);
        } catch (error) {
            console.error("Error deleting gift card:", error);
            toast.custom((toastId) => (
                <IconNotification
                    title={t("common.error")}
                    description={t("giftCards.deleteFailed")}
                    color="error"
                    hideDismissLabel={true}
                    onClose={() => toast.dismiss(toastId)}
                />
            ));
        } finally {
            setIsDeleting(false);
        }
    };

    const handleDeleteClick = (giftCard: GiftCard) => {
        setSelectedGiftCard(giftCard);
        setShowDeleteModal(true);
    };

    const formatCurrency = (amount: number, currency: string) => {
        return new Intl.NumberFormat(currentLocale, {
            style: "currency",
            currency: currency.toUpperCase(),
        }).format(amount);
    };

    const formatDate = (timestamp: any) => {
        if (!timestamp) return t("common.na");
        try {
            const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
            return date.toLocaleDateString(currentLocale, {
                year: "numeric",
                month: "short",
                day: "numeric",
            });
        } catch {
            return t("common.na");
        }
    };

    return (
        <Page title={t("nav.giftCards")} className="p-8">
            <Breadcrumbs className="mb-4">
                <Breadcrumbs.Item icon={HomeLine} href="/app" />
                <Breadcrumbs.Item>{t("nav.giftCards")}</Breadcrumbs.Item>
            </Breadcrumbs>

            <div className="mb-6 flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-semibold text-primary">{isSearchMode ? t("common.searchResults") : t("giftCards.allGiftCards")}</h1>
                    {isSearchMode ? (
                        <p className="mt-1 text-sm text-tertiary">
                            {t("common.resultsFor", { count: searchTotalHits, query: searchQuery })}
                        </p>
                    ) : (
                        !countLoading &&
                        count !== null && (
                            <p className="mt-1 text-sm text-tertiary">
                                {t("common.totalCount", { count, item: t("giftCards.itemName") })}
                            </p>
                        )
                    )}
                </div>
                <Button color="primary" iconLeading={Plus} onClick={() => setShowGenerateModal(true)}>
                    {t("giftCards.generateGiftCard")}
                </Button>
            </div>

            <div className="mb-6 flex gap-3">
                <Input
                    placeholder={t("giftCards.searchPlaceholder")}
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
                <Table aria-label={t("giftCards.allGiftCards")} selectionMode="none">
                    <Table.Header>
                        <Table.Head id="code" label={t("giftCards.code")} isRowHeader />
                        <Table.Head id="amount" label={t("giftCards.amount")} />
                        <Table.Head id="sessions" label={t("giftCards.sessions")} />
                        <Table.Head id="purchaseDate" label={t("giftCards.purchaseDate")} />
                        <Table.Head id="status" label={t("giftCards.status")} />
                        <Table.Head id="actions" />
                    </Table.Header>

                    <Table.Body>
                        {(isSearchMode ? searchLoading : loading) ? (
                            <Table.Row key="loading">
                                <Table.Cell colSpan={6}>
                                    <div className="flex items-center justify-center py-8">
                                        <span className="text-sm text-tertiary">{isSearchMode ? t("common.searchingItem", { item: t("giftCards.itemName") }) : t("common.loadingItem", { item: t("giftCards.itemName") })}</span>
                                    </div>
                                </Table.Cell>
                            </Table.Row>
                        ) : (isSearchMode ? searchError : error) ? (
                            <Table.Row key="error">
                                <Table.Cell colSpan={6}>
                                    <div className="flex items-center justify-center py-8">
                                        <span className="text-sm text-tertiary">
                                            {t("common.errorItem", { action: isSearchMode ? t("common.searching") : t("common.loading"), item: t("giftCards.itemName") })}:{" "}
                                            {isSearchMode ? searchError : (error as any)?.message || t("common.unknownError")}
                                        </span>
                                    </div>
                                </Table.Cell>
                            </Table.Row>
                        ) : (isSearchMode ? searchResults : giftCards).length === 0 ? (
                            <Table.Row key="empty">
                                <Table.Cell colSpan={6}>
                                    <div className="flex items-center justify-center py-8">
                                        <span className="text-sm text-tertiary">
                                            {isSearchMode ? t("common.noItemsFoundFor", { item: t("giftCards.itemName"), query: searchQuery }) : t("common.noItemsFound", { item: t("giftCards.itemName") })}
                                        </span>
                                    </div>
                                </Table.Cell>
                            </Table.Row>
                        ) : (
                            (isSearchMode ? searchResults : giftCards).map((giftCard) => {
                                // Handle both Firebase and Algolia results
                                const giftCardCode = giftCard.code || (giftCard as any).objectID;

                                const giftCardData = isSearchMode
                                    ? ({
                                          ...giftCard,
                                          code: giftCardCode,
                                      } as GiftCard)
                                    : giftCard;
                                return (
                                    <Table.Row key={giftCardCode} id={giftCardCode}>
                                        <Table.Cell>
                                            <div className="group flex items-center gap-3 outline-hidden">
                                                <div>
                                                    <p className="text-sm font-medium text-primary">{giftCardData.code}</p>
                                                    <p className="font-mono text-xs text-tertiary">{giftCardData.paymentId || t("common.na")}</p>
                                                </div>
                                            </div>
                                        </Table.Cell>
                                        <Table.Cell>
                                            <span className="text-sm font-medium text-primary">
                                                {formatCurrency(giftCardData.amount || 0, giftCardData.currency || "usd")}
                                            </span>
                                        </Table.Cell>
                                        <Table.Cell>
                                            <span className="text-sm text-tertiary">{giftCardData.sessions || 0}</span>
                                        </Table.Cell>
                                        <Table.Cell>
                                            <span className="text-sm text-tertiary">{formatDate(giftCardData.purchaseDate)}</span>
                                        </Table.Cell>
                                        <Table.Cell>
                                            <BadgeWithDot size="sm" color={giftCardData.used ? "error" : "success"} type="modern">
                                                {giftCardData.used ? t("giftCards.used") : t("giftCards.available")}
                                            </BadgeWithDot>
                                        </Table.Cell>
                                        <Table.Cell className="px-4">
                                            <div className="flex justify-end gap-0.5">
                                                <ButtonUtility
                                                    size="xs"
                                                    tooltip={t("giftCards.deleteGiftCard")}
                                                    icon={Trash01}
                                                    onClick={() => handleDeleteClick(giftCardData)}
                                                    disabled={isDeleting}
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
            <GenerateGiftCardModal isOpen={showGenerateModal} onOpenChange={setShowGenerateModal} onConfirm={handleGenerateGiftCard} isLoading={isGenerating} />
            <DeleteConfirmationModal
                isOpen={showDeleteModal}
                onClose={() => setShowDeleteModal(false)}
                onConfirm={handleDeleteGiftCard}
                title={t("giftCards.deleteTitle")}
                description={t("giftCards.deleteDescription", { code: selectedGiftCard?.code ?? "" })}
                isLoading={isDeleting}
            />
        </Page>
    );
}
