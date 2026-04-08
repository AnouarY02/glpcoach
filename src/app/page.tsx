import Link from "next/link";
import {
  Syringe,
  Brain,
  TrendingDown,
  Apple,
  CheckCircle,
  Star,
  ArrowRight,
  Zap,
  Shield,
  Heart,
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
              Start gratis
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
          Je GLP-1 werkt.<br />
          <span className="text-orange-500">Maar doe jij het ook?</span>
        </h1>
        <p className="text-lg md:text-xl text-green-600 max-w-2xl mx-auto mb-10 leading-relaxed">
          GlpCoach begeleidt je week voor week door je medicatiecyclus. Bijwerkingen begrijpen,
          injecties bijhouden en een AI-coach die weet waar je in je cyclus zit.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/register" className="btn-primary text-base px-8 py-4">
            Start gratis — 7 dagen Pro
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link href="#features" className="btn-outline text-base px-8 py-4">
            Bekijk hoe het werkt
          </Link>
        </div>
        <p className="mt-4 text-sm text-green-500">Geen creditcard nodig • Annuleer altijd</p>
      </section>

      {/* Pain Points */}
      <section className="bg-white py-16">
        <div className="max-w-5xl mx-auto px-4">
          <h2 className="text-2xl md:text-3xl font-bold text-green-800 text-center mb-12">
            Dit herken je waarschijnlijk...
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                emoji: "😕",
                title: "Wanneer was mijn laatste injectie ook alweer?",
                desc: "Je weet dat je injectie bijna op moet, maar je weet niet meer precies wanneer je de laatste hebt gezet.",
              },
              {
                emoji: "🤢",
                title: "Is deze misselijkheid normaal?",
                desc: "Op dag 2 na je injectie voel je je niet goed. Is dit normaal, zal het overgaan? Je weet het gewoon niet.",
              },
              {
                emoji: "😩",
                title: "Ik eet te weinig eiwit, maar hoe houd ik dat bij?",
                desc: "Je arts zegt: eet meer eiwit. Maar caloriëtellen voel je niet, en je weet niet waar je moet beginnen.",
              },
            ].map((item) => (
              <div key={item.title} className="card text-center">
                <div className="text-4xl mb-4">{item.emoji}</div>
                <h3 className="font-semibold text-green-800 mb-2">{item.title}</h3>
                <p className="text-green-600 text-sm leading-relaxed">{item.desc}</p>
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
          GlpCoach is gebouwd rondom jouw 7-daagse medicatiecyclus.
        </p>
        <div className="grid md:grid-cols-2 gap-8">
          {[
            {
              icon: <Syringe className="w-6 h-6" />,
              title: "Injectie tracker",
              desc: "Log elke injectie in 10 seconden. Zie wanneer je volgende injectie gepland staat en welke lichaamslocaties je al gebruikt hebt.",
              color: "bg-green-50 text-green-600",
            },
            {
              icon: <Brain className="w-6 h-6" />,
              title: "AI dagcoach",
              desc: "Stel vragen aan je persoonlijke GLP-1 coach. Die weet precies op welke dag van je cyclus je zit en geeft advies dat daarbij past.",
              color: "bg-orange-50 text-orange-500",
            },
            {
              icon: <Heart className="w-6 h-6" />,
              title: "Bijwerkingen logboek",
              desc: "Tik snel aan welke bijwerkingen je hebt en hoe erg. Zo zie je patronen: misselijkheid op dag 2 is heel normaal!",
              color: "bg-green-50 text-green-600",
            },
            {
              icon: <TrendingDown className="w-6 h-6" />,
              title: "Voortgang in beeld",
              desc: "Zie je gewichtsverloop, je streak en vergelijk met wat klinisch gebruikelijk is voor jouw medicatie.",
              color: "bg-orange-50 text-orange-500",
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

      {/* Social Proof */}
      <section className="bg-green-600 py-16 text-white text-center">
        <div className="max-w-5xl mx-auto px-4">
          <div className="flex justify-center gap-1 mb-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <Star key={i} className="w-6 h-6 fill-orange-400 text-orange-400" />
            ))}
          </div>
          <p className="text-2xl md:text-3xl font-bold mb-3">
            8.000+ gebruikers vertrouwen GlpCoach
          </p>
          <p className="text-green-200 text-lg max-w-xl mx-auto">
            "Eindelijk begrijp ik waarom ik me elke week anders voel. En mijn coach geeft tips die echt helpen."
          </p>
          <p className="text-green-300 text-sm mt-3">— Sophie, 34, Ozempic gebruiker</p>
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
              <p className="text-green-600 text-sm mt-1">7 dagen Pro gratis</p>
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
                €12,99
                <span className="text-lg font-normal text-green-600">/maand</span>
              </div>
              <p className="text-green-600 text-sm mt-1">Of €99/jaar (35% korting)</p>
            </div>
            <ul className="space-y-3 mb-8">
              {[
                "Alles van Gratis",
                "Onbeperkt AI coaching",
                "Maaltijd analyse (foto)",
                "Geavanceerde voortgang",
                "Export naar PDF",
                "Prioriteit support",
              ].map((item) => (
                <li key={item} className="flex items-center gap-2 text-sm text-green-700">
                  <CheckCircle className="w-4 h-4 text-orange-500 shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
            <Link href="/register" className="btn-primary w-full text-center block">
              Begin met Pro
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
          <div className="flex items-center gap-1 text-green-500 text-sm">
            <Shield className="w-3.5 h-3.5" />
            <span>GlpCoach is geen medisch advies. Raadpleeg altijd je arts.</span>
          </div>
          <p className="text-green-500 text-sm">© 2025 GlpCoach</p>
        </div>
      </footer>
    </div>
  );
}
