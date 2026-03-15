"use client";

import { useState, useEffect } from "react";
import PlatformEmailFooter from "@/app/components/PlatformEmailFooter";

type IntegrationStatus = {
  twilioConfigured: boolean;
  twilioPhoneNumber: string | null;
  dailyConfigured: boolean;
  whatsappConfigured: boolean;
  whatsappProvider: string | null;
  whatsappPhoneNumberId: string | null;
  whatsappFromNumber: string | null;
  emailSendingMode: "platform" | "custom_domain";
  customSmtpConfigured: boolean;
  customSmtpHost: string | null;
  customSmtpPort: number | null;
  customSmtpFromEmail: string | null;
  customSmtpSecure: boolean;
};

export default function IntegrationsClient() {
  const [status, setStatus] = useState<IntegrationStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const [twilioAccountSid, setTwilioAccountSid] = useState("");
  const [twilioAuthToken, setTwilioAuthToken] = useState("");
  const [twilioPhoneNumber, setTwilioPhoneNumber] = useState("");
  const [dailyApiKey, setDailyApiKey] = useState("");
  const [whatsappProvider, setWhatsappProvider] = useState<string>("");
  const [whatsappPhoneNumberId, setWhatsappPhoneNumberId] = useState("");
  const [whatsappAccessToken, setWhatsappAccessToken] = useState("");
  const [whatsappFromNumber, setWhatsappFromNumber] = useState("");
  const [emailSendingMode, setEmailSendingMode] = useState<"platform" | "custom_domain">("platform");
  const [customSmtpHost, setCustomSmtpHost] = useState("");
  const [customSmtpPort, setCustomSmtpPort] = useState("");
  const [customSmtpUser, setCustomSmtpUser] = useState("");
  const [customSmtpPassword, setCustomSmtpPassword] = useState("");
  const [customSmtpFromEmail, setCustomSmtpFromEmail] = useState("");
  const [customSmtpSecure, setCustomSmtpSecure] = useState(true);

  useEffect(() => {
    fetch("/api/app/integrations")
      .then((res) =>
        res.ok ? res.json() : { twilioConfigured: false, dailyConfigured: false, whatsappConfigured: false, emailSendingMode: "platform" }
      )
      .then((data) => {
        setStatus(data);
        setWhatsappProvider(data.whatsappProvider ?? "");
        setEmailSendingMode(data.emailSendingMode ?? "platform");
        setCustomSmtpHost(data.customSmtpHost ?? "");
        setCustomSmtpPort(data.customSmtpPort != null ? String(data.customSmtpPort) : "");
        setCustomSmtpFromEmail(data.customSmtpFromEmail ?? "");
        setCustomSmtpSecure(data.customSmtpSecure !== false);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch("/api/app/integrations", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          twilioAccountSid: twilioAccountSid.trim() || undefined,
          twilioAuthToken: twilioAuthToken.trim() || undefined,
          twilioPhoneNumber: twilioPhoneNumber.trim() || undefined,
          dailyApiKey: dailyApiKey.trim() || undefined,
          whatsappProvider: whatsappProvider || null,
          whatsappPhoneNumberId: whatsappPhoneNumberId.trim() || null,
          whatsappAccessToken: whatsappAccessToken.trim() || null,
          whatsappFromNumber: whatsappFromNumber.trim() || null,
          emailSendingMode,
          customSmtpHost: customSmtpHost.trim() || undefined,
          customSmtpPort: customSmtpPort.trim() ? parseInt(customSmtpPort, 10) : undefined,
          customSmtpUser: customSmtpUser.trim() || undefined,
          customSmtpPassword: customSmtpPassword.trim() || undefined,
          customSmtpFromEmail: customSmtpFromEmail.trim() || undefined,
          customSmtpSecure,
        }),
      });
      if (!res.ok) throw new Error("Failed to save");
      setMessage({ type: "success", text: "Integrations saved. SMS, video, WhatsApp, and email settings updated." });
      setTwilioAuthToken("");
      setWhatsappAccessToken("");
      setCustomSmtpPassword("");
      const data = await fetch("/api/app/integrations").then((r) => r.json());
      setStatus(data);
      setWhatsappProvider(data.whatsappProvider ?? "");
      setEmailSendingMode(data.emailSendingMode ?? "platform");
      setCustomSmtpHost(data.customSmtpHost ?? "");
      setCustomSmtpPort(data.customSmtpPort != null ? String(data.customSmtpPort) : "");
      setCustomSmtpFromEmail(data.customSmtpFromEmail ?? "");
      setCustomSmtpSecure(data.customSmtpSecure !== false);
    } catch {
      setMessage({ type: "error", text: "Failed to save. Try again." });
    } finally {
      setSaving(false);
    }
  };

  const labelClass = "block text-sm font-semibold text-slate-700 mb-1";
  const inputClass =
    "w-full px-4 py-2 rounded-lg border border-slate-200 bg-white text-slate-900 placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent";

  if (loading) {
    return (
      <div className="max-w-2xl">
        <p className="text-slate-500">Loading…</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Integrations</h1>
        <p className="text-slate-600 mt-1">
          Connect your own accounts for SMS and video. FertilityOS does not provide or pay for these services — you add your credentials and use your own payment plans.
        </p>
      </div>

      {message && (
        <div
          className={`rounded-lg px-4 py-3 text-sm ${
            message.type === "success" ? "bg-teal-50 text-teal-800 border border-teal-200" : "bg-red-50 text-red-800 border border-red-200"
          }`}
        >
          {message.text}
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-8">
        {/* Twilio (SMS) */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-bold text-slate-900 mb-1">SMS (Twilio)</h2>
          <p className="text-sm text-slate-500 mb-4">
            Used for appointment reminders and portal verification. Add your Twilio Account SID, Auth Token, and “From” phone number.
          </p>
          <div className="space-y-4">
            <div>
              <label htmlFor="twilioAccountSid" className={labelClass}>
                Account SID
              </label>
              <input
                id="twilioAccountSid"
                type="text"
                placeholder={status?.twilioConfigured ? "••••••••" : "AC…"}
                value={twilioAccountSid}
                onChange={(e) => setTwilioAccountSid(e.target.value)}
                className={inputClass}
                autoComplete="off"
              />
            </div>
            <div>
              <label htmlFor="twilioAuthToken" className={labelClass}>
                Auth Token
              </label>
              <input
                id="twilioAuthToken"
                type="password"
                placeholder={status?.twilioConfigured ? "••••••••" : "Leave blank to keep existing"}
                value={twilioAuthToken}
                onChange={(e) => setTwilioAuthToken(e.target.value)}
                className={inputClass}
                autoComplete="new-password"
              />
            </div>
            <div>
              <label htmlFor="twilioPhoneNumber" className={labelClass}>
                From phone (E.164)
              </label>
              <input
                id="twilioPhoneNumber"
                type="text"
                placeholder={status?.twilioPhoneNumber ?? "+1234567890"}
                value={twilioPhoneNumber}
                onChange={(e) => setTwilioPhoneNumber(e.target.value)}
                className={inputClass}
              />
            </div>
          </div>
        </div>

        {/* Daily.co (Video) */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-bold text-slate-900 mb-1">Video (Daily.co)</h2>
          <p className="text-sm text-slate-500 mb-4">
            Used for telemedicine appointments. Add your Daily.co API key from the Daily dashboard.
          </p>
          <div>
            <label htmlFor="dailyApiKey" className={labelClass}>
              Daily.co API key
            </label>
            <input
              id="dailyApiKey"
              type="password"
              placeholder={status?.dailyConfigured ? "••••••••" : "Paste your API key"}
              value={dailyApiKey}
              onChange={(e) => setDailyApiKey(e.target.value)}
              className={inputClass}
              autoComplete="off"
            />
          </div>
        </div>

        {/* WhatsApp (tenant-owned) */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm overflow-hidden">
          <div className="bg-gradient-to-r from-emerald-500 to-green-600 -mx-6 -mt-6 px-6 py-3 mb-4">
            <h2 className="text-lg font-bold text-white">WhatsApp</h2>
          </div>
          <p className="text-sm text-slate-500 mb-2">
            Use your own WhatsApp Business account for patient updates and appointment reminders. We do not provide or pay for WhatsApp — you add your credentials and use your own account.
          </p>
          <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mb-4">
            Use your own WhatsApp Business account; we do not provide or pay for WhatsApp.
          </p>
          <div className="space-y-4">
            <div>
              <label htmlFor="whatsappProvider" className={labelClass}>
                Provider
              </label>
              <select
                id="whatsappProvider"
                value={whatsappProvider}
                onChange={(e) => setWhatsappProvider(e.target.value)}
                className={inputClass}
              >
                <option value="">Not configured</option>
                <option value="twilio_whatsapp">Twilio (WhatsApp)</option>
                <option value="meta_cloud_api">Meta Cloud API</option>
              </select>
            </div>
            {whatsappProvider === "twilio_whatsapp" && (
              <div>
                <label htmlFor="whatsappFromNumber" className={labelClass}>
                  WhatsApp From number (E.164)
                </label>
                <input
                  id="whatsappFromNumber"
                  type="text"
                  placeholder={status?.whatsappFromNumber ?? "e.g. +14155238886"}
                  value={whatsappFromNumber}
                  onChange={(e) => setWhatsappFromNumber(e.target.value)}
                  className={inputClass}
                />
                <p className="text-xs text-slate-500 mt-1">Use the same Twilio account as SMS above; enter the WhatsApp-enabled “From” number.</p>
              </div>
            )}
            {whatsappProvider === "meta_cloud_api" && (
              <>
                <div>
                  <label htmlFor="whatsappPhoneNumberId" className={labelClass}>
                    Phone number ID
                  </label>
                  <input
                    id="whatsappPhoneNumberId"
                    type="text"
                    placeholder={status?.whatsappPhoneNumberId ?? "Meta Phone Number ID"}
                    value={whatsappPhoneNumberId}
                    onChange={(e) => setWhatsappPhoneNumberId(e.target.value)}
                    className={inputClass}
                    autoComplete="off"
                  />
                </div>
                <div>
                  <label htmlFor="whatsappAccessToken" className={labelClass}>
                    Access token
                  </label>
                  <input
                    id="whatsappAccessToken"
                    type="password"
                    placeholder={status?.whatsappConfigured ? "••••••••" : "Paste your permanent token"}
                    value={whatsappAccessToken}
                    onChange={(e) => setWhatsappAccessToken(e.target.value)}
                    className={inputClass}
                    autoComplete="off"
                  />
                </div>
              </>
            )}
          </div>
        </div>

        {/* Email sending (Phase 8.2) */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-bold text-slate-900 mb-1">Email sending</h2>
          <p className="text-sm text-slate-500 mb-4">
            Newsletter and campaign emails can be sent via the platform (with TheFertilityOS branding in the footer) or your own domain/SMTP (premium, no platform footer).
          </p>
          <div className="space-y-4">
            <div>
              <label className={labelClass}>Mode</label>
              <div className="flex gap-6">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="emailSendingMode"
                    checked={emailSendingMode === "platform"}
                    onChange={() => setEmailSendingMode("platform")}
                    className="text-blue-600"
                  />
                  <span className="text-sm font-medium text-slate-700">Default (TheFertilityOS)</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="emailSendingMode"
                    checked={emailSendingMode === "custom_domain"}
                    onChange={() => setEmailSendingMode("custom_domain")}
                    className="text-blue-600"
                  />
                  <span className="text-sm font-medium text-slate-700">Custom domain (premium)</span>
                </label>
              </div>
              <p className="text-xs text-slate-500 mt-2">
                Default: emails are sent via our infrastructure with a “Sent via FertilityOS” footer linking to www.thefertilityos.com. Custom: use your own SMTP; no platform footer.
              </p>
              {emailSendingMode === "platform" && (
                <div className="mt-3 pt-3 border-t border-slate-100">
                  <p className="text-xs text-slate-600 mb-2">Footer shown in campaign emails:</p>
                  <PlatformEmailFooter />
                </div>
              )}
            </div>
            {emailSendingMode === "custom_domain" && (
              <div className="space-y-4 pt-2 border-t border-slate-100">
                <div>
                  <label htmlFor="customSmtpHost" className={labelClass}>SMTP host</label>
                  <input
                    id="customSmtpHost"
                    type="text"
                    placeholder={status?.customSmtpConfigured ? status.customSmtpHost ?? "smtp.example.com" : "smtp.example.com"}
                    value={customSmtpHost}
                    onChange={(e) => setCustomSmtpHost(e.target.value)}
                    className={inputClass}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="customSmtpPort" className={labelClass}>Port</label>
                    <input
                      id="customSmtpPort"
                      type="text"
                      inputMode="numeric"
                      placeholder={status?.customSmtpPort ? String(status.customSmtpPort) : "465"}
                      value={customSmtpPort}
                      onChange={(e) => setCustomSmtpPort(e.target.value)}
                      className={inputClass}
                    />
                  </div>
                  <div className="flex items-end pb-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={customSmtpSecure}
                        onChange={(e) => setCustomSmtpSecure(e.target.checked)}
                        className="rounded border-slate-300 text-blue-600"
                      />
                      <span className="text-sm text-slate-700">TLS / SSL</span>
                    </label>
                  </div>
                </div>
                <div>
                  <label htmlFor="customSmtpUser" className={labelClass}>SMTP user (optional)</label>
                  <input
                    id="customSmtpUser"
                    type="text"
                    value={customSmtpUser}
                    onChange={(e) => setCustomSmtpUser(e.target.value)}
                    className={inputClass}
                    autoComplete="off"
                  />
                </div>
                <div>
                  <label htmlFor="customSmtpPassword" className={labelClass}>SMTP password (optional)</label>
                  <input
                    id="customSmtpPassword"
                    type="password"
                    placeholder={status?.customSmtpConfigured ? "••••••••" : "Leave blank to keep existing"}
                    value={customSmtpPassword}
                    onChange={(e) => setCustomSmtpPassword(e.target.value)}
                    className={inputClass}
                    autoComplete="new-password"
                  />
                </div>
                <div>
                  <label htmlFor="customSmtpFromEmail" className={labelClass}>From email address</label>
                  <input
                    id="customSmtpFromEmail"
                    type="email"
                    placeholder={status?.customSmtpFromEmail ?? "newsletter@yourdomain.com"}
                    value={customSmtpFromEmail}
                    onChange={(e) => setCustomSmtpFromEmail(e.target.value)}
                    className={inputClass}
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="px-6 py-2.5 rounded-xl bg-blue-600 text-white font-semibold text-sm hover:bg-blue-700 disabled:opacity-50"
        >
          {saving ? "Saving…" : "Save"}
        </button>
      </form>
    </div>
  );
}
