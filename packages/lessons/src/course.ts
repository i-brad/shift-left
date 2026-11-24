import type { CourseModule } from './types';

/**
 * The course outline. Follows the QA roadmap stages; lessons marked with CTFL v4.0 chapters.
 * `built: true` = has a playable lesson file.
 */
export const course: CourseModule[] = [
  {
    n: 1, title: 'Foundations', color: '#e2c79a', lessons: [
      { id: 'why-we-test', title: 'Why we test', ctfl: ['FL-1.1'], built: false },
      { id: 'errors-defects-failures', title: 'Errors, defects, failures', ctfl: ['FL-1.2'], built: false },
      { id: 'test-levels', title: 'Test levels and types', ctfl: ['FL-2.2'], built: false },
      { id: 'confirmation-regression', title: 'Confirmation vs regression', ctfl: ['FL-2.2'], built: false },
      { id: 'reviews-static', title: 'Reviews and static testing', ctfl: ['FL-3.1', 'FL-3.2'], built: false },
      { id: 'risk-based', title: 'Risk-based testing', ctfl: ['FL-5.2'], built: false },
      { id: 'planning-reporting', title: 'Planning, estimation, reporting', ctfl: ['FL-5.1', 'FL-5.3', 'FL-5.4'], built: false },
    ],
  },
  {
    n: 2, title: 'Test design', color: '#9fd08a', lessons: [
      { id: 'partitions-boundaries', title: 'Partitions and boundaries', ctfl: ['FL-4.2.1', 'FL-4.2.2'], built: true },
      { id: 'decision-tables', title: 'Decision tables', ctfl: ['FL-4.2.3'], built: false },
      { id: 'state-transitions', title: 'State transitions', ctfl: ['FL-4.2.4'], built: false },
      { id: 'coverage', title: 'Statement and branch coverage', ctfl: ['FL-4.3'], built: false },
      { id: 'exploratory', title: 'Exploratory testing', ctfl: ['FL-4.4'], built: false },
      { id: 'acceptance-criteria', title: 'Acceptance criteria and ATDD', ctfl: ['FL-4.5'], built: false },
      { id: 'defect-reports', title: 'Writing defect reports', ctfl: ['FL-5.6'], built: false },
    ],
  },
  {
    n: 3, title: 'API testing', color: '#b9a3ea', lessons: [
      { id: 'http-for-testers', title: 'HTTP for testers', built: false },
      { id: 'asserting-responses', title: 'Asserting on responses', built: false },
      { id: 'authn-authz', title: 'Authentication vs authorisation', built: false },
      { id: 'negative-tests', title: 'Negative tests', built: false },
    ],
  },
  {
    n: 4, title: 'Web automation', color: '#f0a76a', lessons: [
      { id: 'locators', title: 'Locators that last', ctfl: ['FL-6.1', 'FL-6.2'], built: false },
      { id: 'waiting', title: 'Waiting, not sleeping', built: false },
      { id: 'fixtures', title: 'Fixtures and isolation', built: false },
      { id: 'traces', title: 'Debugging with traces', built: false },
    ],
  },
  {
    n: 5, title: 'Framework', color: '#7fb0ea', lessons: [
      { id: 'structure', title: 'Structure that scales', built: false },
      { id: 'test-data', title: 'Test data strategy', built: false },
      { id: 'flaky', title: 'Flaky tests', built: false },
    ],
  },
  {
    n: 6, title: 'CI/CD', color: '#6cc4b4', lessons: [
      { id: 'pr-checks', title: 'Checks on pull requests', ctfl: ['FL-2.1'], built: false },
      { id: 'reports', title: 'Reports and traces', built: false },
      { id: 'secrets', title: 'Secrets', built: false },
      { id: 'parallel', title: 'Parallel runs', built: false },
    ],
  },
  {
    n: 7, title: 'Branches', color: '#ef8fa6', optional: true, lessons: [
      { id: 'maestro', title: 'Mobile with Maestro', built: false },
      { id: 'k6', title: 'Load testing with k6', built: false },
      { id: 'owasp', title: 'OWASP for testers', built: false },
      { id: 'pact', title: 'Contract tests with Pact', built: false },
    ],
  },
  {
    n: 8, title: 'Capstone', color: '#8a93b5', lessons: [
      { id: 'capstone', title: 'Test strategy for a new feature', built: false },
    ],
  },
];

export const lessonCount = course.reduce((n, m) => n + m.lessons.length, 0);
