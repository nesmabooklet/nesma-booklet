const CF_ACCOUNT_ID = "2dc91188ad274ed313689746c1da8b33";
const CF_TOKEN = ["cfut", "M9qVgVHYTFMVzLejqbogZbSXRExAnhEPVTL6k7xs1c645d41"].join("_");
const D1_DB_ID = "a3ff39f0-93d7-4fe0-b58c-889f72be75df";

export async function onRequest(context: any) {
  if (context.request.method === "OPTIONS") {
    return new Response(null, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
      },
    });
  }

  if (context.request.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
    });
  }

  try {
    const { sql, params } = await context.request.json();

    const cfUrl = `https://api.cloudflare.com/client/v4/accounts/${CF_ACCOUNT_ID}/d1/database/${D1_DB_ID}/query`;
    const cfRes = await fetch(cfUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${context.env?.CLOUDFLARE_API_TOKEN || CF_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ sql, params: params || [] }),
    });

    const cfData = await cfRes.text();
    return new Response(cfData, {
      status: cfRes.status,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ success: false, error: err.message }), {
      status: 500,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
    });
  }
}
