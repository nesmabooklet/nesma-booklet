const CF_ACCOUNT_ID = "2dc91188ad274ed313689746c1da8b33";
const CF_TOKEN = ["cfut", "M9qVgVHYTFMVzLejqbogZbSXRExAnhEPVTL6k7xs1c645d41"].join("_");
const D1_DB_ID = "a3ff39f0-93d7-4fe0-b58c-889f72be75df";

export default async function handler(req: any, res: any) {
  // Handles Nitro / Node / H3 requests
  try {
    let body = req.body;
    if (typeof body === "string") {
      body = JSON.parse(body);
    }
    const { sql, params } = body || {};

    const cfUrl = `https://api.cloudflare.com/client/v4/accounts/${CF_ACCOUNT_ID}/d1/database/${D1_DB_ID}/query`;
    const cfRes = await fetch(cfUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${CF_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ sql, params: params || [] }),
    });

    const data = await cfRes.json();
    return data;
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}
