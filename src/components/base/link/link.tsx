import type { ComponentProps, MouseEventHandler } from "react";
import { Link as AriaLink } from "react-aria-components";
import { useNavigate } from "react-router-dom";

interface LinkProps extends Omit<ComponentProps<typeof AriaLink>, "href" | "onClick"> {
    href?: string;
    onClick?: MouseEventHandler;
}

export const Link = ({ href, onClick, children, ...props }: LinkProps) => {
    const navigate = useNavigate();

    const handleClick = (e: React.MouseEvent) => {
        if (href && !href.startsWith("http") && !href.startsWith("mailto:") && !href.startsWith("tel:")) {
            e.preventDefault();
            navigate(href);
        }

        if (onClick) {
            onClick.call;
        }
    };

    const isExternal = href?.startsWith("http") || href?.startsWith("mailto:") || href?.startsWith("tel:");

    return (
        <AriaLink {...props} href={isExternal ? href : undefined} onClick={handleClick}>
            {children}
        </AriaLink>
    );
};
