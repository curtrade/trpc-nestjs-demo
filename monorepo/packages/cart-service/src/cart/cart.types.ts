export interface CartLine {
  itemId: string;
  name: string;
  /** Unit price in minor units (cents), copied from Catalog at add time. */
  unitPrice: number;
  qty: number;
}

export interface Cart {
  userId: string;
  lines: CartLine[];
  /** Sum of unitPrice * qty across lines, in minor units. */
  total: number;
}
