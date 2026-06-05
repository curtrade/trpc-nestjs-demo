export interface Item {
  id: string;
  name: string;
  /** Price in minor units (e.g. cents). Integer to avoid float rounding. */
  price: number;
  inStock: boolean;
}

/** Result of looking up an item. `null` means "no such item". */
export type ItemResult = Item | null;
