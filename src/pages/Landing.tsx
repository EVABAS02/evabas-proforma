import { Link } from 'react-router-dom';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Logo } from '@/components/Logo';
import { Users, Package, FileText, Zap, MessageCircle, Clock, Check, Star, Mail, Menu, X } from 'lucide-react';

const features = [
  { icon: Users, title: 'Gestion des clients', desc: 'Ajoutez et organisez vos clients avec toutes leurs informations en un seul endroit.' },
  { icon: Package, title: 'Catalogue produits', desc: 'Créez votre catalogue avec prix unitaires prédéfinis en FCFA.' },
  { icon: FileText, title: 'Génération PDF', desc: 'Générez des factures proforma professionnelles en PDF en un clic.' },
  { icon: Zap, title: 'Ultra rapide', desc: "Interface fluide pour créer vos proformas en moins d'une minute." },
  { icon: MessageCircle, title: 'Partage WhatsApp', desc: 'Envoyez vos factures directement via WhatsApp en un tap.' },
  { icon: Clock, title: 'Historique complet', desc: 'Retrouvez toutes vos proformas avec statuts et suivi intégré.' },
];

const testimonials = [
  { quote: "Avant je perdais 20 minutes par facture avec Excel. Maintenant c'est moins de 2 minutes.", name: 'Adjoua K.', role: 'Gérante, Abidjan', initials: 'AK' },
  { quote: "Mes clients reçoivent des factures professionnelles directement sur WhatsApp. C'est parfait pour mon commerce.", name: 'Moussa D.', role: 'Importateur, Cotonou', initials: 'MD' },
  { quote: "Le catalogue produits me fait gagner un temps fou. Je recommande à tous les commerçants.", name: 'Fatoumata B.', role: 'Responsable achats, Dakar', initials: 'FB' },
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
    <div className="min-h-screen bg-background">
      {/* NAVBAR */}
      <header className="sticky top-0 z-50 bg-background/85 backdrop-blur-md border-b border-border">
        <div className="container flex items-center justify-between h-16 px-4 sm:px-6">
          <Logo />
          <nav className="hidden md:flex items-center gap-6 lg:gap-8 absolute left-1/2 -translate-x-1/2">
            <a href="#accueil" className="text-[13px] lg:text-sm font-medium text-foreground/80 hover:text-primary transition-colors">Accueil</a>
            <a href="#fonctionnalites" className="text-[13px] lg:text-sm font-medium text-foreground/80 hover:text-primary transition-colors">Fonctionnalités</a>
            <a href="#avantages" className="text-[13px] lg:text-sm font-medium text-foreground/80 hover:text-primary transition-colors">Avantages</a>
          </nav>
          <div className="flex items-center gap-2">
            <Link to="/auth">
              <Button className="rounded-full bg-primary hover:bg-primary/90 px-3 sm:px-5 h-9 text-xs sm:text-sm">Se connecter</Button>
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
      <section id="accueil" className="relative bg-mesh overflow-hidden">
        <div className="container py-16 md:py-32 px-6 relative">
          <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}
            className="max-w-4xl mx-auto text-center"
          >
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold bg-primary/10 text-primary mb-6">
              ⚡ Factures pro forma professionnelles
            </span>
            <h1 className="font-display text-[32px] sm:text-5xl md:text-7xl font-bold leading-tight mb-6">
              Créez vos factures <span className="text-gradient">pro forma</span> en 60 secondes
            </h1>
            <p className="text-[15px] sm:text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-8 sm:mb-10">
              L'outil le plus simple pour gérer vos clients, vos produits et générer des factures proforma professionnelles — partagées en un clic sur WhatsApp.
            </p>
            <Link to="/auth" className="block sm:inline-block">
              <Button size="lg" className="w-full sm:w-auto rounded-full bg-primary hover:bg-primary/90 text-base px-10 h-14 shadow-glow">
                S'inscrire
              </Button>
            </Link>
            <div className="flex flex-col sm:flex-row sm:flex-wrap items-center justify-center gap-3 sm:gap-6 mt-8 text-sm text-muted-foreground">
              <span className="flex items-center gap-2"><Check className="h-4 w-4 text-primary" /> Gratuit</span>
              <span className="flex items-center gap-2"><Check className="h-4 w-4 text-primary" /> Sans carte bancaire</span>
              <span className="flex items-center gap-2"><Check className="h-4 w-4 text-primary" /> PDF & WhatsApp inclus</span>
            </div>
          </motion.div>
        </div>
      </section>

      {/* FEATURES */}
      <section id="fonctionnalites" className="py-16 sm:py-24 bg-background">
        <div className="container px-6">
          <div className="text-center max-w-2xl mx-auto mb-12 sm:mb-16">
            <p className="text-xs font-bold tracking-[0.2em] text-primary mb-3">FONCTIONNALITÉS</p>
            <h2 className="font-display text-[28px] sm:text-4xl md:text-5xl font-bold mb-4">Tout ce dont vous avez besoin</h2>
            <p className="text-muted-foreground text-base sm:text-lg">Une solution complète pour gérer vos factures proforma de A à Z.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f, i) => (
              <motion.div key={f.title} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.05 }}>
                <Card className="p-7 h-full shadow-card hover:shadow-soft hover:-translate-y-1 transition-all border-border/60">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-5">
                    <f.icon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="font-display text-xl font-bold mb-2">{f.title}</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">{f.desc}</p>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section className="py-16 sm:py-24 bg-secondary/40">
        <div className="container px-6">
          <h2 className="font-display text-[28px] sm:text-4xl md:text-5xl font-bold text-center mb-12 sm:mb-16">Ils nous font confiance</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {testimonials.map((t, i) => (
              <motion.div key={t.name} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}>
                <Card className="p-7 h-full shadow-card border-border/60">
                  <div className="flex gap-0.5 mb-4">
                    {[...Array(5)].map((_, j) => <Star key={j} className="h-4 w-4 fill-accent text-accent" />)}
                  </div>
                  <p className="text-foreground/90 mb-6 leading-relaxed">"{t.quote}"</p>
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-full bg-gradient-to-br from-primary to-primary-glow flex items-center justify-center text-white font-bold text-sm">{t.initials}</div>
                    <div>
                      <p className="font-semibold text-sm">{t.name}</p>
                      <p className="text-xs text-muted-foreground">{t.role}</p>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ADVANTAGES */}
      <section id="avantages" className="py-16 sm:py-24 bg-background">
        <div className="container px-6 grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          <div>
            <p className="text-xs font-bold tracking-[0.2em] text-accent mb-3">AVANTAGES</p>
            <h2 className="font-display text-[28px] sm:text-4xl md:text-5xl font-bold mb-8 sm:mb-10">Pourquoi choisir Evabas Proforma ?</h2>
            <div className="space-y-7">
              {advantages.map((a) => (
                <div key={a.title} className="flex gap-4">
                  <div className="flex-shrink-0 w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center mt-0.5">
                    <Check className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-display text-lg font-bold mb-1">{a.title}</h3>
                    <p className="text-muted-foreground">{a.desc}</p>
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
            <Logo dark />
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
