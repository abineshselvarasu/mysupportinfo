/**
 * Copies text cleanly using the modern Async Clipboard API with a DOM textarea
 * fallback for browsers or security contexts that restrict navigator.clipboard.
 */
export async function copyToClipboard(text: string): Promise<boolean> {
    if (typeof window === "undefined" || !text) return false;

    try {
        if (navigator.clipboard?.writeText) {
            await navigator.clipboard.writeText(text);
            return true;
        }
    } catch {
        // Fall through to legacy textarea selection copy
    }

    try {
        const el = document.createElement("textarea");
        el.value = text;
        el.setAttribute("readonly", "");
        el.style.cssText = "position:fixed;top:-9999px;left:-9999px;opacity:0;";
        document.body.appendChild(el);
        el.select();
        el.setSelectionRange(0, el.value.length);
        const ok = document.execCommand("copy");
        document.body.removeChild(el);
        return ok;
    } catch {
        return false;
    }
}
