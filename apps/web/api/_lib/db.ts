import { MongoClient, ObjectId, Collection } from "mongodb";

let client: MongoClient | null = null;

export { ObjectId };

export interface WorldMember {
  uid: string;
  email?: string;
  displayName?: string;
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
  emoji?: string;
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
  actorName?: string;
  type: string;
  meta: Record<string, unknown>;
  createdAt: Date;
}

export interface WorldInvitationDoc {
  _id: ObjectId;
  worldId: ObjectId;
  worldName: string;
  inviterUid: string;
  inviterEmail: string;
  inviteeEmail: string;
  role: "admin" | "editor";
  status: "pending" | "accepted" | "rejected";
  createdAt: Date;
  respondedAt?: Date;
}

export interface Collections {
  Worlds: Collection<WorldDoc>;
  Pages: Collection<PageDoc>;
  PageContent: Collection<PageContentDoc>;
  Favorites: Collection<FavoriteDoc>;
  WorldActivity: Collection<WorldActivityDoc>;
  WorldInvitations: Collection<WorldInvitationDoc>;
}

let collections: Collections | null = null;

export async function getCollections(): Promise<Collections> {
  if (collections) return collections;

  const url = process.env.MONGO_URL;
  if (!url) throw new Error("MONGO_URL is not set");

  try {
    if (!client) {
      client = new MongoClient(url);
      await client.connect();
    }

    const dbName = process.env.MONGO_DB || "enfield";
    const db = client.db(dbName);

    const cols: Collections = {
      Worlds: db.collection<WorldDoc>("worlds"),
      Pages: db.collection<PageDoc>("pages"),
      PageContent: db.collection<PageContentDoc>("page_content"),
      Favorites: db.collection<FavoriteDoc>("favorites"),
      WorldActivity: db.collection<WorldActivityDoc>("world_activity"),
      WorldInvitations: db.collection<WorldInvitationDoc>("world_invitations"),
    };

    // Indexes (cheap if they already exist)
    await Promise.all([
      cols.Worlds.createIndex({ ownerUid: 1 }),
      cols.Worlds.createIndex({ "members.uid": 1 }),
      cols.Pages.createIndex({ worldId: 1, parentId: 1, position: 1 }),
      cols.Pages.createIndex({ ownerUid: 1 }),
      cols.PageContent.createIndex({ pageId: 1, ownerUid: 1 }),
      cols.Favorites.createIndex({ uid: 1, worldId: 1 }),
      cols.WorldActivity.createIndex({ worldId: 1, createdAt: -1 }),
      cols.WorldInvitations.createIndex({ inviteeEmail: 1, status: 1 }),
      cols.WorldInvitations.createIndex({ worldId: 1, inviteeEmail: 1 }),
    ]);

    collections = cols;
    return collections;
  } catch (err) {
    // Reset so the next request retries the connection rather than using a
    // broken client.
    client = null;
    collections = null;
    throw err;
  }
}
