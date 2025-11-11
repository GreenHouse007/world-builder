export interface World {
  _id: string;
  name: string;
  emoji?: string;
}

export interface Page {
  _id: string;
  worldId: string;
  title: string;
  emoji?: string;
  parentId?: string | null;
  position: number;
  isFavorite?: boolean;
}
