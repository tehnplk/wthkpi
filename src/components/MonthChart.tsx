interface Props {
  title: string;
  labels: string[];
  values: (number | null)[];
  kind: "line" | "bar";
  // Bar mode: value n is drawn at level n and the axis shows these names.
  levelNames?: string[];
}

const W = 1000;
const H = 200;
const PAD = { top: 24, right: 12, bottom: 26, left: 72 };
const PLOT_W = W - PAD.left - PAD.right;
const PLOT_H = H - PAD.top - PAD.bottom;

const fmt = (n: number) => n.toLocaleString("th-TH", { maximumFractionDigits: 2 });

// Smallest 1/2/2.5/5 x 10^n step whose 4 ticks cover max.
const niceStep = (max: number) => {
  const raw = max / 4;
  const mag = 10 ** Math.floor(Math.log10(raw));
  return [1, 2, 2.5, 5, 10].map((m) => m * mag).find((s) => s >= raw) ?? raw;
};

export function MonthChart({ title, labels, values, kind, levelNames = [] }: Props) {
  const isBar = kind === "bar";
  const step0 = niceStep(Math.max(...values.map((v) => v ?? 0), 1));
  const max = isBar ? Math.max(levelNames.length, 1) : step0 * 4;
  const ticks = isBar
    ? levelNames.map((name, i) => ({ value: i + 1, label: name }))
    : [0, 1, 2, 3, 4].map((n) => ({ value: step0 * n, label: fmt(step0 * n) }));

  const step = PLOT_W / labels.length;
  const x = (i: number) => PAD.left + step * (i + 0.5);
  const y = (v: number) => PAD.top + PLOT_H - (v / max) * PLOT_H;

  const points = values
    .map((v, i) => (v == null ? null : { i, v }))
    .filter((p): p is { i: number; v: number } => p !== null);
  const barW = Math.min(step * 0.6, 28);

  return (
    <figure className="month-chart">
      <figcaption className="month-chart-title">{title}</figcaption>
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={title}>
        {ticks.map((t) => (
          <g key={t.label}>
            <line x1={PAD.left} x2={W - PAD.right} y1={y(t.value)} y2={y(t.value)} className="month-chart-grid" />
            <text x={PAD.left - 8} y={y(t.value)} className="month-chart-axis" textAnchor="end" dominantBaseline="middle">
              {t.label}
            </text>
          </g>
        ))}
        {isBar && <line x1={PAD.left} x2={W - PAD.right} y1={y(0)} y2={y(0)} className="month-chart-grid" />}
        {labels.map((label, i) => (
          <text key={label} x={x(i)} y={H - 8} className="month-chart-axis" textAnchor="middle">{label}</text>
        ))}

        {isBar
          ? points.map(({ i, v }) => {
              const top = y(v);
              const h = PAD.top + PLOT_H - top;
              return (
                <g key={i}>
                  <title>{`${labels[i]}: ${levelNames[v - 1] ?? v}`}</title>
                  {/* rounded top, square base */}
                  <path
                    d={`M${x(i) - barW / 2},${top + h} V${top + 4} q0,-4 4,-4 H${x(i) + barW / 2 - 4} q4,0 4,4 V${top + h} Z`}
                    className="month-chart-bar"
                  />
                  <rect x={x(i) - step / 2} y={PAD.top} width={step} height={PLOT_H} fill="transparent" />
                </g>
              );
            })
          : (
            <>
              <polyline
                points={points.map(({ i, v }) => `${x(i)},${y(v)}`).join(" ")}
                className="month-chart-line"
              />
              {points.map(({ i, v }) => (
                <g key={i}>
                  <title>{`${labels[i]}: ${fmt(v)}`}</title>
                  <circle cx={x(i)} cy={y(v)} r={4} className="month-chart-dot" />
                  <rect x={x(i) - step / 2} y={PAD.top} width={step} height={PLOT_H} fill="transparent" />
                </g>
              ))}
              {points.length > 0 && (
                <text
                  x={x(points[points.length - 1].i)}
                  y={y(points[points.length - 1].v) - 10}
                  className="month-chart-value"
                  textAnchor="middle"
                >
                  {fmt(points[points.length - 1].v)}
                </text>
              )}
            </>
          )}
      </svg>
    </figure>
  );
}
