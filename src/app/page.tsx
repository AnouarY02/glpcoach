import Link from "next/link";
import {
  Syringe,
  TrendingUp,
  Apple,
  CheckCircle,
  ArrowRight,
  Zap,
  Shield,
  Brain,
  AlertCircle,
  BarChart2,
} from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-cream">
      {/* Sticky Navbar */}
      <nav className="sticky top-0 z-50 bg-cream/95 backdrop-blur-sm border-b border-green-100">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center">
              <Syringe className="w-4 h-4 text-white" />
            </div>
            <span className="text-lg font-bold text-green-800">GlpCoach</span>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="text-green-700 hover:text-green-900 font-medium text-sm px-3 py-2 rounded-lg hover:bg-green-50 transition-colors"
            >
              Inloggen
            </Link>
            <Link href="/register" className="btn-primary text-sm py-2 px-4">
              7 dagen gratis proberen
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-5xl mx-auto px-4 pt-16 pb-20 text-center">
        <div className="inline-flex items-center gap-2 bg-orange-50 text-orange-600 rounded-full px-4 py-1.5 text-sm font-medium mb-6">
          <Zap className="w-3.5 h-3.5" />
          Speciaal voor GLP-1 gebruikers
        </div>
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-green-800 leading-tight mb-6">
          GLP-1 werkt alleen<br />
          <span className="text-orange-500">als je weet wat je doet</span>
        </h1>
        <p className="text-lg md:text-xl text-green-600 max-w-2xl mx-auto mb-10 leading-relaxed">
          AI coach die jouw gebruik begrijpt. Bijwerkingen bijhouden, plateaus doorbreken, en altijd precies weten wat er speelt — voor jou én je arts.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/register" className="btn-primary text-base px-8 py-4">
            7 dagen gratis proberen
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link href="/login" className="btn-outline text-base px-8 py-4">
            Inloggen
          </Link>
        </div>
        <p className="mt-4 text-sm text-green-500">Gratis starten — geen creditcard nodig</p>
      </section>

      {/* Pain Points */}
      <section className="bg-white py-16">
        <div className="max-w-5xl mx-auto px-4">
          <h2 className="text-2xl md:text-3xl font-bold text-green-800 text-center mb-12">
            Dit herken je waarschijnlijk...
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            {[
              {
                icon: <Brain className="w-8 h-8 text-orange-500" />,
                title: "Food noise verdwijnt — maar niemand vertelt je wat dan",
                desc: "Ineens ben je niet meer obsessief aan het nadenken over eten. Wat betekent dat? GLP Coach legt het uit in jouw context.",
              },
              {
                icon: <BarChart2 className="w-8 h-8 text-green-600" />,
                title: "Plateau na 3 maanden — je weegt al weken hetzelfde",
                desc: "Normaal fenomeen, maar frustrerend. De app signaleert het automatisch en de coach weet precies wat er aan de hand is.",
              },
              {
                icon: <AlertCircle className="w-8 h-8 text-orange-500" />,
                title: "Stoppen is eng — je weet niet wat er daarna gebeurt",
                desc: "Zal het gewicht terugkomen? Wat doet het met je hormonen? Vragen die je arts vaak te snel passeert.",
              },
              {
                icon: <Syringe className="w-8 h-8 text-green-600" />,
                title: "Je arts vraagt: hoe gaat het? Je weet het eigenlijk niet",
                desc: "Je hebt niets bijgehouden. GlpCoach houdt alles bij zodat je bij je volgende afspraak een compleet beeld kunt geven.",
              },
            ].map((item) => (
              <div key={item.title} className="card flex gap-4">
                <div className="shrink-0 mt-1">{item.icon}</div>
                <div>
                  <h3 className="font-semibold text-green-800 mb-1">{item.title}</h3>
                  <p className="text-green-600 text-sm leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20 max-w-5xl mx-auto px-4">
        <h2 className="text-2xl md:text-3xl font-bold text-green-800 text-center mb-4">
          Alles wat je nodig hebt, op één plek
        </h2>
        <p className="text-green-600 text-center mb-14 max-w-xl mx-auto">
          GlpCoach is gebouwd voor iedereen op een GLP-1 behandeling.
        </p>
        <div className="grid md:grid-cols-2 gap-8">
          {[
            {
              icon: <Brain className="w-6 h-6" />,
              title: "AI Coach",
              desc: "Persoonlijke GLP-1 coach die jouw gebruik kent. Stelt vragen, herkent patronen en geeft inzichten op basis van jouw data — niet generieke tips.",
              color: "bg-orange-50 text-orange-500",
            },
            {
              icon: <Syringe className="w-6 h-6" />,
              title: "Injectie tracker",
              desc: "Nooit meer vergeten wanneer je gespoten hebt. Log elke injectie in 10 seconden en zie wanneer je volgende injectie gepland staat.",
              color: "bg-green-50 text-green-600",
            },
            {
              icon: <TrendingUp className="w-6 h-6" />,
              title: "Plateau-signalering",
              desc: "De app detecteert automatisch als je gewicht stilstaat. Je coach wordt gewaarschuwd zodat je proactief het gesprek kunt aangaan.",
              color: "bg-blue-50 text-blue-500",
            },
            {
              icon: <Apple className="w-6 h-6" />,
              title: "Bijwerkingen & voeding",
              desc: "Log misselijkheid, vermoeidheid of andere klachten. Alles klaar voor je artsbezoek — inclusief voeding en hydratatie.",
              color: "bg-green-50 text-green-600",
            },
          ].map((feature) => (
            <div key={feature.title} className="card flex gap-4">
              <div className={`w-12 h-12 rounded-xl ${feature.color} flex items-center justify-center shrink-0`}>
                {feature.icon}
              </div>
              <div>
                <h3 className="font-semibold text-green-800 mb-1.5">{feature.title}</h3>
                <p className="text-green-600 text-sm leading-relaxed">{feature.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Quote */}
      <section className="bg-green-600 py-16 text-white text-center">
        <div className="max-w-5xl mx-auto px-4">
          <p className="text-2xl md:text-3xl font-bold mb-3 max-w-2xl mx-auto leading-snug">
            "Eindelijk heb ik alles op één plek. Bij mijn artsbezoek kon ik precies vertellen wat ik de afgelopen maanden had ervaren."
          </p>
          <p className="text-green-300 text-sm mt-4">— Sophie, 34, Ozempic gebruiker</p>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-20 max-w-5xl mx-auto px-4">
        <h2 className="text-2xl md:text-3xl font-bold text-green-800 text-center mb-4">
          Simpele, eerlijke prijzen
        </h2>
        <p className="text-green-600 text-center mb-12">Begin gratis, upgrade als je er klaar voor bent.</p>
        <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto">
          {/* Free */}
          <div className="card border-2 border-green-100">
            <div className="mb-6">
              <h3 className="text-lg font-bold text-green-800 mb-1">Gratis</h3>
              <div className="text-3xl font-bold text-green-800">€0</div>
              <p className="text-green-600 text-sm mt-1">7 dagen Pro gratis inbegrepen</p>
            </div>
            <ul className="space-y-3 mb-8">
              {[
                "Injectie tracker",
                "Bijwerkingen loggen",
                "Gewicht bijhouden",
                "3 AI coach berichten/dag",
                "Voortgang dashboard",
              ].map((item) => (
                <li key={item} className="flex items-center gap-2 text-sm text-green-700">
                  <CheckCircle className="w-4 h-4 text-green-500 shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
            <Link href="/register" className="btn-outline w-full text-center block">
              Start gratis
            </Link>
          </div>

          {/* Pro */}
          <div className="card border-2 border-orange-400 relative overflow-hidden">
            <div className="absolute top-4 right-4 bg-orange-500 text-white text-xs font-bold px-2 py-1 rounded-full">
              POPULAIR
            </div>
            <div className="mb-6">
              <h3 className="text-lg font-bold text-green-800 mb-1">Pro</h3>
              <div className="text-3xl font-bold text-green-800">
                €99
                <span className="text-lg font-normal text-green-600">/jaar</span>
              </div>
              <p className="text-green-600 text-sm mt-1">= €8,25/maand — bespaar 35%</p>
            </div>
            <ul className="space-y-3 mb-8">
              {[
                "Alles van Gratis",
                "Onbeperkt AI coach berichten",
                "Plateau-signalering",
                "Maaltijd analyse (foto)",
                "Geavanceerde voortgang",
                "Export naar PDF voor arts",
              ].map((item) => (
                <li key={item} className="flex items-center gap-2 text-sm text-green-700">
                  <CheckCircle className="w-4 h-4 text-orange-500 shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
            <Link href="/register" className="btn-primary w-full text-center block">
              7 dagen gratis proberen
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-green-100 py-10 bg-white">
        <div className="max-w-5xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-green-600 rounded-lg flex items-center justify-center">
              <Syringe className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="font-bold text-green-800">GlpCoach</span>
          </div>
          <div className="flex items-center gap-1 text-slate-400 text-xs max-w-sm text-center">
            <Shield className="w-3.5 h-3.5 shrink-0" />
            <span>GlpCoach is een tracking en organisatie app. Wij geven geen medisch advies. Raadpleeg altijd je arts of zorgverlener voor medische vragen.</span>
          </div>
          <p className="text-green-500 text-sm">© 2025 GlpCoach</p>
        </div>
      </footer>
    </div>
  );
}
