import Link from "next/link";
import { ChevronRight, ArrowLeft, ArrowRight } from "lucide-react";
import DiagnosticFaqSection, { type DiagnosticFaqItem } from "@/components/ui/DiagnosticFaqSection";

const faqs: DiagnosticFaqItem[] = [
    {
        q: "What is bufferbloat and why does it cause lag in gaming and video calls?",
        a: "Bufferbloat is unwanted latency and jitter that occurs when network equipment (such as your home router or modem) buffers too many data packets. When large downloads or uploads saturate your bandwidth, packets sit waiting in oversized memory queues. High-priority packets—such as competitive gaming inputs, Discord voice data, or Zoom video streams—get stuck behind bulk transfers, causing sudden ping spikes.",
    },
    {
        q: "How does the Bufferbloat Test work?",
        a: "The test executes a multi-phase diagnostic: first it measures your idle round-trip ping, then saturates downstream bandwidth, then upstream bandwidth, and calculates how much latency climbed under load to award a grade from A to F.",
    },
    {
        q: "What is a good bufferbloat score and how can I fix a poor grade?",
        a: "An A or A+ grade (0–5 ms increase under load) is ideal for competitive gaming and smooth video calls. A Grade B (6–30 ms) is good for daily use. For C, D, or F grades, enable Smart Queue Management (SQM / CAKE / FQ-CoDel) on your router, cap QoS bandwidth slightly below max line speed, or switch from Wi-Fi to wired Ethernet.",
    },
    {
        q: "Do you store or log my IP address or personal data?",
        a: "No. All browser detection, hardware querying, screen resolution detection, and latency checks run inside your local browser sandbox. We keep zero database logs, store no IP addresses on our servers, and build no cross-session device profiles.",
    },
    {
        q: "What is a WebRTC leak and how does MySupportInfo detect it?",
        a: "WebRTC lets browsers run voice and video calls directly, but STUN negotiation can occasionally expose your real local or public IP address even when connected to a VPN. MySupportInfo inspects local ICE candidates to report whether any address leaks outside your tunnel.",
    },
    {
        q: "How do I share my technical diagnostic results with an IT support technician?",
        a: "Use 'Copy All Info' to paste a clean ticket summary into Zendesk, Jira, or email; use 'Share Link' to send a client-side URL snapshot with optional IP masking; or open 'Screenshot Report' to customize fields and export as a PNG image, PDF document, or CSV spreadsheet.",
    },
    {
        q: "Why does my detected RAM or CPU core count differ from my computer's exact specs?",
        a: "Modern browsers intentionally cap Device Memory values into coarse buckets (often up to 8 GB) and report logical threads via navigator.hardwareConcurrency to reduce cross-site fingerprinting.",
    },
    {
        q: "What is the difference between Screen Resolution and Viewport Size?",
        a: "Screen Resolution is the full display area reported by your OS, while Viewport Size is the active CSS pixel region available inside your browser window (which changes dynamically as you resize windows or zoom).",
    },
    {
        q: "How does MySupportInfo compare to MySupportDetails and other legacy tools?",
        a: "Instead of cluttering older tables with intrusive ads, MySupportInfo combines plain-English explanations, zero server data logging, interactive Bufferbloat testing, WebRTC VPN leak checks, and client-side PNG image, PDF, CSV, and link exports.",
    },
    {
        q: "Why does my bufferbloat grade differ from a standard throughput speed test?",
        a: "Traditional speed tests focus on peak Mbps transfer capacity on an empty connection. You can have gigabit throughput and still stutter on calls if your router buffers packets poorly under simultaneous uploads or downloads.",
    },
    {
        q: "Is MySupportInfo completely free for personal and team support use?",
        a: "Yes. MySupportInfo is free to open and share across IT helpdesks, QA teams, classrooms, and remote workers without accounts or paywalls.",
    },
    {
        q: "Which browsers and operating systems are supported?",
        a: "Chrome, Firefox, Safari, Microsoft Edge, Brave, Opera, and Vivaldi across Windows, macOS, Linux, ChromeOS, iOS, iPadOS, and Android.",
    },
    {
        q: "What should I do if my browser or operating system is detected incorrectly?",
        a: "Privacy blockers and spoofed User-Agent settings can alter reported headers. Use 'Report a detection issue' on the homepage or email report@mysupportinfo.com so we can refine detection heuristics.",
    },
];

