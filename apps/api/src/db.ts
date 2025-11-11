import { MongoClient, ObjectId, Collection } from "mongodb";

let client: MongoClient | null = null;

export { ObjectId };

export interface WorldMember {
  uid: string;
  role: "owner" | "admin" | "editor" | "viewer";
  addedAt: Date;
}

export interface WorldStats {
  pageCount: number;
  favoriteCount: number;
  collaboratorCount: number;
}

export interface WorldDoc {
  _id: ObjectId;
  ownerUid: string;
  name: string;
  emoji: string;
  members: WorldMember[];
  stats: WorldStats;
  createdAt: Date;
  updatedAt: Date;
  lastActivityAt: Date;
}

export interface PageDoc {
  _id: ObjectId;
  ownerUid: string;
  worldId: ObjectId;
  title: string;
  emoji: string;
  parentId: ObjectId | null;
  position: number;
  lastEditedBy?: string;
  lastEditedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface PageContentDoc {
  _id: ObjectId;
  ownerUid: string;
  worldId: ObjectId;
  pageId: ObjectId;
  doc: unknown;
  lastEditedBy?: string;
  updatedAt: Date;
}

export interface FavoriteDoc {
  _id: ObjectId;
  uid: string;
  worldId: ObjectId;
  pageId: ObjectId;
  createdAt: Date;
}

export interface WorldActivityDoc {
  _id: ObjectId;
  worldId: ObjectId;
  pageId?: ObjectId;
  actorUid: string;
  type: string;
  meta: Record<string, unknown>;
  createdAt: Date;
}

export interface Collections {
  Worlds: Collection<WorldDoc>;
  Pages: Collection<PageDoc>;
  PageContent: Collection<PageContentDoc>;
  Favorites: Collection<FavoriteDoc>;
  WorldActivity: Collection<WorldActivityDoc>;
}

let collections: Collections | null = null;

export async function initDb(): Promise<void> {
  if (client) return;

  const url = process.env.MONGO_URL;
  if (!url) throw new Error("MONGO_URL is not set");

  client = new MongoClient(url);
  await client.connect();

  const dbName = process.env.MONGO_DB || "enfield";
  const db = client.db(dbName);

  collections = {
    Worlds: db.collection<WorldDoc>("worlds"),
    Pages: db.collection<PageDoc>("pages"),
    PageContent: db.collection<PageContentDoc>("page_content"),
    Favorites: db.collection<FavoriteDoc>("favorites"),
    WorldActivity: db.collection<WorldActivityDoc>("world_activity"),
  };

  // Indexes (run once, cheap if they already exist)
  await Promise.all([
    collections.Worlds.createIndex({ ownerUid: 1 }),
    collections.Worlds.createIndex({ "members.uid": 1 }),
    collections.Pages.createIndex({ worldId: 1, parentId: 1, position: 1 }),
    collections.Pages.createIndex({ ownerUid: 1 }),
    collections.PageContent.createIndex({ pageId: 1 }),
    collections.Favorites.createIndex({ uid: 1, worldId: 1 }),
    collections.WorldActivity.createIndex({ worldId: 1, createdAt: -1 }),
  ]);
}

export function getCollections(): Collections {
  if (!collections) {
    throw new Error("Database not initialized. Call initDb() first.");
  }
  return collections;
}
