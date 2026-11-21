import React from "react";
import Link from "next/link";

interface LogoProps {
    className?: string;
    variant?: "full" | "icon";
    theme?: "light" | "dark";
    size?: "sm" | "md" | "lg";
    onClick?: () => void;
}

export default function Logo({
    className = "",
    variant = "full",
    theme = "light",
    size = "md",
    onClick,
}: LogoProps) {
    const isDark = theme === "dark";

    const dimensions = {
        sm: { size: 30, text: "text-lg", sub: "text-4xs" },
        md: { size: 36, text: "text-xl", sub: "text-3xs" },
        lg: { size: 44, text: "text-2xl", sub: "text-2xs" },
    }[size];

    const iconNode = (
        <svg
            width={dimensions.size}
            height={dimensions.size}
            viewBox="0 0 100 100"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="flex-shrink-0 transition-transform duration-300 group-hover:scale-105"
            aria-hidden="true"
        >
            <defs>
                <linearGradient id="logo-bg" x1="0" y1="0" x2="100" y2="100" gradientUnits="userSpaceOnUse">
                    <stop offset="0%" stopColor="#00473E" />
                    <stop offset="100%" stopColor="#00241F" />
                </linearGradient>
                <linearGradient id="logo-pulse" x1="10" y1="50" x2="90" y2="50" gradientUnits="userSpaceOnUse">
                    <stop offset="0%" stopColor="#FFC470" />
                    <stop offset="40%" stopColor="#FF8E60" />
                    <stop offset="80%" stopColor="#FF5C35" />
                    <stop offset="100%" stopColor="#00C48C" />
                </linearGradient>
                <filter id="logo-glow" x="-20%" y="-20%" width="140%" height="140%">
                    <feGaussianBlur stdDeviation="2" result="blur" />
                    <feMerge>
                        <feMergeNode in="blur" />
                        <feMergeNode in="SourceGraphic" />
                    </feMerge>
                </filter>
            </defs>
            <rect width="100" height="100" rx="24" fill="url(#logo-bg)" stroke="#00C48C" strokeWidth="2" strokeOpacity="0.6" />
            <circle cx="50" cy="50" r="36" stroke="#00C48C" strokeWidth="1.2" strokeOpacity="0.25" strokeDasharray="3 3" />
            
            {/* Shield Body */}
            <path d="M50 16 L76 27 C76 54 50 76 50 76 C50 76 24 54 24 27 Z" fill="#0A5C50" stroke="#00C48C" strokeWidth="2.5" strokeLinejoin="round" />
            <path d="M50 18 L74 28 C74 52 50 73 50 73 Z" fill="#ffffff" fillOpacity="0.1" />

            {/* Diagnostic Pulse Wave */}
            <path d="M18 52 L34 52 L42 36 L50 66 L58 32 L66 58 L72 52 L82 52" fill="none" stroke="url(#logo-pulse)" strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round" filter="url(#logo-glow)" />
            <path d="M18 52 L34 52 L42 36 L50 66 L58 32 L66 58 L72 52 L82 52" fill="none" stroke="#FAF6F0" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />

            {/* Diagnostic Spark Node */}
            <circle cx="50" cy="28" r="3.5" fill="#FF8E60" filter="url(#logo-glow)" />
            <circle cx="50" cy="28" r="2" fill="#FAF6F0" />
        </svg>
    );

    if (variant === "icon") {
        return (
            <Link href="/" onClick={onClick} aria-label="MySupportInfo Home" className={`group inline-flex items-center ${className}`}>
                {iconNode}
            </Link>
        );
    }

    return (
        <Link href="/" onClick={onClick} aria-label="MySupportInfo Home" className={`group inline-flex items-center gap-2.5 ${className}`}>
            {iconNode}
            <div className="flex flex-col">
                <span className={`${dimensions.text} font-black tracking-tight leading-none ${isDark ? "text-background" : "text-background-dark"}`}>
                    MySupport<span className="text-primary font-black italic font-serif ml-0.5">Info</span>
                </span>
            </div>
        </Link>
    );
}
