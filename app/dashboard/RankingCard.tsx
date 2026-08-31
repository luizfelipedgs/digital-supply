import { LineIcon } from "@/components/LineIcon";

const MEDAL_COLOR = ["text-yellow-400", "text-neutral-300", "text-orange-600"];
const BORDER_COLOR = ["border-yellow-400/30", "border-neutral-400/30", "border-orange-700/30"];
const BG_COLOR = ["bg-yellow-400/5", "bg-neutral-400/5", "bg-orange-700/5"];

function formatCurrency(value: number) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function weekRangeLabel(): string {
  const now = new Date(new Date().toLocaleString("en-US", { timeZone: "America/Sao_Paulo" }));
  const isoDow = now.getDay() === 0 ? 7 : now.getDay(); // 1=segunda ... 7=domingo
  const monday = new Date(now);
  monday.setDate(now.getDate() - (isoDow - 1));
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  const fmt = (d: Date) => d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
  return `${fmt(monday)} — ${fmt(sunday)}`;
}

export function RankingCard({
  entries,
}: {
  entries: { user_id: string; display_name: string; avatarUrl: string | null; total: number }[];
}) {
  return (
    <div className="dgs-card mb-8">
      <div className="flex items-center justify-between mb-1">
        <div className="text-neutral-100 font-medium text-sm flex items-center gap-2">
          <LineIcon name="trophy" size={16} className="text-brand" />
          Ranking da Semana
        </div>
        <div className="text-neutral-600 text-[11px]">{weekRangeLabel()}</div>
      </div>
      <div className="text-neutral-500 text-xs mb-4 whitespace-nowrap">Top 3 em faturamento - renova toda segunda-feira.</div>

      {entries.length === 0 ? (
        <div className="text-neutral-600 text-sm py-4 text-center">
          Nenhum lançamento essa semana ainda. Seja o primeiro do ranking!
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {entries.map((e, i) => (
            <div
              key={e.user_id}
              className={`flex items-center gap-3 rounded-lg border ${BORDER_COLOR[i]} ${BG_COLOR[i]} px-3 py-2.5`}
            >
              <div
                className={`w-6 h-6 rounded-full border ${BORDER_COLOR[i]} flex items-center justify-center text-xs font-bold shrink-0 ${MEDAL_COLOR[i]}`}
              >
                {i + 1}
              </div>
              {e.avatarUrl ? (
                <img src={e.avatarUrl} alt="" className="w-8 h-8 rounded-full object-cover border border-white/10 shrink-0" />
              ) : (
                <div className="w-8 h-8 rounded-full bg-brand/10 border border-white/10 flex items-center justify-center text-brand text-xs font-medium shrink-0">
                  {e.display_name.charAt(0).toUpperCase()}
                </div>
              )}
              <div className="text-neutral-200 text-sm flex-1 truncate">{e.display_name}</div>
              <div className="text-neutral-100 text-sm font-medium shrink-0">{formatCurrency(e.total)}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
