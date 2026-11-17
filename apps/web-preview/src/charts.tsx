// Recharts charts in RevYne's style: white bars on the gradient hero cards,
// a palette-coloured area chart on white cards, and a shared tooltip.
// Colours are real hex values (SVG attributes can't read CSS variables).
import { Area, AreaChart, Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { usePalette } from './store';

export type Point = { label: string; title: string; value: number; lines?: string[] };

function Tip({ active, payload }: { active?: boolean; payload?: { payload: Point }[] }) {
  if (!active || !payload?.length) return null;
  const p = payload[0].payload;
  return (
    <div className="chart-tip">
      <div className="chart-tip-title">{p.title}</div>
      {(p.lines ?? []).map((l) => (
        <div key={l} className="chart-tip-line">{l}</div>
      ))}
    </div>
  );
}

/** Bars for a gradient card. Today / the latest bar is solid, the rest soft. */
export function HeroBars({ data, height = 110, highlightLast = true, ariaLabel }: { data: Point[]; height?: number; highlightLast?: boolean; ariaLabel: string }) {
  const max = Math.max(1, ...data.map((d) => d.value));
  return (
    <div style={{ height }} role="img" aria-label={ariaLabel}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 4, right: 0, bottom: 0, left: 0 }} barCategoryGap={data.length > 40 ? 1 : '22%'}>
          <XAxis
            dataKey="label"
            tickLine={false}
            axisLine={false}
            interval={data.length > 10 ? 'preserveStartEnd' : 0}
            minTickGap={18}
            tick={{ fill: 'rgba(255,255,255,0.85)', fontSize: 12, fontWeight: 700 }}
            height={22}
          />
          <YAxis hide domain={[0, max]} />
          <Tooltip content={<Tip />} cursor={{ fill: 'rgba(255,255,255,0.12)', radius: 6 } as object} />
          <Bar
            dataKey="value"
            radius={[6, 6, 2, 2]}
            minPointSize={3}
            isAnimationActive
            animationDuration={500}
            shape={(props: any) => {
              const last = highlightLast && props.index === data.length - 1;
              const op = props.value === 0 ? 0.25 : last ? 1 : 0.55;
              return <rect x={props.x} y={props.y} width={props.width} height={props.height} rx={Math.min(6, props.width / 2)} fill="#ffffff" fillOpacity={op} />;
            }}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

/** Area chart on a white card, in the palette's primary colour. */
export function TrendArea({ data, height = 180, ariaLabel }: { data: Point[]; height?: number; ariaLabel: string }) {
  const p = usePalette();
  const id = `trend-${p.id}`;
  return (
    <div style={{ height }} role="img" aria-label={ariaLabel}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -18 }}>
          <defs>
            <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={p.primary} stopOpacity={0.28} />
              <stop offset="100%" stopColor={p.primary} stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke={p.line} vertical={false} />
          <XAxis dataKey="label" tickLine={false} axisLine={false} interval="preserveStartEnd" minTickGap={24} tick={{ fill: '#5B5577', fontSize: 12 }} />
          <YAxis allowDecimals={false} tickLine={false} axisLine={false} width={44} tick={{ fill: '#5B5577', fontSize: 12 }} />
          <Tooltip content={<Tip />} cursor={{ stroke: p.shade200, strokeWidth: 2 }} />
          <Area type="monotone" dataKey="value" stroke={p.primary} strokeWidth={2.5} fill={`url(#${id})`} activeDot={{ r: 5, fill: p.primary, stroke: '#fff', strokeWidth: 2 }} animationDuration={500} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