export default function FAQPage() {
    return (
        <div className="bg-canvas text-ink pb-20">
            <div className="bg-brand text-white border-b border-white/10 py-12 sm:py-14">
                <div className="max-w-site mx-auto px-5 sm:px-6 space-y-4">
                    <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs text-white/75 font-medium">
                        <Link href="/" className="hover:text-white transition-colors">Overview</Link>
                        <ChevronRight size={14} aria-hidden="true" />
                        <span className="text-white font-semibold" aria-current="page">Help &amp; FAQ</span>
                    </nav>
                    <div className="space-y-2 max-w-2xl">
                        <h1 className="text-fluid-hero font-extrabold text-white tracking-tight">
                            Frequently Asked Questions
                        </h1>
                        <p className="text-sm sm:text-base text-white/80 leading-relaxed">
                            {faqs.length} plain-English answers covering device detection, browser engines, bufferbloat lag, WebRTC leak checks, and privacy architecture.
                        </p>
                    </div>
                </div>
            </div>

            <div className="max-w-site mx-auto px-5 sm:px-6 py-12 space-y-10">
                {/* Summary Topics Strip */}
                <div className="bg-surface border border-line rounded-2xl divide-y sm:divide-y-0 sm:divide-x divide-line grid grid-cols-1 sm:grid-cols-3">
                    {[
                        { label: "Bufferbloat & Latency", desc: "Why calls stutter under downloads and how router SQM/QoS eliminates spikes." },
                        { label: "Privacy & WebRTC", desc: "Local browser processing, STUN leak detection, and zero stored IP logs." },
                        { label: "Browser & Display Specs", desc: "Understanding viewport CSS pixels, DPR zoom scaling, and hardware limits." },
                    ].map((item) => (
                        <div key={item.label} className="p-5 space-y-1.5">
                            <h2 className="text-sm font-bold text-ink">{item.label}</h2>
                            <p className="text-xs text-muted leading-relaxed">{item.desc}</p>
                        </div>
                    ))}
                </div>

                {/* FAQ Accordion */}
                <DiagnosticFaqSection title="Browse Questions & Answers" items={faqs} />

                {/* Navigation Actions */}
                <div className="border-t border-line pt-8 flex flex-wrap items-center justify-between gap-4">
                    <div className="flex flex-wrap gap-2.5">
                        <Link
                            href="/bufferbloat"
                            className="inline-flex items-center gap-1.5 px-4 py-2 bg-primary text-foreground font-bold text-xs rounded-lg hover:bg-primary-dark transition-colors"
                        >
                            <span>Run Bufferbloat Test</span>
                            <ArrowRight size={13} aria-hidden="true" />
                        </Link>
                        <Link
                            href="/privacy"
                            className="inline-flex items-center gap-1.5 px-4 py-2 bg-brand text-white font-semibold text-xs rounded-lg hover:opacity-95 transition-opacity"
                        >
                            <span>Privacy Policy</span>
                        </Link>
                        <Link
                            href="/terms"
                            className="inline-flex items-center gap-1.5 px-4 py-2 bg-surface text-ink border border-line-strong font-semibold text-xs rounded-lg hover:bg-hover transition-colors"
                        >
                            <span>Terms of Use</span>
                        </Link>
                    </div>
                    <Link
                        href="/"
                        className="inline-flex items-center gap-1.5 px-4 py-2 bg-surface text-ink border border-line-strong font-semibold text-xs rounded-lg hover:bg-hover transition-colors"
                    >
                        <ArrowLeft size={13} aria-hidden="true" />
                        <span>Back to Overview</span>
                    </Link>
                </div>
            </div>
        </div>
    );
}
