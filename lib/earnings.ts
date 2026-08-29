// Funções auxiliares de data usadas no dashboard de faturamento.
// Tudo trabalha com strings "YYYY-MM-DD" (mesmo formato da coluna entry_date no Postgres).

export function toISODate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export function todayISO(): string {
  return toISODate(new Date());
}

export function subtractDays(iso: string, days: number): string {
  const d = new Date(iso + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() - days);
  return toISODate(d);
}

export type Entry = { entry_date: string; amount: number };

// Soma o valor de todas as entradas cuja data está entre from e to (inclusive)
export function sumInRange(entries: Entry[], from: string, to: string): number {
  return entries
    .filter((e) => e.entry_date >= from && e.entry_date <= to)
    .reduce((acc, e) => acc + Number(e.amount), 0);
}

// Variação percentual entre dois períodos. Retorna null quando não dá pra calcular
// (período anterior zerado — evita divisão por zero e "infinito%" enganoso).
export function percentChange(current: number, previous: number): number | null {
  if (previous === 0) return current > 0 ? null : 0;
  return ((current - previous) / previous) * 100;
}

export type PeriodStat = {
  label: string;
  total: number;
  changePct: number | null;
};

// Monta as 3 métricas fixas do topo: hoje, últimos 7 dias, últimos 30 dias —
// cada uma comparada com o período equivalente imediatamente anterior.
export function computeFixedStats(entries: Entry[]): PeriodStat[] {
  const today = todayISO();
  const yesterday = subtractDays(today, 1);

  const todayTotal = sumInRange(entries, today, today);
  const yesterdayTotal = sumInRange(entries, yesterday, yesterday);

  const last7Start = subtractDays(today, 6);
  const prev7Start = subtractDays(today, 13);
  const prev7End = subtractDays(today, 7);
  const last7Total = sumInRange(entries, last7Start, today);
  const prev7Total = sumInRange(entries, prev7Start, prev7End);

  const last30Start = subtractDays(today, 29);
  const prev30Start = subtractDays(today, 59);
  const prev30End = subtractDays(today, 30);
  const last30Total = sumInRange(entries, last30Start, today);
  const prev30Total = sumInRange(entries, prev30Start, prev30End);

  return [
    { label: "Hoje", total: todayTotal, changePct: percentChange(todayTotal, yesterdayTotal) },
    { label: "Últimos 7 dias", total: last7Total, changePct: percentChange(last7Total, prev7Total) },
    { label: "Últimos 30 dias", total: last30Total, changePct: percentChange(last30Total, prev30Total) },
  ];
}

// Agrupa as entradas por dia dentro de um intervalo, preenchendo dias sem lançamento com 0
// (necessário pro gráfico não "pular" datas).
export function dailySeries(entries: Entry[], from: string, to: string) {
  const totals = new Map<string, number>();
  for (const e of entries) {
    if (e.entry_date >= from && e.entry_date <= to) {
      totals.set(e.entry_date, (totals.get(e.entry_date) ?? 0) + Number(e.amount));
    }
  }

  const series: { date: string; total: number }[] = [];
  let cursor = from;
  while (cursor <= to) {
    series.push({ date: cursor, total: totals.get(cursor) ?? 0 });
    cursor = subtractDays(cursor, -1); // avança um dia
  }
  return series;
}
