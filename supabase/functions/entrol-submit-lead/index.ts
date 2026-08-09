import { createClient } from "npm:@supabase/supabase-js@2";

const ALLOWED_ORIGINS = new Set([
  "https://www.entrol.com",
  "https://entrol.com",
]);

const MAX_BODY_BYTES = 24_000;
const TEXT_LIMITS: Record<string, number> = {
  name: 160,
  email: 320,
  contact: 320,
  company: 240,
  product_interest: 500,
  quantity: 160,
  target_market: 240,
  message: 5000,
  source_page: 2000,
  landing_page: 2000,
  referrer: 2000,
  utm_source: 240,
  utm_medium: 240,
  utm_campaign: 240,
  utm_content: 500,
  utm_term: 500,
  catalog_touch_page: 2000,
  catalog_touch_placement: 80,
  catalog_touched_at: 80,
  inquiry_trigger: 500,
};

function corsHeaders(origin: string | null) {
  return {
    "Access-Control-Allow-Origin": origin && ALLOWED_ORIGINS.has(origin) ? origin : "https://www.entrol.com",
    "Access-Control-Allow-Headers": "content-type, x-request-id",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Max-Age": "86400",
    "Vary": "Origin",
  };
}

function jsonResponse(origin: string | null, body: unknown, status: number) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders(origin), "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" },
  });
}

function clean(value: unknown, max: number): string | null {
  if (typeof value !== "string") return null;
  const normalized = value.trim().replace(/\u0000/g, "");
  return normalized ? normalized.slice(0, max) : null;
}

function first(payload: Record<string, unknown>, names: string[], max: number): string | null {
  for (const name of names) {
    const value = clean(payload[name], max);
    if (value) return value;
  }
  return null;
}

function cleanTimestamp(value: unknown): string | null {
  const text = clean(value, TEXT_LIMITS.catalog_touched_at);
  if (!text) return null;
  const parsed = Date.parse(text);
  return Number.isFinite(parsed) ? new Date(parsed).toISOString() : null;
}

