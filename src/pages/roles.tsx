import { useEffect, useState } from "react";
import { Edit02, HomeLine, Plus, Trash01 } from "@untitledui/icons";
import { DialogTrigger as AriaDialogTrigger, Heading as AriaHeading } from "react-aria-components";
import { Breadcrumbs } from "@/components/application/breadcrumbs/breadcrumbs";
import { Modal, Dialog as ModalDialog, ModalOverlay } from "@/components/application/modals/modal";
import { Button } from "@/components/base/buttons/button";
import { CloseButton } from "@/components/base/buttons/close-button";
import { InputBase, TextField } from "@/components/base/input/input";
import { Label } from "@/components/base/input/label";
import { Toggle } from "@/components/base/toggle/toggle";
import { FeaturedIcon } from "@/components/foundations/featured-icon/featured-icon";
import Page from "@/components/page";
import useRoles from "@/hooks/use-roles";
import { CollectionName, CrudPermissions, PermissionMap, createEmptyPermissionMap } from "@/types/role";
import { useTranslations } from "@/lib/LanguageContext";

const DeleteRoleModal = ({
    isOpen,
    onOpenChange,
    roleName,
    onConfirm,
}: {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    roleName: string;
    onConfirm: () => void;
}) => {
    const t = useTranslations();

    return (
        <AriaDialogTrigger isOpen={isOpen} onOpenChange={onOpenChange}>
            <ModalOverlay isDismissable>
                <Modal>
                    <ModalDialog>
                        <div className="relative w-full overflow-hidden rounded-2xl bg-primary shadow-xl transition-all sm:max-w-100">
                            <CloseButton onClick={() => onOpenChange(false)} theme="light" size="lg" className="absolute top-3 right-3" />
                            <div className="flex flex-col gap-4 px-4 pt-5 sm:px-6 sm:pt-6">
                                <div className="relative w-max">
                                    <FeaturedIcon color="error" size="lg" theme="light" icon={Trash01} />
                                </div>
                                <div className="z-10 flex flex-col gap-0.5">
                                    <AriaHeading slot="title" className="text-md font-semibold text-primary">
                                        {t("roles.deleteTitle", { name: roleName })}
                                    </AriaHeading>
                                    <p className="text-sm text-tertiary">{t("roles.deleteDescription")}</p>
                                </div>
                            </div>
                            <div className="z-10 flex flex-1 flex-col-reverse gap-3 p-4 pt-6 *:grow sm:grid sm:grid-cols-2 sm:px-6 sm:pt-8 sm:pb-6">
                                <Button color="secondary" size="lg" onClick={() => onOpenChange(false)}>
                                    {t("common.cancel")}
                                </Button>
                                <Button color="primary-destructive" size="lg" onClick={onConfirm}>
                                    {t("common.delete")}
                                </Button>
                            </div>
                        </div>
                    </ModalDialog>
                </Modal>
            </ModalOverlay>
        </AriaDialogTrigger>
    );
};

const CreateRoleModal = ({
    isOpen,
    onOpenChange,
    onConfirm,
}: {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    onConfirm: (roleName: string) => void;
}) => {
    const t = useTranslations();
    const [roleName, setRoleName] = useState("");

    const handleCreate = () => {
        if (roleName.trim()) {
            onConfirm(roleName.trim());
            setRoleName("");
            onOpenChange(false);
        }
    };

    return (
        <AriaDialogTrigger isOpen={isOpen} onOpenChange={onOpenChange}>
            <ModalOverlay isDismissable>
                <Modal>
                    <ModalDialog>
                        <div className="relative w-full overflow-hidden rounded-2xl bg-primary shadow-xl transition-all sm:max-w-100">
                            <CloseButton onClick={() => onOpenChange(false)} theme="light" size="lg" className="absolute top-3 right-3" />
                            <div className="flex flex-col gap-4 px-4 pt-5 sm:px-6 sm:pt-6">
                                <div className="z-10 flex flex-col gap-0.5">
                                    <AriaHeading slot="title" className="text-md font-semibold text-primary">
                                        {t("roles.createTitle")}
                                    </AriaHeading>
                                </div>
                                <div className="flex flex-col gap-3">
                                    <TextField name="roleName" value={roleName} onChange={setRoleName}>
                                        <Label>{t("roles.roleName")}</Label>
                                        <InputBase size="md" />
                                    </TextField>
                                </div>
                            </div>
                            <div className="z-10 flex flex-1 flex-col-reverse gap-3 p-4 pt-6 *:grow sm:grid sm:grid-cols-2 sm:px-6 sm:pt-8 sm:pb-6">
                                <Button color="secondary" size="lg" onClick={() => onOpenChange(false)}>
                                    {t("common.cancel")}
                                </Button>
                                <Button color="primary" size="lg" onClick={handleCreate}>
                                    {t("common.create")}
                                </Button>
                            </div>
                        </div>
                    </ModalDialog>
                </Modal>
            </ModalOverlay>
        </AriaDialogTrigger>
    );
};

