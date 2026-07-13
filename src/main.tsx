import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { Toaster } from "sonner";
import { AuthProvider } from "@/contexts/auth-context";
import { LanguageProvider } from "@/lib/LanguageContext";
import { AppQueryClientProvider } from "@/providers/query-client-provider";
import { ThemeProvider } from "@/providers/theme-provider";
import "nprogress/nprogress.css";
import "@/styles/globals.css";
import App from "./App";

createRoot(document.getElementById("root")!).render(
    <StrictMode>
        <ThemeProvider>
            <LanguageProvider>
                <BrowserRouter>
                    <AppQueryClientProvider>
                        <AuthProvider>
                            <App />
                        </AuthProvider>
                    </AppQueryClientProvider>
                    <Toaster />
                </BrowserRouter>
            </LanguageProvider>
        </ThemeProvider>
    </StrictMode>,
);
