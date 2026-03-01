import { useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { useWorlds } from "../../store/worlds";
import { usePages, type PageNode } from "../../store/pages";
import { exportPdf } from "../../services/export";

export function ExportModal({ onClose }: { onClose: () => void }) {
  const { currentWorldId } = useWorlds();
  const { tree } = usePages();

  const allIds = useMemo(() => {
    const out: string[] = [];
    const walk = (n: PageNode) => {
      out.push(n._id);
      n.children?.forEach(walk);
    };
    tree.forEach(walk);
    return out;
  }, [tree]);

  const [checked, setChecked] = useState<Set<string>>(new Set(allIds));
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);

  const toggle = (id: string) => {
    const next = new Set(checked);
    next.has(id) ? next.delete(id) : next.add(id);
    setChecked(next);
  };

  const selectAll = () => setChecked(new Set(allIds));
  const clearAll = () => setChecked(new Set());

  async function doExport() {
    if (!currentWorldId || checked.size === 0 || exporting) return;
    setExporting(true);
    setExportError(null);
    const order: string[] = [];
    const walk = (n: PageNode) => {
      if (checked.has(n._id)) order.push(n._id);
      n.children?.forEach(walk);
    };
    tree.forEach(walk);
    try {
      await exportPdf({ worldId: currentWorldId, pageIds: [...checked], order });
      onClose();
    } catch (err) {
      setExportError(
        err instanceof Error ? err.message : "Export failed. Please allow popups and try again."
      );
    } finally {
      setExporting(false);
    }
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
          {tree.length === 0 ? (
            <div className="h-full flex items-center justify-center text-sm text-slate-400">
              No pages in this world yet.
            </div>
          ) : (
            tree.map((n) => (
              <Node
                key={n._id}
                n={n}
                depth={0}
                checked={checked}
                toggle={toggle}
              />
            ))
          )}
        </div>

        <div className="mt-4 flex justify-end gap-2">
          <button
            className="px-3 py-2 rounded bg-white/5 hover:bg-white/10"
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            className="px-3 py-2 rounded bg-indigo-500 text-white disabled:opacity-50"
            onClick={doExport}
            disabled={exporting || checked.size === 0}
          >
            {exporting ? "Exporting…" : "Export PDF"}
          </button>
        </div>
        {exportError && (
          <p className="mt-2 text-xs text-red-400 text-right">{exportError}</p>
        )}
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
  n: PageNode;
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
        ? n.children.map((c) => (
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
