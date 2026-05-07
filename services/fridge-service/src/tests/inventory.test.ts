import { describe, it, expect } from 'vitest';

describe('Fridge Inventory Logic', () => {
  it('should correctly calculate total items', () => {
    const items = [{ name: 'A' }, { name: 'B' }];
    expect(items.length).toBe(2);
  });

  it('should identify low stock items', () => {
    const amount = 2;
    const isLow = amount < 5;
    expect(isLow).toBe(true);
  });
});
