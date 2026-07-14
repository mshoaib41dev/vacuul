import { useEffect } from "react";
import { APP_NAME } from "../config";

interface PageProps {
    title: string;
    children: React.ReactNode;
    className?: string;
}

export default function Page({ title, children, className }: PageProps) {
    useEffect(() => {
        document.title = `${title} | ${APP_NAME}`;
    }, [title]);
    return <div className={className}>{children}</div>;
}
