import { useEffect, useState } from "react";
import { Mail01 } from "@untitledui/icons";
import { Radio, RadioGroup } from "react-aria-components";
import { toast } from "sonner";
import { FileUpload } from "@/components/application/file-upload/file-upload-base";
import { Dark, Light, System } from "@/components/application/modals/base-components/appearances";
import { IconNotification } from "@/components/application/notifications/notifications";
import { SectionFooter } from "@/components/application/section-footers/section-footer";
import { SectionHeader } from "@/components/application/section-headers/section-headers";
import { SectionLabel } from "@/components/application/section-headers/section-label";
import { Avatar } from "@/components/base/avatar/avatar";
import { Button } from "@/components/base/buttons/button";
import { Form } from "@/components/base/form/form";
import { InputBase, TextField } from "@/components/base/input/input";
import { Label } from "@/components/base/input/label";
import { RadioButtonBase } from "@/components/base/radio-buttons/radio-buttons";
import { Select } from "@/components/base/select/select";
import Page from "@/components/page";
import { useAuth } from "@/hooks/use-auth";
import { useLanguage, useTranslations } from "@/lib/LanguageContext";
import { useTheme } from "@/providers/theme-provider";
import { cx } from "@/utils/cx";

export default function Account() {
    const { user, updateName, updatePhotoURL } = useAuth();
    const { theme, setTheme } = useTheme();
    const { currentLocale, changeLanguage } = useLanguage();
    const t = useTranslations();
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [profileImage, setProfileImage] = useState<string | null>(null);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [loadingProfileInfo, setLoadingProfileInfo] = useState(false);

    const themes = [
        {
            value: "system",
            label: t("account.systemPreference"),
            component: System,
        },
        {
            value: "light",
            label: t("account.lightMode"),
            component: Light,
        },
        {
            value: "dark",
            label: t("account.darkMode"),
            component: Dark,
        },
    ];

    useEffect(() => {
        setEmail(user?.email || "");
        setName(user?.displayName || "");
        setProfileImage(user?.photoURL || null);
    }, [user]);

    const handleUpdateInfo = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoadingProfileInfo(true);

        try {
            await updateName(name);

            if (selectedFile) {
                const downloadURL = await updatePhotoURL(selectedFile);
                setProfileImage(downloadURL);
                setSelectedFile(null);
            }

            toast.custom((toastId) => (
                <IconNotification
                    title={t("common.updated")}
                    description={t("account.profileUpdated")}
                    color="success"
                    hideDismissLabel={true}
                    onClose={() => toast.dismiss(toastId)}
                />
            ));
        } catch (error) {
            console.error("Error updating profile:", error);
            toast.custom((toastId) => (
                <IconNotification
                    title={t("common.oops")}
                    description={t("account.profileUpdateFailed")}
                    color="error"
                    hideDismissLabel={true}
                    onClose={() => toast.dismiss(toastId)}
                />
            ));
        } finally {
            setLoadingProfileInfo(false);
        }
    };

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

    return (
        <Page title={t("account.settings")} className="p-6">
            <div className="flex flex-col gap-8">
                <div className="flex flex-col gap-5 px-4 lg:px-8">
                    <div className="relative flex flex-col gap-5">
                        <div className="flex flex-col gap-4 lg:flex-row lg:justify-between">
                            <div className="flex flex-col gap-0.5 lg:gap-1">
                                <h1 className="text-xl font-semibold text-primary lg:text-display-xs">{t("account.settings")}</h1>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="px-4 lg:px-8">
                    <Form className="flex flex-col gap-6" onSubmit={handleUpdateInfo}>
                        <SectionHeader.Root>
                            <SectionHeader.Group>
                                <div className="flex flex-1 flex-col justify-center gap-0.5 self-stretch">
                                    <SectionHeader.Heading>{t("account.personalInfo")}</SectionHeader.Heading>
                                    <SectionHeader.Subheading>{t("account.personalInfoDescription")}</SectionHeader.Subheading>
                                </div>

                                <SectionHeader.Actions>
                                    <Button type="submit" color="primary" size="md" isLoading={loadingProfileInfo}>
                                        {t("common.saveChanges")}
                                    </Button>
                                </SectionHeader.Actions>
                            </SectionHeader.Group>
                        </SectionHeader.Root>

                        <div className="flex flex-col gap-5">
                            <div className="grid grid-cols-1 lg:grid-cols-[minmax(200px,280px)_minmax(400px,512px)] lg:gap-8">
                                <SectionLabel.Root isRequired size="sm" title={t("account.name")} className="max-lg:hidden" />

                                <TextField isRequired name="name" value={name} defaultValue={name} onChange={(e) => setName(e)}>
                                    <Label className="lg:hidden">{t("account.name")}</Label>
                                    <InputBase size="md" />
                                </TextField>
                            </div>

                            <hr className="h-px w-full border-none bg-border-secondary" />

                            <div className="grid grid-cols-1 lg:grid-cols-[minmax(200px,280px)_minmax(400px,512px)] lg:gap-8">
                                <SectionLabel.Root isRequired size="sm" title={t("account.emailAddress")} className="max-lg:hidden" />

                                <TextField isRequired name="email" type="email" value={email} isDisabled>
                                    <Label className="lg:hidden">{t("account.emailAddress")}</Label>
                                    <InputBase size="md" icon={Mail01} />
                                </TextField>
                            </div>

                            <hr className="h-px w-full border-none bg-border-secondary" />

                            <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(200px,280px)_minmax(400px,512px)] lg:gap-8">
                                <SectionLabel.Root isRequired size="sm" title={t("account.yourPhoto")} description={t("account.yourPhotoDescription")} />
                                <div className="flex flex-col gap-5 lg:flex-row">
                                    <Avatar size="2xl" src={profileImage} />

                                    <FileUpload.DropZone
                                        className="w-full"
                                        allowsMultiple={false}
                                        onDropFiles={(files) => handleFileUpload(files[0])}
                                        maxSize={5242880}
                                        hint={t("account.photoHint")}
                                        accept="image/*"
                                    />
                                </div>
                            </div>

                            <hr className="h-px w-full border-none bg-border-secondary" />

                            <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(200px,280px)_1fr] lg:gap-8">
                                <SectionLabel.Root size="sm" title={t("account.displayPreference")} description={t("account.displayPreferenceDescription")} />

                                <div className="flex flex-col gap-3 lg:hidden">
                                    <Label>{t("account.displayPreference")}</Label>
                                    <p className="text-sm text-tertiary">{t("account.displayPreferenceDescription")}</p>
                                </div>

                                <RadioGroup
                                    aria-label={t("account.displayPreference")}
                                    value={theme}
                                    onChange={(value) => setTheme(value as "light" | "dark" | "system")}
                                    className="flex gap-5"
                                >
                                    {themes.map((themeOption) => (
                                        <Radio key={themeOption.value} value={themeOption.value} className="flex cursor-pointer flex-col gap-3">
                                            {({ isSelected, isFocusVisible }) => (
                                                <>
                                                    <section
                                                        className={cx(
                                                            "relative h-33 w-50 rounded-[10px] border border-border-secondary bg-utility-gray-100",
                                                            isSelected && "outline-2 outline-offset-2 outline-focus-ring",
                                                        )}
                                                    >
                                                        <themeOption.component className="size-full" />

                                                        {isSelected && (
                                                            <RadioButtonBase
                                                                size="md"
                                                                isSelected={isSelected}
                                                                isFocusVisible={isFocusVisible}
                                                                className="absolute bottom-2 left-2"
                                                            />
                                                        )}
                                                    </section>
                                                    <section className="w-full">
                                                        <p className="text-sm font-semibold text-primary">{themeOption.label}</p>
                                                    </section>
                                                </>
                                            )}
                                        </Radio>
                                    ))}
                                </RadioGroup>
                            </div>

                            <hr className="h-px w-full border-none bg-border-secondary" />

                            <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(200px,280px)_1fr] lg:gap-8">
                                <SectionLabel.Root size="sm" title={t("account.language")} description={t("account.languageDescription")} />

                                <div className="w-max min-w-50">
                                    <Select
                                        name="language"
                                        aria-label={t("account.language")}
                                        size="sm"
                                        selectedKey={currentLocale}
                                        onSelectionChange={(key) => changeLanguage(key as "en" | "de")}
                                        items={[
                                            {
                                                id: "en",
                                                label: "English (US)",
                                                icon: <img aria-hidden src="https://www.untitledui.com/images/flags/US.svg" alt="US" className="size-5" />,
                                            },
                                            {
                                                id: "de",
                                                label: "German (DE)",
                                                icon: <img aria-hidden src="https://www.untitledui.com/images/flags/DE.svg" alt="DE" className="size-5" />,
                                            },
                                        ]}
                                    >
                                        {(item) => (
                                            <Select.Item id={item.id} icon={item.icon}>
                                                {item.label}
                                            </Select.Item>
                                        )}
                                    </Select>
                                </div>
                            </div>
                        </div>

                        <SectionFooter.Root className="-mt-1">
                            <SectionFooter.Actions>
                                <Button type="submit" color="primary" size="md" isLoading={loadingProfileInfo}>
                                    {t("common.saveChanges")}
                                </Button>
                            </SectionFooter.Actions>
                        </SectionFooter.Root>
                    </Form>
                </div>
            </div>
        </Page>
    );
}
