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
    const isDarkSurface = theme === "dark";

    const dimensions = {
        sm: { icon: 28, text: "text-base" },
        md: { icon: 32, text: "text-lg" },
        lg: { icon: 40, text: "text-2xl" },
    }[size];

    const iconNode = (
        <svg
            width={dimensions.icon}
            height={dimensions.icon}
            viewBox="0 0 100 100"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="flex-shrink-0 transition-transform duration-200 group-hover:scale-[1.03]"
            aria-hidden="true"
        >
            <rect width="100" height="100" rx="22" fill="#00473E" stroke="#009E52" strokeWidth="3" />
            <circle cx="50" cy="50" r="34" stroke="#FFC4B7" strokeWidth="1.5" strokeOpacity="0.3" strokeDasharray="4 4" />
            <path
                d="M20 52 L35 52 L43 34 L50 68 L58 30 L66 58 L72 52 L80 52"
                fill="none"
                stroke="#FF8E60"
                strokeWidth="6"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
            <circle cx="50" cy="22" r="4.5" fill="#009E52" />
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
            <span className={`${dimensions.text} font-extrabold tracking-tight leading-none ${isDarkSurface ? "text-white" : "text-ink"}`}>
                MySupport<span className="text-primary">Info</span>
            </span>
        </Link>
    );
}
