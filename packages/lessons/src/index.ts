export * from './types';
export * from './course';
export * from './evaluate';
export * from './glossary';
import { partitionsBoundaries } from './lessons/partitions-boundaries';
import type { Lesson } from './types';

export const lessons: Record<string, Lesson> = {
  [partitionsBoundaries.id]: partitionsBoundaries,
};

export { partitionsBoundaries };
