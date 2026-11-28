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
                if (stored && ["light", "dark", "system"].includes(stored)) setTheme(stored);
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
            document.documentElement.classList.toggle("dark", isDark);
            window.dispatchEvent(new CustomEvent("theme-changed", { detail: mode }));
        } catch {
            // ignore
        }
    };

    const options: { mode: ThemeMode; label: string; icon: LucideIcon }[] = [
        { mode: "light", label: "Light", icon: Sun },
        { mode: "system", label: "System", icon: Monitor },
        { mode: "dark", label: "Dark", icon: Moon },
    ];

    const containerClasses =
        variant === "dark"
            ? "bg-white/10 border border-white/15 text-white"
            : variant === "light"
            ? "bg-[#F2ECE1] border border-foreground/15 text-foreground"
            : "bg-well border border-line text-ink";

    if (!mounted) {
        return (
            <div
                aria-hidden="true"
                className={`inline-flex items-center p-0.5 rounded-lg h-8 ${compact ? "w-[78px]" : "w-[90px]"} ${containerClasses} ${className}`}
            />
        );
    }

    const getButtonClasses = (isSelected: boolean) => {
        if (variant === "dark") {
            return isSelected
                ? "bg-primary text-foreground font-bold"
                : "text-white/75 hover:text-white hover:bg-white/10 font-medium";
        }
        if (variant === "light") {
            return isSelected
                ? "bg-background-dark text-white font-bold"
                : "text-foreground/75 hover:text-foreground hover:bg-foreground/5 font-medium";
        }
        return isSelected
            ? "bg-brand text-white dark:bg-primary dark:text-foreground font-bold"
            : "text-muted hover:text-ink hover:bg-hover font-medium";
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
            className={`inline-flex items-center gap-0.5 p-0.5 rounded-lg ${containerClasses} ${className}`}
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
                        className={`inline-flex items-center justify-center rounded-md transition-colors cursor-pointer ${
                            compact ? "p-1" : "p-1.5"
                        } ${getButtonClasses(isSelected)}`}
                    >
                        <Icon size={compact ? 13 : 14} strokeWidth={2.2} aria-hidden="true" />
                    </button>
                );
            })}
        </div>
    );
}
