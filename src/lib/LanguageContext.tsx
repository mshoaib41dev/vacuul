import { createContext, useCallback, useContext, useEffect, useState } from "react";
import type { ReactNode } from "react";
import type { Locale } from "./i18n";
import { defaultLocale } from "./i18n";

const STORAGE_KEY = "vacuuladmin-locale";

type Messages = Record<string, string>;

interface LanguageContextType {
    currentLocale: Locale;
    changeLanguage: (locale: Locale) => void;
    messages: Messages;
}

const LanguageContext = createContext<LanguageContextType>({
    currentLocale: defaultLocale,
    changeLanguage: () => {},
    messages: {},
});

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
    const [currentLocale, setCurrentLocale] = useState<Locale>(() => {
        const stored = localStorage.getItem(STORAGE_KEY);
        return (stored === "en" || stored === "de" ? stored : defaultLocale) as Locale;
    });
    const [messages, setMessages] = useState<Messages>({});

    const loadMessages = useCallback(async (locale: Locale) => {
        try {
            const mod = await import(`../locales/${locale}.json`);
            setMessages(mod.default ?? mod);
        } catch {
            if (locale !== defaultLocale) {
                const fallback = await import(`../locales/${defaultLocale}.json`);
                setMessages(fallback.default ?? fallback);
            }
        }
    }, []);

    useEffect(() => {
        loadMessages(currentLocale);
    }, [currentLocale, loadMessages]);

    const changeLanguage = useCallback((locale: Locale) => {
        setCurrentLocale(locale);
        localStorage.setItem(STORAGE_KEY, locale);
    }, []);

    return (
        <LanguageContext.Provider value={{ currentLocale, changeLanguage, messages }}>
            {children}
        </LanguageContext.Provider>
    );
};

export const useLanguage = () => useContext(LanguageContext);

export const useTranslations = () => {
    const { messages } = useContext(LanguageContext);

    return useCallback(
        (key: string, params?: Record<string, string | number>) => {
            let value = messages[key] ?? key;
            if (params) {
                for (const [k, v] of Object.entries(params)) {
                    value = value.replace(new RegExp(`\\{\\{${k}\\}\\}`, "g"), String(v));
                }
            }
            return value;
        },
        [messages],
    );
};
