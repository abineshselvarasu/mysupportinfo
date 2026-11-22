"use client";

import React, { useEffect, useState } from "react";
import { Sun, Moon, Monitor, LucideIcon } from "lucide-react";

export type ThemeMode = "light" | "dark" | "system";

const THEME_STORAGE_KEY = "msi_theme";

export interface ThemeToggleProps {
    className?: string;
    compact?: boolean;
    variant?: "auto" | "dark" | "light";
}

export default function ThemeToggle({
    className = "",
    compact = false,
    variant = "auto",
}: ThemeToggleProps) {
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
            <div
                className={`inline-flex items-center gap-1 p-1 rounded-xl h-8 w-24 ${
                    variant === "dark"
                        ? "bg-white/10 border border-white/20"
                        : variant === "light"
                        ? "bg-background-dark/5 border border-background-dark/15"
                        : "bg-background-dark/5 dark:bg-white/10 border border-background-dark/15 dark:border-white/20"
                } ${className}`}
            />
        );
    }

    const options: { mode: ThemeMode; label: string; icon: LucideIcon }[] = [
        { mode: "light", label: "Light", icon: Sun },
        { mode: "system", label: "System", icon: Monitor },
        { mode: "dark", label: "Dark", icon: Moon },
    ];

    // Styling variants
    // variant === "dark": For consistently dark surfaces (like the footer), regardless of active HTML theme
    // variant === "light": For consistently light surfaces
    // variant === "auto": Follows active document theme (light on light header, dark on dark header)
    const containerClasses =
        variant === "dark"
            ? "bg-white/10 border-2 border-white/20 text-white shadow-sm"
            : variant === "light"
            ? "bg-background-dark/5 border-2 border-background-dark/25 text-background-dark shadow-sm"
            : "bg-background-dark/5 dark:bg-white/10 border-2 border-background-dark/25 dark:border-white/20 text-background-dark dark:text-white transition-colors shadow-sm";

    const getButtonClasses = (isSelected: boolean) => {
        if (variant === "dark") {
            return isSelected
                ? "bg-primary text-background-dark shadow-block-sm scale-102 font-black"
                : "text-accent/80 hover:text-white hover:bg-white/10";
        }
        if (variant === "light") {
            return isSelected
                ? "bg-background-dark text-white shadow-block-sm scale-102 font-extrabold"
                : "text-background-dark/75 hover:text-background-dark hover:bg-background-dark/10";
        }
        // auto variant
        return isSelected
            ? "bg-background-dark text-white dark:bg-primary dark:text-background-dark shadow-block-sm scale-102 font-extrabold"
            : "text-background-dark/75 dark:text-accent/80 hover:text-background-dark dark:hover:text-white hover:bg-background-dark/10 dark:hover:bg-white/10";
    };

    const handleKeyDown = (e: React.KeyboardEvent, index: number) => {
        let nextIndex = index;
        if (e.key === "ArrowRight" || e.key === "ArrowDown") {
            e.preventDefault();
            nextIndex = (index + 1) % options.length;
        } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
            e.preventDefault();
            nextIndex = (index - 1 + options.length) % options.length;
        } else if (e.key === "Home") {
            e.preventDefault();
            nextIndex = 0;
        } else if (e.key === "End") {
            e.preventDefault();
            nextIndex = options.length - 1;
        }
        if (nextIndex !== index) {
            applyTheme(options[nextIndex].mode);
        }
    };

    return (
        <div
            role="radiogroup"
            aria-label="Color theme selector"
            className={`inline-flex items-center gap-0.5 p-1 rounded-xl transition-colors ${containerClasses} ${className}`}
        >
            {options.map((opt, i) => {
                const Icon = opt.icon;
                const isSelected = theme === opt.mode;
                return (
                    <button
                        key={opt.mode}
                        type="button"
                        role="radio"
                        aria-checked={isSelected}
                        tabIndex={isSelected ? 0 : -1}
                        onKeyDown={(e) => handleKeyDown(e, i)}
                        aria-label={`${opt.label} theme`}
                        title={`${opt.label} theme`}
                        onClick={() => applyTheme(opt.mode)}
                        className={`flex items-center justify-center gap-1.5 px-2 py-1 rounded-lg text-3xs uppercase tracking-wider transition-all cursor-pointer ${getButtonClasses(
                            isSelected
                        )}`}
                    >
                        <Icon size={13} strokeWidth={2.4} />
                        {!compact && <span className="hidden sm:inline font-bold">{opt.label}</span>}
                    </button>
                );
            })}
        </div>
    );
}
