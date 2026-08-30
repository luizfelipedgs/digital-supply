"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Dot,
} from "recharts";

type SeriesPoint = { date: string; total: number; label: string };

function formatCurrency(value: number) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export function TodayEarningsCard({
  series,
  todayTotal,
  className = "",
}: {
  series: SeriesPoint[];
  todayTotal: number;
  className?: string;
}) {
  return (
    <div className={`dgs-card mb-8 ${className}`}>
      <div className="text-neutral-500 text-xs mb-1.5">Faturamento de Hoje:</div>
      <div className="text-neutral-100 text-3xl font-bold mb-4">{formatCurrency(todayTotal)}</div>

      <div className="h-40 -ml-2">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={series} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="4 4" stroke="rgba(255,255,255,0.08)" horizontal={true} vertical={false} />
            <XAxis
              dataKey="label"
              stroke="#6b6b63"
              fontSize={11}
              tickLine={false}
              axisLine={false}
              dy={6}
            />
            <YAxis
              stroke="#6b6b63"
              fontSize={11}
              tickLine={false}
              axisLine={false}
              width={54}
              tickFormatter={(v) => `R$${v}`}
            />
            <Tooltip
              contentStyle={{ background: "#0c0e09", border: "0.5px solid rgba(255,255,255,0.12)", borderRadius: 8 }}
              labelStyle={{ color: "#f2f2ee" }}
              formatter={(value: number) => [formatCurrency(value), "Faturado"]}
            />
            <Line
              type="monotone"
              dataKey="total"
              stroke="#9ACD32"
              strokeWidth={2.5}
              dot={{ r: 5, fill: "#0c0e09", stroke: "#9ACD32", strokeWidth: 2.5 }}
              activeDot={{ r: 6, fill: "#9ACD32", stroke: "#0c0e09", strokeWidth: 2 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
