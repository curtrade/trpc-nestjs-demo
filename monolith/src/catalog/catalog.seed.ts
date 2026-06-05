import { Item } from './catalog.types';

/** Deterministic seed so README examples are reproducible. Prices in cents. */
export const SEED_ITEMS: Item[] = [
  { id: 'i1', name: 'Coffee Mug', price: 1200, inStock: true },
  { id: 'i2', name: 'T-Shirt', price: 2500, inStock: true },
  { id: 'i3', name: 'Sticker Pack', price: 500, inStock: false },
];
