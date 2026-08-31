"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { createClient } from "@/lib/supabase/client";
import { computeFixedStats, dailySeries, sumInRange, subtractDays, todayISO } from "@/lib/earnings";
import { EarningForm, type EarningEntry } from "./EarningForm";
import { LineIcon } from "@/components/LineIcon";

const PLATFORM_LABEL: Record<string, string> = { instagram: "Instagram", tiktok: "TikTok", youtube: "YouTube" };
const PLATFORM_ICON: Record<string, string> = { instagram: "instagram", tiktok: "music", youtube: "play" };

function formatCurrency(value: number) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function formatDatePt(iso: string) {
  const [y, m, d] = iso.split("-");
  return `${d}/${m}`;
}

export function FaturamentoClient({ userId }: { userId: string }) {
  const supabase = createClient();
  const [entries, setEntries] = useState<EarningEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingEntry, setEditingEntry] = useState<EarningEntry | null>(null);
  const [signedUrls, setSignedUrls] = useState<Record<string, string>>({});

  // Filtro de período personalizado — por padrão, últimos 30 dias
  const today = todayISO();
  const [rangeFrom, setRangeFrom] = useState(subtractDays(today, 29));
  const [rangeTo, setRangeTo] = useState(today);

  async function loadEntries() {
    setLoading(true);
    // Busca uma janela ampla (120 dias) pra permitir os cálculos comparativos fixos,
    // mais tudo que estiver fora disso mas dentro do filtro custom escolhido.
    const earliestNeeded = rangeFrom < subtractDays(today, 119) ? rangeFrom : subtractDays(today, 119);
    const { data } = await supabase
      .from("earnings")
      .select("id, entry_date, platform, title, amount, screenshot_path")
      .eq("user_id", userId)
      .gte("entry_date", earliestNeeded)
      .order("entry_date", { ascending: false });
    setEntries((data as EarningEntry[]) ?? []);
    setLoading(false);
  }

  useEffect(() => {
    loadEntries();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rangeFrom]);

  // Gera URLs assinadas (temporárias) pros prints, já que o bucket é privado
  useEffect(() => {
    async function loadSignedUrls() {
      const withScreenshot = entries.filter((e) => e.screenshot_path);
      const entries_: Record<string, string> = {};
      for (const e of withScreenshot) {
        if (!e.screenshot_path) continue;
        const { data } = await supabase.storage
          .from("earnings-screenshots")
          .createSignedUrl(e.screenshot_path, 3600);
        if (data?.signedUrl) entries_[e.id] = data.signedUrl;
      }
      setSignedUrls(entries_);
    }
    if (entries.length > 0) loadSignedUrls();
  }, [entries, supabase]);

  const fixedStats = useMemo(() => computeFixedStats(entries), [entries]);
  const chartData = useMemo(
    () => dailySeries(entries, rangeFrom, rangeTo).map((d) => ({ ...d, label: formatDatePt(d.date) })),
    [entries, rangeFrom, rangeTo]
  );
  const rangeTotal = useMemo(() => sumInRange(entries, rangeFrom, rangeTo), [entries, rangeFrom, rangeTo]);
  const visibleEntries = useMemo(
    () => entries.filter((e) => e.entry_date >= rangeFrom && e.entry_date <= rangeTo),
    [entries, rangeFrom, rangeTo]
  );

  function resetToLast30() {
    setRangeFrom(subtractDays(today, 29));
    setRangeTo(today);
  }

  async function deleteEntry(entry: EarningEntry) {
    if (!confirm("Apagar este lançamento?")) return;
    await supabase.from("earnings").delete().eq("id", entry.id);
    if (entry.screenshot_path) {
      await supabase.storage.from("earnings-screenshots").remove([entry.screenshot_path]);
    }
    loadEntries();
  }

  return (
    <div>
      {/* Cards fixos: hoje / 7 dias / 30 dias */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
        {fixedStats.map((stat) => (
          <div key={stat.label} className="rounded-xl bg-white/[0.03] border border-white/10 p-4">
            <div className="text-neutral-500 text-xs mb-1.5">{stat.label}</div>
            <div className="text-neutral-100 text-xl font-medium mb-1">{formatCurrency(stat.total)}</div>
            {stat.changePct === null ? (
              <div className="text-neutral-600 text-xs">sem comparação anterior</div>
            ) : (
              <div className={`text-xs ${stat.changePct >= 0 ? "text-brand" : "text-red-400"}`}>
                {stat.changePct >= 0 ? "↑" : "↓"} {Math.abs(stat.changePct).toFixed(1)}% vs período anterior
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Gráfico */}
      <div className="rounded-xl bg-white/[0.03] border border-white/10 p-5 mb-6">
        <div className="text-neutral-100 font-medium text-sm mb-4">Evolução no período</div>
        <div className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ left: -20, right: 10 }}>
              <defs>
                <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#9ACD32" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="#9ACD32" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
              <XAxis dataKey="label" stroke="#6b6b63" fontSize={11} tickLine={false} axisLine={false} />
              <YAxis
                stroke="#6b6b63"
                fontSize={11}
                tickLine={false}
                axisLine={false}
                tickFormatter={(v) => `R$${v}`}
              />
              <Tooltip
                contentStyle={{ background: "#0c0e09", border: "0.5px solid rgba(255,255,255,0.12)", borderRadius: 8 }}
                labelStyle={{ color: "#f2f2ee" }}
                formatter={(value: number) => [formatCurrency(value), "Faturado"]}
              />
              <Area type="monotone" dataKey="total" stroke="#9ACD32" strokeWidth={2} fill="url(#colorAmount)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Filtro de período personalizado */}
      <div className="rounded-xl bg-white/[0.03] border border-white/10 p-4 mb-6 flex flex-wrap items-end gap-3">
        <div>
          <label className="text-neutral-500 text-xs block mb-1">De</label>
          <input type="date" className="dgs-input" value={rangeFrom} onChange={(e) => setRangeFrom(e.target.value)} />
        </div>
        <div>
          <label className="text-neutral-500 text-xs block mb-1">Até</label>
          <input type="date" className="dgs-input" value={rangeTo} onChange={(e) => setRangeTo(e.target.value)} />
        </div>
        <button onClick={resetToLast30} className="text-neutral-500 text-xs">
          últimos 30 dias
        </button>
        <div className="ml-auto text-right">
          <div className="text-neutral-500 text-xs">Total no período</div>
          <div className="text-brand font-medium">{formatCurrency(rangeTotal)}</div>
        </div>
      </div>

      {/* Aviso sobre honestidade nos lançamentos */}
      <div className="rounded-lg border border-orange-700/30 bg-orange-700/5 px-4 py-3 mb-4 flex items-start gap-2.5">
        <span className="shrink-0 mt-0.5 text-orange-500">
          <LineIcon name="warning" size={14} />
        </span>
        <p className="text-neutral-400 text-xs leading-relaxed">
          Lance apenas valores reais, condizentes com o que você faturou de fato. Esse espaço existe pra te ajudar a
          acompanhar sua própria evolução — inflar números só atrapalha seu próprio processo de aprendizado. Em breve,
          o sistema de conquistas vai exigir comprovação dos lançamentos, então mantenha tudo honesto desde já.
        </p>
      </div>

      {/* Botão novo lançamento / formulário */}
      {showForm || editingEntry ? (
        <div className="mb-6">
          <EarningForm
            editing={editingEntry}
            onCancel={() => {
              setShowForm(false);
              setEditingEntry(null);
            }}
            onSaved={() => {
              setShowForm(false);
              setEditingEntry(null);
              loadEntries();
            }}
          />
        </div>
      ) : (
        <button onClick={() => setShowForm(true)} className="dgs-btn-primary w-auto px-5 mb-6">
          + novo lançamento
        </button>
      )}

      {/* Lista de lançamentos */}
      <div className="flex flex-col gap-2">
        {loading && <div className="text-neutral-500 text-sm">Carregando…</div>}
        {!loading && visibleEntries.length === 0 && (
          <div className="text-neutral-600 text-sm">Nenhum lançamento nesse período.</div>
        )}
        {visibleEntries.map((entry) => (
          <div
            key={entry.id}
            className="flex items-center gap-3 rounded-lg border border-white/10 bg-white/[0.02] p-3"
          >
            {signedUrls[entry.id] ? (
              <a href={signedUrls[entry.id]} target="_blank" rel="noreferrer">
                <img src={signedUrls[entry.id]} alt="Print" className="w-12 h-12 rounded object-cover border border-white/10" />
              </a>
            ) : (
              <div className="w-12 h-12 rounded bg-white/5 flex items-center justify-center text-neutral-600 text-xs">
                sem print
              </div>
            )}
            <div className="flex-1 min-w-0">
              <div className="text-neutral-200 text-sm truncate">
                <LineIcon name={PLATFORM_ICON[entry.platform]} size={13} className="inline-block align-[-2px] mr-1 text-neutral-400" />
                {entry.title}
              </div>
              <div className="text-neutral-500 text-xs">
                {formatDatePt(entry.entry_date)} · {PLATFORM_LABEL[entry.platform]}
              </div>
            </div>
            <div className="text-neutral-100 text-sm font-medium">{formatCurrency(Number(entry.amount))}</div>
            <button onClick={() => setEditingEntry(entry)} className="text-neutral-500 text-xs">
              editar
            </button>
            <button onClick={() => deleteEntry(entry)} className="text-red-400 text-xs">
              apagar
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
