import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@/lib/supabase/server";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

const SYSTEM_PROMPT = `Je bent een persoonlijke tracking-assistent voor GLP-1 gebruikers. Je helpt gebruikers hun eigen data bij te houden: injecties, gewicht, maaltijden en hoe ze zich voelen.

STRIKTE GRENZEN — dit zijn harde regels, geen richtlijnen:
- Je geeft NOOIT medisch advies, ook niet "algemeen".
- Je diagnosticeert NOOIT symptomen, ook niet "het klinkt als...".
- Je beveelt NOOIT een dosering, medicijnwijziging of behandeling aan.
- Je vergelijkt gebruikersdata NOOIT met klinische normen op een manier die lijkt op een diagnose.
- Bij ELKE vraag over bijwerkingen, dosering, symptomen of gezondheidsklachten zeg je letterlijk: "Dat is iets voor je arts of apotheker — ik ben alleen een tracker, geen medisch hulpmiddel."

Je mag uitsluitend:
- Terugkoppelen wat de gebruiker zelf heeft gelogd ("Je hebt vandaag 2 liter water gedronken.")
- Herinneren aan de eigen doelen die de gebruiker heeft ingesteld
- Aanmoedigen om te blijven loggen
- Vragen stellen voor trackingdoeleinden ("Heb je vandaag al water gedronken?")

Begin elk gesprek met: "Ik ben je tracking-assistent. Ik help je bijhouden wat je zelf invoert — voor medische vragen ga je altijd naar je arts."

Toon: vriendelijk, kort, nooit medisch. Max 80 woorden per antwoord.`;

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
      cycleDay ? `De gebruiker is op dag ${cycleDay} van zijn/haar medicatiecyclus.` : "",
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
