import { Trash01 } from "@untitledui/icons";
import { Heading as AriaHeading } from "react-aria-components";
import { Button } from "@/components/base/buttons/button";
import { CloseButton } from "@/components/base/buttons/close-button";
import { FeaturedIcon } from "@/components/foundations/featured-icon/featured-icon";
import { useTranslations } from "@/lib/LanguageContext";
import { BackgroundPattern } from "@/components/shared-assets/background-patterns";
import { Dialog, Modal, ModalOverlay } from "./modal";

interface DeleteConfirmationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    description: string;
    isLoading?: boolean;
}

export const DeleteConfirmationModal = ({ isOpen, onClose, onConfirm, title, description, isLoading = false }: DeleteConfirmationModalProps) => {
    const t = useTranslations();

    return (
        <ModalOverlay isOpen={isOpen} onOpenChange={onClose} isDismissable={!isLoading}>
            <Modal className="max-w-md" isDismissable={!isLoading}>
                <Dialog>
                    <div className="relative w-full overflow-hidden rounded-2xl bg-primary shadow-xl transition-all sm:max-w-100">
                        <CloseButton onClick={onClose} theme="light" size="lg" className="absolute top-3 right-3" isDisabled={isLoading} />
                        <div className="flex flex-col gap-4 px-4 pt-5 sm:px-6 sm:pt-6">
                            <div className="relative w-max">
                                <FeaturedIcon color="error" size="lg" theme="light" icon={Trash01} />
                                <BackgroundPattern pattern="circle" size="sm" className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                            </div>
                            <div className="z-10 flex flex-col gap-0.5">
                                <AriaHeading slot="title" className="text-md font-semibold text-primary">
                                    {title}
                                </AriaHeading>
                                <p className="text-sm text-tertiary">{description}</p>
                            </div>
                        </div>
                        <div className="z-10 flex flex-1 flex-col-reverse gap-3 p-4 pt-6 *:grow sm:grid sm:grid-cols-2 sm:px-6 sm:pt-8 sm:pb-6">
                            <Button color="secondary" size="lg" onClick={onClose} isDisabled={isLoading}>
                                {t("common.cancel")}
                            </Button>
                            <Button color="primary-destructive" size="lg" onClick={onConfirm} isLoading={isLoading}>
                                {t("common.delete")}
                            </Button>
                        </div>
                    </div>
                </Dialog>
            </Modal>
        </ModalOverlay>
    );
};
