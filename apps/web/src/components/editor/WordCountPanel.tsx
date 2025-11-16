import { useEffect, useMemo, useState } from "react";

export function WordCountPanel({ html }: { html: string }) {
  const [chars, setChars] = useState(0);

  const text = useMemo(() => {
    const div = document.createElement("div");
    div.innerHTML = html || "";
    const t = (div.textContent || "").replace(/\s+/g, " ").trim();
    return t;
  }, [html]);

  useEffect(() => setChars(text.length), [text]);

  const words = text ? text.split(" ").filter(Boolean).length : 0;
  const minutes = Math.max(1, Math.round(words / 200));

  return (
    <div className="mt-2 text-[11px] text-slate-400">
      {words} words • {chars} chars • ~{minutes} min read
    </div>
  );
}
