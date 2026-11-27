import type { Metadata } from "next";
import WhatIsMyScreenResolutionClient from "./WhatIsMyScreenResolutionClient";
import type { DiagnosticFaqItem } from "@/components/ui/DiagnosticFaqSection";
import { buildToolJsonLd } from "@/lib/seo-schema";

export const metadata: Metadata = {
    title: "What Is My Screen Resolution? Viewport, DPR & Aspect Ratio",
    description:
        "Check your physical screen resolution, live CSS browser viewport size, device pixel ratio (DPR), responsive breakpoint, and color depth live in your browser.",
    keywords: [
        "what is my screen resolution",
        "check screen size",
        "viewport size online",
        "screen resolution tester",
        "device pixel ratio",
        "DPR checker",
        "color depth tester",
        "display aspect ratio",
        "css viewport size",
    ],
    alternates: {
        canonical: "/what-is-my-screen-resolution",
    },
    openGraph: {
        title: "What Is My Screen Resolution? Viewport, DPR & Aspect Ratio",
        description:
            "Check your screen resolution, browser viewport size, responsive breakpoint, and device pixel ratio live in your browser.",
        url: "/what-is-my-screen-resolution",
    },
};

const screenFaqs: DiagnosticFaqItem[] = [
    {
        q: "What is the difference between screen resolution and browser viewport?",
        a: "Screen resolution is the total pixel grid reported by your monitor hardware (for example, 1920x1080 or 3840x2160 scaled by OS DPI). Browser viewport size is the inner CSS pixel area inside your active browser window excluding OS taskbars, tabs, bookmarks bars, and scrollbars.",
    },
    {
        q: "What is Device Pixel Ratio (DPR)?",
        a: "Device Pixel Ratio (DPR) is the ratio between physical hardware pixels on your display panel and logical CSS pixels used by web layouts. On Retina and 4K monitors configured at 200% scaling (DPR 2.0), a 2x2 grid of 4 physical sub-pixels renders every 1x1 logical CSS pixel for razor-sharp typography.",
    },
    {
        q: "What is the most common screen resolution and viewport in 2026?",
        a: "1920x1080 (Full HD 16:9) remains the top desktop resolution globally, followed by 2560x1440 (QHD) and 1512x982 logical macOS Retina laptops. On mobile devices, logical viewports between 390x844 and 412x915 CSS pixels cover the majority of modern smartphones.",
    },
    {
        q: "How do I change my screen resolution on Windows or macOS?",
        a: "On Windows 11, right-click your desktop, choose Display settings, and adjust Scale or Display resolution. On macOS, open Apple Menu > System Settings > Displays and choose a scaled resolution preset such as Default or More Space.",
    },
    {
        q: "Why does zooming my browser with Ctrl + / - change the reported viewport size?",
        a: "Browser zoom enlarges each CSS pixel relative to physical hardware pixels. Increasing zoom from 100% to 125% or 150% reduces how many CSS pixels fit across the window, causing responsive CSS media queries (like md: or lg: breakpoints) to reflow automatically.",
    },
];

export default function WhatIsMyScreenResolutionPage() {
    const schemas = buildToolJsonLd({
        name: "MySupportInfo — What Is My Screen Resolution & Viewport Checker",
        description:
            "Free in-browser screen resolution, live CSS viewport size, device pixel ratio (DPR), and aspect ratio diagnostic tool.",
        path: "/what-is-my-screen-resolution",
        breadcrumbLabel: "What Is My Screen Resolution",
        featureList: [
            "Real-time physical monitor resolution and aspect ratio calculation",
            "Live CSS browser viewport width and height on resize and zoom",
            "Device Pixel Ratio (DPR) and active CSS breakpoint detection",
            "Display bit color depth and screen orientation API readout",
        ],
        faqs: screenFaqs,
    });

    return (
        <>
            {schemas.map((schema, i) => (
                <script
                    key={i}
                    type="application/ld+json"
                    dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
                />
            ))}
            <WhatIsMyScreenResolutionClient faqs={screenFaqs} />
        </>
    );
}
