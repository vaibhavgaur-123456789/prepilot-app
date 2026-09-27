"use client";

import { Bar, BarChart, CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

const axis = { stroke: "var(--muted)", fontSize: 12, tickLine: false, axisLine: false } as const;
const tooltipStyle = { background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 12, color: "var(--text)", fontSize: 12 };

export function TrendChart({ data, unit, label, height = 200, domain = [0, 100] }: { data: { label: string; value: number | null; name?: string }[]; unit: string; label: string; height?: number; domain?: [number, number] }) {
  return (
    <figure aria-label={label}>
      <div style={{ height }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
            <CartesianGrid stroke="var(--border)" vertical={false} />
            <XAxis dataKey="label" {...axis} minTickGap={16} />
            <YAxis {...axis} domain={domain} />
            <Tooltip contentStyle={tooltipStyle} formatter={(v) => [`${v}${unit}`, label]} labelFormatter={(l, p) => (p?.[0]?.payload?.name ? `${p[0].payload.name} · ${l}` : l)} />
            <Line type="monotone" dataKey="value" stroke="var(--primary)" strokeWidth={2.5} dot={{ r: 3, fill: "var(--primary)" }} connectNulls />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <figcaption className="sr-only">{label}: {data.map((d) => `${d.label} ${d.value ?? "no data"}${unit}`).join(", ")}</figcaption>
    </figure>
  );
}

export function PlannedActualChart({ data, height = 220 }: { data: { label: string; planned: number; actual: number }[]; height?: number }) {
  return (
    <figure aria-label="Planned vs actual study minutes per day">
      <div style={{ height }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 8, right: 8, left: -18, bottom: 0 }} barGap={2}>
            <CartesianGrid stroke="var(--border)" vertical={false} />
            <XAxis dataKey="label" {...axis} minTickGap={12} />
            <YAxis {...axis} />
            <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "var(--surface-2)" }} formatter={(v, n) => [`${v} min`, n === "planned" ? "Planned" : "Actual"]} />
            <Legend formatter={(v) => (v === "planned" ? "Planned" : "Actual")} wrapperStyle={{ fontSize: 12 }} />
            <Bar dataKey="planned" fill="var(--border)" radius={[4, 4, 0, 0]} />
            <Bar dataKey="actual" fill="var(--primary)" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <figcaption className="sr-only">{data.map((d) => `${d.label}: planned ${d.planned}, actual ${d.actual}`).join("; ")}</figcaption>
    </figure>
  );
}

export function SubjectBars({ data, height = 220 }: { data: { name: string; accuracy: number | null; coverage: number }[]; height?: number }) {
  return (
    <figure aria-label="Accuracy and syllabus coverage by subject">
      <div style={{ height }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data.map((d) => ({ ...d, accuracy: d.accuracy ?? 0 }))} layout="vertical" margin={{ top: 4, right: 12, left: 8, bottom: 0 }} barGap={2}>
            <CartesianGrid stroke="var(--border)" horizontal={false} />
            <XAxis type="number" domain={[0, 100]} {...axis} />
            <YAxis type="category" dataKey="name" width={110} {...axis} />
            <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "var(--surface-2)" }} formatter={(v, n) => [`${v}%`, n === "accuracy" ? "Accuracy" : "Coverage"]} />
            <Legend formatter={(v) => (v === "accuracy" ? "Accuracy" : "Coverage")} wrapperStyle={{ fontSize: 12 }} />
            <Bar dataKey="accuracy" fill="var(--primary)" radius={[0, 4, 4, 0]} />
            <Bar dataKey="coverage" fill="var(--accent)" radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </figure>
  );
}
