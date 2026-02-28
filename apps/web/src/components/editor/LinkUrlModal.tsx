import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { useTheme } from "../../store/theme";

interface LinkUrlModalProps {
  onClose: () => void;
  onSubmit: (url: string) => void;
  initialUrl?: string;
}

export function LinkUrlModal({
  onClose,
  onSubmit,
  initialUrl = "",
}: LinkUrlModalProps) {
  const [url, setUrl] = useState(initialUrl);
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const { editorTheme } = useTheme();

  useEffect(() => {
    inputRef.current?.focus();
    // Select all text if editing
    if (initialUrl) {
      inputRef.current?.select();
    }
  }, [initialUrl]);

  const validateUrl = (input: string): boolean => {
    if (!input.trim()) {
      setError("URL cannot be empty");
      return false;
    }

    // Allow relative URLs or fragment links
    if (input.startsWith("/") || input.startsWith("#")) {
      setError("");
      return true;
    }

    // For absolute URLs, ensure they have a protocol or can be made valid
    try {
      const urlToTest = input.startsWith("http") ? input : `https://${input}`;
      new URL(urlToTest);
      setError("");
      return true;
    } catch {
      setError("Please enter a valid URL");
      return false;
    }
  };

  const handleSubmit = () => {
    if (!validateUrl(url)) return;

    // Normalize URL
    let normalizedUrl = url.trim();
    if (
      !normalizedUrl.startsWith("/") &&
      !normalizedUrl.startsWith("#") &&
      !normalizedUrl.startsWith("http")
    ) {
      normalizedUrl = `https://${normalizedUrl}`;
    }

    onSubmit(normalizedUrl);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSubmit();
    } else if (e.key === "Escape") {
      e.preventDefault();
      onClose();
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
            {initialUrl ? "Edit link" : "Link to URL"}
          </h2>
        </div>

        {/* Input */}
        <div className="p-4">
          <label
            className={`block text-sm font-medium mb-2 ${
              editorTheme === "dark" ? "text-slate-300" : "text-gray-700"
            }`}
          >
            URL
          </label>
          <input
            ref={inputRef}
            type="text"
            value={url}
            onChange={(e) => {
              setUrl(e.target.value);
              setError("");
            }}
            onKeyDown={handleKeyDown}
            placeholder="https://example.com or /relative/path"
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${
              error
                ? editorTheme === "dark"
                  ? "border-red-500 focus:ring-red-500 bg-red-500/10 text-red-300"
                  : "border-red-500 focus:ring-red-500 bg-red-50 text-red-900"
                : editorTheme === "dark"
                ? "bg-white/5 border-white/10 text-slate-100 placeholder-slate-400 focus:ring-purple-500"
                : "bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:ring-blue-500"
            }`}
          />
          {error && (
            <p
              className={`mt-2 text-sm ${
                editorTheme === "dark" ? "text-red-400" : "text-red-600"
              }`}
            >
              {error}
            </p>
          )}
          <p
            className={`mt-2 text-xs ${
              editorTheme === "dark" ? "text-slate-400" : "text-gray-500"
            }`}
          >
            External links will open in a new tab
          </p>
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
          <button
            onClick={handleSubmit}
            className={`px-4 py-2 text-sm rounded-md transition-colors ${
              editorTheme === "dark"
                ? "bg-purple-500 hover:bg-purple-600 text-white"
                : "bg-blue-500 hover:bg-blue-600 text-white"
            }`}
          >
            {initialUrl ? "Update" : "Insert"}
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
