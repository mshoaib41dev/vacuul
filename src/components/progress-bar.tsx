import { useEffect, useLayoutEffect } from "react";
import NProgress from "nprogress";

export function NProgressB(): null {
    NProgress.configure({
        showSpinner: false,
    });

    useLayoutEffect(() => {
        NProgress.start();
    }, []);

    useEffect(() => {
        NProgress.done();
    }, []);

    return null;
}

export default function ProgressBar() {
    return (
        <>
            <NProgressB />
        </>
    );
}
