import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@/lib/supabase/server";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

const SYSTEM_PROMPT = `Je bent een persoonlijke GLP-1 coach. Je kent de wetenschap achter GLP-1 medicatie (Ozempic, Wegovy, Mounjaro) en helpt gebruikers hun behandeling begrijpen en bijhouden.

WAT JE WEL DOET:
- Uitleggen hoe GLP-1 medicatie werkt (food noise, verzadigingssignalen, maaglediging)
- Bijwerkingen in context plaatsen (misselijkheid dag 1-3 na injectie is normaal, afneemt met tijd)
- Plateaus begrijpelijk maken (metabolisme adapteert, normaal na 3-4 maanden)
- Stoppen-angst bespreken (gewicht kan terugkomen zonder leefstijl, eerlijk antwoord geven)
- Cyclusfase uitleggen: dag 1-2 = piek bijwerkingen, dag 3-5 = piekwerking eetlustremming, dag 6-7 = dalende werking
- Vragen stellen over hoe iemand zich voelt en wat ze eten
- Terugkoppelen op ingelogde data (gewicht, injecties, symptomen)
- Vrouwen begeleiden rond cyclusfasen (oestrogeen beïnvloedt GLP-1 effectiviteit)

WAT JE NOOIT DOET:
- Dosering aanpassen of aanbevelen — dat is altijd de arts
- Diagnoses stellen of symptomen duiden als medisch zorgwekkend
- Zeggen dat iemand moet stoppen of doorgaan met medicatie

Bij vragen over dosiswijzigingen, stopzetting, of zorgwekkende symptomen: "Dat is een vraag voor je arts — ik kan je helpen het goed te verwoorden voor je afspraak."

TOON: Direct, menselijk, geen jargon. Kort (max 100 woorden). Stel één vervolgvraag als het gesprek net begint.`;

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
    const [
      { data: profile },
      { data: lastInjection },
      { data: lastSymptoms },
      { data: weightLogs },
    ] = await Promise.all([
      supabase
        .from("user_profiles")
        .select("goal, medication_type, dose_mg")
        .eq("id", user.id)
        .single(),
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
        .select("weight_kg, logged_at")
        .eq("user_id", user.id)
        .order("logged_at", { ascending: false })
        .limit(5),
    ]);

    // Plateau detection: last 3+ entries with < 0.5kg delta
    let plateauDetected = false;
    if (weightLogs && weightLogs.length >= 3) {
      const weights = weightLogs.map((w) => w.weight_kg);
      const delta = Math.abs(weights[0] - weights[weights.length - 1]);
      if (delta < 0.5) plateauDetected = true;
    }

    const lastWeight = weightLogs?.[0];

    const contextParts = [
      cycleDay ? `Medicatiecyclus dag ${cycleDay}/7.` : "",
      profile?.medication_type ? `Medicatie: ${profile.medication_type} ${profile.dose_mg}mg.` : "",
      profile?.goal ? `Doel gebruiker: ${profile.goal}.` : "",
      lastInjection?.[0]
        ? `Laatste injectie: ${lastInjection[0].dose_mg}mg op ${lastInjection[0].injected_at}.`
        : "",
      lastSymptoms?.length
        ? `Recente klachten: ${lastSymptoms.map((s) => s.type).join(", ")}.`
        : "",
      lastWeight
        ? `Huidig gewicht: ${lastWeight.weight_kg}kg.`
        : "",
      plateauDetected ? "LET OP: plateau gedetecteerd — gewicht nauwelijks veranderd afgelopen metingen." : "",
    ]
      .filter(Boolean)
      .join(" ");

    const systemWithContext = contextParts
      ? `${SYSTEM_PROMPT}\n\nGebruikerscontext: ${contextParts}`
      : SYSTEM_PROMPT;

    const anthropicMessages = messages.map(
      (msg: { role: string; content: string }) => ({
        role: msg.role as "user" | "assistant",
        content: msg.content,
      })
    );

    const response = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 300,
      system: systemWithContext,
      messages: anthropicMessages,
    });

    const assistantMessage =
      response.content[0].type === "text" ? response.content[0].text : "";

    // Save both user message and assistant reply to coach_messages
    const lastUserMessage = messages[messages.length - 1];
    if (lastUserMessage?.role === "user") {
      await supabase.from("coach_messages").insert([
        { user_id: user.id, role: "user", content: lastUserMessage.content },
        { user_id: user.id, role: "assistant", content: assistantMessage },
      ]);
    }

    return NextResponse.json({ message: assistantMessage });
  } catch (error: unknown) {
    console.error("Coach API error:", error);
    return NextResponse.json(
      { error: "Er is een fout opgetreden bij de AI coach." },
      { status: 500 }
    );
  }
}
