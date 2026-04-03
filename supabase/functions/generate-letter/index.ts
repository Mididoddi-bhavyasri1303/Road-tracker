import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { title, description, category, location, state, city, district, address_line1, address_line2, reporter_name, reporter_contact, reporter_signature } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const systemPrompt = `You are a government correspondence writer for Indian municipal authorities. Convert road issue reports into formal complaint letters. The letter should:

- Be addressed to the appropriate authority (District Collector / Municipal Commissioner / Public Works Department) based on the state and district
- Include a proper subject line with reference to the road issue category
- Have a formal salutation
- Contain a detailed body describing the issue, exact location (using address details), and its impact on citizens
- Include a request for immediate inspection and remedial action
- Have a formal closing with the sender's full name, contact number, and designation/signature
- Include date and reference number format
- The sender details at the bottom should use the reporter's name, contact number, and signature/designation provided

Use professional Indian government letter format. Be specific about the location using the address provided.`;

    const fullAddress = [address_line1, address_line2].filter(Boolean).join(", ");
    const locationInfo = [fullAddress, district, state].filter(v => v && v !== "Not specified").join(", ");

    const userPrompt = `Generate a formal government-style complaint letter for the following road issue:

Title: ${title}
Category: ${category}
Description: ${description || "No additional description provided"}
Full Address: ${fullAddress || "Not specified"}
District: ${district || city || "Not specified"}
State: ${state || "Not specified"}
GPS/Location Reference: ${location}

Complete location: ${locationInfo}

Reporter Details:
- Full Name: ${reporter_name || "Not specified"}
- Contact Number: ${reporter_contact || "Not specified"}
- Designation/Signature: ${reporter_signature || "Concerned Citizen"}

Please format this as a complete formal letter addressed to the appropriate municipal authority of ${district || city || "the district"}, ${state || "the state"}. Use the reporter's name and contact details at the bottom of the letter as the sender.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limited. Please try again later." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add funds." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const text = await response.text();
      console.error("AI gateway error:", response.status, text);
      throw new Error("AI gateway error");
    }

    const data = await response.json();
    const letter = data.choices?.[0]?.message?.content || "Failed to generate letter.";

    return new Response(JSON.stringify({ letter }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-letter error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
