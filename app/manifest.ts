import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
    return {
        name: "MySupportInfo — System & Network Diagnostics",
        short_name: "MySupportInfo",
        description:
            "One link to diagnose any device: browser version, OS, IPv4/IPv6, WebRTC leaks, GPU, screen resolution, and Bufferbloat latency testing.",
        start_url: "/",
        display: "standalone",
        background_color: "#FAF6F0",
        theme_color: "#00473E",
        icons: [
            {
                src: "/favicon.svg",
                sizes: "any",
                type: "image/svg+xml",
            },
            {
                src: "/logo-icon-512.png",
                sizes: "512x512",
                type: "image/png",
            },
            {
                src: "/apple-icon.svg",
                sizes: "180x180",
                type: "image/svg+xml",
            },
        ],
    };
}