Deno.serve(async (req: Request) => {
  const origin = req.headers.get("origin");

  if (req.method === "OPTIONS") {
    if (!origin || !ALLOWED_ORIGINS.has(origin)) return jsonResponse(origin, { ok: false, error: "origin_not_allowed" }, 403);
    return new Response(null, { status: 204, headers: corsHeaders(origin) });
  }
  if (req.method !== "POST") return jsonResponse(origin, { ok: false, error: "method_not_allowed" }, 405);
  if (!origin || !ALLOWED_ORIGINS.has(origin)) return jsonResponse(origin, { ok: false, error: "origin_not_allowed" }, 403);

  const declaredLength = Number(req.headers.get("content-length") || "0");
  if (declaredLength > MAX_BODY_BYTES) return jsonResponse(origin, { ok: false, error: "payload_too_large" }, 413);

  let payload: Record<string, unknown>;
  try {
    const raw = await req.text();
    if (new TextEncoder().encode(raw).byteLength > MAX_BODY_BYTES) throw new Error("payload_too_large");
    payload = JSON.parse(raw);
    if (!payload || Array.isArray(payload) || typeof payload !== "object") throw new Error("invalid_payload");
  } catch (error) {
    const code = error instanceof Error && error.message === "payload_too_large" ? "payload_too_large" : "invalid_json";
    return jsonResponse(origin, { ok: false, error: code }, code === "payload_too_large" ? 413 : 400);
  }

  if (clean(payload.website, 200)) return jsonResponse(origin, { ok: true }, 202);

  const requestIdText = clean(payload.request_id, 36);
  if (!requestIdText || !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(requestIdText)) {
    return jsonResponse(origin, { ok: false, error: "invalid_request_id" }, 400);
  }

  const email = first(payload, ["email", "business_email"], TEXT_LIMITS.email);
  const contact = first(payload, ["contact", "phone", "whatsapp"], TEXT_LIMITS.contact);
  if (!email && !contact) return jsonResponse(origin, { ok: false, error: "contact_required" }, 422);
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return jsonResponse(origin, { ok: false, error: "invalid_email" }, 422);

  const safePayload = Object.fromEntries(
    Object.entries(payload)
      .filter(([key, value]) => !key.startsWith("_") && key !== "website" && typeof value === "string")
      .slice(0, 50)
      .map(([key, value]) => [key.slice(0, 100), clean(value, 5000)]),
  );
  const submissionType = clean(payload.submission_type, 20) === "catalog" || clean(payload.catalog_request, 10) ? "catalog" : "inquiry";

  const secretKeys = JSON.parse(Deno.env.get("SUPABASE_SECRET_KEYS") || "{}");
  const secretKey = secretKeys.default || Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  if (!secretKey || !supabaseUrl) return jsonResponse(origin, { ok: false, error: "server_not_configured" }, 500);

  const admin = createClient(supabaseUrl, secretKey, { auth: { persistSession: false, autoRefreshToken: false } });
  const row = {
    request_id: requestIdText,
    submission_type: submissionType,
    name: first(payload, ["name", "first-name", "first_name"], TEXT_LIMITS.name),
    email,
    contact,
    company: first(payload, ["company", "company-name", "company_name"], TEXT_LIMITS.company),
    product_interest: first(payload, ["product_interest", "product-interest", "product", "product_type"], TEXT_LIMITS.product_interest),
    quantity: first(payload, ["quantity", "estimated_quantity"], TEXT_LIMITS.quantity),
    target_market: first(payload, ["target_market", "market"], TEXT_LIMITS.target_market),
    message: clean(payload.message, TEXT_LIMITS.message),
    source_page: clean(payload.source_page, TEXT_LIMITS.source_page),
    landing_page: clean(payload.landing_page, TEXT_LIMITS.landing_page),
    referrer: clean(payload.referrer, TEXT_LIMITS.referrer),
    utm_source: clean(payload.utm_source, TEXT_LIMITS.utm_source),
    utm_medium: clean(payload.utm_medium, TEXT_LIMITS.utm_medium),
    utm_campaign: clean(payload.utm_campaign, TEXT_LIMITS.utm_campaign),
    utm_content: clean(payload.utm_content, TEXT_LIMITS.utm_content),
    utm_term: clean(payload.utm_term, TEXT_LIMITS.utm_term),
    catalog_touch_page: clean(payload.catalog_touch_page, TEXT_LIMITS.catalog_touch_page),
    catalog_touch_placement: clean(payload.catalog_touch_placement, TEXT_LIMITS.catalog_touch_placement),
    catalog_touched_at: cleanTimestamp(payload.catalog_touched_at),
    inquiry_trigger: clean(payload.inquiry_trigger, TEXT_LIMITS.inquiry_trigger),
    user_agent: clean(req.headers.get("user-agent"), 1000),
    raw_payload: safePayload,
  };

  const { data, error } = await admin.from("entrol_leads").insert(row).select("id").single();
  if (error?.code === "23505") return jsonResponse(origin, { ok: true, duplicate: true }, 200);
  if (error) {
    console.error("lead_insert_failed", error.code, error.message);
    return jsonResponse(origin, { ok: false, error: "storage_failed" }, 500);
  }

  const resendApiKey = Deno.env.get("RESEND_API_KEY");
  const notificationTo = Deno.env.get("ENTROL_NOTIFICATION_TO") || "wangyan@entrol.com";
  const notificationFrom = Deno.env.get("ENTROL_NOTIFICATION_FROM") || "Entrol Leads <leads@updates.entrol.com>";
  let notificationStatus = "not_configured";

  if (resendApiKey) {
    const subjectName = row.company || row.name || row.email || row.contact || "New lead";
    const notificationText = [
      "A new Entrol website lead was stored successfully.",
      "",
      `Lead ID: ${data.id}`,
      `Type: ${row.submission_type}`,
      `Name: ${row.name || "-"}`,
      `Company: ${row.company || "-"}`,
      `Email: ${row.email || "-"}`,
      `Contact: ${row.contact || "-"}`,
      `Product: ${row.product_interest || "-"}`,
      `Quantity: ${row.quantity || "-"}`,
      `Message: ${row.message || "-"}`,
      `Source: ${row.source_page || "-"}`,
      `Landing page: ${row.landing_page || "-"}`,
      `Campaign: ${row.utm_campaign || "-"}`,
      `Catalog touch: ${row.catalog_touch_placement || "-"} | ${row.catalog_touch_page || "-"}`,
      `Catalog touched at: ${row.catalog_touched_at || "-"}`,
      `Inquiry trigger: ${row.inquiry_trigger || "-"}`,
    ].join("\n");

    try {
      const emailResponse = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${resendApiKey}` },
        body: JSON.stringify({
          from: notificationFrom,
          to: [notificationTo],
          reply_to: row.email || undefined,
          subject: `[Entrol Lead] ${subjectName}`.slice(0, 200),
          text: notificationText,
        }),
      });
      const emailResult = await emailResponse.json().catch(() => ({}));
      notificationStatus = emailResponse.ok ? "sent" : "failed";
      await admin.from("entrol_leads").update({
        notification_status: notificationStatus,
        notification_provider: "resend",
        notification_provider_id: emailResponse.ok && typeof emailResult.id === "string" ? emailResult.id : null,
        notification_attempted_at: new Date().toISOString(),
        notification_error: emailResponse.ok ? null : String(emailResult.message || `HTTP ${emailResponse.status}`).slice(0, 1000),
      }).eq("id", data.id);
    } catch (notificationError) {
      notificationStatus = "failed";
      await admin.from("entrol_leads").update({
        notification_status: "failed",
        notification_provider: "resend",
        notification_attempted_at: new Date().toISOString(),
        notification_error: String(notificationError).slice(0, 1000),
      }).eq("id", data.id);
    }
  } else {
    await admin.from("entrol_leads").update({ notification_status: "not_configured" }).eq("id", data.id);
  }

  return jsonResponse(origin, {
    ok: true,
    lead_id: data.id,
    duplicate: false,
    notification_status: notificationStatus,
  }, 201);
});
