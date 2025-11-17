import {
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
  closestCenter,
  type DragEndEvent,
} from "@dnd-kit/core";
import { useMemo } from "react";
import { usePages } from "../../store/pages";
import { SidebarPageItem } from "./SidebarPageItem";
import { useDroppable, useDraggable } from "@dnd-kit/core";

/** Domain types (matches store) */
export type PageNode = {
  _id: string;
  title: string;
  isCollapsed?: boolean;
  isFavorite?: boolean;
  children?: PageNode[];
};

type FlatRow = {
  id: string;
  depth: number;
  parentId: string | null;
  index: number;
  node: PageNode;
};

function flattenTree(
  tree: PageNode[],
  depth = 0,
  parentId: string | null = null
): FlatRow[] {
  const rows: FlatRow[] = [];
  tree.forEach((node, i) => {
    rows.push({ id: node._id, depth, parentId, index: i, node });
    if (!node.isCollapsed && node.children?.length) {
      rows.push(...flattenTree(node.children, depth + 1, node._id));
    }
  });
  return rows;
}

function idParts(
  droppableId: string
):
  | { kind: "before" | "after" | "on"; target: string }
  | { kind: "unknown"; target: "" } {
  if (droppableId.startsWith("before:"))
    return { kind: "before", target: droppableId.slice(7) };
  if (droppableId.startsWith("after:"))
    return { kind: "after", target: droppableId.slice(6) };
  if (droppableId.startsWith("on:"))
    return { kind: "on", target: droppableId.slice(3) };
  return { kind: "unknown", target: "" };
}

/** Small wrappers so dnd-kit can register zones */
function Droppable({
  id,
  className,
  style,
  children,
}: {
  id: string;
  className?: string;
  style?: React.CSSProperties;
  children?: React.ReactNode;
}) {
  const { setNodeRef, isOver } = useDroppable({ id });
  return (
    <div
      ref={setNodeRef}
      className={className}
      style={{
        ...(style ?? {}),
        // subtle feedback when hovering gutter/row
        background: isOver ? "rgba(99,102,241,0.08)" : undefined,
      }}
      data-droppable-id={id}
    >
      {children}
    </div>
  );
}

function DraggableRow({
  row,
  children,
}: {
  row: FlatRow;
  children: React.ReactNode;
}) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: row.id,
  });
  const style: React.CSSProperties | undefined = transform
    ? {
        transform: `translate3d(${Math.round(transform.x)}px, ${Math.round(
          transform.y
        )}px, 0)`,
      }
    : undefined;

  return (
    <div ref={setNodeRef} style={style} {...listeners} {...attributes}>
      {children}
    </div>
  );
}

export function DndTree({
  tree,
  filterVisible,
}: {
  tree: PageNode[];
  filterVisible: (id: string) => boolean;
}) {
  const { movePage } = usePages();

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } })
  );

  const rows = useMemo(() => flattenTree(tree), [tree]);
  const byId = useMemo(() => new Map(rows.map((r) => [r.id, r])), [rows]);

  function computeSiblingInsert(
    targetId: string,
    place: "before" | "after"
  ): { parentId: string | null; index: number } | null {
    const t = byId.get(targetId);
    if (!t) return null;
    const parentId = t.parentId;
    const index = place === "before" ? t.index : t.index + 1;
    return { parentId, index };
  }

  function computeReparent(
    targetId: string
  ): { parentId: string; index: number } | null {
    const t = byId.get(targetId);
    if (!t) return null;
    const parentId = t.id; // drop ON → child of target
    const childCount = t.node.children?.length ?? 0;
    return { parentId, index: childCount };
  }

  async function handleDragEnd(e: DragEndEvent) {
    const active = e.active?.id as string | undefined;
    const over = e.over?.id as string | undefined;
    if (!active || !over || active === over) return;

    const { kind, target } = idParts(over);
    if (!target) return;

    if (kind === "before" || kind === "after") {
      const pos = computeSiblingInsert(target, kind);
      if (pos) await movePage(active, pos.parentId, pos.index);
    } else if (kind === "on") {
      const pos = computeReparent(target);
      if (pos) await movePage(active, pos.parentId, pos.index);
    }
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <div>
        {rows.map((row) => {
          const visible = filterVisible(row.id);
          if (!visible) return null;

          const padLeft = 8 + row.depth * 14;

          return (
            <div key={`row:${row.id}`}>
              {/* BEFORE gutter */}
              <Droppable
                id={`before:${row.id}`}
                className="h-2"
                style={{ paddingLeft: padLeft }}
              />

              {/* ROW BODY is both droppable (ON: reparent) and draggable */}
              <Droppable id={`on:${row.id}`}>
                <DraggableRow row={row}>
                  <SidebarPageItem node={row.node} depth={row.depth} visible />
                </DraggableRow>
              </Droppable>

              {/* AFTER gutter */}
              <Droppable
                id={`after:${row.id}`}
                className="h-2"
                style={{ paddingLeft: padLeft }}
              />
            </div>
          );
        })}
      </div>
    </DndContext>
  );
}
