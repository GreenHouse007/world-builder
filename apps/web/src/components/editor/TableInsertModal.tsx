import { useState } from "react";
import { createPortal } from "react-dom";
import type { Editor } from "@tiptap/react";

interface TableInsertModalProps {
  editor: Editor;
  onClose: () => void;
}

export function TableInsertModal({ editor, onClose }: TableInsertModalProps) {
  const [rows, setRows] = useState(3);
  const [cols, setCols] = useState(3);
  const [hoveredCell, setHoveredCell] = useState<{ row: number; col: number } | null>(null);

  const maxRows = 10;
  const maxCols = 10;

  const handleInsertTable = () => {
    const finalRows = hoveredCell ? hoveredCell.row + 1 : rows;
    const finalCols = hoveredCell ? hoveredCell.col + 1 : cols;

    editor
      .chain()
      .focus()
      .insertTable({ rows: finalRows, cols: finalCols, withHeaderRow: true })
      .run();
    onClose();
  };

  const handleCellHover = (row: number, col: number) => {
    setHoveredCell({ row, col });
    setRows(row + 1);
    setCols(col + 1);
  };

  const handleCellClick = (row: number, col: number) => {
    const finalRows = row + 1;
    const finalCols = col + 1;

    editor
      .chain()
      .focus()
      .insertTable({ rows: finalRows, cols: finalCols, withHeaderRow: true })
      .run();
    onClose();
  };

  return createPortal(
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-[200]"
      onClick={onClose}
    >
      <div
        className="bg-[#0a0f1a] border border-purple-500/30 rounded-3xl p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-slate-100">Insert Table</h3>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 transition-colors text-2xl leading-none"
          >
            ×
          </button>
        </div>

        <div className="mb-4">
          <p className="text-sm text-slate-300 mb-3">
            Hover to select table size: <span className="font-semibold text-purple-300">{rows} × {cols}</span>
          </p>

          {/* Grid Preview */}
          <div className="inline-grid gap-1 p-2 bg-white/5 rounded-lg">
            {Array.from({ length: maxRows }).map((_, rowIndex) => (
              <div key={rowIndex} className="flex gap-1">
                {Array.from({ length: maxCols }).map((_, colIndex) => {
                  const isSelected =
                    hoveredCell &&
                    rowIndex <= hoveredCell.row &&
                    colIndex <= hoveredCell.col;

                  return (
                    <div
                      key={colIndex}
                      className={`w-6 h-6 border-2 rounded cursor-pointer transition-all ${
                        isSelected
                          ? "bg-purple-500 border-purple-400"
                          : "bg-white/10 border-white/20 hover:bg-white/20"
                      }`}
                      onMouseEnter={() => handleCellHover(rowIndex, colIndex)}
                      onClick={() => handleCellClick(rowIndex, colIndex)}
                    />
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
