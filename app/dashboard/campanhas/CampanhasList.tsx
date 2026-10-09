"use client";

import { useState } from "react";
import Link from "next/link";
import { LineIcon } from "@/components/LineIcon";
import { campaignStatus, CAMPAIGN_STATUS_LABEL, formatDateBR, type CampaignStatus } from "@/lib/campaigns";

type Campaign = {
  id: string;
  title: string;
  cover_path: string | null;
  coverUrl: string | null;
  start_date: string;
  end_date: string;
  prize_label: string | null;
  link_url: string;
};

const STATUS_PILL_CLASS: Record<CampaignStatus, string> = {
  andamento: "bg-brand/15 text-[#c3e67a] border border-brand/30",
  aguardando: "bg-violet-500/15 text-violet-300 border border-violet-500/30",
  encerrada: "bg-white/5 text-neutral-500 border border-white/10",
};

export function CampanhasList({ campaigns }: { campaigns: Campaign[] }) {
  const [tab, setTab] = useState<"ativas" | "encerradas">("ativas");

  const withStatus = campaigns.map((c) => ({ ...c, status: campaignStatus(c.start_date, c.end_date) }));
  const active = withStatus
    .filter((c) => c.status !== "encerrada")
    .sort((a, b) => (a.start_date < b.start_date ? -1 : 1));
  const closed = withStatus
    .filter((c) => c.status === "encerrada")
    .sort((a, b) => (a.end_date > b.end_date ? -1 : 1));

  return (
    <div>
      <div className="flex gap-6 border-b border-white/10 mb-6">
        <button
          onClick={() => setTab("ativas")}
          className={`text-sm pb-3 -mb-px border-b-2 transition-colors ${
            tab === "ativas" ? "text-neutral-100 border-brand font-medium" : "text-neutral-500 border-transparent"
          }`}
        >
          Ativas <span className="text-neutral-600 text-xs">({active.length})</span>
        </button>
        <button
          onClick={() => setTab("encerradas")}
          className={`text-sm pb-3 -mb-px border-b-2 transition-colors ${
            tab === "encerradas" ? "text-neutral-100 border-brand font-medium" : "text-neutral-500 border-transparent"
          }`}
        >
          Encerradas <span className="text-neutral-600 text-xs">({closed.length})</span>
        </button>
      </div>

      {tab === "ativas" &&
        (active.length === 0 ? (
          <div className="dgs-card text-neutral-500 text-sm text-center py-10">Nenhuma campanha ativa no momento.</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {active.map((c) => (
              <div key={c.id} className="dgs-card p-0 overflow-hidden flex flex-col">
                <div className="h-36 relative bg-gradient-to-br from-brand/10 via-white/[0.02] to-transparent">
                  {c.coverUrl ? (
                    <img src={c.coverUrl} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-neutral-700">
                      <LineIcon name="sparkles" size={28} />
                    </div>
                  )}
                </div>
                <div className="p-4 flex flex-col gap-3">
                  <div className="text-neutral-100 text-sm font-semibold leading-snug">{c.title}</div>
                  <span
                    className={`self-start text-[10.5px] font-semibold px-2.5 py-1 rounded-full ${STATUS_PILL_CLASS[c.status]}`}
                  >
                    {CAMPAIGN_STATUS_LABEL[c.status]}
                  </span>
                  <div className="flex flex-wrap gap-3 text-xs text-neutral-500">
                    <span>
                      📅 {formatDateBR(c.start_date)} — {formatDateBR(c.end_date)}
                    </span>
                    {c.prize_label && <span className="text-[#c3e67a] font-medium">🏆 {c.prize_label}</span>}
                  </div>
                  <Link href={`/dashboard/campanhas/${c.id}`} className="dgs-btn-primary no-underline text-center">
                    Mais informações →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        ))}

      {tab === "encerradas" &&
        (closed.length === 0 ? (
          <div className="dgs-card text-neutral-500 text-sm text-center py-10">Nenhuma campanha encerrada ainda.</div>
        ) : (
          <div className="dgs-card p-0">
            {closed.map((c, i) => (
              <div
                key={c.id}
                className={`flex items-center gap-3 px-4 py-3 ${i !== closed.length - 1 ? "border-b border-white/10" : ""}`}
              >
                <div className="w-10 h-10 rounded-lg overflow-hidden bg-white/5 border border-white/10 shrink-0">
                  {c.coverUrl && <img src={c.coverUrl} alt="" className="w-full h-full object-cover" />}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-neutral-300 text-sm truncate">{c.title}</div>
                  <div className="text-neutral-600 text-[11px]">
                    {formatDateBR(c.start_date)} — {formatDateBR(c.end_date)}
                    {c.prize_label ? ` · ${c.prize_label}` : ""}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ))}
    </div>
  );
}
