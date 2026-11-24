export * from './types';
export * from './course';
export * from './evaluate';
export * from './glossary';
import { acceptanceCriteria } from './lessons/acceptance-criteria';
import { coverage } from './lessons/coverage';
import { decisionTables } from './lessons/decision-tables';
import { defectReports } from './lessons/defect-reports';
import { exploratory } from './lessons/exploratory';
import { errorsDefectsFailures, testLevels, whyWeTest } from './lessons/module-1a';
import { confirmationRegression, planningReporting, reviewsStatic, riskBased } from './lessons/module-1b';
import { assertingResponses, authnAuthz, httpForTesters, negativeTests } from './lessons/module-3';
import { partitionsBoundaries } from './lessons/partitions-boundaries';
import { stateTransitions } from './lessons/state-transitions';
import type { Lesson } from './types';

export const lessons: Record<string, Lesson> = {
  [whyWeTest.id]: whyWeTest,
  [errorsDefectsFailures.id]: errorsDefectsFailures,
  [testLevels.id]: testLevels,
  [confirmationRegression.id]: confirmationRegression,
  [reviewsStatic.id]: reviewsStatic,
  [riskBased.id]: riskBased,
  [planningReporting.id]: planningReporting,
  [partitionsBoundaries.id]: partitionsBoundaries,
  [decisionTables.id]: decisionTables,
  [stateTransitions.id]: stateTransitions,
  [coverage.id]: coverage,
  [exploratory.id]: exploratory,
  [acceptanceCriteria.id]: acceptanceCriteria,
  [defectReports.id]: defectReports,
  [httpForTesters.id]: httpForTesters,
  [assertingResponses.id]: assertingResponses,
  [authnAuthz.id]: authnAuthz,
  [negativeTests.id]: negativeTests,
};

export { httpForTesters, assertingResponses, authnAuthz, negativeTests };

export { whyWeTest, errorsDefectsFailures, testLevels, confirmationRegression, reviewsStatic, riskBased, planningReporting };
export { acceptanceCriteria, coverage, decisionTables, defectReports, exploratory, partitionsBoundaries, stateTransitions };
