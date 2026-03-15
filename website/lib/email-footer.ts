/**
 * Platform email footer for default (TheFertilityOS) sending mode.
 * "Sent via FertilityOS" with FertilityOS in blue–teal gradient linking to https://www.thefertilityos.com
 */

const FERTILITYOS_URL = "https://www.thefertilityos.com";

/**
 * Returns HTML fragment for the platform footer. Use when email_sending_mode is "platform".
 * Inline styles for email client compatibility; gradient with solid fallback.
 */
export function platformEmailFooterHtml(): string {
  return `<p style="margin-top:24px;padding-top:16px;border-top:1px solid #e2e8f0;font-size:12px;color:#64748b;">Sent via <a href="${FERTILITYOS_URL}" style="text-decoration:none;"><span style="background:linear-gradient(90deg,#2563eb,#0d9488);-webkit-background-clip:text;background-clip:text;color:#0d9488;font-weight:600;">FertilityOS</span></a></p>`;
}

/**
 * Returns plain-text version of the footer for text/plain body.
 */
export function platformEmailFooterText(): string {
  return `Sent via FertilityOS (${FERTILITYOS_URL})`;
}

/**
 * Appends the platform footer to HTML body (no extra wrapper). Use for campaign/default emails.
 */
export function appendPlatformFooter(html: string): string {
  const trimmed = html.trim();
  if (!trimmed) return platformEmailFooterHtml();
  return trimmed + "\n" + platformEmailFooterHtml();
}

/**
 * Appends the platform footer to plain-text body.
 */
export function appendPlatformFooterText(text: string): string {
  const trimmed = text.trim();
  if (!trimmed) return platformEmailFooterText();
  return trimmed + "\n\n" + platformEmailFooterText();
}
