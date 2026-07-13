import { useState } from "react";
import { HomeLine, Key01, Mail01, User01 } from "@untitledui/icons";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Breadcrumbs } from "@/components/application/breadcrumbs/breadcrumbs";
import { IconNotification } from "@/components/application/notifications/notifications";
import { SectionHeader } from "@/components/application/section-headers/section-headers";
import { SectionLabel } from "@/components/application/section-headers/section-label";
import { Button } from "@/components/base/buttons/button";
import { Form } from "@/components/base/form/form";
import { InputBase, TextField } from "@/components/base/input/input";
import { Label } from "@/components/base/input/label";
import { Select } from "@/components/base/select/select";
import Page from "@/components/page";
import useRoles from "@/hooks/use-roles";
import useUser from "@/hooks/use-users";
import { useTranslations } from "@/lib/LanguageContext";

export default function CreateUser() {
    const t = useTranslations();
    const navigate = useNavigate();
    const [displayName, setDisplayName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [role, setRole] = useState<string>("user");

    const [isLoading, setIsLoading] = useState(false);

    const { createUser } = useUser();
    const { roles } = useRoles();

    const roleOptions = [{ id: "user", label: t("users.user") }, ...roles.map((role) => ({ id: role.id, label: role.name }))];

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            if (!displayName || !email || !password) {
                throw new Error(t("users.fieldsRequired"));
            }

            // Create user
            await createUser({
                displayName,
                email,
                password,
                roleId: role === "user" ? null : role,
            });

            toast.custom((toastId) => (
                <IconNotification
                    title={t("common.success")}
                    description={t("users.createSuccess")}
                    color="success"
                    hideDismissLabel={true}
                    onClose={() => toast.dismiss(toastId)}
                />
            ));
            navigate("/app/users");
        } catch (error) {
            console.error("Error creating user:", error);
            toast.custom((toastId) => (
                <IconNotification
                    title={t("common.error")}
                    description={error instanceof Error ? error.message : t("users.createFailed")}
                    color="error"
                    hideDismissLabel={true}
                    onClose={() => toast.dismiss(toastId)}
                />
            ));
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Page title={t("users.createNew")} className="p-8">
            <Breadcrumbs className="mb-4">
                <Breadcrumbs.Item icon={HomeLine} href="/app" />
                <Breadcrumbs.Item href="/app/users">{t("nav.users")}</Breadcrumbs.Item>
                <Breadcrumbs.Item>{t("users.createNew")}</Breadcrumbs.Item>
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
                                {t("users.createUser")}
                            </Button>
                        </SectionHeader.Actions>
                    </SectionHeader.Group>
                </SectionHeader.Root>

                <div className="flex flex-col gap-5">
                    <div className="grid grid-cols-1 lg:grid-cols-[minmax(200px,280px)_minmax(400px,512px)] lg:gap-8">
                        <SectionLabel.Root isRequired size="sm" title={t("users.displayName")} className="max-lg:hidden" />

                        <TextField isRequired name="displayName" value={displayName} onChange={setDisplayName}>
                            <Label className="lg:hidden">{t("users.displayName")}</Label>
                            <InputBase size="md" icon={User01} />
                        </TextField>
                    </div>

                    <hr className="h-px w-full border-none bg-border-secondary" />

                    <div className="grid grid-cols-1 lg:grid-cols-[minmax(200px,280px)_minmax(400px,512px)] lg:gap-8">
                        <SectionLabel.Root isRequired size="sm" title={t("users.emailAddress")} className="max-lg:hidden" />

                        <TextField isRequired name="email" type="email" value={email} onChange={setEmail}>
                            <Label className="lg:hidden">{t("users.emailAddress")}</Label>
                            <InputBase size="md" icon={Mail01} />
                        </TextField>
                    </div>

                    <hr className="h-px w-full border-none bg-border-secondary" />

                    <div className="grid grid-cols-1 lg:grid-cols-[minmax(200px,280px)_minmax(400px,512px)] lg:gap-8">
                        <SectionLabel.Root isRequired size="sm" title={t("users.password")} className="max-lg:hidden" />

                        <TextField isRequired name="password" type="password" value={password} onChange={setPassword}>
                            <Label className="lg:hidden">{t("users.password")}</Label>
                            <InputBase size="md" icon={Key01} />
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
                </div>
            </Form>
        </Page>
    );
}
