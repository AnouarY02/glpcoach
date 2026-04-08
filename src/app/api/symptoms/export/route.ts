import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { format, subDays } from "date-fns";
import { nl } from "date-fns/locale";

interface SymptomRow {
  logged_at: string;
  type: string;
  severity: number;
  cycle_day: number | null;
  notes: string | null;
}

export async function GET(_request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const thirtyDaysAgo = subDays(new Date(), 30).toISOString();

    const { data: symptoms, error } = await supabase
      .from("symptoms")
      .select("logged_at, type, severity, cycle_day, notes")
      .eq("user_id", user.id)
      .gte("logged_at", thirtyDaysAgo)
      .order("logged_at", { ascending: false });

    if (error) {
      return NextResponse.json(
        { error: "Database fout" },
        { status: 500 }
      );
    }

    const rows = (symptoms ?? []) as SymptomRow[];

    // Build CSV
    const header = "Datum,Tijdstip,Symptoom,Ernst (1-5),Cyclusdag,Notities";
    const lines = rows.map((s) => {
      const date = format(new Date(s.logged_at), "d MMM yyyy", { locale: nl });
      const time = format(new Date(s.logged_at), "HH:mm");
      const symptoomLabel = s.type.replace(/_/g, " ");
      const cycleDay = s.cycle_day != null ? `Dag ${s.cycle_day}` : "";
      const notes = s.notes ? `"${s.notes.replace(/"/g, '""')}"` : "";
      return `${date},${time},${symptoomLabel},${s.severity},${cycleDay},${notes}`;
    });

    const csv = [header, ...lines].join("\n");

    const exportDate = format(new Date(), "yyyy-MM-dd");
    const filename = `glpcoach-bijwerkingen-${exportDate}.csv`;

    return new NextResponse(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error: unknown) {
    console.error("Symptoms export error:", error);
    return NextResponse.json(
      { error: "Export mislukt." },
      { status: 500 }
    );
  }
}
