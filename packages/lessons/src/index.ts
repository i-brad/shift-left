export * from './types';
export * from './course';
export * from './evaluate';
export * from './glossary';
import { acceptanceCriteria } from './lessons/acceptance-criteria';
import { coverage } from './lessons/coverage';
import { decisionTables } from './lessons/decision-tables';
import { defectReports } from './lessons/defect-reports';
import { exploratory } from './lessons/exploratory';
import { partitionsBoundaries } from './lessons/partitions-boundaries';
import { stateTransitions } from './lessons/state-transitions';
import type { Lesson } from './types';

export const lessons: Record<string, Lesson> = {
  [partitionsBoundaries.id]: partitionsBoundaries,
  [decisionTables.id]: decisionTables,
  [stateTransitions.id]: stateTransitions,
  [coverage.id]: coverage,
  [exploratory.id]: exploratory,
  [acceptanceCriteria.id]: acceptanceCriteria,
  [defectReports.id]: defectReports,
};

export { acceptanceCriteria, coverage, decisionTables, defectReports, exploratory, partitionsBoundaries, stateTransitions };
