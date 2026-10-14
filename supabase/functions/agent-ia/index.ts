import "@supabase/functions-js/edge-runtime.d.ts";
import { withSupabase } from "@supabase/server";

// Modeles essayes dans l'ordre : si le premier est indisponible, on passe au suivant.
const MODELES = ["gemini-3.1-flash-lite", "gemini-3.5-flash"];

async function appelerGemini(prompt: string, cle: string) {
  for (const modele of MODELES) {
    const reponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${modele}:generateContent`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-goog-api-key": cle },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
      },
    );
    if (reponse.ok) {
      const data = await reponse.json();
      return {
        modele,
        texte: data.candidates?.[0]?.content?.parts?.[0]?.text ?? "",
        usage: data.usageMetadata ?? null,
      };
    }
    console.error(`Gemini ${modele} -> HTTP ${reponse.status}`);
  }
  return null;
}

export default {
  // auth: "user" = seul un utilisateur connecte peut appeler cette fonction.
  fetch: withSupabase({ auth: "user" }, async (req) => {
    const cle = Deno.env.get("GEMINI_API_KEY");
    if (!cle) {
      return Response.json({ error: "Configuration manquante" }, { status: 500 });
    }

    let message = "";
    try {
      ({ message } = await req.json());
    } catch {
      // corps invalide : traite plus bas
    }
    if (typeof message !== "string" || message.trim() === "" || message.length > 2000) {
      return Response.json({ error: "Message invalide" }, { status: 400 });
    }

    const resultat = await appelerGemini(message, cle);
    if (!resultat) {
      return Response.json({ error: "Service IA indisponible, reessayez" }, { status: 503 });
    }
    return Response.json(resultat);
  }),
};