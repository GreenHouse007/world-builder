import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { usePages } from "../../store/pages";
import { useWorlds } from "../../store/worlds";
import { useAppStatus } from "../../store/appStatus";
import { useTheme } from "../../store/theme";
import { api } from "../../services/http";
import { TextEditor } from "../editor/TextEditor";

function EditablePageTitle({ pageId, initialTitle }: { pageId: string; initialTitle: string }) {
  const { renamePage } = usePages();
  const { interfaceTheme } = useTheme();
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
        className={`w-full text-3xl font-bold bg-transparent border-b-2 border-purple-500 outline-none px-2 py-1 ${
          interfaceTheme === "dark" ? "text-slate-100" : "text-gray-900"
        }`}
        autoFocus
      />
    );
  }

  return (
    <h1
      onClick={() => setIsEditing(true)}
      className={`text-3xl font-bold cursor-pointer transition-colors px-2 py-1 rounded-lg ${
        interfaceTheme === "dark"
          ? "text-slate-100 hover:text-purple-300 hover:bg-white/5"
          : "text-gray-900 hover:text-purple-600 hover:bg-gray-100"
      }`}
      title="Click to edit page title"
    >
      {title || "Untitled Page"}
    </h1>
  );
}

function useDebouncedCallback<Args extends readonly unknown[], R>(
  fn: (...args: Args) => R,
  delay = 3000
): [(...args: Args) => void, () => void] {
  const t = useRef<number | null>(null);
  const fnRef = useRef<(...args: Args) => R>(fn);

  useEffect(() => {
    fnRef.current = fn;
  }, [fn]);

  const debounced = useCallback(
    (...args: Args) => {
      if (t.current) window.clearTimeout(t.current);
      t.current = window.setTimeout(() => {
        t.current = null;
        void fnRef.current(...args);
      }, delay);
    },
    [delay]
  ) as (...args: Args) => void;

  const cancel = useCallback(() => {
    if (t.current !== null) {
      window.clearTimeout(t.current);
      t.current = null;
    }
  }, []);

  return [debounced, cancel];
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

  const pendingHtmlRef = useRef<string | null>(null);

  const save = useCallback(
    async (html: string) => {
      pendingHtmlRef.current = null;
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

  // saveRef always points to the current page's save so the [currentPageId]
  // cleanup can flush pending content to the *old* page, not the new one.
  const saveRef = useRef(save);
  useEffect(() => { saveRef.current = save; }, [save]);

  const [debouncedSave, cancelDebouncedSave] = useDebouncedCallback(save, 3000);

  const handleChange = useCallback((html: string) => {
    pendingHtmlRef.current = html;
    setUnsavedChanges(true);
    debouncedSave(html);
  }, [debouncedSave, setUnsavedChanges]);

  useEffect(() => {
    if (!currentPageId) {
      setInitial(null);
      return;
    }
    let isCurrent = true;
    setLoading(true);
    setLoadErr(null);
    api<GetContentResp>(`/pages/${currentPageId}/content`)
      .then((res) => { if (isCurrent) setInitial(res?.doc ?? ""); })
      .catch((e) => { if (isCurrent) setLoadErr(e?.message || "Failed to load content"); })
      .finally(() => { if (isCurrent) setLoading(false); });

    return () => {
      isCurrent = false;
      // Cancel any pending debounce and immediately flush unsaved content for
      // the *current* page before switching to a new one. saveRef.current still
      // points to the old page's save here because the [save] effect hasn't
      // re-run yet with the new page's save callback.
      cancelDebouncedSave();
      const pending = pendingHtmlRef.current;
      if (pending !== null) {
        pendingHtmlRef.current = null;
        void saveRef.current(pending);
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPageId]);

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
            currentPageId={currentPageId}
          />
        </div>
      )}
    </div>
  );
}
