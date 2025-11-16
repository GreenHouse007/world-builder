import { useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { useWorlds } from "../../store/worlds";
import { usePages } from "../../store/pages";
import { exportPdf } from "../../services/export";

export function ExportModal({ onClose }: { onClose: () => void }) {
  const { currentWorldId } = useWorlds();
  const { tree } = usePages();

  const allIds = useMemo(() => {
    const out: string[] = [];
    const walk = (n: any) => {
      out.push(n._id);
      n.children?.forEach(walk);
    };
    tree.forEach(walk);
    return out;
  }, [tree]);

  const [checked, setChecked] = useState<Set<string>>(new Set(allIds));

  const toggle = (id: string) => {
    const next = new Set(checked);
    next.has(id) ? next.delete(id) : next.add(id);
    setChecked(next);
  };

  const selectAll = () => setChecked(new Set(allIds));
  const clearAll = () => setChecked(new Set());

  async function doExport() {
    if (!currentWorldId || checked.size === 0) return;
    // order pages by current tree order
    const order: string[] = [];
    const walk = (n: any) => {
      if (checked.has(n._id)) order.push(n._id);
      n.children?.forEach(walk);
    };
    tree.forEach(walk);
    await exportPdf({ worldId: currentWorldId, pageIds: [...checked], order });
    onClose();
  }

  return createPortal(
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 overflow-auto">
      <div className="w-full max-w-[760px] my-auto rounded-2xl bg-[#0b1020] border border-white/10 p-4 shadow-2xl">
        <div className="flex items-center justify-between mb-3">
          <div className="text-sm font-medium text-slate-100">
            Export to PDF
          </div>
          <button
            className="text-slate-400 hover:text-slate-200"
            onClick={onClose}
          >
            ✕
          </button>
        </div>

        <div className="flex items-center gap-2 mb-3">
          <button
            className="px-3 py-1 rounded bg-white/5 hover:bg-white/10 text-sm"
            onClick={selectAll}
          >
            Select all
          </button>
          <button
            className="px-3 py-1 rounded bg-white/5 hover:bg-white/10 text-sm"
            onClick={clearAll}
          >
            Deselect all
          </button>
        </div>

        <div className="h-80 overflow-auto border border-white/10 rounded-lg p-2">
          {tree.map((n) => (
            <Node
              key={n._id}
              n={n}
              depth={0}
              checked={checked}
              toggle={toggle}
            />
          ))}
        </div>

        <div className="mt-4 flex justify-end gap-2">
          <button
            className="px-3 py-2 rounded bg-white/5 hover:bg-white/10"
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            className="px-3 py-2 rounded bg-indigo-500 text-white"
            onClick={doExport}
          >
            Export PDF
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

function Node({
  n,
  depth,
  checked,
  toggle,
}: {
  n: any;
  depth: number;
  checked: Set<string>;
  toggle: (id: string) => void;
}) {
  return (
    <>
      <div
        style={{ paddingLeft: depth * 16 }}
        className="py-1 flex items-center gap-2"
      >
        <input
          type="checkbox"
          checked={checked.has(n._id)}
          onChange={() => toggle(n._id)}
        />
        <div className="text-sm text-slate-200 truncate">{n.title}</div>
      </div>
      {n.children?.length
        ? n.children.map((c: any) => (
            <Node
              key={c._id}
              n={c}
              depth={depth + 1}
              checked={checked}
              toggle={toggle}
            />
          ))
        : null}
    </>
  );
}
