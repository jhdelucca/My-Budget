// Barra de progresso que muda de cor conforme o percentual usado.
export default function ProgressBar({ percent }) {
  const pct = Math.min(Number(percent) || 0, 100);
  let cor = 'bg-emerald-500';
  if (pct >= 100) cor = 'bg-red-500';
  else if (pct >= 80) cor = 'bg-amber-500';

  return (
    <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-200">
      <div className={`h-full rounded-full ${cor} transition-all`} style={{ width: `${pct}%` }} />
    </div>
  );
}
