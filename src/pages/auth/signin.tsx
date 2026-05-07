// Hooks
import { useState } from "react";
import { toast } from "sonner";
import { IconNotification } from "@/components/application/notifications/notifications";
import { Button } from "@/components/base/buttons/button";
import { Checkbox } from "@/components/base/checkbox/checkbox";
import { Form } from "@/components/base/form/form";
import { Input } from "@/components/base/input/input";
import Logo from "@/components/logo";
import { useAuth } from "@/hooks/use-auth";
import AuthLayout from "@/layouts/auth-layout";
import { useTranslations } from "@/lib/LanguageContext";

export default function Signin() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [rememberMe, setRememberMe] = useState(false);

    const { login } = useAuth();
    const t = useTranslations();

    const handleOnSubmitForm = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);
        await login(email, password, rememberMe)
            .then(() => {
                setLoading(false);
                toast.custom((toastId) => (
                    <IconNotification
                        title={t("signIn.welcomeBack")}
                        description={t("signIn.signedInSuccess")}
                        color="success"
                        hideDismissLabel={true}
                        onClose={() => toast.dismiss(toastId)}
                    />
                ));
            })
            .catch((e) => {
                setLoading(false);
                setEmail("");
                setPassword("");
                toast.custom((toastId) => (
                    <IconNotification
                        title={t("signIn.somethingWentWrong")}
                        description={e.message}
                        color="error"
                        hideDismissLabel={true}
                        onClose={() => toast.dismiss(toastId)}
                    />
                ));
            });
    };

    return (
        <AuthLayout name={t("signIn.title")} icon={<Logo full={false} />} title={t("signIn.title")} description={t("signIn.description")}>
            <Form onSubmit={handleOnSubmitForm} className="z-10 -mx-4 flex flex-col gap-6 bg-primary px-4 py-8 sm:mx-0 sm:rounded-2xl sm:px-8 sm:shadow-sm">
                <div className="flex flex-col gap-5">
                    <Input
                        isRequired
                        hideRequiredIndicator
                        label={t("signIn.email")}
                        type="email"
                        name="email"
                        placeholder={t("signIn.emailPlaceholder")}
                        size="md"
                        value={email}
                        onChange={setEmail}
                    />
                    <Input
                        isRequired
                        hideRequiredIndicator
                        label={t("signIn.password")}
                        type="password"
                        name="password"
                        size="md"
                        placeholder="••••••••"
                        value={password}
                        onChange={setPassword}
                    />
                </div>

                <div className="flex items-center">
                    <Checkbox label={t("signIn.rememberMe")} name="remember" isSelected={rememberMe} onChange={setRememberMe} />

                    <Button color="link-color" size="md" href="/forgot-password" className="ml-auto">
                        {t("signIn.forgotPassword")}
                    </Button>
                </div>

                <div className="flex flex-col gap-4">
                    <Button type="submit" size="lg" isLoading={loading}>
                        {t("signIn.signIn")}
                    </Button>
                </div>
            </Form>
        </AuthLayout>
    );
}
