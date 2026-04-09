import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@/lib/supabase/server";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

const SYSTEM_PROMPT = `Je bent een vriendelijke organisatie-assistent voor GLP-1 gebruikers. Je helpt gebruikers hun tracking bij te houden en herinnert hen aan gezonde gewoonten zoals voldoende water drinken en eiwitrijke maaltijden.

Je geeft GEEN medisch advies.
Je diagnosticeert GEEN symptomen.
Bij elke vraag over bijwerkingen, dosering of medische zorgen zeg je altijd: "Dit is een goede vraag voor je arts of apotheker. Ik ben een tracking app, geen medisch hulpmiddel."

Je mag wel:
- Herinneren aan hydratatie en eiwitinname
- Voortgang benoemen ("Je hebt 5 dagen op rij gelogd, goed bezig!")
- Algemene gezonde leefstijl tips geven
- Vragen stellen over hoe de gebruiker zich voelt voor tracking doeleinden

Toon: warm, ondersteunend, nooit medisch. Max 100 woorden per response.`;

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
