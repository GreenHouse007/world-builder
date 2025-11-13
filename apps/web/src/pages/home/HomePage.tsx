import { usePages } from "../../store/pages";
//import { PageEditor } from "../../components/editor/PageEditor";
import PageView from "../../components/layout/PageView";

function HomePage() {
  const { currentPageId } = usePages();

  // If a page is selected, show the editor
  if (currentPageId) {
    return <PageView />;
  }

  // Otherwise show the dashboard
  return (
    <div className="grid grid-cols-[minmax(0,2.2fr)_minmax(260px,0.9fr)] gap-6">
      {/* Left: main dashboard */}
      <section className="space-y-6">
        <div className="bg-white/5 border border-white/10 rounded-3xl p-6 shadow-xl">
          <div className="text-[10px] font-semibold tracking-[0.2em] text-slate-500 uppercase">
            World Builder Overview
          </div>
          <h2 className="mt-1 text-2xl font-semibold text-slate-100">
            Start by choosing a world and creating a page.
          </h2>
          <p className="mt-2 text-sm text-slate-400 max-w-xl">
            Use the top bar to create or switch worlds. Then use the sidebar to
            add pages for locations, factions, timelines, magic systems, and
            more. Click a page on the left to open its rich editor here.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4 text-xs">
          <div className="bg-white/3 border border-white/8 rounded-3xl p-4">
            <div className="font-medium text-slate-100">Infinite structure</div>
            <p className="mt-1 text-slate-400">
              Nest pages for continents, regions, cities, characters, and scenes
              to keep your lore navigable.
            </p>
          </div>
          <div className="bg-white/3 border border-indigo-500/40 rounded-3xl p-4">
            <div className="font-medium text-slate-100">
              Writing-first editor
            </div>
            <p className="mt-1 text-slate-400">
              Clean Tiptap editor with autosave so you can stay in flow while
              Enfield handles structure.
            </p>
          </div>
        </div>
      </section>

      {/* Right: side widgets */}
      <aside className="space-y-4 text-xs">
        <div className="bg-white/3 border border-white/8 rounded-3xl p-4">
          <div className="font-medium text-slate-100">Quick tips</div>
          <ul className="mt-2 space-y-1 text-slate-400">
            <li>🪐 Create a world from the top bar.</li>
            <li>📄 Add a page in the sidebar for that world.</li>
            <li>✏️ Click the page to open the editor here.</li>
          </ul>
        </div>

        <div className="bg-white/3 border border-white/8 rounded-3xl p-4">
          <div className="font-medium text-slate-100">Coming soon</div>
          <ul className="mt-2 space-y-1 text-slate-400">
            <li>👥 Real-time collaboration.</li>
            <li>📚 Multi-document PDF exports.</li>
            <li>🔗 Linked references across worlds.</li>
          </ul>
        </div>
      </aside>
    </div>
  );
}

export default HomePage;
