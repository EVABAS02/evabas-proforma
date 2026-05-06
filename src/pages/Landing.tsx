import { Link } from 'react-router-dom';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Logo } from '@/components/Logo';
import { Users, Package, FileText, Zap, MessageCircle, Clock, Check, Star, Mail, Menu, X, ArrowRight } from 'lucide-react';

const features = [
  { icon: Users, title: 'Gestion des clients', desc: 'Ajoutez et organisez vos clients avec toutes leurs informations en un seul endroit.' },
  { icon: Package, title: 'Catalogue produits', desc: 'Créez votre catalogue avec prix unitaires prédéfinis en FCFA.' },
  { icon: FileText, title: 'Génération PDF', desc: 'Générez des factures proforma professionnelles en PDF en un clic.' },
  { icon: Zap, title: 'Ultra rapide', desc: "Interface fluide pour créer vos proformas en moins d'une minute." },
  { icon: MessageCircle, title: 'Partage WhatsApp', desc: 'Envoyez vos factures directement via WhatsApp en un tap.' },
  { icon: Clock, title: 'Historique complet', desc: 'Retrouvez toutes vos proformas avec statuts et suivi intégré.' },
];

const testimonials = [
  { quote: "Avant je perdais 20 minutes par facture avec Excel. Maintenant c'est moins de 2 minutes.", name: 'Adjoua K.', role: 'Gérante, Abidjan', avatar: 'https://i.pravatar.cc/80?img=47' },
  { quote: "Mes clients reçoivent des factures professionnelles directement sur WhatsApp. C'est parfait pour mon commerce.", name: 'Moussa D.', role: 'Importateur, Cotonou', avatar: 'https://i.pravatar.cc/80?img=12' },
  { quote: "Le catalogue produits me fait gagner un temps fou. Je recommande à tous les commerçants.", name: 'Fatoumata B.', role: 'Responsable achats, Dakar', avatar: 'https://i.pravatar.cc/80?img=56' },
];

const advantages = [
  { title: 'Gain de temps', desc: "Créez une proforma en moins d'une minute au lieu de 15 minutes avec Excel." },
  { title: 'Zéro erreur', desc: 'Les calculs sont automatiques. Fini les erreurs de formules.' },
  { title: 'Image professionnelle', desc: "Des documents élégants qui renforcent la crédibilité de votre entreprise." },
  { title: 'Accessible partout', desc: "Utilisez l'application depuis n'importe quel appareil, à tout moment." },
];

