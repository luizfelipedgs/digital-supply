"use client";

import { useState } from "react";

interface TutorialViewerProps {
  youtubeEmbedUrl: string | null;
}

export function TutorialViewer({ youtubeEmbedUrl }: TutorialViewerProps) {
  const [activeTab, setActiveTab] = useState<"video" | "animacao">(
    youtubeEmbedUrl ? "video" : "animacao"
  );

  return (
    <div className="flex flex-col gap-4">
      {youtubeEmbedUrl && (
        <div className="flex items-center gap-2 bg-white/[0.03] p-1 rounded-xl border border-white/10 w-fit">
          <button
            type="button"
            onClick={() => setActiveTab("video")}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
              activeTab === "video"
                ? "bg-brand text-[#080806] font-semibold shadow"
                : "text-neutral-400 hover:text-white"
            }`}
          >
            Vídeo Tutorial
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("animacao")}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
              activeTab === "animacao"
                ? "bg-brand text-[#080806] font-semibold shadow"
                : "text-neutral-400 hover:text-white"
            }`}
          >
            Passo a Passo Visual (Vídeo)
          </button>
        </div>
      )}

      <div className="aspect-video w-full rounded-xl overflow-hidden border border-white/15 bg-black shadow-2xl relative">
        {activeTab === "video" && youtubeEmbedUrl ? (
          <iframe
            src={youtubeEmbedUrl}
            className="w-full h-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            title="Tutorial da Central DGS"
          />
        ) : (
          <video
            src="/tutorial/passo-a-passo.mp4"
            poster="/tutorial/passo-1-extrair.png"
            controls
            autoPlay
            loop
            muted
            playsInline
            className="w-full h-full object-contain bg-black"
          />
        )}
      </div>
    </div>
  );
}
