import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@/lib/supabase/server";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

const SYSTEM_PROMPT = `Je bent een warme, bemoedigende GLP-1 dagcoach. Je helpt gebruikers het meeste uit hun Ozempic, Wegovy, Mounjaro of Zepbound te halen.

Jij bent GEEN arts en geeft GEEN medisch advies. Verwijs altijd naar een arts bij medische zorgen.

Je weet dat GLP-1 medicijnen werken in een 7-daagse cyclus:
- Dag 1-2: Medicatie bouwt op, bijwerkingen het sterkst (misselijkheid, vermoeidheid)
- Dag 3-5: Piekfase, eetlustremming maximaal
- Dag 6-7: Medicatie neemt af, honger kan iets toenemen

Je stijl:
- Warm, aanmoedigend, niet klinisch
- Max 150 woorden per antwoord
- Praktische tips gericht op de huidige cyclusfase
- Normaliseer bijwerkingen die normaal zijn, maar moedig aan bij zorgen contact op te nemen met arts

Gebruik de cyclusdag die je krijgt om context te geven.`;

const FREE_DAILY_LIMIT = 3;

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Niet ingelogd" }, { status: 401 });
    }

    // Check subscription and message limit
    const { data: profile } = await supabase
      .from("user_profiles")
      .select("subscription_tier")
      .eq("id", user.id)
      .single();

    const isPro = profile?.subscription_tier === "pro";

    if (!isPro) {
      // Count today's coaching messages via daily_checkins
      const today = new Date().toISOString().split("T")[0];
      const { data: checkin } = await supabase
        .from("daily_checkins")
        .select("ai_coaching_response")
        .eq("user_id", user.id)
        .eq("date", today)
        .single();

      // Simple count approach: parse message count from coaching_response metadata
      // For MVP: allow up to FREE_DAILY_LIMIT per day based on client-side count
      // (Full implementation would track per message in a separate table)
    }

    const body = await request.json();
    const { messages, cycleDay } = body;

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: "Ongeldige berichten" }, { status: 400 });
    }

    // Get additional context
    const [{ data: lastInjection }, { data: lastSymptoms }, { data: lastWeight }] =
      await Promise.all([
        supabase
          .from("injections")
          .select("dose_mg, site, injected_at")
          .eq("user_id", user.id)
          .order("injected_at", { ascending: false })
          .limit(1),
        supabase
          .from("symptoms")
          .select("type, severity")
          .eq("user_id", user.id)
          .order("logged_at", { ascending: false })
          .limit(3),
        supabase
          .from("weight_logs")
          .select("weight_kg")
          .eq("user_id", user.id)
          .order("logged_at", { ascending: false })
          .limit(1),
      ]);

    const contextInfo = [
      cycleDay ? `Gebruiker is op dag ${cycleDay} van hun GLP-1 cyclus.` : "",
      lastInjection?.[0]
        ? `Laatste injectie: ${lastInjection[0].dose_mg}mg.`
        : "",
      lastSymptoms?.length
        ? `Recente klachten: ${lastSymptoms.map((s) => s.type).join(", ")}.`
        : "",
      lastWeight?.[0]
        ? `Huidig gewicht: ${lastWeight[0].weight_kg}kg.`
        : "",
    ]
      .filter(Boolean)
      .join(" ");

    const systemPromptWithContext = contextInfo
      ? `${SYSTEM_PROMPT}\n\nGebruikerscontext: ${contextInfo}`
      : SYSTEM_PROMPT;

    // Format messages for Anthropic
    const anthropicMessages = messages.map(
      (msg: { role: string; content: string }) => ({
        role: msg.role as "user" | "assistant",
        content: msg.content,
      })
    );

    const response = await anthropic.messages.create({
      model: "claude-opus-4-5",
      max_tokens: 300,
      system: systemPromptWithContext,
      messages: anthropicMessages,
    });

    const assistantMessage =
      response.content[0].type === "text" ? response.content[0].text : "";

    // Save AI response to daily checkin
    const today = new Date().toISOString().split("T")[0];
    await supabase.from("daily_checkins").upsert(
      {
        user_id: user.id,
        date: today,
        water_ml: 0,
        ai_coaching_response: assistantMessage,
      },
      { onConflict: "user_id,date" }
    );

    return NextResponse.json({ message: assistantMessage });
  } catch (error: unknown) {
    console.error("Coach API error:", error);
    return NextResponse.json(
      { error: "Er is een fout opgetreden bij de AI coach." },
      { status: 500 }
    );
  }
}
