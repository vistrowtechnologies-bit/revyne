const SUPABASE_URL = "https://dbqizpephewiefvghenr.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_377ZtWI_hNXl8C6TuVPTWQ_b6A2L6S_";

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const authHeader = req.headers.authorization || "";
  if (!authHeader.startsWith("Bearer ")) {
    res.status(401).json({ error: "Login required" });
    return;
  }

  try {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/create-razorpay-subscription`, {
      method: "POST",
      headers: {
        apikey: SUPABASE_PUBLISHABLE_KEY,
        Authorization: authHeader,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(req.body || {})
    });

    const text = await response.text();
    const contentType = response.headers.get("content-type") || "application/json";
    res.status(response.status);
    res.setHeader("Content-Type", contentType);
    res.send(text);
  } catch (error) {
    res.status(502).json({
      error: "Payment service could not be reached",
      detail: error?.message || "Unknown error"
    });
  }
};
