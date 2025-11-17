import { usePages } from "../../store/pages";
import { useWorlds } from "../../store/worlds";
import { useEffect, useState } from "react";
import { api } from "../../services/http";
//import { PageEditor } from "../../components/editor/PageEditor";
import PageView from "../../components/layout/PageView";
import UserSettings from "../settings/UserSettings";

interface ActivityEvent {
  _id: string;
  worldId: string;
  pageId: string | null;
  actorUid: string;
  type: string;
  meta: {
    title?: string;
    oldTitle?: string;
    newTitle?: string;
    parentId?: string | null;
    wordCountDiff?: number;
    oldWordCount?: number;
    newWordCount?: number;
  };
  createdAt: string;
}

function HomePage() {
  const { currentPageId, pages, setCurrentPage } = usePages();
  const { currentWorldId } = useWorlds();
  const [activities, setActivities] = useState<ActivityEvent[]>([]);
  const [showAllActivities, setShowAllActivities] = useState(false);

  // Get favorite pages from current world
  const favoritePages = pages.filter(page => page.isFavorite);

  // Fetch activity log
  useEffect(() => {
    if (!currentWorldId) return;
    api<ActivityEvent[]>(`/worlds/${currentWorldId}/activity`)
      .then(data => setActivities(data.slice(0, 20))) // Fetch top 20
      .catch(err => console.error('Failed to fetch activity', err));
  }, [currentWorldId, pages]); // Refetch when pages change

  // Show 5 or 20 based on expanded state
  const displayedActivities = showAllActivities ? activities : activities.slice(0, 5);

  const formatRelativeTime = (dateStr: string | Date | undefined) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const getActivityDisplay = (activity: ActivityEvent) => {
    const page = pages.find(p => p._id === activity.pageId);
    const pageTitle = page?.title || activity.meta.title || 'Unknown page';
    const isDeleted = !page && activity.type === 'page_deleted';

    let icon = '📄';
    let action = '';
    let actionColor = 'text-slate-400';
    let extraInfo = '';

    switch (activity.type) {
      case 'page_created':
        icon = '➕';
        action = 'created';
        actionColor = 'text-green-400';
        break;
      case 'page_deleted':
        icon = '🗑️';
        action = 'deleted';
        actionColor = 'text-red-400';
        break;
      case 'page_renamed':
        icon = '✏️';
        action = 'renamed';
        actionColor = 'text-yellow-400';
        break;
      case 'page_moved':
        icon = '📦';
        action = 'moved';
        actionColor = 'text-blue-400';
        break;
      case 'page_duplicated':
        icon = '📋';
        action = 'duplicated';
        actionColor = 'text-purple-400';
        break;
      case 'content_updated':
        icon = '✍️';
        action = 'edited';
        actionColor = 'text-indigo-400';
        // Add word count info
        if (activity.meta.wordCountDiff !== undefined) {
          const diff = activity.meta.wordCountDiff;
          if (diff > 0) {
            extraInfo = `+${diff} words`;
          } else if (diff < 0) {
            extraInfo = `${diff} words`;
          }
        }
        break;
      default:
        action = activity.type;
    }

    // Get user name or email (fallback to UID)
    const userName = activity.actorUid.includes('@')
      ? activity.actorUid.split('@')[0]
      : activity.actorUid;

    return { icon, action, actionColor, pageTitle, isDeleted, page, extraInfo, userName };
  };

  // If settings is selected, show settings page
  if (currentPageId === "settings") {
    return <UserSettings />;
  }

  // If a page is selected, show the editor
  if (currentPageId) {
    return <PageView />;
  }

  // Otherwise show the dashboard
  return (
    <div className="grid grid-cols-[minmax(0,2.2fr)_minmax(260px,0.9fr)] gap-6 pt-6">
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

        {/* Recent Activity Widget */}
        {activities.length > 0 && (
          <div className="bg-white/3 border border-blue-500/30 rounded-3xl p-4 text-xs">
            <div className="font-medium text-slate-100 flex items-center justify-between">
              <span className="flex items-center gap-2">🕐 Recent Activity</span>
              {activities.length > 5 && (
                <button
                  onClick={() => setShowAllActivities(!showAllActivities)}
                  className="text-blue-400 hover:text-blue-300 text-[10px] px-2 py-1 rounded bg-blue-500/10 hover:bg-blue-500/20 transition-colors"
                >
                  {showAllActivities ? 'Show Less' : `Show All (${activities.length})`}
                </button>
              )}
            </div>
            <ul className="mt-3 space-y-2.5">
              {displayedActivities.map((activity) => {
                const { icon, action, actionColor, pageTitle, isDeleted, page, extraInfo, userName } = getActivityDisplay(activity);
                return (
                  <li key={activity._id} className="flex items-start gap-2">
                    <span className="text-base mt-0.5 shrink-0">{icon}</span>
                    <div className="flex-1 min-w-0">
                      {/* Desktop: horizontal layout */}
                      <div className="hidden md:flex md:items-center md:gap-3 md:flex-wrap">
                        <span className={`font-medium ${actionColor} shrink-0`}>{action}</span>
                        {isDeleted ? (
                          <span className="text-slate-400 line-through truncate">
                            {pageTitle}
                          </span>
                        ) : page ? (
                          <button
                            onClick={() => setCurrentPage(page._id)}
                            className="text-slate-300 hover:text-blue-300 transition-colors truncate"
                          >
                            {pageTitle}
                          </button>
                        ) : (
                          <span className="text-slate-400 truncate">{pageTitle}</span>
                        )}
                        {extraInfo && (
                          <span className="text-emerald-400 text-[10px] shrink-0">({extraInfo})</span>
                        )}
                        <span className="text-slate-500 text-[10px] shrink-0">by {userName}</span>
                        <span className="text-slate-500 text-[10px] shrink-0">• {formatRelativeTime(activity.createdAt)}</span>
                      </div>

                      {/* Mobile: stacked layout */}
                      <div className="md:hidden">
                        <div className="flex items-baseline gap-1.5 flex-wrap">
                          <span className={`font-medium ${actionColor}`}>{action}</span>
                          {isDeleted ? (
                            <span className="text-slate-400 line-through truncate">
                              {pageTitle}
                            </span>
                          ) : page ? (
                            <button
                              onClick={() => setCurrentPage(page._id)}
                              className="text-slate-300 hover:text-blue-300 transition-colors truncate"
                            >
                              {pageTitle}
                            </button>
                          ) : (
                            <span className="text-slate-400 truncate">{pageTitle}</span>
                          )}
                          {extraInfo && (
                            <span className="text-emerald-400 text-[10px]">({extraInfo})</span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-0.5 text-[10px] text-slate-500">
                          <span>{userName}</span>
                          <span>•</span>
                          <span>{formatRelativeTime(activity.createdAt)}</span>
                        </div>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </section>

      {/* Right: side widgets */}
      <aside className="space-y-4 text-xs">
        {/* Favorites widget */}
        <div className="bg-white/3 border border-amber-500/30 rounded-3xl p-4">
          <div className="font-medium text-slate-100 flex items-center gap-2">
            ⭐ Favorite Pages
          </div>
          {favoritePages.length > 0 ? (
            <ul className="mt-2 space-y-1">
              {favoritePages.map((page) => (
                <li key={page._id}>
                  <button
                    onClick={() => setCurrentPage(page._id)}
                    className="text-slate-300 hover:text-amber-300 transition-colors text-left w-full truncate"
                  >
                    {page.title}
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-2 text-slate-400">
              No favorites yet. Click the star next to any page in the sidebar to add it here.
            </p>
          )}
        </div>

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
