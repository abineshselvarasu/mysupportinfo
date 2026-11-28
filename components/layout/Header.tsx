"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Menu, X, ChevronRight } from "lucide-react";
import Logo from "@/components/ui/Logo";
import ThemeToggle from "@/components/ui/ThemeToggle";

const NAV_LINKS = [
    { href: "/", label: "Overview" },
    { href: "/bufferbloat", label: "Bufferbloat" },
    { href: "/what-is-my-ip", label: "IP & Leak Test" },
    { href: "/what-is-my-browser", label: "Browser" },
    { href: "/what-is-my-screen-resolution", label: "Screen Size" },
    { href: "/faq", label: "FAQ" },
];

export default function Header() {
    const pathname = usePathname();
    const [isOpen, setIsOpen] = useState(false);

    const isActive = (path: string) => pathname === path;
    const toggleMenu = () => setIsOpen((prev) => !prev);
    const closeMenu = () => setIsOpen(false);

    return (
        <header role="banner" className="sticky top-0 z-40 w-full border-b border-line bg-canvas/95 backdrop-blur-md">
            <div className="max-w-site mx-auto px-5 sm:px-6 h-16 flex items-center justify-between gap-4">
                <Logo onClick={closeMenu} size="md" />

                <div className="hidden md:flex items-center gap-4 lg:gap-6">
                    <nav aria-label="Main navigation" className="flex items-center gap-0.5 lg:gap-1">
                        {NAV_LINKS.map((item) => {
                            const active = isActive(item.href);
                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className={`relative px-2.5 lg:px-3 py-2 text-xs lg:text-sm font-semibold rounded-lg whitespace-nowrap transition-colors ${
                                        active
                                            ? "text-ink bg-well"
                                            : "text-muted hover:text-ink hover:bg-hover"
                                    }`}
                                >
                                    {item.label}
                                    {active && (
                                        <span
                                            aria-hidden="true"
                                            className="absolute inset-x-3 bottom-1 h-0.5 rounded-full bg-primary"
                                        />
                                    )}
                                </Link>
                            );
                        })}
                    </nav>
                    <div className="h-5 w-px bg-line" aria-hidden="true" />
                    <ThemeToggle />
                </div>

                <div className="flex items-center gap-2 md:hidden">
                    <ThemeToggle compact />
                    <button
                        type="button"
                        onClick={toggleMenu}
                        className="p-2 rounded-lg border border-line bg-surface text-ink hover:border-line-strong transition-colors cursor-pointer"
                        aria-label="Toggle navigation menu"
                        aria-expanded={isOpen}
                        aria-controls="mobile-nav-panel"
                    >
                        {isOpen ? <X size={18} aria-hidden="true" /> : <Menu size={18} aria-hidden="true" />}
                    </button>
                </div>
            </div>

            <div
                id="mobile-nav-panel"
                role="region"
                aria-label="Mobile Navigation Menu"
                className={`md:hidden grid transition-[grid-template-rows] duration-250 ease-out bg-surface ${
                    isOpen ? "grid-rows-[1fr] border-t border-line" : "grid-rows-[0fr]"
                }`}
            >
                <div className="overflow-hidden">
                    <nav className="flex flex-col divide-y divide-line px-5 py-2">
                        {[
                            { href: "/", label: "Device & System Overview" },
                            { href: "/what-is-my-ip", label: "What Is My IP Address" },
                            { href: "/what-is-my-browser", label: "What Is My Browser" },
                            { href: "/what-is-my-screen-resolution", label: "Screen Resolution & Viewport" },
                            { href: "/bufferbloat", label: "Bufferbloat Latency Test" },
                            { href: "/faq", label: "Help & FAQ" },
                            { href: "/privacy", label: "Privacy Architecture" },
                        ].map((item) => {
                            const active = isActive(item.href);
                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    onClick={closeMenu}
                                    className={`flex items-center justify-between py-3.5 text-sm font-semibold transition-colors ${
                                        active ? "text-primary font-bold" : "text-ink hover:text-primary"
                                    }`}
                                >
                                    <span>{item.label}</span>
                                    <ChevronRight size={15} className="text-muted" aria-hidden="true" />
                                </Link>
                            );
                        })}
                    </nav>
                </div>
            </div>
        </header>
    );
}
