import { FeaturedIcon } from "@/components/foundations/featured-icon/featured-icon";
import Page from "@/components/page";
import { BackgroundPattern } from "@/components/shared-assets/background-patterns";

interface AuthLayoutProps {
    name: string;
    title: string;
    description?: string | React.ReactNode;
    icon?: React.ReactNode;
    children: React.ReactNode;
}

export default function AuthLayout({ name, icon, title, description, children }: AuthLayoutProps) {
    return (
        <Page title={name} className="flex min-h-screen items-center justify-center overflow-hidden bg-secondary px-4 py-12 md:px-8 md:pt-24">
            <div className="mx-auto flex w-full flex-col gap-8 sm:max-w-110">
                <div className="flex flex-col items-center gap-6 text-center">
                    <div className="relative">
                        <BackgroundPattern pattern="grid" className="absolute top-1/2 left-1/2 z-0 hidden -translate-x-1/2 -translate-y-1/2 md:block" />
                        <BackgroundPattern pattern="grid" size="md" className="absolute top-1/2 left-1/2 z-0 -translate-x-1/2 -translate-y-1/2 md:hidden" />
                        <FeaturedIcon color="gray" theme="modern" size="xl" className="z-10">
                            {icon}
                        </FeaturedIcon>
                    </div>
                    <div className="z-10 flex flex-col gap-2 md:gap-3">
                        <h1 className="text-display-xs font-semibold text-primary md:text-display-sm">{title}</h1>
                        <p className="text-md text-tertiary">{description}</p>
                    </div>
                </div>
                {children}
            </div>
        </Page>
    );
}
