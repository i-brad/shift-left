export * from './types';
export * from './course';
export * from './evaluate';
export * from './glossary';
import { decisionTables } from './lessons/decision-tables';
import { partitionsBoundaries } from './lessons/partitions-boundaries';
import { stateTransitions } from './lessons/state-transitions';
import type { Lesson } from './types';

export const lessons: Record<string, Lesson> = {
  [partitionsBoundaries.id]: partitionsBoundaries,
  [decisionTables.id]: decisionTables,
  [stateTransitions.id]: stateTransitions,
};

export { decisionTables, partitionsBoundaries, stateTransitions };
