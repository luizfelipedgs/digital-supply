import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { DashboardHeader } from "@/components/DashboardHeader";
import { CAMPAIGN_STATUS_LABEL, campaignStatus, formatDateBR, type CampaignStatus } from "@/lib/campaigns";

const STATUS_PILL_CLASS: Record<CampaignStatus, string> = {
  andamento: "bg-brand/15 text-[#c3e67a] border border-brand/30",
  aguardando: "bg-violet-500/15 text-violet-300 border border-violet-500/30",
  encerrada: "bg-white/5 text-neutral-500 border border-white/10",
};

export default async function CampanhaDetalhesPage({ params }: { params: { id: string } }) {
  const supabase = createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) redirect("/login");

  const { data: profile } = await supabase.from("profiles").select("status").eq("id", userData.user.id).single();
  if (!profile || profile.status === "pending") redirect("/aguardando");
  if (profile.status !== "active") redirect("/login");

  const { data: campaign } = await supabase
    .from("campaigns")
    .select("id, title, description, cover_path, start_date, end_date, prize_label, link_url")
    .eq("id", params.id)
    .maybeSingle();

  if (!campaign) notFound();

  const coverUrl = campaign.cover_path
    ? supabase.storage.from("content-covers").getPublicUrl(campaign.cover_path).data.publicUrl
    : null;
  const status = campaignStatus(campaign.start_date, campaign.end_date);

  return (
    <div className="min-h-screen bg-ink-900 p-6 sm:p-8">
      <div className="max-w-2xl mx-auto">
        <DashboardHeader backHref="/dashboard/campanhas" backLabel="Voltar pra Campanhas exclusivas" />

        <div className="mt-6">
          <div className="h-48 sm:h-56 rounded-2xl overflow-hidden border border-white/10 mb-5 bg-gradient-to-br from-brand/10 via-white/[0.02] to-transparent">
            {coverUrl && <img src={coverUrl} alt="" className="w-full h-full object-cover" />}
          </div>

          <h1 className="text-neutral-100 text-xl font-semibold leading-snug mb-3">{campaign.title}</h1>

          <span
            className={`inline-block text-xs font-semibold px-3 py-1 rounded-full mb-5 ${STATUS_PILL_CLASS[status]}`}
          >
            {CAMPAIGN_STATUS_LABEL[status]}
          </span>

          <div className="flex flex-wrap gap-8 mb-6">
            <div>
              <div className="text-neutral-600 text-[10.5px] uppercase tracking-wide mb-1">Período</div>
              <div className="text-neutral-100 text-sm font-medium">
                {formatDateBR(campaign.start_date)} — {formatDateBR(campaign.end_date)}
              </div>
            </div>
            {campaign.prize_label && (
              <div>
                <div className="text-neutral-600 text-[10.5px] uppercase tracking-wide mb-1">Premiação</div>
                <div className="text-[#c3e67a] text-sm font-medium">{campaign.prize_label}</div>
              </div>
            )}
          </div>

          {campaign.description && (
            <div
              className="text-neutral-300 text-sm leading-relaxed mb-7 whitespace-pre-wrap [&_blockquote]:border-l-2 [&_blockquote]:border-brand/50 [&_blockquote]:pl-3 [&_blockquote]:text-neutral-400 [&_blockquote]:italic [&_a]:text-brand [&_a]:underline"
              dangerouslySetInnerHTML={{ __html: campaign.description }}
            />
          )}

          <a
            href={campaign.link_url}
            target="_blank"
            rel="noopener noreferrer"
            className="dgs-btn-primary no-underline text-center"
          >
            Participar da campanha →
          </a>
        </div>
      </div>
    </div>
  );
}
