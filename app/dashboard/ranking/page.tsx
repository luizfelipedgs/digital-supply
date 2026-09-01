import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { DashboardHeader } from "@/components/DashboardHeader";
import { LineIcon } from "@/components/LineIcon";

const MEDAL_COLOR = ["text-yellow-400", "text-neutral-300", "text-orange-600"];
const BORDER_COLOR = ["border-yellow-400/30", "border-neutral-400/30", "border-orange-700/30"];
const BG_COLOR = ["bg-yellow-400/5", "bg-neutral-400/5", "bg-orange-700/5"];

function formatCurrency(value: number) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function monthLabel(): string {
  const now = new Date(new Date().toLocaleString("en-US", { timeZone: "America/Sao_Paulo" }));
  const label = now.toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
  return label.charAt(0).toUpperCase() + label.slice(1);
}

export default async function RankingPage() {
  const supabase = createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("status")
    .eq("id", userData.user.id)
    .single();

  if (!profile || profile.status !== "active") redirect("/aguardando");

  type RankingEntry = { user_id: string; display_name: string; total: number; avatarUrl: string | null };

  const { data: rankingRaw } = await supabase.rpc("monthly_ranking", { top_n: 20 });
  const ranking: RankingEntry[] = (rankingRaw ?? []).map(
    (r: { user_id: string; display_name: string; avatar_path: string | null; total: number }) => ({
      user_id: r.user_id,
      display_name: r.display_name,
      total: Number(r.total),
      avatarUrl: r.avatar_path ? supabase.storage.from("avatars").getPublicUrl(r.avatar_path).data.publicUrl : null,
    })
  );

  return (
    <div className="min-h-screen bg-ink-900 p-6 sm:p-8">
      <div className="max-w-2xl mx-auto">
        <DashboardHeader backHref="/dashboard" />

        <div className="flex items-center gap-2 mb-1">
          <LineIcon name="trophy" size={20} className="text-brand" />
          <h1 className="text-neutral-100 text-xl font-medium">Ranking Geral</h1>
        </div>
        <p className="text-neutral-500 text-sm mb-6">
          Top {ranking.length > 0 ? Math.min(20, ranking.length) : 20} em faturamento acumulado — {monthLabel()}.
        </p>

        {ranking.length === 0 ? (
          <div className="dgs-card text-center py-8">
            <p className="text-neutral-500 text-sm">
              Nenhum lançamento neste mês ainda. Seja o primeiro a aparecer no ranking!
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {ranking.map((r, i) => {
              const isTop3 = i < 3;
              return (
                <div
                  key={r.user_id}
                  className={`flex items-center gap-3 rounded-lg border px-4 py-3 ${
                    isTop3 ? `${BORDER_COLOR[i]} ${BG_COLOR[i]}` : "border-white/10 bg-white/[0.02]"
                  }`}
                >
                  <div
                    className={`w-7 h-7 rounded-full border flex items-center justify-center text-xs font-bold shrink-0 ${
                      isTop3 ? `${BORDER_COLOR[i]} ${MEDAL_COLOR[i]}` : "border-white/10 text-neutral-500"
                    }`}
                  >
                    {i + 1}
                  </div>
                  {r.avatarUrl ? (
                    <img src={r.avatarUrl} alt="" className="w-9 h-9 rounded-full object-cover border border-white/10 shrink-0" />
                  ) : (
                    <div className="w-9 h-9 rounded-full bg-brand/10 border border-white/10 flex items-center justify-center text-brand text-xs font-medium shrink-0">
                      {r.display_name.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className="text-neutral-200 text-sm flex-1 truncate">{r.display_name}</div>
                  <div className="text-neutral-100 text-sm font-medium shrink-0">{formatCurrency(r.total)}</div>
                </div>
              );
            })}
          </div>
        )}

        <p className="text-neutral-600 text-xs mt-6 text-center">
          O ranking se renova automaticamente todo início de mês, com base nos lançamentos de faturamento de cada
          aluno.
        </p>
      </div>
    </div>
  );
}
