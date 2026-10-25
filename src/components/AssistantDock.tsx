import { useEffect } from 'react';
import { Loader2, Sparkles } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import AssistantPanel from '@/components/AssistantPanel';
import { assistantActions, useAssistant } from '@/lib/assistantStore';

// Bouton flottant + panneau latéral de l'assistant, présents sur toutes les pages connectées.
export default function AssistantDock() {
  const { user } = useAuth();
  const a = useAssistant();
  const utilisateurId = user?.id ?? null;

  useEffect(() => {
    assistantActions.lier(utilisateurId);
  }, [utilisateurId]);

  // Tant que l'état n'appartient pas à l'utilisateur connecté, on n'affiche rien.
  if (!utilisateurId || a.utilisateurId !== utilisateurId) return null;

  return (
    <>
      <Button
        type="button"
        size="icon"
        onClick={() => assistantActions.ouvrir()}
        aria-label="Ouvrir l'assistant"
        className="no-print fixed bottom-[76px] right-4 z-40 h-14 w-14 rounded-full bg-accent text-accent-foreground shadow-soft hover:bg-accent/90 md:bottom-6 md:right-6"
      >
        {a.chargement ? (
          <Loader2 className="h-6 w-6 animate-spin" aria-hidden="true" />
        ) : (
          <Sparkles className="h-6 w-6" aria-hidden="true" />
        )}
        {a.nonLu && (
          <span
            className="absolute right-1 top-1 h-3 w-3 rounded-full bg-red-500 ring-2 ring-white"
            aria-hidden="true"
          />
        )}
      </Button>

      <Sheet
        open={a.ouvert}
        onOpenChange={(ouvert) => (ouvert ? assistantActions.ouvrir() : assistantActions.fermer())}
      >
        <SheetContent
          side="right"
          aria-describedby={undefined}
          className="flex w-full flex-col gap-0 p-0 sm:max-w-lg"
        >
          <SheetHeader className="border-b px-4 py-3 pr-12 text-left">
            <SheetTitle className="font-display flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" aria-hidden="true" />
              Assistant
            </SheetTitle>
          </SheetHeader>
          <AssistantPanel />
        </SheetContent>
      </Sheet>
    </>
  );
}