import Link from "next/link";
import { ChevronRight, ArrowLeft } from "lucide-react";

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <section className="space-y-3 pb-8 border-b border-line last:border-b-0">
        <h2 className="text-lg font-bold text-ink">{title}</h2>
        <div className="text-muted text-sm leading-relaxed space-y-3">{children}</div>
    </section>
);

export default function TermsPage() {
    return (
        <div className="bg-canvas text-ink pb-20">
            <div className="bg-brand text-white border-b border-white/10 py-12 sm:py-14">
                <div className="max-w-site mx-auto px-5 sm:px-6 space-y-4">
                    <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs text-white/75 font-medium">
                        <Link href="/" className="hover:text-white transition-colors">Overview</Link>
                        <ChevronRight size={14} aria-hidden="true" />
                        <span className="text-white font-semibold" aria-current="page">Terms of Use</span>
                    </nav>
                    <div className="space-y-2">
                        <h1 className="text-fluid-hero font-extrabold text-white tracking-tight">Terms of Use</h1>
                        <p className="text-xs font-mono text-accent">Last updated: May 2026</p>
                        <p className="text-sm sm:text-base text-white/80 leading-relaxed max-w-xl">
                            MySupportInfo is a free, informational client-side utility provided &ldquo;as is&rdquo; with zero account requirements or personal data collection.
                        </p>
                    </div>
                </div>
            </div>

            <div className="max-w-site mx-auto px-5 sm:px-6 py-12 space-y-10">
                <div className="bg-surface border border-line rounded-2xl divide-y sm:divide-y-0 sm:divide-x divide-line grid grid-cols-1 sm:grid-cols-3">
                    {[
                        { label: "No Server Logs", desc: "Diagnostics run locally inside your browser." },
                        { label: "Free Utility", desc: "Free for personal and team support use with no sign-up." },
                        { label: "Informational Only", desc: "Browser API estimates intended for troubleshooting." },
                    ].map((item) => (
                        <div key={item.label} className="p-5 space-y-1">
                            <p className="font-bold text-sm text-ink">{item.label}</p>
                            <p className="text-xs text-muted leading-relaxed">{item.desc}</p>
                        </div>
                    ))}
                </div>

                <div className="space-y-8">
                    <Section title="1. Acceptance & Scope">
                        <p>
                            By accessing MySupportInfo at <code className="px-1.5 py-0.5 rounded bg-well border border-line font-mono text-xs text-ink">mysupportinfo.com</code>, you agree to these Terms of Use. The Service operates as a read-only browser diagnostic utility for troubleshooting device, browser, display, and network conditions.
                        </p>
                    </Section>

                    <Section title="2. Accuracy & Browser Estimates">
                        <p>
                            Browser vendors intentionally limit or round certain system APIs (such as RAM memory buckets, User-Agent freeze policies, or mobile-only network estimates) for user privacy. Output should be treated as informational diagnostic guidance rather than legal or hardware-verified certification.
                        </p>
                    </Section>

                    <Section title="3. Permitted Use & Third-Party Lookups">
                        <p>
                            You are welcome to copy, export PNG images, PDFs, or CSV spreadsheets, and share links generated from your own device. Automated scraping or abusive load against upstream IP or STUN endpoints (<code className="px-1.5 py-0.5 rounded bg-well border border-line font-mono text-xs text-ink">ipapi.co</code>, <code className="px-1.5 py-0.5 rounded bg-well border border-line font-mono text-xs text-ink">api64.ipify.org</code>, <code className="px-1.5 py-0.5 rounded bg-well border border-line font-mono text-xs text-ink">stun.l.google.com</code>) is prohibited.
                        </p>
                    </Section>

                    <Section title="4. Disclaimers & Contact">
                        <p>
                            The Service is provided &ldquo;as is&rdquo; and &ldquo;as available&rdquo; without warranties of any kind. For privacy details see our{" "}
                            <Link href="/privacy" className="text-secondary font-semibold hover:underline">Privacy Policy</Link>. Contact{" "}
                            <a href="mailto:contact@mysupportinfo.com" className="text-secondary font-semibold hover:underline">contact@mysupportinfo.com</a> or{" "}
                            <a href="mailto:report@mysupportinfo.com" className="text-secondary font-semibold hover:underline">report@mysupportinfo.com</a>.
                        </p>
                    </Section>
                </div>

                <div className="pt-4 flex flex-wrap gap-3">
                    <Link href="/privacy" className="px-4 py-2 bg-brand text-white rounded-lg text-xs font-semibold hover:opacity-95 transition-opacity">
                        Privacy Policy
                    </Link>
                    <Link href="/faq" className="px-4 py-2 bg-surface border border-line-strong text-ink rounded-lg text-xs font-semibold hover:bg-hover transition-colors">
                        FAQ
                    </Link>
                    <Link href="/" className="inline-flex items-center gap-1.5 px-4 py-2 bg-surface border border-line-strong text-ink rounded-lg text-xs font-semibold hover:bg-hover transition-colors">
                        <ArrowLeft size={13} aria-hidden="true" />
                        <span>Back to Overview</span>
                    </Link>
                </div>
            </div>
        </div>
    );
}
