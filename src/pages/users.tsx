import { useCallback, useState } from "react";
import { Edit01, HomeLine, Link03, Plus, SearchLg, Trash01, UserMinus01, UserPlus01 } from "@untitledui/icons";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Breadcrumbs } from "@/components/application/breadcrumbs/breadcrumbs";
import { DeleteConfirmationModal } from "@/components/application/modals/delete-confirmation-modal";
import { IconNotification } from "@/components/application/notifications/notifications";
import { PaginationPageDefault } from "@/components/application/pagination/pagination";
import { Table, TableCard } from "@/components/application/table/table";
import { Avatar } from "@/components/base/avatar/avatar";
import { BadgeWithDot } from "@/components/base/badges/badges";
import { Button } from "@/components/base/buttons/button";
import { ButtonUtility } from "@/components/base/buttons/button-utility";
import { Input } from "@/components/base/input/input";
import Page from "@/components/page";
import { useDebouncedSearch } from "@/hooks/use-debounce";
import useUser from "@/hooks/use-users";
import { useTranslations } from "@/lib/LanguageContext";
import type { User } from "@/types/user";

export default function Users() {
    const navigate = useNavigate();
    const t = useTranslations();
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize] = useState(5); // Items per page
    const [searchQuery, setSearchQuery] = useState("");
    const [isDisabling, setIsDisabling] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; user: User | null }>({
        isOpen: false,
        user: null,
    });

    const {
        users,
        loading,
        error,
        count,
        countLoading,
        totalPages,
        hasNextPage,
        hasPreviousPage,
        disableUser,
        enableUser,
        deleteUserAccount,
        searchResults,
        searchLoading,
        searchError,
        searchTotalHits,
        searchUsers,
        clearSearch,
    } = useUser({
        page: currentPage,
        limit: pageSize,
    });

    useDebouncedSearch({
        query: searchQuery,
        search: searchUsers,
        clearSearch,
    });

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

    const handleEdit = (user: User) => {
        navigate(`/app/users/edit/${user.id}`);
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

    const handleToggleUserStatus = async (user: User) => {
        setIsDisabling(true);
        try {
            if (user.disabled ?? false) {
                await enableUser(user.id);
                toast.custom((toastId) => (
                    <IconNotification
                        title={t("common.success")}
                        description={t("users.enabledSuccess", { name: user.displayName || t("users.user") })}
                        color="success"
                        hideDismissLabel={true}
                        onClose={() => toast.dismiss(toastId)}
                    />
                ));
            } else {
                await disableUser(user.id);
                toast.custom((toastId) => (
                    <IconNotification
                        title={t("common.success")}
                        description={t("users.disabledSuccess", { name: user.displayName || t("users.user") })}
                        color="success"
                        hideDismissLabel={true}
                        onClose={() => toast.dismiss(toastId)}
                    />
                ));
            }
        } catch (error) {
            console.error("Error toggling user status:", error);
            toast.custom((toastId) => (
                <IconNotification
                    title={t("common.error")}
                    description={t("users.statusUpdateFailed")}
                    color="error"
                    hideDismissLabel={true}
                    onClose={() => toast.dismiss(toastId)}
                />
            ));
        } finally {
            setIsDisabling(false);
        }
    };

    const handleStripeLink = (stripeLink: string) => {
        window.open(stripeLink, "_blank", "noopener,noreferrer");
    };

    const handleDeleteClick = (user: User) => {
        setDeleteModal({ isOpen: true, user });
    };

    const handleDeleteConfirm = async () => {
        if (!deleteModal.user) return;

        setIsDeleting(true);
        try {
            await deleteUserAccount(deleteModal.user.id);
            toast.custom((toastId) => (
                <IconNotification
                    title={t("common.success")}
                    description={t("users.deleteSuccess", { name: deleteModal.user?.displayName || t("users.user") })}
                    color="success"
                    hideDismissLabel={true}
                    onClose={() => toast.dismiss(toastId)}
                />
            ));
            setDeleteModal({ isOpen: false, user: null });
        } catch (error) {
            console.error("Error deleting user account:", error);
            toast.custom((toastId) => (
                <IconNotification
                    title={t("common.error")}
                    description={error instanceof Error ? error.message : t("users.deleteFailed")}
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
        setDeleteModal({ isOpen: false, user: null });
    };

    return (
        <Page title={t("nav.users")} className="p-8">
            <Breadcrumbs className="mb-4">
                <Breadcrumbs.Item icon={HomeLine} href="/app" />
                <Breadcrumbs.Item>{t("nav.users")}</Breadcrumbs.Item>
            </Breadcrumbs>

            <div className="mb-6 flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-semibold text-primary">{isSearchMode ? t("common.searchResults") : t("users.allUsers")}</h1>
                    {isSearchMode ? (
                        <p className="mt-1 text-sm text-tertiary">{t("common.resultsFor", { count: searchTotalHits, query: searchQuery })}</p>
                    ) : (
                        !countLoading &&
                        count !== null && <p className="mt-1 text-sm text-tertiary">{t("common.totalCount", { count, item: t("nav.users").toLowerCase() })}</p>
                    )}
                </div>
                <Button color="primary" iconLeading={Plus} href="/app/users/create">
                    {t("users.createNew")}
                </Button>
            </div>

            <div className="mb-6 flex gap-3">
                <Input
                    placeholder={t("users.searchPlaceholder")}
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
                <Table aria-label={t("nav.users")} selectionMode="none">
                    <Table.Header>
                        <Table.Head id="displayName" label={t("users.displayName")} isRowHeader />
                        <Table.Head id="email" label={t("users.email")} />
                        <Table.Head id="sessions" label={t("users.sessions")} />
                        <Table.Head id="status" label={t("users.status")} />
                        <Table.Head id="stripeLink" label={t("users.stripe")} />
                        <Table.Head id="actions" />
                    </Table.Header>

                    <Table.Body>
                        {(isSearchMode ? searchLoading : loading) ? (
                            <Table.Row key="loading">
                                <Table.Cell colSpan={6}>
                                    <div className="flex items-center justify-center py-8">
                                        <span className="text-sm text-tertiary">{isSearchMode ? t("users.searchingUsers") : t("users.loadingUsers")}</span>
                                    </div>
                                </Table.Cell>
                            </Table.Row>
                        ) : (isSearchMode ? searchError : error) ? (
                            <Table.Row key="error">
                                <Table.Cell colSpan={6}>
                                    <div className="flex items-center justify-center py-8">
                                        <span className="text-sm text-tertiary">
                                            {t("users.errorLoadingUsers", { action: isSearchMode ? t("common.searching") : t("common.loading") })}{" "}
                                            {isSearchMode ? searchError : (error as any)?.message || t("common.unknownError")}
                                        </span>
                                    </div>
                                </Table.Cell>
                            </Table.Row>
                        ) : (isSearchMode ? searchResults : users).length === 0 ? (
                            <Table.Row key="empty">
                                <Table.Cell colSpan={6}>
                                    <div className="flex items-center justify-center py-8">
                                        <span className="text-sm text-tertiary">
                                            {isSearchMode ? t("users.noUsersFoundFor", { query: searchQuery }) : t("users.noUsersFound")}
                                        </span>
                                    </div>
                                </Table.Cell>
                            </Table.Row>
                        ) : (
                            (isSearchMode ? searchResults : users).map((user) => {
                                // Handle users returned with either id, uid, or objectID.
                                const userId = user.id || (user as any).objectID;
                                const userData = isSearchMode
                                    ? ({
                                          ...user,
                                          id: userId,
                                      } as User)
                                    : user;

                                return (
                                    <Table.Row key={userId} id={userId}>
                                        <Table.Cell>
                                            <div className="group flex items-center gap-3 outline-hidden">
                                                <Avatar
                                                    src={userData.photoURL || undefined}
                                                    alt={userData.displayName || t("users.user")}
                                                    initials={(userData.displayName || "U").substring(0, 1)}
                                                    size="sm"
                                                />
                                                <div>
                                                    <p className="text-sm font-medium text-primary">{userData.displayName || t("common.na")}</p>
                                                    <p className="font-mono text-xs text-tertiary">{userId}</p>
                                                </div>
                                            </div>
                                        </Table.Cell>
                                        <Table.Cell>
                                            <span className="text-sm text-tertiary">{userData.email || t("common.na")}</span>
                                        </Table.Cell>
                                        <Table.Cell>
                                            <span className="text-sm text-tertiary">{userData.sessions ?? 0}</span>
                                        </Table.Cell>
                                        <Table.Cell>
                                            <BadgeWithDot size="sm" color={(userData.disabled ?? false) ? "error" : "success"} type="modern">
                                                {(userData.disabled ?? false) ? t("common.disabled") : t("common.active")}
                                            </BadgeWithDot>
                                        </Table.Cell>
                                        <Table.Cell>
                                            {userData.stripeLink ? (
                                                <ButtonUtility
                                                    size="xs"
                                                    color="tertiary"
                                                    tooltip={t("users.viewInStripe")}
                                                    icon={Link03}
                                                    onClick={() => handleStripeLink(userData.stripeLink!)}
                                                />
                                            ) : (
                                                <span className="text-xs text-tertiary">{t("users.noStripe")}</span>
                                            )}
                                        </Table.Cell>
                                        <Table.Cell className="px-4">
                                            <div className="flex justify-end gap-0.5">
                                                <ButtonUtility
                                                    size="xs"
                                                    tooltip={(userData.disabled ?? false) ? t("users.enableUser") : t("users.disableUser")}
                                                    icon={(userData.disabled ?? false) ? UserPlus01 : UserMinus01}
                                                    onClick={() => handleToggleUserStatus(userData)}
                                                    disabled={isDisabling}
                                                />
                                                <ButtonUtility
                                                    size="xs"
                                                    color="tertiary"
                                                    tooltip={t("common.edit")}
                                                    icon={Edit01}
                                                    onClick={() => handleEdit(userData)}
                                                />
                                                <ButtonUtility
                                                    size="xs"
                                                    color="tertiary"
                                                    tooltip={t("users.deleteAccount")}
                                                    icon={Trash01}
                                                    onClick={() => handleDeleteClick(userData)}
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
                title={t("users.deleteTitle", { name: deleteModal.user?.displayName || deleteModal.user?.email || t("users.user") })}
                description={t("users.deleteDescription")}
                isLoading={isDeleting}
            />
        </Page>
    );
}
