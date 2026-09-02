"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { DashboardHeader } from "@/components/DashboardHeader";
import { toYoutubeEmbedUrl } from "@/lib/youtube";
import { LineIcon } from "@/components/LineIcon";

export function DesktopTutorialAdminClient({ initialTutorialUrl }: { initialTutorialUrl: string }) {
  const supabase = createClient();

  const [tutorialUrl, setTutorialUrl] = useState(initialTutorialUrl);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const previewEmbed = tutorialUrl ? toYoutubeEmbedUrl(tutorialUrl) : null;

  async function saveSettings() {
    setSaving(true);
    await supabase
      .from("desktop_app_settings")
      .update({ tutorial_video_url: tutorialUrl || null, updated_at: new Date().toISOString() })
      .eq("id", "main");
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  return (
    <div className="min-h-screen bg-ink-900 p-6 sm:p-8">
      <div className="max-w-2xl mx-auto">
        <DashboardHeader backHref="/dashboard/desktop" backLabel="Voltar ao Editor de Músicas — Desktop" />
        <h1 className="text-neutral-100 text-xl font-medium mb-1">Tutorial do Desktop</h1>
        <p className="text-neutral-500 text-sm mb-6">
          Cole aqui o link de um vídeo do YouTube explicando como baixar e usar o Editor de Músicas Desktop. Ele
          aparece pra todos os alunos logo abaixo da descrição, na página do programa.
        </p>

        <div className="dgs-card flex flex-col gap-3">
          <div className="text-neutral-100 font-medium text-sm">Vídeo tutorial (YouTube)</div>
          <input
            className="dgs-input"
            placeholder="https://www.youtube.com/watch?v=..."
            value={tutorialUrl}
            onChange={(e) => setTutorialUrl(e.target.value)}
          />
          {tutorialUrl && !previewEmbed && (
            <p className="text-red-400 text-xs">Não consegui reconhecer esse link como um vídeo do YouTube.</p>
          )}
          {previewEmbed && (
            <div className="aspect-video rounded-lg overflow-hidden border border-white/10">
              <iframe src={previewEmbed} className="w-full h-full" allowFullScreen />
            </div>
          )}

          <button
            onClick={saveSettings}
            disabled={saving}
            className="dgs-btn-primary w-auto px-5 self-start flex items-center justify-center gap-1.5"
          >
            {saving ? (
              "Salvando…"
            ) : saved ? (
              <>
                <LineIcon name="check" size={14} /> Salvo
              </>
            ) : (
              "Salvar"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
