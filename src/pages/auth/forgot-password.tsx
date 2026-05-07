// Hooks
import { useState } from "react";
import { ArrowLeft, Key01, Mail01 } from "@untitledui/icons";
import { toast } from "sonner";
import { Button } from "@/components/base/buttons/button";
import { Form } from "@/components/base/form/form";
import { Input } from "@/components/base/input/input";
import { useAuth } from "@/hooks/use-auth";
import AuthLayout from "@/layouts/auth-layout";
import { useTranslations } from "@/lib/LanguageContext";

export default function ForgotPassword() {
    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const { resetPassword } = useAuth();
    const t = useTranslations();

    const handleOnSubmitForm = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);

        await resetPassword(email)
            .then(() => {
                setLoading(false);
                setSuccess(true);
            })
            .catch((error) => {
                setLoading(false);
                setEmail("");
                toast.error(error.message);
                console.error(error);
            });
    };

    return (
        <AuthLayout
            name={t("forgotPassword.title")}
            icon={success ? <Mail01 className="size-7" /> : <Key01 className="size-7" />}
            title={success ? t("forgotPassword.checkEmail") : t("forgotPassword.title")}
            description={
                success ? (
                    <>
                        {t("forgotPassword.sentLink")}
                        <span className="text-md font-medium"> {email}</span>
                    </>
                ) : (
                    t("forgotPassword.description")
                )
            }
        >
            {success === false ? (
                <>
                    <Form onSubmit={handleOnSubmitForm} className="z-10 flex flex-col gap-6">
                        <Input
                            isRequired
                            hideRequiredIndicator
                            label={t("forgotPassword.email")}
                            type="email"
                            name="email"
                            placeholder={t("forgotPassword.emailPlaceholder")}
                            size="md"
                            value={email}
                            onChange={setEmail}
                        />

                        <div className="flex flex-col gap-4">
                            <Button type="submit" size="lg" isLoading={loading}>
                                {t("forgotPassword.resetPassword")}
                            </Button>
                        </div>
                    </Form>
                    <div className="z-10 flex justify-center gap-1 text-center">
                        <Button size="md" color="link-gray" href="/signin" className="mx-auto" iconLeading={ArrowLeft}>
                            {t("forgotPassword.backToLogin")}
                        </Button>
                    </div>
                </>
            ) : (
                <>
                    <div className="flex flex-col items-center gap-8 text-center">
                        <p className="flex gap-1">
                            <span className="text-sm text-tertiary">{t("forgotPassword.didntReceive")}</span>
                            <Button color="link-color" size="md" onClick={() => setSuccess(false)}>
                                {t("forgotPassword.clickToResend")}
                            </Button>
                        </p>
                        <Button size="md" color="link-gray" href="/signin" className="mx-auto" iconLeading={ArrowLeft}>
                            {t("forgotPassword.backToLogin")}
                        </Button>
                    </div>
                </>
            )}
        </AuthLayout>
    );
}
