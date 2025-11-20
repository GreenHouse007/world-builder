import { useState } from "react";
import { createPortal } from "react-dom";

interface IconPickerModalProps {
  currentIcon?: string;
  onSelect: (icon: string) => void;
  onClose: () => void;
  interfaceTheme: "dark" | "light";
}

// Curated emoji list organized by category
const EMOJI_CATEGORIES = {
  Nature: ["🌍", "🌎", "🌏", "🌐", "🗺️", "🏔️", "⛰️", "🏕️", "🏞️", "🏜️", "🏖️", "🏝️"],
  Fantasy: ["⚔️", "🛡️", "🏰", "🏯", "🗡️", "🧙", "🧝", "🧛", "🧟", "🐉", "🦄", "🔮"],
  Space: ["🌟", "⭐", "✨", "🌠", "🌌", "🚀", "🛸", "🌙", "☀️", "🪐", "🌕", "🌑"],
  Objects: ["📖", "📚", "📜", "🗝️", "💎", "👑", "🎭", "🎪", "🎨", "🎬", "🎮", "🎲"],
  Symbols: ["⚡", "🔥", "💧", "❄️", "🌪️", "☁️", "🌈", "✨", "💫", "🔆", "🌤️", "⛈️"],
  Animals: ["🐺", "🦅", "🦉", "🐉", "🦁", "🐅", "🐆", "🦊", "🐻", "🦇", "🦈", "🐙"],
};

export function IconPickerModal({
  currentIcon,
  onSelect,
  onClose,
  interfaceTheme,
}: IconPickerModalProps) {
  const [selectedCategory, setSelectedCategory] = useState<keyof typeof EMOJI_CATEGORIES>("Nature");

  return createPortal(
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-[200]"
      onClick={onClose}
    >
      <div
        className={`rounded-3xl p-6 shadow-2xl max-w-md w-full mx-4 ${
          interfaceTheme === "dark"
            ? "bg-[#0a0f1a] border border-white/10"
            : "bg-white border border-gray-300"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h2
            className={`text-xl font-semibold ${
              interfaceTheme === "dark" ? "text-slate-100" : "text-gray-900"
            }`}
          >
            Choose Icon
          </h2>
          <button
            onClick={onClose}
            className={`text-2xl leading-none transition-colors ${
              interfaceTheme === "dark"
                ? "text-slate-400 hover:text-slate-200"
                : "text-gray-400 hover:text-gray-600"
            }`}
          >
            ×
          </button>
        </div>

        {/* Current Icon Display */}
        {currentIcon && (
          <div
            className={`mb-4 p-3 rounded-lg text-center ${
              interfaceTheme === "dark" ? "bg-white/5" : "bg-gray-100"
            }`}
          >
            <span className="text-4xl">{currentIcon}</span>
            <p
              className={`text-xs mt-1 ${
                interfaceTheme === "dark" ? "text-slate-400" : "text-gray-600"
              }`}
            >
              Current Icon
            </p>
          </div>
        )}

        {/* Category Tabs */}
        <div className="flex gap-1 mb-3 overflow-x-auto pb-2">
          {Object.keys(EMOJI_CATEGORIES).map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category as keyof typeof EMOJI_CATEGORIES)}
              className={`px-3 py-1.5 rounded-lg text-xs whitespace-nowrap transition-colors ${
                selectedCategory === category
                  ? interfaceTheme === "dark"
                    ? "bg-purple-500/20 text-purple-300 border border-purple-500/30"
                    : "bg-purple-100 text-purple-700 border border-purple-300"
                  : interfaceTheme === "dark"
                  ? "bg-white/5 text-slate-300 hover:bg-white/10"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              {category}
            </button>
          ))}
        </div>

        {/* Emoji Grid */}
        <div
          className={`grid grid-cols-6 gap-2 p-3 rounded-lg max-h-64 overflow-y-auto ${
            interfaceTheme === "dark"
              ? "bg-white/5 [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-white/5 [&::-webkit-scrollbar-thumb]:bg-white/20 [&::-webkit-scrollbar-thumb]:rounded-full"
              : "bg-gray-50 [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-gray-100 [&::-webkit-scrollbar-thumb]:bg-gray-300 [&::-webkit-scrollbar-thumb]:rounded-full"
          }`}
        >
          {EMOJI_CATEGORIES[selectedCategory].map((emoji) => (
            <button
              key={emoji}
              onClick={() => {
                onSelect(emoji);
                onClose();
              }}
              className={`w-12 h-12 text-3xl rounded-lg transition-all hover:scale-110 ${
                currentIcon === emoji
                  ? interfaceTheme === "dark"
                    ? "bg-purple-500/30 ring-2 ring-purple-500"
                    : "bg-purple-100 ring-2 ring-purple-400"
                  : interfaceTheme === "dark"
                  ? "hover:bg-white/10"
                  : "hover:bg-gray-200"
              }`}
              title={emoji}
            >
              {emoji}
            </button>
          ))}
        </div>

        {/* Footer Actions */}
        <div className="flex gap-3 mt-4">
          <button
            onClick={() => {
              onSelect("");
              onClose();
            }}
            className={`flex-1 px-4 py-2 rounded-lg text-sm transition-colors ${
              interfaceTheme === "dark"
                ? "bg-white/5 hover:bg-white/10 text-slate-200"
                : "bg-gray-100 hover:bg-gray-200 text-gray-900"
            }`}
          >
            Remove Icon
          </button>
          <button
            onClick={onClose}
            className={`flex-1 px-4 py-2 rounded-lg text-sm transition-colors ${
              interfaceTheme === "dark"
                ? "bg-purple-500/90 hover:bg-purple-500 text-white"
                : "bg-purple-600 hover:bg-purple-700 text-white"
            }`}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
