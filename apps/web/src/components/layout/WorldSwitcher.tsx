import { useWorlds } from "../../store/worlds";

export function WorldSwitcher() {
  const { worlds, currentWorldId, setWorld } = useWorlds();

  if (!worlds.length) {
    return (
      <div className="px-3 py-1 rounded-2xl bg-white/5 text-xs text-slate-300">
        No worlds yet
      </div>
    );
  }

  const current = worlds.find((w) => w._id === currentWorldId) ?? worlds[0];

  return (
    <div className="relative inline-flex items-center gap-2 px-3 py-1.5 bg-black/40 rounded-2xl border border-white/10 text-xs text-slate-200">
      <span className="text-lg">{current.emoji || "🌌"}</span>
      <span className="font-medium truncate max-w-[140px]">{current.name}</span>
      <select
        className="absolute inset-0 opacity-0 cursor-pointer"
        value={current._id}
        onChange={(e) => setWorld(e.target.value)}
      >
        {worlds.map((w) => (
          <option key={w._id} value={w._id}>
            {w.name}
          </option>
        ))}
      </select>
    </div>
  );
}
