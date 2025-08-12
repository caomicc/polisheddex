import { cn } from "@/lib/utils"

const base = "rounded-full px-2 py-0.5 text-[11px] font-medium border"

const typeStyles: Record<string, string> = {
  Normal: "bg-neutral-100 text-neutral-800 border-neutral-300",
  Fire: "bg-rose-100 text-rose-800 border-rose-300",
  Water: "bg-cyan-100 text-cyan-800 border-cyan-300",
  Electric: "bg-amber-100 text-amber-900 border-amber-300",
  Grass: "bg-emerald-100 text-emerald-800 border-emerald-300",
  Ice: "bg-teal-100 text-teal-800 border-teal-300",
  Fighting: "bg-orange-100 text-orange-800 border-orange-300",
  Poison: "bg-fuchsia-100 text-fuchsia-800 border-fuchsia-300",
  Ground: "bg-stone-100 text-stone-800 border-stone-300",
  Flying: "bg-violet-100 text-violet-800 border-violet-300",
  Psychic: "bg-pink-100 text-pink-800 border-pink-300",
  Bug: "bg-lime-100 text-lime-800 border-lime-300",
  Rock: "bg-yellow-100 text-yellow-900 border-yellow-300",
  Ghost: "bg-purple-100 text-purple-800 border-purple-300",
  Dragon: "bg-indigo-100 text-indigo-800 border-indigo-300",
  Dark: "bg-zinc-800 text-zinc-100 border-zinc-700",
  Steel: "bg-slate-100 text-slate-800 border-slate-300",
  Fairy: "bg-rose-100 text-rose-800 border-rose-300",
}

export default function TypeBadge({ type, className }: { type?: string | null; className?: string }) {
  if (!type)
    return <span className={cn(base, "bg-neutral-50 text-neutral-500 border-neutral-200", className)}>None</span>
  return (
    <span className={cn(base, typeStyles[type] ?? "bg-neutral-100 text-neutral-800 border-neutral-300", className)}>
      {type}
    </span>
  )
}