export default function Landing() {
  const [menuOpen, setMenuOpen] = useState(false);
  return (
    <div className="min-h-screen bg-white">
      {/* NAVBAR */}
      <header className="sticky top-0 z-50 bg-white border-b border-[#E5E7EB]">
        <div className="container flex items-center justify-between h-16 px-4 sm:px-6">
          <Logo />
          <nav className="hidden md:flex items-center absolute left-1/2 -translate-x-1/2 bg-[#F3F4F6] rounded-full p-[6px] gap-1">
            <a href="#accueil" className="text-[13px] font-medium text-[#0F172A] bg-white rounded-full px-4 py-1.5 shadow-[0_1px_3px_rgba(0,0,0,0.1)]">Accueil</a>
            <a href="#fonctionnalites" className="text-[13px] font-medium text-[#374151] hover:text-[#6366F1] transition-colors px-4 py-1.5">Fonctionnalités</a>
            <a href="#avantages" className="text-[13px] font-medium text-[#374151] hover:text-[#6366F1] transition-colors px-4 py-1.5">Avantages</a>
          </nav>
          <div className="flex items-center gap-2">
            <Link to="/auth"
              className="inline-flex items-center justify-center bg-[#6366F1] hover:bg-[#4F46E5] text-white text-sm font-semibold rounded-[10px] px-5 py-2.5 transition-all hover:scale-[1.02]">
              Se connecter
            </Link>
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="md:hidden inline-flex items-center justify-center w-10 h-10 rounded-md hover:bg-muted"
              aria-label="Menu"
            >
              {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>
        {menuOpen && (
          <div className="md:hidden border-t border-border bg-background">
            <nav className="flex flex-col">
              <a href="#accueil" onClick={() => setMenuOpen(false)} className="px-6 py-4 text-sm font-medium border-b border-border">Accueil</a>
              <a href="#fonctionnalites" onClick={() => setMenuOpen(false)} className="px-6 py-4 text-sm font-medium border-b border-border">Fonctionnalités</a>
              <a href="#avantages" onClick={() => setMenuOpen(false)} className="px-6 py-4 text-sm font-medium">Avantages</a>
            </nav>
          </div>
        )}
      </header>

      {/* HERO */}
      <section id="accueil" className="relative overflow-hidden bg-white" style={{ backgroundImage: 'radial-gradient(ellipse at center, #EEF2FF 0%, #FFFFFF 70%)' }}>
        <div className="container py-12 sm:py-20 md:py-28 px-6 relative">
          <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}
            className="max-w-4xl mx-auto text-center"
          >
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-[13px] font-medium mb-6 border border-[#C7D2FE] bg-[#EEF2FF] text-[#4338CA]">
              <Zap className="h-3.5 w-3.5" /> Factures pro forma professionnelles
            </span>
            <h1 className="font-display text-[32px] sm:text-5xl md:text-7xl font-bold leading-tight mb-6 text-[#0F172A]">
              Créez vos factures <span className="text-gradient">pro forma</span> en 60 secondes
            </h1>
            <p className="text-[15px] sm:text-lg md:text-xl text-[#6B7280] max-w-2xl mx-auto mb-8 sm:mb-10">
              L'outil le plus simple pour gérer vos clients, vos produits et générer des factures proforma professionnelles — partagées en un clic sur WhatsApp.
            </p>
            <Link to="/auth"
              className="group inline-flex items-center gap-2 text-white font-bold text-base rounded-[14px] px-10 py-4 transition-all hover:-translate-y-0.5"
              style={{
                background: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)',
                boxShadow: '0 8px 24px rgba(99,102,241,0.35)',
                letterSpacing: '0.3px',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.boxShadow = '0 12px 32px rgba(99,102,241,0.45)')}
              onMouseLeave={(e) => (e.currentTarget.style.boxShadow = '0 8px 24px rgba(99,102,241,0.35)')}
            >
              S'inscrire <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
            <div className="flex items-center justify-center gap-6 sm:gap-10 mt-10 divide-x divide-[#E5E7EB]">
              {[
                { n: '500+', l: 'Entreprises actives' },
                { n: '10 000+', l: 'Factures créées' },
                { n: '60 sec', l: 'Temps moyen' },
              ].map((s, i) => (
                <div key={s.n} className={`text-center ${i > 0 ? 'pl-6 sm:pl-10' : ''}`}>
                  <div className="font-display font-bold text-[20px] text-[#0F172A]">{s.n}</div>
                  <div className="text-[13px] text-[#6B7280] mt-1">{s.l}</div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* FEATURES */}
      <section id="fonctionnalites" className="py-12 sm:py-20 bg-[#F9FAFB]">
        <div className="container px-6">
          <div className="text-center max-w-2xl mx-auto mb-12 sm:mb-16">
            <p className="text-xs font-bold tracking-[0.2em] text-[#6366F1] mb-3">FONCTIONNALITÉS</p>
            <h2 className="font-display font-bold mb-4 text-[#0F172A]" style={{ fontSize: 'clamp(28px, 4vw, 40px)' }}>Tout ce dont vous avez besoin</h2>
            <p className="text-[#6B7280] text-base sm:text-lg">Une solution complète pour gérer vos factures proforma de A à Z.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f, i) => (
              <motion.div key={f.title} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.05 }}>
                <div className="bg-white border border-[#E5E7EB] rounded-2xl p-6 h-full transition-all duration-200 hover:border-[#C7D2FE] hover:-translate-y-0.5 hover:shadow-[0_4px_20px_rgba(99,102,241,0.1)]">
                  <div className="w-12 h-12 rounded-xl bg-[#EEF2FF] flex items-center justify-center mb-5">
                    <f.icon className="h-6 w-6 text-[#6366F1]" />
                  </div>
                  <h3 className="font-display text-xl font-bold mb-2 text-[#0F172A]">{f.title}</h3>
                  <p className="text-[#6B7280] text-sm leading-relaxed">{f.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section className="py-12 sm:py-20 bg-white">
        <div className="container px-6">
          <h2 className="font-display font-bold text-center mb-12 sm:mb-16 text-[#0F172A]" style={{ fontSize: 'clamp(28px, 4vw, 40px)' }}>Ils nous font confiance</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {testimonials.map((t, i) => (
              <motion.div key={t.name} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}>
                <div className="bg-white border border-[#E5E7EB] rounded-2xl p-6 h-full">
                  <div className="flex gap-0.5 mb-3">
                    {[...Array(5)].map((_, j) => <Star key={j} className="h-3.5 w-3.5 fill-[#F59E0B] text-[#F59E0B]" />)}
                  </div>
                  <div className="relative">
                    <span aria-hidden className="absolute -top-3 -left-1 font-display font-bold" style={{ fontSize: 60, color: '#C7D2FE', lineHeight: 0.5 }}>“</span>
                    <p className="relative text-[15px] text-[#374151] italic leading-[1.6] mb-6 pl-4">{t.quote}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <img src={t.avatar} alt={t.name} className="w-12 h-12 rounded-full object-cover" loading="lazy" />
                    <div>
                      <p className="font-semibold text-sm text-[#0F172A]">{t.name}</p>
                      <p className="text-[13px] text-[#6B7280]">{t.role}</p>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ADVANTAGES */}
      <section id="avantages" className="py-12 sm:py-20 bg-[#F9FAFB]">
        <div className="container px-6 grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          <div>
            <p className="text-xs font-bold tracking-[0.2em] text-accent mb-3">AVANTAGES</p>
            <h2 className="font-display font-bold mb-8 sm:mb-10 text-[#0F172A]" style={{ fontSize: 'clamp(28px, 4vw, 40px)' }}>Pourquoi choisir Evabas ?</h2>
            <div className="space-y-7">
              {advantages.map((a) => (
                <div key={a.title} className="flex gap-4">
                  <div className="flex-shrink-0 w-7 h-7 rounded-full bg-[#EEF2FF] flex items-center justify-center mt-0.5">
                    <Check className="h-4 w-4 text-[#6366F1]" />
                  </div>
                  <div>
                    <h3 className="font-display text-lg font-bold mb-1 text-[#0F172A]">{a.title}</h3>
                    <p className="text-[#6B7280]">{a.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          {/* Invoice preview illustration */}
          <motion.div initial={{ opacity: 0, scale: 0.95 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ duration: 0.6 }}>
            <div className="relative">
              <div className="absolute -inset-6 bg-gradient-to-br from-primary/20 to-accent/10 rounded-3xl blur-2xl" />
              <Card className="relative p-6 sm:p-8 shadow-soft border-border/60">
                <div className="flex justify-between items-start mb-6 pb-5 border-b">
                  <div>
                    <p className="font-display font-bold text-lg">Mon Entreprise</p>
                    <p className="text-xs text-muted-foreground">Cotonou, Bénin</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-bold tracking-wider text-primary">FACTURE PROFORMA</p>
                    <p className="font-mono text-sm font-semibold mt-1">FP-2026-0042</p>
                  </div>
                </div>
                <div className="space-y-2.5 mb-5">
                  {[
                    { d: 'Vin rouge Bordeaux', q: 12, p: 8500 },
                    { d: 'Huile végétale 5L', q: 8, p: 6200 },
                    { d: 'Savon de Marseille', q: 24, p: 1200 },
                  ].map((it) => (
                    <div key={it.d} className="flex justify-between text-sm py-2 border-b border-border/40 last:border-0">
                      <span className="font-medium">{it.d}</span>
                      <span className="text-muted-foreground tabular-nums">{it.q} × {it.p.toLocaleString('fr-FR')}</span>
                    </div>
                  ))}
                </div>
                <div className="flex justify-between items-center pt-4 border-t-2 border-foreground/10">
                  <span className="font-display font-bold">Total TTC</span>
                  <span className="font-display font-bold text-xl sm:text-2xl text-primary tabular-nums">180 200 FCFA</span>
                </div>
              </Card>
            </div>
          </motion.div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-[hsl(222_47%_11%)] text-white py-12 sm:py-16">
        <div className="container px-6 grid grid-cols-1 md:grid-cols-3 gap-10 text-center md:text-left">
          <div className="flex flex-col items-center md:items-start">
            <div className="flex items-baseline" style={{ letterSpacing: '1px', fontSize: 20 }}>
              <span style={{ fontWeight: 400, color: '#94A3B8' }}>Eva</span>
              <span style={{ fontWeight: 700, color: '#FFFFFF' }}>BAS</span>
            </div>
            <p className="text-white/60 text-sm mt-4 max-w-xs">La facturation proforma simple pour les entreprises africaines.</p>
          </div>
          <div>
            <h4 className="font-display font-bold mb-4">Navigation</h4>
            <ul className="space-y-2 text-sm text-white/70">
              <li><a href="#accueil" className="hover:text-white">Accueil</a></li>
              <li><a href="#fonctionnalites" className="hover:text-white">Fonctionnalités</a></li>
              <li><a href="#avantages" className="hover:text-white">Avantages</a></li>
              <li><a href="#" className="hover:text-white">Politique de confidentialité</a></li>
            </ul>
          </div>
          <div>
            <h4 className="font-display font-bold mb-4">Contact</h4>
            <ul className="space-y-3 text-sm text-white/70 inline-flex flex-col items-center md:items-start">
              <li className="flex items-center gap-2"><MessageCircle className="h-4 w-4" /> 0198114754</li>
              <li className="flex items-center gap-2"><Mail className="h-4 w-4" /> lascarobenito@gmail.com</li>
            </ul>
          </div>
        </div>
        <div className="container px-6 mt-12 pt-8 border-t border-white/10 text-center text-xs text-white/50">
          © 2026 EVA BAS. Tous droits réservés.
        </div>
      </footer>
    </div>
  );
}
