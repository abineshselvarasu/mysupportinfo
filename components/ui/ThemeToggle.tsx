"use client";

import React, { useEffect, useState } from "react";
import { Sun, Moon, Monitor, LucideIcon } from "lucide-react";

export type ThemeMode = "light" | "dark" | "system";

const THEME_STORAGE_KEY = "msi_theme";

export default function ThemeToggle({
    className = "",
    compact = false,
}: {
    className?: string;
    compact?: boolean;
}) {
    const [theme, setTheme] = useState<ThemeMode>("system");
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        try {
            const stored = localStorage.getItem(THEME_STORAGE_KEY) as ThemeMode | null;
            if (stored && ["light", "dark", "system"].includes(stored)) {
                setTheme(stored);
            }
        } catch {
            // storage unavailable
        }

        const handleSync = () => {
            try {
                const stored = localStorage.getItem(THEME_STORAGE_KEY) as ThemeMode | null;
                if (stored) setTheme(stored);
            } catch { /* ignore */ }
        };

        window.addEventListener("theme-changed", handleSync);
        return () => window.removeEventListener("theme-changed", handleSync);
    }, []);

    const applyTheme = (mode: ThemeMode) => {
        setTheme(mode);
        try {
            localStorage.setItem(THEME_STORAGE_KEY, mode);
            const mql = window.matchMedia("(prefers-color-scheme: dark)");
            const isDark = mode === "dark" || (mode === "system" && mql.matches);
            if (isDark) {
                document.documentElement.classList.add("dark");
            } else {
                document.documentElement.classList.remove("dark");
            }
            window.dispatchEvent(new CustomEvent("theme-changed", { detail: mode }));
        } catch {
            // ignore
        }
    };

    if (!mounted) {
        // Render placeholder to avoid layout shift during SSR hydration
        return (
            <div className={`inline-flex items-center gap-1 p-1 rounded-xl bg-background-dark/5 border border-background-dark/15 h-8 w-24 ${className}`} />
        );
    }

    const options: { mode: ThemeMode; label: string; icon: LucideIcon }[] = [
        { mode: "light", label: "Light", icon: Sun },
        { mode: "system", label: "System", icon: Monitor },
        { mode: "dark", label: "Dark", icon: Moon },
    ];

    return (
        <div
            role="radiogroup"
            aria-label="Color theme selector"
            className={`inline-flex items-center gap-0.5 p-1 rounded-xl bg-background-dark/5 dark:bg-white/10 border-2 border-background-dark/20 dark:border-white/20 transition-colors ${className}`}
        >
            {options.map((opt) => {
                const Icon = opt.icon;
                const isSelected = theme === opt.mode;
                return (
                    <button
                        key={opt.mode}
                        type="button"
                        role="radio"
                        aria-checked={isSelected}
                        aria-label={`${opt.label} theme`}
                        title={`${opt.label} theme`}
                        onClick={() => applyTheme(opt.mode)}
                        className={`flex items-center justify-center gap-1.5 px-2 py-1 rounded-lg text-3xs font-extrabold uppercase tracking-wider transition-all cursor-pointer ${
                            isSelected
                                ? "bg-background-dark text-white dark:bg-primary dark:text-background-dark shadow-block-sm scale-102"
                                : "text-background-dark/60 dark:text-white/60 hover:text-background-dark dark:hover:text-white hover:bg-background-dark/10 dark:hover:bg-white/10"
                        }`}
                    >
                        <Icon size={13} strokeWidth={2.4} />
                        {!compact && <span className="hidden sm:inline">{opt.label}</span>}
                    </button>
                );
            })}
        </div>
    );
}
