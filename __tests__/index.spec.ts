import { expect, test } from 'vitest';
import { sum } from '@/index';
test('Math.sqrt()', () => {
  expect(sum(1, 2)).toBe(3);
});
