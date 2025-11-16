import React from "react";

export type SlashItem = {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  run: () => void;
  shortcut?: string;
};

export function EditorSlashMenu({
  items,
  selectedIndex,
}: {
  items: SlashItem[];
  selectedIndex: number;
}) {
  if (!items.length) {
    return <div className="px-3 py-2 text-xs text-slate-400">No results…</div>;
  }

  return (
    <div className="min-w-[280px] max-w-[420px] rounded-xl border border-white/10 bg-[#0b101a]/95 shadow-2xl backdrop-blur p-1">
      {items.map((item, i) => (
        <button
          key={item.title + i}
          onMouseDown={(e) => e.preventDefault()}
          onClick={item.run}
          className={
            "w-full text-left px-3 py-2 rounded-lg flex items-center gap-2 " +
            (i === selectedIndex ? "bg-white/10" : "hover:bg-white/5")
          }
        >
          <span className="w-5 text-center">{item.icon ?? "•"}</span>
          <div className="flex-1">
            <div className="text-sm text-slate-100">{item.title}</div>
            {item.subtitle && (
              <div className="text-[11px] text-slate-400">{item.subtitle}</div>
            )}
          </div>
          {item.shortcut && (
            <kbd className="text-[10px] text-slate-400">{item.shortcut}</kbd>
          )}
        </button>
      ))}
    </div>
  );
}
