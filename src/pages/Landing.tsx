import { Link } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';
import { LazyMotion, domAnimation, m, useInView, animate } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Logo } from '@/components/Logo';
import { Users2, LayoutGrid, FileDown, Zap, Send, ClipboardList, MessageCircle, Star, Mail, Menu, X, ArrowRight } from 'lucide-react';

const features = [
  { Icon: Users2, title: 'Gestion des clients', desc: 'Ajoutez et organisez vos clients avec toutes leurs informations en un seul endroit.' },
  { Icon: LayoutGrid, title: 'Catalogue produits', desc: 'Créez votre catalogue avec prix unitaires prédéfinis en FCFA.' },
  { Icon: FileDown, title: 'Génération PDF', desc: 'Générez des factures proforma professionnelles en PDF en un clic.' },
  { Icon: Zap, title: 'Ultra rapide', desc: "Interface fluide pour créer vos proformas en moins d'une minute." },
  { Icon: Send, title: 'Partage WhatsApp', desc: 'Envoyez vos factures directement via WhatsApp en un tap.' },
  { Icon: ClipboardList, title: 'Historique complet', desc: 'Retrouvez toutes vos proformas avec statuts et suivi intégré.' },
];

const testimonials = [
  { quote: "Avant je perdais 20 minutes par facture avec Excel. Maintenant c'est moins de 2 minutes.", name: 'Adjoua K.', role: 'Gérante, Abidjan', avatar: 'https://i.pravatar.cc/80?img=47' },
  { quote: "Mes clients reçoivent des factures professionnelles directement sur WhatsApp. C'est parfait pour mon commerce.", name: 'Moussa D.', role: 'Importateur, Cotonou', avatar: 'https://i.pravatar.cc/80?img=12' },
  { quote: "Le catalogue produits me fait gagner un temps fou. Je recommande à tous les commerçants.", name: 'Fatoumata B.', role: 'Responsable achats, Dakar', avatar: 'https://i.pravatar.cc/80?img=56' },
];

const advantagesLeft = [
  { title: 'GAIN DE TEMPS', desc: "Créez une proforma en moins d'une minute au lieu de 15 minutes avec Excel." },
  { title: 'ZÉRO ERREUR', desc: 'Les calculs sont automatiques. Fini les erreurs de formules.' },
];

const advantagesRight = [
  { title: 'IMAGE PROFESSIONNELLE', desc: "Des documents élégants qui renforcent la crédibilité de votre entreprise." },
  { title: 'ACCESSIBLE PARTOUT', desc: "Utilisez l'application depuis n'importe quel appareil, à tout moment." },
];

// Composant pour animer les chiffres
function AnimatedCounter({ value, suffix = '' }: { value: number; suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true });

  useEffect(() => {
    if (isInView && ref.current) {
      const controls = animate(0, value, {
        duration: 2,
        ease: 'easeOut',
        onUpdate(v) {
          if (ref.current) {
            ref.current.textContent = Math.floor(v).toLocaleString('fr-FR') + suffix;
          }
        },
      });
      return () => controls.stop();
    }
  }, [isInView, value, suffix]);

  return <span ref={ref}>0{suffix}</span>;
}

