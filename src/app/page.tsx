import Link from "next/link";
import {
  Syringe,
  TrendingUp,
  Apple,
  CheckCircle,
  Star,
  ArrowRight,
  Zap,
  Shield,
  Calendar,
  Droplets,
  Clipboard,
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
          Alles op één plek<br />
          <span className="text-orange-500">voor je GLP-1 reis</span>
        </h1>
        <p className="text-lg md:text-xl text-green-600 max-w-2xl mx-auto mb-10 leading-relaxed">
          Houd je injecties, voeding, bijwerkingen en voortgang bij — zodat jij en je arts altijd een compleet beeld hebben.
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
        <p className="mt-4 text-sm text-green-500">Al door 8.000+ GLP-1 gebruikers gebruikt om hun reis bij te houden</p>
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
                icon: <Calendar className="w-8 h-8 text-green-600" />,
                title: "Wanneer was je laatste injectie ook alweer?",
                desc: "Je weet dat je injectie bijna op moet, maar je weet niet meer precies wanneer je de laatste hebt gezet.",
              },
              {
                icon: <Droplets className="w-8 h-8 text-orange-500" />,
                title: "Hoeveel water heb je vandaag gedronken?",
                desc: "Voldoende hydratatie is belangrijk, maar het is makkelijk om te vergeten bij te houden hoeveel je drinkt.",
              },
              {
                icon: <Clipboard className="w-8 h-8 text-green-600" />,
                title: "Wat wil je je arts vertellen bij je volgende afspraak?",
                desc: "Bij het artsbezoek weet je niet meer precies wat je hebt ervaren. GlpCoach houdt het allemaal bij.",
              },
            ].map((item) => (
              <div key={item.title} className="card text-center">
                <div className="flex justify-center mb-4">{item.icon}</div>
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
          GlpCoach is gebouwd voor iedereen op een GLP-1 behandeling.
        </p>
        <div className="grid md:grid-cols-2 gap-8">
          {[
            {
              icon: <Syringe className="w-6 h-6" />,
              title: "Injectie tracker",
              desc: "Nooit meer vergeten wanneer je gespoten hebt. Log elke injectie in 10 seconden en zie wanneer je volgende injectie gepland staat.",
              color: "bg-green-50 text-green-600",
            },
            {
              icon: <Clipboard className="w-6 h-6" />,
              title: "Bijwerkingen log",
              desc: "Alles klaar voor je artsbezoek. Noteer wat je hebt ervaren zodat je bij je volgende afspraak een compleet beeld kunt geven.",
              color: "bg-orange-50 text-orange-500",
            },
            {
              icon: <Apple className="w-6 h-6" />,
              title: "Voeding check",
              desc: "Eiwit en hydratatie bijhouden. Houd bij hoeveel water je drinkt en of je voldoende eiwitrijke maaltijden eet.",
              color: "bg-green-50 text-green-600",
            },
            {
              icon: <TrendingUp className="w-6 h-6" />,
              title: "Voortgang",
              desc: "Je reis in één oogopslag. Zie je gewichtsverloop en je streak over tijd in een duidelijk overzicht.",
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
            Al door 8.000+ GLP-1 gebruikers gebruikt om hun reis bij te houden
          </p>
          <p className="text-green-200 text-lg max-w-xl mx-auto">
            "Eindelijk heb ik alles op één plek. Bij mijn artsbezoek kon ik precies vertellen wat ik had bijgehouden."
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
                "3 assistent berichten/dag",
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
                "Onbeperkt berichten",
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
