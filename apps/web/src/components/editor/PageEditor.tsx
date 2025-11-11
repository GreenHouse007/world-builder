// apps/web/src/components/editor/PageEditor.tsx
import { useEffect, useRef, useState } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { usePages } from "../../store/pages";
import { useAppStatus } from "../../store/appStatus";
import { api } from "../../services/http";

type PageDocResponse = {
  doc: Record<string, unknown> | null;
  updatedAt?: string | null;
};

export function PageEditor() {
  const { currentPageId } = usePages();
  const { startSaving, finishSaving } = useAppStatus();
  const [loading, setLoading] = useState(false);
  const saveTimeout = useRef<number | null>(null);

  const editor = useEditor({
    extensions: [StarterKit],
    content: "",
    editable: true,
    onUpdate: ({ editor }) => {
      const json = editor.getJSON() as Record<string, unknown>;
      queueSave(json);
    },
  });

  // Load content when page changes
  useEffect(() => {
    if (!editor) return;

    if (!currentPageId) {
      editor.commands.setContent("");
      return;
    }

    let cancelled = false;

    (async () => {
      setLoading(true);
      try {
        const res = await api<PageDocResponse>(
          `/pages/${currentPageId}/content`
        );
        if (cancelled) return;
        if (res.doc) {
          editor.commands.setContent(res.doc);
        } else {
          // fresh page
          editor.commands.setContent("");
        }
      } catch (err) {
        console.error("Failed to load page content", err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [currentPageId, editor]);

  const queueSave = (doc: Record<string, unknown>) => {
    if (!currentPageId) return;
    startSaving();

    if (saveTimeout.current) {
      window.clearTimeout(saveTimeout.current);
    }

    saveTimeout.current = window.setTimeout(async () => {
      try {
        await api<{ ok: boolean; updatedAt: string }>(
          `/pages/${currentPageId}/content`,
          {
            method: "PUT",
            body: JSON.stringify({ doc }),
          }
        );
      } catch (err) {
        console.error("Failed to save content", err);
      } finally {
        finishSaving();
      }
    }, 600);
  };

  if (!editor || !currentPageId) {
    // No page selected → show nothing here (Dashboard handles empty state)
    return null;
  }

  return (
    <div className="h-full w-full">
      {loading && (
        <div className="text-[10px] text-slate-500 mb-2">Loading page…</div>
      )}
      <div className="bg-[#050814] border border-white/5 rounded-3xl p-6 text-slate-100 text-sm min-h-[400px]">
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}
