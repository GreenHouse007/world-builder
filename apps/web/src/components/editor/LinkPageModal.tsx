import { useState, useMemo, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { usePages } from "../../store/pages";
import { useTheme } from "../../store/theme";

interface LinkPageModalProps {
  onClose: () => void;
  onSelectPage: (pageId: string, pageTitle: string) => void;
  currentPageId?: string | null;
}

export function LinkPageModal({
  onClose,
  onSelectPage,
  currentPageId,
}: LinkPageModalProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const { pages } = usePages();
  const { editorTheme } = useTheme();

  // Auto-focus search input
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Filter pages based on search query
  const filteredPages = useMemo(() => {
    let filtered = pages.filter((page) => page._id !== currentPageId);

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (page) =>
          page.title.toLowerCase().includes(query) ||
          page.emoji?.toLowerCase().includes(query)
      );
    }

    return filtered.sort((a, b) => a.title.localeCompare(b.title));
  }, [pages, searchQuery, currentPageId]);

  // Reset selected index when search changes
  useEffect(() => {
    setSelectedIndex(0);
  }, [searchQuery]);

  // Scroll selected item into view
  useEffect(() => {
    if (listRef.current) {
      const selectedElement = listRef.current.children[
        selectedIndex
      ] as HTMLElement;
      if (selectedElement) {
        selectedElement.scrollIntoView({
          block: "nearest",
          behavior: "smooth",
        });
      }
    }
  }, [selectedIndex]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setSelectedIndex((prev) =>
          Math.min(prev + 1, filteredPages.length - 1)
        );
        break;
      case "ArrowUp":
        e.preventDefault();
        setSelectedIndex((prev) => Math.max(prev - 1, 0));
        break;
      case "Enter":
        e.preventDefault();
        if (filteredPages[selectedIndex]) {
          const page = filteredPages[selectedIndex];
          onSelectPage(page._id, page.title);
        }
        break;
      case "Escape":
        e.preventDefault();
        onClose();
        break;
    }
  };

  const modalContent = (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      {/* Modal */}
      <div
        className={`relative z-[10001] w-full max-w-md rounded-lg shadow-lg border ${
          editorTheme === "dark"
            ? "bg-[#0a0f1a] border-white/10"
            : "bg-white border-gray-300"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className={`px-4 py-3 border-b ${
            editorTheme === "dark" ? "border-white/10" : "border-gray-200"
          }`}
        >
          <h2
            className={`text-lg font-semibold ${
              editorTheme === "dark" ? "text-slate-50" : "text-gray-900"
            }`}
          >
            Link to page
          </h2>
        </div>

        {/* Search Input */}
        <div
          className={`p-4 border-b ${
            editorTheme === "dark" ? "border-white/10" : "border-gray-200"
          }`}
        >
          <input
            ref={inputRef}
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search pages..."
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${
              editorTheme === "dark"
                ? "bg-white/5 border-white/10 text-slate-100 placeholder-slate-400 focus:ring-purple-500"
                : "bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:ring-blue-500"
            }`}
          />
        </div>

        {/* Page List */}
        <div
          ref={listRef}
          className="max-h-[400px] overflow-y-auto scrollbar-thin"
        >
          {filteredPages.length === 0 ? (
            <div
              className={`px-4 py-8 text-center ${
                editorTheme === "dark" ? "text-slate-400" : "text-gray-500"
              }`}
            >
              {searchQuery ? "No pages found" : "No pages available"}
            </div>
          ) : (
            <div className="py-1">
              {filteredPages.map((page, index) => (
                <button
                  key={page._id}
                  onClick={() => onSelectPage(page._id, page.title)}
                  onMouseEnter={() => setSelectedIndex(index)}
                  className={`w-full px-4 py-2 text-left flex items-center gap-2 transition-colors ${
                    index === selectedIndex
                      ? editorTheme === "dark"
                        ? "bg-purple-500/20 text-purple-300"
                        : "bg-blue-100 text-blue-900"
                      : editorTheme === "dark"
                      ? "hover:bg-white/5 text-slate-300"
                      : "hover:bg-gray-50 text-gray-900"
                  }`}
                >
                  <span className="text-lg">{page.emoji || "📄"}</span>
                  <span className="flex-1 truncate">{page.title}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          className={`px-4 py-3 border-t flex justify-end gap-2 ${
            editorTheme === "dark" ? "border-white/10" : "border-gray-200"
          }`}
        >
          <button
            onClick={onClose}
            className={`px-4 py-2 text-sm rounded-md transition-colors ${
              editorTheme === "dark"
                ? "hover:bg-white/5 text-slate-300"
                : "hover:bg-gray-100 text-gray-700"
            }`}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
