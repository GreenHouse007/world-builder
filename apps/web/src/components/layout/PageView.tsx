import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { usePages } from "../../store/pages";
import { useWorlds } from "../../store/worlds";
import { useAppStatus } from "../../store/appStatus";
import { api } from "../../services/http";
import { TextEditor } from "../editor/TextEditor";

function EditablePageTitle({ pageId, initialTitle }: { pageId: string; initialTitle: string }) {
  const { renamePage } = usePages();
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState(initialTitle);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setTitle(initialTitle);
  }, [initialTitle]);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleSave = async () => {
    if (!title.trim()) {
      setTitle(initialTitle);
      setIsEditing(false);
      return;
    }
    if (title !== initialTitle) {
      await renamePage(pageId, title.trim());
    }
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSave();
    } else if (e.key === "Escape") {
      setTitle(initialTitle);
      setIsEditing(false);
    }
  };

  if (isEditing) {
    return (
      <input
        ref={inputRef}
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onBlur={handleSave}
        onKeyDown={handleKeyDown}
        className="w-full text-3xl font-bold text-slate-100 bg-transparent border-b-2 border-purple-500 outline-none px-2 py-1"
        autoFocus
      />
    );
  }

  return (
    <h1
      onClick={() => setIsEditing(true)}
      className="text-3xl font-bold text-slate-100 cursor-pointer hover:text-purple-300 transition-colors px-2 py-1 rounded-lg hover:bg-white/5"
      title="Click to edit page title"
    >
      {title || "Untitled Page"}
    </h1>
  );
}

function useDebouncedCallback<Args extends readonly unknown[], R>(
  fn: (...args: Args) => R,
  delay = 3000
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
  const { currentPageId, pages } = usePages();
  const { setSaving, setSavedNow, setUnsavedChanges, setOffline } = useAppStatus();

  const currentPage = pages.find((p) => p._id === currentPageId);

  const [initial, setInitial] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadErr, setLoadErr] = useState<string | null>(null);

  // Detect online/offline status
  useEffect(() => {
    const handleOnline = () => setOffline(false);
    const handleOffline = () => setOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Set initial state
    setOffline(!navigator.onLine);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [setOffline]);

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
      setOffline(false);
      try {
        await api(`/pages/${currentPageId}/content`, {
          method: "PUT",
          body: JSON.stringify({ doc: html }),
        });
        setSavedNow();
      } catch (error) {
        // Check if error is network-related
        if (error instanceof TypeError || (error as any)?.message?.includes('fetch')) {
          setOffline(true);
        }
        throw error;
      } finally {
        setSaving(false);
      }
    },
    [currentPageId, setSaving, setSavedNow, setOffline]
  );

  const debouncedSave = useDebouncedCallback(save, 3000);

  const handleChange = useCallback((html: string) => {
    setUnsavedChanges(true);
    debouncedSave(html);
  }, [debouncedSave, setUnsavedChanges]);

  const header = useMemo(() => {
    if (!currentWorldId) return "Select or create a world";
    if (!currentPageId) return "Create or select a page";
    return null;
  }, [currentWorldId, currentPageId]);

  return (
    <div className="max-w-7xl mx-auto pt-6">
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

      {!header && !loading && !loadErr && currentPage && (
        <div className="space-y-4">
          <EditablePageTitle
            pageId={currentPageId!}
            initialTitle={currentPage.title}
          />
          <TextEditor
            key={currentPageId}
            initialContent={initial}
            onChange={handleChange}
            onSaveStart={() => setSaving(true)}
            onSaveEnd={() => setSaving(false)}
          />
        </div>
      )}
    </div>
  );
}
