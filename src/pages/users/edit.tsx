import { useEffect, useState } from "react";
import { CreditCard01, Hash01, HomeLine, Link03, Mail01, User01 } from "@untitledui/icons";
import { useParams } from "react-router-dom";
import { toast } from "sonner";
import { Breadcrumbs } from "@/components/application/breadcrumbs/breadcrumbs";
import { FileUpload } from "@/components/application/file-upload/file-upload-base";
import { IconNotification } from "@/components/application/notifications/notifications";
import { SectionHeader } from "@/components/application/section-headers/section-headers";
import { SectionLabel } from "@/components/application/section-headers/section-label";
import { Avatar } from "@/components/base/avatar/avatar";
import { Button } from "@/components/base/buttons/button";
import { Form } from "@/components/base/form/form";
import { InputBase, TextField } from "@/components/base/input/input";
import { Label } from "@/components/base/input/label";
import { Select } from "@/components/base/select/select";
import Page from "@/components/page";
import useRoles from "@/hooks/use-roles";
import useUser from "@/hooks/use-users";
import { useTranslations } from "@/lib/LanguageContext";
import type { User } from "@/types/user";

export default function EditUser() {
    const { id } = useParams<{ id: string }>();
    const { getUser, updateUser } = useUser();
    const { roles } = useRoles();
    const t = useTranslations();

    const [user, setUser] = useState<User | null>(null);
    const [isLoadingUser, setIsLoadingUser] = useState(true);
    const [userError, setUserError] = useState<string | null>(null);

    const [displayName, setDisplayName] = useState("");
    const [email, setEmail] = useState("");
    const [sessions, setSessions] = useState(0);
    const [disabled, setDisabled] = useState(false);
    const [role, setRole] = useState<string>("user");
    const [profileImage, setProfileImage] = useState<string | null>(null);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    // Fetch user data on component mount
    useEffect(() => {
        if (!id) {
            setUserError(t("users.userIdRequired"));
            setIsLoadingUser(false);
            return;
        }

        const fetchUser = async () => {
            try {
                setIsLoadingUser(true);
                setUserError(null);
                const userData = await getUser(id);

                if (!userData) {
                    setUserError(t("users.userNotFound"));
                    return;
                }

                setUser(userData);
                setDisplayName(userData.displayName || "");
                setEmail(userData.email || "");
                setSessions(userData.sessions ?? 0);
                setDisabled(userData.disabled ?? false);
                setRole(userData.roleId || "user");
                setProfileImage(userData.photoURL || null);
            } catch (error) {
                console.error("Error fetching user:", error);
                setUserError(t("users.failedToLoadData"));
            } finally {
                setIsLoadingUser(false);
            }
        };

        fetchUser();
    }, [id]);

    // Create role options with default "User" option
    const roleOptions = [{ id: "user", label: t("users.user") }, ...roles.map((role) => ({ id: role.id, label: role.name }))];

    const handleFileUpload = (file?: File) => {
        if (file) {
            setSelectedFile(file);
            const reader = new FileReader();
            reader.onload = (e) => {
                setProfileImage(e.target?.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        if (!id || !user) {
            toast.custom((toastId) => (
                <IconNotification
                    title={t("common.error")}
                    description={t("users.dataNotAvailable")}
                    color="error"
                    hideDismissLabel={true}
                    onClose={() => toast.dismiss(toastId)}
                />
            ));
            return;
        }

        setIsLoading(true);

        try {
            if (!displayName.trim()) {
                throw new Error(t("users.displayNameRequired"));
            }

            let photoURL = user.photoURL || undefined;

            await updateUser(
                id,
                {
                    displayName,
                    sessions,
                    disabled,
                    roleId: role === "user" ? null : role,
                    photoURL,
                },
                selectedFile || undefined,
            );
            setSelectedFile(null);
            setUser((currentUser) =>
                currentUser
                    ? {
                          ...currentUser,
                          displayName: displayName.trim(),
                          sessions,
                          roleId: role === "user" ? null : role,
                      }
                    : currentUser,
            );

            toast.custom((toastId) => (
                <IconNotification
                    title={t("common.success")}
                    description={t("users.updateSuccess")}
                    color="success"
                    hideDismissLabel={true}
                    onClose={() => toast.dismiss(toastId)}
                />
            ));
        } catch (error) {
            console.error("Error updating user:", error);
            toast.custom((toastId) => (
                <IconNotification
                    title={t("common.error")}
                    description={error instanceof Error ? error.message : t("users.updateFailed")}
                    color="error"
                    hideDismissLabel={true}
                    onClose={() => toast.dismiss(toastId)}
                />
            ));
        } finally {
            setIsLoading(false);
        }
    };

    const handleStripeLink = () => {
        if (user?.stripeLink) {
            window.open(user.stripeLink, "_blank", "noopener,noreferrer");
        }
    };

    // Show loading state while fetching user data
    if (isLoadingUser) {
        return (
            <Page title={t("users.editUser")} className="p-8">
                <Breadcrumbs className="mb-4">
                    <Breadcrumbs.Item icon={HomeLine} href="/app" />
                    <Breadcrumbs.Item href="/app/users">{t("nav.users")}</Breadcrumbs.Item>
                    <Breadcrumbs.Item>{t("users.editUser")}</Breadcrumbs.Item>
                </Breadcrumbs>
                <div className="flex items-center justify-center py-8">
                    <span className="text-sm text-tertiary">{t("users.loadingUserData")}</span>
                </div>
            </Page>
        );
    }

    // Show error state if user couldn't be loaded
    if (userError || !user) {
        return (
            <Page title={t("users.editUser")} className="p-8">
                <Breadcrumbs className="mb-4">
                    <Breadcrumbs.Item icon={HomeLine} href="/app" />
                    <Breadcrumbs.Item href="/app/users">{t("nav.users")}</Breadcrumbs.Item>
                    <Breadcrumbs.Item>{t("users.editUser")}</Breadcrumbs.Item>
                </Breadcrumbs>
                <div className="flex items-center justify-center py-8">
                    <span className="text-sm text-tertiary">{userError || t("users.userNotFound")}</span>
                </div>
            </Page>
        );
    }

    return (
        <Page title={t("users.editUser")} className="p-8">
            <Breadcrumbs className="mb-4">
                <Breadcrumbs.Item icon={HomeLine} href="/app" />
                <Breadcrumbs.Item href="/app/users">{t("nav.users")}</Breadcrumbs.Item>
                <Breadcrumbs.Item>{t("users.editUser")}</Breadcrumbs.Item>
            </Breadcrumbs>

            <Form className="flex flex-col gap-6" onSubmit={handleSubmit}>
                <SectionHeader.Root>
                    <SectionHeader.Group>
                        <div className="flex flex-1 flex-col justify-center gap-0.5 self-stretch">
                            <SectionHeader.Heading>{t("users.personalInfo")}</SectionHeader.Heading>
                            <SectionHeader.Subheading>{t("users.personalInfoDescription")}</SectionHeader.Subheading>
                        </div>

                        <SectionHeader.Actions>
                            <Button type="button" color="secondary" size="md" href="/app/users">
                                {t("common.cancel")}
                            </Button>
                            <Button type="submit" color="primary" size="md" isLoading={isLoading}>
                                {t("users.updateUser")}
                            </Button>
                        </SectionHeader.Actions>
                    </SectionHeader.Group>
                </SectionHeader.Root>

                <div className="flex flex-col gap-5">
                    <div className="grid grid-cols-1 lg:grid-cols-[minmax(200px,280px)_minmax(400px,512px)] lg:gap-8">
                        <SectionLabel.Root size="sm" title={t("users.userId")} className="max-lg:hidden" />

                        <TextField name="userId" value={user.id} onChange={() => {}} isDisabled>
                            <Label className="lg:hidden">{t("users.userId")}</Label>
                            <InputBase size="md" icon={Hash01} />
                        </TextField>
                    </div>

                    <hr className="h-px w-full border-none bg-border-secondary" />

                    <div className="grid grid-cols-1 lg:grid-cols-[minmax(200px,280px)_minmax(400px,512px)] lg:gap-8">
                        <SectionLabel.Root isRequired size="sm" title={t("users.displayName")} className="max-lg:hidden" />

                        <TextField isRequired name="displayName" value={displayName} onChange={setDisplayName}>
                            <Label className="lg:hidden">{t("users.displayName")}</Label>
                            <InputBase size="md" icon={User01} />
                        </TextField>
                    </div>

                    <hr className="h-px w-full border-none bg-border-secondary" />

                    <div className="grid grid-cols-1 lg:grid-cols-[minmax(200px,280px)_minmax(400px,512px)] lg:gap-8">
                        <SectionLabel.Root size="sm" title={t("users.emailAddress")} className="max-lg:hidden" />

                        <TextField name="email" type="email" value={email} onChange={() => {}} isDisabled>
                            <Label className="lg:hidden">{t("users.emailAddress")}</Label>
                            <InputBase size="md" icon={Mail01} />
                        </TextField>
                    </div>

                    <hr className="h-px w-full border-none bg-border-secondary" />

                    <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(200px,280px)_minmax(400px,512px)] lg:gap-8">
                        <SectionLabel.Root
                            size="sm"
                            title={t("users.profilePhoto")}
                            description={t("users.profilePhotoDescription")}
                            className="max-lg:hidden"
                        />
                        <div className="flex flex-col gap-5 lg:flex-row">
                            <Label className="lg:hidden">{t("users.profilePhoto")}</Label>
                            <Avatar size="2xl" src={profileImage || undefined} />

                            <FileUpload.DropZone
                                className="w-full"
                                allowsMultiple={false}
                                onDropFiles={(files) => handleFileUpload(files[0])}
                                maxSize={5242880}
                                hint={t("users.photoHint")}
                                accept="image/*"
                            />
                        </div>
                    </div>

                    <hr className="h-px w-full border-none bg-border-secondary" />

                    <div className="grid grid-cols-1 lg:grid-cols-[minmax(200px,280px)_minmax(400px,512px)] lg:gap-8">
                        <SectionLabel.Root size="sm" title={t("users.sessions")} className="max-lg:hidden" />

                        <TextField name="sessions" type="number" value={sessions.toString()} onChange={(value) => setSessions(Number(value) || 0)}>
                            <Label className="lg:hidden">{t("users.sessions")}</Label>
                            <InputBase size="md" />
                        </TextField>
                    </div>

                    <hr className="h-px w-full border-none bg-border-secondary" />

                    <div className="grid grid-cols-1 lg:grid-cols-[minmax(200px,280px)_minmax(400px,512px)] lg:gap-8">
                        <SectionLabel.Root size="sm" title={t("users.role")} className="max-lg:hidden" />

                        <div className="flex flex-col gap-1.5">
                            <Label className="lg:hidden">{t("users.role")}</Label>
                            <Select
                                items={roleOptions}
                                selectedKey={role}
                                onSelectionChange={(key) => setRole(key as string)}
                                placeholder={t("users.selectRole")}
                                size="md"
                            >
                                {(item) => (
                                    <Select.Item key={item.id} id={item.id}>
                                        {item.label}
                                    </Select.Item>
                                )}
                            </Select>
                        </div>
                    </div>

                    <hr className="h-px w-full border-none bg-border-secondary" />

                    <div className="grid grid-cols-1 lg:grid-cols-[minmax(200px,280px)_minmax(400px,512px)] lg:gap-8">
                        <SectionLabel.Root size="sm" title={t("users.stripeId")} className="max-lg:hidden" />

                        <TextField name="stripeId" value={user?.stripeId || ""} onChange={() => {}} isDisabled>
                            <Label className="lg:hidden">{t("users.stripeId")}</Label>
                            <InputBase size="md" icon={CreditCard01} placeholder={t("users.stripeIdPlaceholder")} />
                        </TextField>
                    </div>

                    <hr className="h-px w-full border-none bg-border-secondary" />

                    <div className="grid grid-cols-1 lg:grid-cols-[minmax(200px,280px)_minmax(400px,512px)] lg:gap-8">
                        <SectionLabel.Root size="sm" title={t("users.stripeLink")} description={t("users.stripeLinkDescription")} className="max-lg:hidden" />

                        <div className="flex items-center gap-3">
                            <Label className="lg:hidden">{t("users.stripeLink")}</Label>
                            {user?.stripeLink ? (
                                <Button type="button" color="tertiary" size="sm" iconLeading={Link03} onClick={handleStripeLink}>
                                    {t("users.viewInStripeDashboard")}
                                </Button>
                            ) : (
                                <span className="text-sm text-tertiary">{t("users.stripeNotFound")}</span>
                            )}
                        </div>
                    </div>
                </div>
            </Form>
        </Page>
    );
}
