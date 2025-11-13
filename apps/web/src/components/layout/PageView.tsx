import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { usePages } from "../../store/pages";
import { useWorlds } from "../../store/worlds";
import { useAppStatus } from "../../store/appStatus";
import { api } from "../../services/http";
import { TextEditor } from "../editor/TextEditor";

function useDebouncedCallback<Args extends readonly unknown[], R>(
  fn: (...args: Args) => R,
  delay = 900
) {
  const t = useRef<number | null>(null);
  const fnRef = useRef<(...args: Args) => R>(fn);

  useEffect(() => {
    fnRef.current = fn;
  }, [fn]);

  return useCallback(
    (...args: Args) => {
      if (t.current) window.clearTimeout(t.current);
      t.current = window.setTimeout(() => {
        // ignore any returned Promise/value
        void fnRef.current(...args);
      }, delay);
    },
    [delay]
  ) as (...args: Args) => void;
}

type GetContentResp = { doc: string | null };

export default function PageView() {
  const { currentWorldId } = useWorlds();
  const { currentPageId } = usePages();
  const { setSaving, setSavedNow } = useAppStatus();

  const [initial, setInitial] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadErr, setLoadErr] = useState<string | null>(null);

  useEffect(() => {
    if (!currentPageId) {
      setInitial(null);
      return;
    }
    setLoading(true);
    setLoadErr(null);
    api<GetContentResp>(`/pages/${currentPageId}/content`)
      .then((res) => setInitial(res?.doc ?? ""))
      .catch((e) => setLoadErr(e?.message || "Failed to load content"))
      .finally(() => setLoading(false));
  }, [currentPageId]);

  const save = useCallback(
    async (html: string) => {
      if (!currentPageId) return;
      setSaving(true);
      try {
        await api(`/pages/${currentPageId}/content`, {
          method: "PUT",
          body: JSON.stringify({ doc: html }),
        });
        setSavedNow();
      } finally {
        setSaving(false);
      }
    },
    [currentPageId, setSaving, setSavedNow]
  );

  const debouncedSave = useDebouncedCallback(save, 900);

  const header = useMemo(() => {
    if (!currentWorldId) return "Select or create a world";
    if (!currentPageId) return "Create or select a page";
    return null;
  }, [currentWorldId, currentPageId]);

  return (
    <div className="max-w-4xl mx-auto pt-6">
      {header && (
        <div className="text-sm text-slate-400 border border-dashed border-white/10 rounded-xl p-6 text-center">
          {header}
        </div>
      )}

      {!header && loading && (
        <div className="text-sm text-slate-400 border border-white/10 rounded-xl p-6">
          Loading content…
        </div>
      )}

      {!header && loadErr && (
        <div className="text-sm text-red-400 border border-red-500/20 rounded-xl p-6">
          {loadErr}
        </div>
      )}

      {!header && !loading && !loadErr && (
        <TextEditor
          key={currentPageId}
          initialContent={initial}
          onChange={debouncedSave}
          onSaveStart={() => setSaving(true)}
          onSaveEnd={() => setSaving(false)}
        />
      )}
    </div>
  );
}
