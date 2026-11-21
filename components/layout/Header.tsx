"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import Logo from "@/components/ui/Logo";

export default function Header() {
    const pathname = usePathname();
    const [isOpen, setIsOpen] = useState(false);
    const isActive = (path: string) => pathname === path;

    const toggleMenu = () => setIsOpen(!isOpen);
    const closeMenu = () => setIsOpen(false);

    return (
        <header className="sticky top-0 z-40 w-full border-b border-background-dark/10 bg-background/90 backdrop-blur-md">
            <div className="max-w-site mx-auto px-6 h-16 flex items-center justify-between">
                {/* Brand Logo */}
                <Logo onClick={closeMenu} size="md" />

                {/* Desktop Nav Links */}
                <nav className="hidden md:flex items-center gap-8">
                    <Link className={`text-sm font-extrabold transition-colors ${isActive('/bufferbloat') ? 'text-background-dark' : 'text-background-dark/60'} hover:text-primary`} href="/bufferbloat">Bufferbloat</Link>
                    <Link className={`text-sm font-extrabold transition-colors ${isActive('/faq') ? 'text-background-dark' : 'text-background-dark/60'} hover:text-primary`} href="/faq">FAQ</Link>
                    <Link className={`text-sm font-extrabold transition-colors ${isActive('/privacy') ? 'text-background-dark' : 'text-background-dark/60'} hover:text-primary`} href="/privacy">Privacy</Link>
                    <Link className={`text-sm font-extrabold transition-colors ${isActive('/terms') ? 'text-background-dark' : 'text-background-dark/60'} hover:text-primary`} href="/terms">Terms</Link>
                </nav>

                {/* Mobile Hamburger Toggle Button */}
                <button
                    onClick={toggleMenu}
                    className="flex md:hidden p-2 text-background-dark hover:text-primary transition-colors focus:outline-none cursor-pointer"
                    aria-label="Toggle navigation menu"
                    aria-expanded={isOpen}
                >
                    <span className="material-symbols-outlined text-2xl font-bold transition-transform duration-200">
                        {isOpen ? 'close' : 'menu'}
                    </span>
                </button>
            </div>

            {/* Mobile Dropdown Panel with Smooth CSS Grid Transition */}
            <div
                className={`md:hidden grid transition-[grid-template-rows] duration-300 ease-out bg-background shadow-block ${
                    isOpen ? "grid-rows-[1fr] border-t-2 border-background-dark" : "grid-rows-[0fr] border-t-0"
                }`}
            >
                <div className="overflow-hidden">
                    <nav className={`flex flex-col p-6 space-y-4 transition-opacity duration-200 ${isOpen ? "opacity-100" : "opacity-0"}`}>
                        <Link
                            onClick={closeMenu}
                            className={`flex items-center gap-3 px-4 py-3 rounded-xl border-2 transition-all font-bold ${
                                isActive('/bufferbloat')
                                    ? 'bg-primary/10 border-background-dark text-background-dark shadow-block-sm'
                                    : 'bg-white border-background-dark/20 text-background-dark/70 hover:border-background-dark hover:text-primary'
                            }`}
                            href="/bufferbloat"
                        >
                            <span className="material-symbols-outlined text-secondary">signal_cellular_alt</span>
                            <span>Bufferbloat Test</span>
                        </Link>
                        <Link
                            onClick={closeMenu}
                            className={`flex items-center gap-3 px-4 py-3 rounded-xl border-2 transition-all font-bold ${
                                isActive('/faq')
                                    ? 'bg-primary/10 border-background-dark text-background-dark shadow-block-sm'
                                    : 'bg-white border-background-dark/20 text-background-dark/70 hover:border-background-dark hover:text-primary'
                            }`}
                            href="/faq"
                        >
                            <span className="material-symbols-outlined text-primary">help</span>
                            <span>Frequently Asked Questions</span>
                        </Link>
                        <Link
                            onClick={closeMenu}
                            className={`flex items-center gap-3 px-4 py-3 rounded-xl border-2 transition-all font-bold ${
                                isActive('/privacy')
                                    ? 'bg-primary/10 border-background-dark text-background-dark shadow-block-sm'
                                    : 'bg-white border-background-dark/20 text-background-dark/70 hover:border-background-dark hover:text-primary'
                            }`}
                            href="/privacy"
                        >
                            <span className="material-symbols-outlined text-background-dark">shield_person</span>
                            <span>Privacy & Compliance</span>
                        </Link>
                        <Link
                            onClick={closeMenu}
                            className={`flex items-center gap-3 px-4 py-3 rounded-xl border-2 transition-all font-bold ${
                                isActive('/terms')
                                    ? 'bg-primary/10 border-background-dark text-background-dark shadow-block-sm'
                                    : 'bg-white border-background-dark/20 text-background-dark/70 hover:border-background-dark hover:text-primary'
                            }`}
                            href="/terms"
                        >
                            <span className="material-symbols-outlined text-primary">gavel</span>
                            <span>Terms of Use</span>
                        </Link>
                    </nav>
                </div>
            </div>
        </header>
    );
}
