import type { ComponentProps, MouseEventHandler } from "react";
import { Link as AriaLink } from "react-aria-components";

interface LinkProps extends Omit<ComponentProps<typeof AriaLink>, "href" | "onClick"> {
    href?: string;
    onClick?: MouseEventHandler;
}

export const Link = ({ href, onClick, children, ...props }: LinkProps) => {
    return (
        <AriaLink {...props} href={href || undefined} onClick={onClick}>
            {children}
        </AriaLink>
    );
};
