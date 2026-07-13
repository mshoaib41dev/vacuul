import type { FC, HTMLAttributes } from "react";
import { useRef, useState } from "react";
import type { Placement } from "@react-types/overlays";
import { ChevronSelectorVertical, LogOut01, Settings01 } from "@untitledui/icons";
import type { DialogProps as AriaDialogProps } from "react-aria-components";
import {
    Button as AriaButton,
    Dialog as AriaDialog,
    DialogTrigger as AriaDialogTrigger,
    Heading as AriaHeading,
    Popover as AriaPopover,
} from "react-aria-components";
import { useNavigate } from "react-router";
import { Modal, Dialog as ModalDialog, ModalOverlay } from "@/components/application/modals/modal";
import { AvatarLabelGroup } from "@/components/base/avatar/avatar-label-group";
import { Button } from "@/components/base/buttons/button";
import { CloseButton } from "@/components/base/buttons/close-button";
import { FeaturedIcon } from "@/components/foundations/featured-icon/featured-icon";
import { BackgroundPattern } from "@/components/shared-assets/background-patterns";
import { useAuth } from "@/hooks/use-auth";
import { useBreakpoint } from "@/hooks/use-breakpoint";
import { useTranslations } from "@/lib/LanguageContext";
import { cx } from "@/utils/cx";

const SignOutConfirmDialog = ({ isOpen, onOpenChange }: { isOpen: boolean; onOpenChange: (open: boolean) => void }) => {
    const { logout } = useAuth();
    const t = useTranslations();

    const handleConfirmSignOut = async () => {
        try {
            await logout();
            onOpenChange(false);
        } catch (error) {
            console.error("Error signing out:", error);
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
                                <div className="relative w-max">
                                    <FeaturedIcon color="error" size="lg" theme="light" icon={LogOut01} />
                                    <BackgroundPattern pattern="circle" size="sm" className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                                </div>
                                <div className="z-10 flex flex-col gap-0.5">
                                    <AriaHeading slot="title" className="text-md font-semibold text-primary">
                                        {t("signOut.title")}
                                    </AriaHeading>
                                    <p className="text-sm text-tertiary">
                                        {t("signOut.description")}
                                    </p>
                                </div>
                            </div>
                            <div className="z-10 flex flex-1 flex-col-reverse gap-3 p-4 pt-6 *:grow sm:grid sm:grid-cols-2 sm:px-6 sm:pt-8 sm:pb-6">
                                <Button color="secondary" size="lg" onClick={() => onOpenChange(false)}>
                                    {t("signOut.cancel")}
                                </Button>
                                <Button color="primary-destructive" size="lg" onClick={handleConfirmSignOut}>
                                    {t("signOut.confirm")}
                                </Button>
                            </div>
                        </div>
                    </ModalDialog>
                </Modal>
            </ModalOverlay>
        </AriaDialogTrigger>
    );
};

export const NavAccountMenu = ({ className, ...dialogProps }: AriaDialogProps & { className?: string }) => {
    const [showSignOutDialog, setShowSignOutDialog] = useState(false);
    const navigate = useNavigate();
    const t = useTranslations();

    const handleSignOutClick = () => {
        setShowSignOutDialog(true);
    };

    return (
        <>
            <AriaDialog {...dialogProps} className={cx("w-66 rounded-xl bg-secondary_alt shadow-lg ring ring-secondary_alt outline-hidden", className)}>
                <div className="rounded-xl bg-primary ring-1 ring-secondary">
                    <div className="flex flex-col gap-0.5 py-1.5">
                        <NavAccountCardMenuItem label={t("signOut.accountSettings")} icon={Settings01} onClick={() => navigate("/app/account")} />
                    </div>
                </div>

                <div className="pt-1 pb-1.5">
                    <NavAccountCardMenuItem label={t("signOut.confirm")} icon={LogOut01} onClick={handleSignOutClick} />
                </div>
            </AriaDialog>

            <SignOutConfirmDialog isOpen={showSignOutDialog} onOpenChange={setShowSignOutDialog} />
        </>
    );
};

const NavAccountCardMenuItem = ({
    icon: Icon,
    label,
    ...buttonProps
}: {
    icon?: FC<{ className?: string }>;
    label: string;
} & HTMLAttributes<HTMLButtonElement>) => {
    return (
        <button {...buttonProps} className={cx("group/item w-full cursor-pointer px-1.5 focus:outline-hidden", buttonProps.className)}>
            <div
                className={cx(
                    "flex w-full items-center gap-3 rounded-md p-2 group-hover/item:bg-primary_hover",
                    "outline-focus-ring group-focus-visible/item:outline-2 group-focus-visible/item:outline-offset-2",
                )}
            >
                <div className="flex gap-2 text-sm font-semibold text-secondary group-hover/item:text-secondary_hover">
                    {Icon && <Icon className="size-5 text-fg-quaternary" />} {label}
                </div>
            </div>
        </button>
    );
};

export const NavAccountCard = ({ popoverPlacement }: { popoverPlacement?: Placement }) => {
    const triggerRef = useRef<HTMLDivElement>(null);
    const isDesktop = useBreakpoint("lg");
    const { user } = useAuth();
    const t = useTranslations();

    if (!user || !user.email) {
        return null;
    }

    return (
        <div ref={triggerRef} className="relative flex items-center gap-3 rounded-xl p-3 ring-1 ring-secondary ring-inset">
            <AvatarLabelGroup
                size="md"
                src={user.photoURL || undefined}
                title={user.displayName || user.email?.split("@")[0] || t("users.user")}
                subtitle={user.email}
            />

            <div className="absolute top-1.5 right-1.5">
                <AriaDialogTrigger>
                    <AriaButton className="flex cursor-pointer items-center justify-center rounded-md p-1.5 text-fg-quaternary outline-focus-ring transition duration-100 ease-linear hover:bg-primary_hover hover:text-fg-quaternary_hover focus-visible:outline-2 focus-visible:outline-offset-2 pressed:bg-primary_hover pressed:text-fg-quaternary_hover">
                        <ChevronSelectorVertical className="size-4 shrink-0" />
                    </AriaButton>
                    <AriaPopover
                        placement={popoverPlacement ?? (isDesktop ? "right bottom" : "top right")}
                        triggerRef={triggerRef}
                        offset={8}
                        className={({ isEntering, isExiting }) =>
                            cx(
                                "will-change-transform",
                                isEntering &&
                                    "duration-150 ease-out animate-in fade-in placement-right:origin-left placement-right:slide-in-from-left-0.5 placement-top:origin-bottom placement-top:slide-in-from-bottom-0.5 placement-bottom:origin-top placement-bottom:slide-in-from-top-0.5",
                                isExiting &&
                                    "duration-100 ease-in animate-out fade-out placement-right:origin-left placement-right:slide-out-to-left-0.5 placement-top:origin-bottom placement-top:slide-out-to-bottom-0.5 placement-bottom:origin-top placement-bottom:slide-out-to-top-0.5",
                            )
                        }
                    >
                        <NavAccountMenu />
                    </AriaPopover>
                </AriaDialogTrigger>
            </div>
        </div>
    );
};