export default function Landing() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-white text-black selection:bg-blue-600 selection:text-white">
      {/* NAVBAR EN BLANC PUR */}
      <header className="sticky top-0 z-50 bg-white border-b border-gray-100 shadow-xs">
        <div className="container flex items-center justify-between h-20 px-4 sm:px-8 max-w-7xl mx-auto">
          {/* Logo cliquable vers l'accueil */}
          <a href="#accueil" className="cursor-pointer">
            <Logo />
          </a>

          {/* Navigation centrale */}
          <nav className="hidden md:flex items-center bg-gray-50 border border-gray-200/60 rounded-full p-1.5 gap-1 shadow-xs">
            <a href="#accueil" className="text-xs font-bold text-black bg-white rounded-full px-5 py-2 shadow-xs">Accueil</a>
            <a href="#fonctionnalites" className="text-xs font-semibold text-gray-600 hover:text-blue-600 transition-colors px-5 py-2">Fonctionnalités</a>
            <a href="#avantages" className="text-xs font-semibold text-gray-600 hover:text-blue-600 transition-colors px-5 py-2">Avantages</a>
          </nav>

          {/* Bouton de connexion à droite (Masqué sur mobile pour laisser place uniquement au hamburger) */}
          <div className="flex items-center gap-3">
            <Link to="/auth" className="hidden sm:inline-flex items-center justify-center text-xs font-bold text-white bg-black hover:bg-gray-800 rounded-full px-6 py-3 transition-all shadow-md">
              Se connecter
            </Link>

            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="md:hidden inline-flex items-center justify-center w-10 h-10 rounded-xl hover:bg-gray-100 text-black border border-gray-200"
              aria-label="Menu"
            >
              {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {menuOpen && (
          <div className="md:hidden border-t border-gray-100 bg-white shadow-lg">
            <nav className="flex flex-col p-4 space-y-2">
              <a href="#accueil" onClick={() => setMenuOpen(false)} className="px-4 py-3 text-sm font-bold text-black rounded-xl hover:bg-gray-50">Accueil</a>
              <a href="#fonctionnalites" onClick={() => setMenuOpen(false)} className="px-4 py-3 text-sm font-bold text-gray-700 rounded-xl hover:bg-gray-50">Fonctionnalités</a>
              <a href="#avantages" onClick={() => setMenuOpen(false)} className="px-4 py-3 text-sm font-bold text-gray-700 rounded-xl hover:bg-gray-50">Avantages</a>
              <Link to="/auth" onClick={() => setMenuOpen(false)} className="w-full text-center text-xs font-bold text-white bg-black rounded-xl py-3 mt-2 block">Se connecter</Link>
            </nav>
          </div>
        )}
      </header>

      <LazyMotion features={domAnimation} strict>
      <main>
        {/* HERO EN DÉGRADÉ BLEU ET TEXTES EN BLANC */}
        <section id="accueil" className="relative overflow-hidden bg-gradient-to-b from-blue-600 via-blue-500 to-blue-400 py-16 sm:py-24 text-white">
          <div className="container px-4 sm:px-8 max-w-5xl mx-auto text-center relative z-10">
            <m.div
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}
            >
              <h1 className="font-display text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-black tracking-tight leading-[1.1] mb-6 text-white">
                Créez vos factures pro forma<br /> en 60 secondes
              </h1>
              
              <p className="text-base sm:text-lg md:text-xl text-blue-100 max-w-2xl mx-auto mb-8 font-medium leading-relaxed">
                L'outil le plus simple pour gérer vos clients, vos produits et générer des factures proforma professionnelles en quelques clics.
              </p>

              <Link to="/auth"
                className="group inline-flex items-center justify-center gap-2 text-blue-900 bg-white hover:bg-blue-50 font-bold text-base sm:text-lg rounded-full px-10 py-4 transition-all shadow-xl hover:-translate-y-0.5"
              >
                S'inscrire <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
              </Link>

              {/* Boîte de statistiques avec animation */}
              <div className="grid grid-cols-3 gap-4 max-w-xl mx-auto mt-12 p-6 bg-white/10 backdrop-blur-md border border-white/20 rounded-3xl text-white">
                <div className="text-center">
                  <div className="font-display font-black text-xl sm:text-2xl">
                    <AnimatedCounter value={500} suffix="+" />
                  </div>
                  <div className="text-[10px] sm:text-xs text-blue-100 font-semibold mt-1 uppercase tracking-wider">Entreprises</div>
                </div>
                <div className="text-center border-x border-white/20 px-2">
                  <div className="font-display font-black text-xl sm:text-2xl">
                    <AnimatedCounter value={10000} suffix="+" />
                  </div>
                  <div className="text-[10px] sm:text-xs text-blue-100 font-semibold mt-1 uppercase tracking-wider">Factures</div>
                </div>
                <div className="text-center">
                  <div className="font-display font-black text-xl sm:text-2xl">
                    <AnimatedCounter value={60} suffix="s" />
                  </div>
                  <div className="text-[10px] sm:text-xs text-blue-100 font-semibold mt-1 uppercase tracking-wider">Chronomètre</div>
                </div>
              </div>
            </m.div>
          </div>
        </section>

        {/* FONCTIONNALITÉS SUR FOND BLANC PUR */}
        <section id="fonctionnalites" className="py-12 sm:py-16 bg-white">
          <div className="container px-4 sm:px-8 max-w-7xl mx-auto">
            <div className="text-center max-w-2xl mx-auto mb-10">
              <span className="text-xs font-bold tracking-widest text-blue-600 uppercase mb-2 block">FONCTIONNALITÉS</span>
              <h2 className="font-display text-2xl sm:text-4xl font-black text-black tracking-tight mb-2">Tout ce dont vous avez besoin</h2>
              <p className="text-gray-500 text-sm sm:text-base font-medium">Une solution complète pour gérer vos factures proforma de A à Z.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {features.map((f, i) => (
                <m.div key={f.title} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.05 }}>
                  <div className="group bg-gray-50 border border-gray-100 rounded-3xl p-6 h-full transition-all duration-300 hover:border-blue-300 hover:bg-white hover:shadow-xl hover:shadow-blue-600/5">
                    <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center mb-4 shadow-md transition-transform group-hover:scale-110">
                      <f.Icon size={24} />
                    </div>
                    <h3 className="font-display text-lg font-bold text-black mb-2">{f.title}</h3>
                    <p className="text-gray-500 text-sm leading-relaxed font-medium">{f.desc}</p>
                  </div>
                </m.div>
              ))}
            </div>
          </div>
        </section>

        {/* TÉMOIGNAGES SUR FOND BLANC PUR */}
        <section className="py-12 sm:py-16 bg-white border-t border-gray-100">
          <div className="container px-4 sm:px-8 max-w-7xl mx-auto">
            <div className="text-center max-w-2xl mx-auto mb-10">
              <span className="text-xs font-bold tracking-widest text-blue-600 uppercase mb-2 block">TÉMOIGNAGES</span>
              <h2 className="font-display text-2xl sm:text-4xl font-black text-black tracking-tight">Ils nous font confiance</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {testimonials.map((t, i) => (
                <m.div key={t.name} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}>
                  <div className="bg-gray-50 border border-gray-100 rounded-3xl p-6 h-full flex flex-col justify-between shadow-xs">
                    <div>
                      <div className="flex gap-1 mb-3">
                        {[...Array(5)].map((_, j) => <Star key={j} className="h-4 w-4 fill-blue-600 text-blue-600" />)}
                      </div>
                      <p className="text-sm sm:text-base text-gray-700 font-medium italic leading-relaxed mb-4">"{t.quote}"</p>
                    </div>
                    <div className="flex items-center gap-4 pt-3 border-t border-gray-200/60">
                      <img src={t.avatar} alt={t.name} className="w-10 h-10 rounded-full object-cover border-2 border-gray-200" loading="lazy" />
                      <div>
                        <p className="font-bold text-sm text-black">{t.name}</p>
                        <p className="text-xs text-gray-500 font-semibold">{t.role}</p>
                      </div>
                    </div>
                  </div>
                </m.div>
              ))}
            </div>
          </div>
        </section>

        {/* SECTION AVANTAGES SANS ICÔNES ET AVEC LIGNES DE CONNEXION */}
        <section id="avantages" className="py-12 sm:py-16 bg-white border-t border-gray-100 relative overflow-hidden">
          <div className="container px-4 sm:px-8 max-w-7xl mx-auto">
            <div className="text-center max-w-3xl mx-auto mb-12">
              <span className="text-xs font-bold tracking-widest text-blue-600 uppercase mb-2 block">AVANTAGES</span>
              <h2 className="font-display text-2xl sm:text-4xl font-black text-black tracking-tight">Pourquoi choisir Evabas ?</h2>
            </div>

            <div className="relative max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8 items-center">
              
              {/* SVG Connecteurs (Lignes bleues de la facture vers les blocs sans icônes) */}
              <div className="absolute inset-0 pointer-events-none hidden lg:block z-0">
                <svg className="w-full h-full" viewBox="0 0 1000 400" preserveAspectRatio="none">
                  <path d="M 360 130 C 310 130, 290 110, 240 110" fill="none" stroke="#2563EB" strokeWidth="2.5" strokeLinecap="round" />
                  <circle cx="360" cy="130" r="4" fill="#2563EB" />
                  <circle cx="240" cy="110" r="4" fill="#2563EB" />

                  <path d="M 360 270 C 310 270, 290 290, 240 290" fill="none" stroke="#2563EB" strokeWidth="2.5" strokeLinecap="round" />
                  <circle cx="360" cy="270" r="4" fill="#2563EB" />
                  <circle cx="240" cy="290" r="4" fill="#2563EB" />

                  <path d="M 640 130 C 690 130, 710 110, 760 110" fill="none" stroke="#2563EB" strokeWidth="2.5" strokeLinecap="round" />
                  <circle cx="640" cy="130" r="4" fill="#2563EB" />
                  <circle cx="760" cy="110" r="4" fill="#2563EB" />

                  <path d="M 640 270 C 690 270, 710 290, 760 290" fill="none" stroke="#2563EB" strokeWidth="2.5" strokeLinecap="round" />
                  <circle cx="640" cy="270" r="4" fill="#2563EB" />
                  <circle cx="760" cy="290" r="4" fill="#2563EB" />
                </svg>
              </div>

              {/* Colonne Gauche (Avantages 1 & 2) */}
              <div className="space-y-6 z-10">
                {advantagesLeft.map((a) => (
                  <div key={a.title} className="bg-white border border-gray-200 p-6 rounded-2xl shadow-xs hover:border-blue-300 transition-all">
                    <h3 className="font-display text-sm font-bold text-black mb-1">{a.title}</h3>
                    <p className="text-gray-600 text-xs font-medium leading-relaxed">{a.desc}</p>
                  </div>
                ))}
              </div>

              {/* Colonne Centrale : Facture Proforma pure au milieu */}
              <div className="relative flex justify-center items-center z-10 my-4 lg:my-0">
                <Card className="w-full max-w-xs p-6 rounded-3xl border border-blue-200 bg-white shadow-xl relative">
                  <div className="flex justify-between items-start mb-4 pb-4 border-b border-gray-100">
                    <div>
                      <p className="font-display font-black text-base text-black">Mon Entreprise</p>
                      <p className="text-[11px] text-gray-500 font-medium">Cotonou, Bénin</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] font-black tracking-wider text-blue-600">PROFORMA</p>
                      <p className="font-mono text-xs font-bold text-black mt-0.5">FP-2026</p>
                    </div>
                  </div>
                  <div className="space-y-2 mb-4 text-xs">
                    {['Vin rouge Bordeaux', 'Huile végétale 5L', 'Savon de Marseille'].map((item, i) => (
                      <div key={item} className="flex justify-between py-1.5 border-b border-gray-50">
                        <span className="font-semibold text-black">{item}</span>
                        <span className="text-gray-600 font-mono">{(i + 1) * 4} × 5 000</span>
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-between items-center pt-2 border-t-2 border-black text-sm">
                    <span className="font-bold text-black">Total TTC</span>
                    <span className="font-black text-blue-600">180 200 FCFA</span>
                  </div>
                </Card>
              </div>

              {/* Colonne Droite (Avantages 3 & 4) */}
              <div className="space-y-6 z-10">
                {advantagesRight.map((a) => (
                  <div key={a.title} className="bg-white border border-gray-200 p-6 rounded-2xl shadow-xs hover:border-blue-300 transition-all">
                    <h3 className="font-display text-sm font-bold text-black mb-1">{a.title}</h3>
                    <p className="text-gray-600 text-xs font-medium leading-relaxed">{a.desc}</p>
                  </div>
                ))}
              </div>

            </div>
          </div>
        </section>
      </main>
      </LazyMotion>

      {/* FOOTER EN DÉGRADÉ BLEU ET TEXTES EN NOIR */}
      <footer className="bg-gradient-to-t from-blue-500 to-blue-600 text-black py-12 border-t border-blue-400">
        <div className="container px-4 sm:px-8 max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8 text-center md:text-left">
          <div className="flex flex-col items-center md:items-start">
            <a href="#accueil" className="cursor-pointer">
              <Logo />
            </a>
            <p className="text-black/80 text-sm mt-4 max-w-xs font-semibold">La facturation proforma simple pour les entreprises africaines.</p>
          </div>
          <div>
            <h4 className="font-display font-black text-sm uppercase tracking-wider mb-4 text-black">Navigation</h4>
            <ul className="space-y-2 text-sm font-semibold text-black/90">
              <li><a href="#accueil" className="hover:underline">Accueil</a></li>
              <li><a href="#fonctionnalites" className="hover:underline">Fonctionnalités</a></li>
              <li><a href="#avantages" className="hover:underline">Avantages</a></li>
            </ul>
          </div>
          <div>
            <h4 className="font-display font-black text-sm uppercase tracking-wider mb-4 text-black">Contact</h4>
            <ul className="space-y-2 text-sm font-semibold text-black/90 inline-flex flex-col items-center md:items-start">
              <li className="flex items-center gap-2"><MessageCircle className="h-4 w-4 text-black" /> +229 0161406443</li>
              <li className="flex items-center gap-2"><Mail className="h-4 w-4 text-black" /> leonevabas@gmail.com</li>
            </ul>
          </div>
        </div>
        <div className="container px-4 sm:px-8 max-w-7xl mx-auto mt-8 pt-6 border-t border-black/10 text-center text-xs font-bold text-black/80">
          © 2026 EVABAS. Tous droits réservés.
        </div>
      </footer>
    </div>
  );
}