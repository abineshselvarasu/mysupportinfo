import Link from "next/link";
import { ArrowLeft, Activity, HelpCircle, ShieldCheck } from "lucide-react";

export default function NotFound() {
    return (
        <div className="bg-canvas text-ink py-16 sm:py-24">
            <div className="max-w-site mx-auto px-5 sm:px-6">
                <div className="max-w-2xl bg-surface border border-line rounded-2xl p-8 sm:p-10 shadow-subtle space-y-6">
                    <div className="space-y-2">
                        <p className="text-xs font-mono font-bold uppercase tracking-wider text-primary">
                            HTTP 404 &middot; Route Not Found
                        </p>
                        <h1 className="text-fluid-h1 font-extrabold text-ink tracking-tight">
                            This diagnostic page does not exist.
                        </h1>
                        <p className="text-sm sm:text-base text-muted leading-relaxed">
                            The link you followed may have moved or contains a typo. Jump straight back to the live system check or one of our focused tools below.
                        </p>
                    </div>

                    <div className="flex flex-wrap gap-3 pt-2">
                        <Link
                            href="/"
                            className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-foreground font-bold text-sm rounded-xl hover:bg-primary-dark transition-colors"
                        >
                            <ArrowLeft size={15} aria-hidden="true" />
                            <span>Back to Device Overview</span>
                        </Link>
                        <Link
                            href="/bufferbloat"
                            className="inline-flex items-center gap-2 px-4 py-2.5 bg-brand text-white font-semibold text-sm rounded-xl hover:opacity-95 transition-opacity"
                        >
                            <Activity size={15} aria-hidden="true" />
                            <span>Bufferbloat Test</span>
                        </Link>
                        <Link
                            href="/what-is-my-ip"
                            className="inline-flex items-center gap-2 px-4 py-2.5 bg-surface text-ink border border-line-strong hover:bg-hover transition-colors font-semibold text-sm rounded-xl"
                        >
                            <ShieldCheck size={15} aria-hidden="true" />
                            <span>IP &amp; WebRTC Audit</span>
                        </Link>
                        <Link
                            href="/faq"
                            className="inline-flex items-center gap-2 px-4 py-2.5 bg-surface text-ink border border-line-strong hover:bg-hover transition-colors font-semibold text-sm rounded-xl"
                        >
                            <HelpCircle size={15} aria-hidden="true" />
                            <span>Help &amp; FAQ</span>
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