// Map collection names to translation keys
const collectionNameKeys: Record<CollectionName, string> = {
    users: "roles.collUsers",
    roles: "roles.collRoles",
    machines: "roles.collMachines",
    time_slots: "roles.collTimeSlots",
    gift_cards: "roles.collGiftCards",
    system_logs: "roles.collSystemLogs",
    content: "roles.collContent",
    pricing: "roles.collPricing",
    bookings: "roles.collBookings",
    sessions: "roles.collSessions",
    contact_us: "roles.collContactUs",
    firmware_packages: "roles.collFirmwarePackages",
};

export default function Roles() {
    const t = useTranslations();
    const { roles, loading, error, createRole, updateRole, deleteRole } = useRoles();
    const [selectedRoleId, setSelectedRoleId] = useState<string>("");
    const [rolePermissions, setRolePermissions] = useState<PermissionMap>(createEmptyPermissionMap());
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [saving, setSaving] = useState(false);

    const selectedRole = roles.find((role) => role.id === selectedRoleId);

    // Helper to format permission names for display (inside component to access t)
    const formatPermissionName = (operation: keyof CrudPermissions): string => {
        switch (operation) {
            case "create":
                return t("roles.permCreate");
            case "read":
                return t("roles.permView");
            case "update":
                return t("roles.permEdit");
            case "delete":
                return t("roles.permDelete");
            default:
                return operation;
        }
    };

    // Set default selected role when roles load
    useEffect(() => {
        if (roles.length > 0 && !selectedRoleId) {
            setSelectedRoleId(roles[0].id);
        }
    }, [roles, selectedRoleId]);

    // Update local permission state when selected role changes
    useEffect(() => {
        if (selectedRole) {
            setRolePermissions(selectedRole.permissions);
        }
    }, [selectedRole]);

    const handlePermissionToggle = (collection: CollectionName, operation: keyof CrudPermissions) => {
        setRolePermissions((prev) => ({
            ...prev,
            [collection]: {
                ...prev[collection],
                [operation]: !prev[collection][operation],
            },
        }));
    };

    const handleSaveChanges = async () => {
        if (!selectedRole) return;

        setSaving(true);
        try {
            await updateRole(selectedRole.id, {
                permissions: rolePermissions,
            });
        } catch (err) {
            console.error("Failed to save role changes:", err);
        } finally {
            setSaving(false);
        }
    };

    const handleDeleteRole = async () => {
        if (!selectedRole) return;

        try {
            await deleteRole(selectedRole.id);
            // Select the first available role after deletion
            const remainingRoles = roles.filter((role) => role.id !== selectedRole.id);
            if (remainingRoles.length > 0) {
                setSelectedRoleId(remainingRoles[0].id);
            } else {
                setSelectedRoleId("");
            }
        } catch (err) {
            console.error("Failed to delete role:", err);
        }
        setShowDeleteModal(false);
    };

    const handleCreateRole = async (roleName: string) => {
        try {
            const newRoleData = {
                name: roleName,
                permissions: createEmptyPermissionMap(),
                isSystemRole: false,
            };

            const createdRole = await createRole(newRoleData);
            setSelectedRoleId(createdRole.id);
        } catch (err) {
            console.error("Failed to create role:", err);
        }
    };

    return (
        <Page title={t("roles.title")} className="p-8">
            <Breadcrumbs className="mb-4">
                <Breadcrumbs.Item icon={HomeLine} href="/app" />
                <Breadcrumbs.Item>{t("roles.title")}</Breadcrumbs.Item>
            </Breadcrumbs>

            <div className="mb-6 flex flex-col items-start justify-start gap-2">
                <h1 className="text-2xl font-semibold text-primary">{t("roles.title")}</h1>
                <span className="text-sm text-fg-secondary">{t("roles.description")}</span>
            </div>

            {loading && (
                <div className="flex h-64 items-center justify-center">
                    <div className="text-center">
                        <span className="text-sm text-tertiary">{t("common.loading")}</span>
                    </div>
                </div>
            )}

            {!loading && error && (
                <div className="flex h-64 items-center justify-center">
                    <div className="text-center">
                        <span className="text-sm text-tertiary">{error.message}</span>
                    </div>
                </div>
            )}

            {!loading && !error && (
                <>
                    <div className="flex max-w-full flex-col gap-6 overflow-hidden lg:flex-row lg:gap-8">
                        {/* Roles List */}
                        <div className="flex shrink-0 flex-col gap-4 lg:max-w-[320px] lg:min-w-[280px]">
                            {roles.map((role) => (
                                <div
                                    key={role.id}
                                    className={`flex min-w-0 cursor-pointer items-start justify-between rounded-lg border p-3 hover:bg-secondary_alt ${
                                        selectedRoleId === role.id ? "border-border-brand bg-secondary_alt" : "border-border-secondary"
                                    }`}
                                    onClick={() => setSelectedRoleId(role.id)}
                                >
                                    <div className="flex min-w-0 flex-col gap-1">
                                        <span className="pr-2 text-sm font-medium break-words text-primary">{role.name}</span>
                                        {role.isSystemRole && <span className="text-xs text-tertiary">{t("roles.systemRole")}</span>}
                                    </div>
                                    <Edit02 className="size-4 shrink-0 text-tertiary" />
                                </div>
                            ))}

                            <Button size="md" color="secondary" iconLeading={Plus} className="w-full justify-center" onClick={() => setShowCreateModal(true)}>
                                {t("roles.newRole")}
                            </Button>
                        </div>

                        {/* Permissions Section */}
                        {selectedRole && (
                            <div className="flex min-w-0 flex-1 flex-col gap-6">
                                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                                    <div className="min-w-0">
                                        <h2 className="text-lg font-semibold break-words text-primary">{t("roles.permissionsFor", { name: selectedRole.name })}</h2>
                                        {selectedRole.isSystemRole && <p className="mt-1 text-sm text-tertiary">{t("roles.systemRoleProtected")}</p>}
                                    </div>
                                    <div className="flex shrink-0 gap-3">
                                        {!selectedRole.isSystemRole && (
                                            <Button size="md" color="secondary" onClick={() => setShowDeleteModal(true)}>
                                                {t("roles.deleteRole")}
                                            </Button>
                                        )}
                                        <Button size="md" color="primary" onClick={handleSaveChanges} disabled={saving || selectedRole.isSystemRole}>
                                            {saving ? t("roles.saving") : t("roles.saveChanges")}
                                        </Button>
                                    </div>
                                </div>

                                {/* Permissions Grid */}
                                <div className="space-y-6">
                                    {Object.entries(rolePermissions)
                                        .sort(([a], [b]) => a.localeCompare(b))
                                        .map(([collection, permissions]) => (
                                            <div key={collection} className="rounded-lg border border-border-secondary p-4">
                                                <h3 className="mb-4 text-md font-semibold text-primary">
                                                    {t(collectionNameKeys[collection as CollectionName])}
                                                </h3>
                                                <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                                                    {Object.entries(permissions)
                                                        .sort(([a], [b]) => a.localeCompare(b))
                                                        .map(([operation, enabled]) => (
                                                            <div key={`${collection}-${operation}`} className="flex items-center gap-3">
                                                                <Toggle
                                                                    size="md"
                                                                    isSelected={enabled}
                                                                    onChange={() =>
                                                                        handlePermissionToggle(collection as CollectionName, operation as keyof CrudPermissions)
                                                                    }
                                                                    className="shrink-0"
                                                                    isDisabled={selectedRole.isSystemRole}
                                                                />
                                                                <span className="text-sm font-medium text-secondary">
                                                                    {formatPermissionName(operation as keyof CrudPermissions)}
                                                                </span>
                                                            </div>
                                                        ))}
                                                </div>
                                            </div>
                                        ))}
                                </div>
                            </div>
                        )}
                    </div>
                </>
            )}

            {/* Modals */}
            <DeleteRoleModal isOpen={showDeleteModal} onOpenChange={setShowDeleteModal} roleName={selectedRole?.name || ""} onConfirm={handleDeleteRole} />
            <CreateRoleModal isOpen={showCreateModal} onOpenChange={setShowCreateModal} onConfirm={handleCreateRole} />
        </Page>
    );
}
