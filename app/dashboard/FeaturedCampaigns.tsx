import Link from "next/link";
import { CAMPAIGN_STATUS_LABEL, campaignStatus, formatDateBR, type CampaignStatus } from "@/lib/campaigns";

type FeaturedCampaign = {
  id: string;
  title: string;
  coverUrl: string | null;
  start_date: string;
  end_date: string;
  prize_label: string | null;
  link_url: string;
};

const STATUS_PILL_CLASS: Record<CampaignStatus, string> = {
  andamento: "bg-brand/15 text-[#c3e67a]",
  aguardando: "bg-violet-500/15 text-violet-300",
  encerrada: "bg-white/5 text-neutral-500",
};

export function FeaturedCampaigns({ campaigns }: { campaigns: FeaturedCampaign[] }) {
  if (campaigns.length === 0) return null;

  return (
    <div className="mb-6">
      <div className="flex items-center justify-between gap-3 mb-3">
        <div className="text-neutral-100 text-sm font-semibold flex items-center gap-2">
          <span className="text-brand">✨</span> Campanhas em destaque
        </div>
        <Link href="/dashboard/campanhas" className="text-brand text-xs no-underline shrink-0">
          Ver todas →
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        {campaigns.map((c) => {
          const status = campaignStatus(c.start_date, c.end_date);
          return (
            <div key={c.id} className="dgs-card p-0 overflow-hidden flex flex-col">
              <div className="h-36 bg-gradient-to-br from-brand/10 via-white/[0.02] to-transparent">
                {c.coverUrl && <img src={c.coverUrl} alt="" className="w-full h-full object-cover" />}
              </div>
              <div className="p-3 flex flex-col gap-1.5 flex-1">
                <div className="text-neutral-100 text-xs font-semibold leading-snug">{c.title}</div>
                <span
                  className={`self-start text-[9.5px] font-semibold px-2 py-0.5 rounded-full ${STATUS_PILL_CLASS[status]}`}
                >
                  {CAMPAIGN_STATUS_LABEL[status]}
                </span>
                <div className="text-neutral-500 text-[10.5px] leading-snug">
                  📅 {formatDateBR(c.start_date)} — {formatDateBR(c.end_date)}
                  {c.prize_label && <span className="text-[#c3e67a]"> · 🏆 {c.prize_label}</span>}
                </div>
                <Link href={`/dashboard/campanhas/${c.id}`} className="dgs-btn-primary no-underline text-center mt-auto">
                  Mais informações →
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
