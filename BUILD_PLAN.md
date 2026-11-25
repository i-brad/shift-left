# Build plan: every lesson

The checklist for finishing the course. Work top to bottom; tick a lesson only when its lesson file, scene, tests and (if listed) Kudi feature + bug + exercise are done, CI is green and it is pushed.

**Definition of done for a lesson**
- `packages/lessons/src/lessons/<id>.ts`: 6–9 steps (setup → problem → fix … → recap), at least one `predict`, at least one `goal`, a Go deeper per step, `check` (3 questions), `atWork` (5 items), glossary links for new terms
- Registered in `src/index.ts`, `built: true` in `course.ts`
- Unit tests in `lessons.test.ts`: goals reachable, predictions match the simulation
- If a new scene kind: pure sim in `packages/sim` + tests, evaluator in `evaluate.ts`, view/controls/metrics in `apps/site/components/scenes/`
- If an exercise: Kudi feature documented in `SPEC.md`, bug in `bugs.ts`, unit/API tests, `exercises/NN-<id>/` with README, HINTS, starter, solution; added to the CI loop
- Site e2e test that walks the lesson's goals
- Pushed; Vercel deploys from `main`

## Scene kinds

| Kind | What the learner does | Used by |
| --- | --- | --- |
| `boundaries` ✅ | Probe amounts on a 3D ruler, flip `<`/`<=` | Partitions and boundaries |
| `fees` ✅ | Flip three conditions on a 2×2×2 cube, reorder rules | Decision tables |
| `card` ✅ | Walk a 3D state map, fix the unfreeze check | State transitions |
| `board` ✅ | Select / classify tiles on a 3D board (findings, criteria, report fields, risks, review comments) | Exploratory, Acceptance criteria, Defect reports, Reviews, Risk-based, Planning, Errors/defects/failures, Why we test |
| `coverage` ✅ | Pick test inputs; 3D code paths light up; statement vs branch % | Statement and branch coverage |
| `pipeline` ✅ | Place checks on a conveyor of stages; see where a bug is caught and what it costs | Test levels, Confirmation vs regression, PR checks, Reports, Secrets, Parallel runs |
| `request` ✅ | Edit method, path, headers, body; see the response; toggle assertions | HTTP, Asserting responses, Authn vs authz, Negative tests, OWASP, Pact |
| `timing` ✅ | Turn a latency dial; tests wait, sleep or retry on a timeline | Waiting, Flaky tests, Load testing (k6) |
| `suite` ✅ | Workers × time lanes; data strategy, order, waits, retries | Fixtures, Test data, Flaky tests, Parallel runs |
| `page` ✅ | Redesign a 3D page; locators hold or snap | Locators, Fixtures and isolation, Traces, Structure, Test data, Maestro |

## Lessons

### Module 1 · Foundations
| | Lesson | CTFL | Scene | Kudi feature / bug | Exercise |
| --- | --- | --- | --- | --- | --- |
| [x] | Why we test | FL-1.1 | board | — | — |
| [x] | Errors, defects, failures | FL-1.2 | board | — | — |
| [x] | Test levels and types | FL-2.2 | pipeline | — | — |
| [x] | Confirmation vs regression | FL-2.2 | pipeline | — | — |
| [x] | Reviews and static testing | FL-3.1, 3.2 | board | — | — |
| [x] | Risk-based testing | FL-5.2 | board | — | — |
| [x] | Planning, estimation, reporting | FL-5.1, 5.3, 5.4 | board | — | — |

### Module 2 · Test design
| | Lesson | CTFL | Scene | Kudi feature / bug | Exercise |
| --- | --- | --- | --- | --- | --- |
| [x] | Partitions and boundaries | FL-4.2.1–2 | boundaries | transfer limits / `limit-exclusive` | 02 |
| [x] | Decision tables | FL-4.2.3 | fees | fees / `fee-express-first` | 03 |
| [x] | State transitions | FL-4.2.4 | card | card / `card-unblock` | 04 |
| [x] | Statement and branch coverage | FL-4.3 | coverage | cashback / `cashback-basic-undefined` | 05 (Vitest coverage) |
| [x] | Exploratory testing | FL-4.4 | board | — | Charter session on Kudi |
| [x] | Acceptance criteria and ATDD | FL-4.5 | board | — | — |
| [x] | Writing defect reports | FL-5.6 | board | — | — |

### Module 3 · API testing
| | Lesson | Scene | Kudi feature / bug | Exercise |
| --- | --- | --- | --- | --- |
| [x] | HTTP for testers | request | — | 06-api (one exercise for the module) |
| [x] | Asserting on responses | request | `history-amount-string` | 06-api |
| [x] | Authentication vs authorisation | request | `GET /api/transfers/:id`, `transfer-idor` | 06-api |
| [x] | Negative tests | request | `bad-json-500` | 06-api |

### Module 4 · Web automation
| | Lesson | Scene | Kudi feature / bug | Exercise |
| --- | --- | --- | --- | --- |
| [x] | Locators that last | page | `KUDI_REDESIGN=1` | 07-web (one exercise for the module) |
| [x] | Waiting, not sleeping | timing | `KUDI_LATENCY` | 07-web |
| [x] | Fixtures and isolation | suite | shared seed data | 07-web |
| [x] | Debugging with traces | page (trace) | `balance-stale` | 07-web |

### Module 5 · Framework
| | Lesson | Scene | Exercise |
| --- | --- | --- | --- |
| [ ] | Structure that scales | page | 14 page objects / fixtures |
| [ ] | Test data strategy | page | 15 factories |
| [ ] | Flaky tests | timing | 16 |

### Module 6 · CI/CD
| | Lesson | Scene | Exercise |
| --- | --- | --- | --- |
| [ ] | Checks on pull requests | pipeline | 17 workflow |
| [ ] | Reports and traces | pipeline | — |
| [ ] | Secrets | pipeline | — |
| [ ] | Parallel runs | pipeline | — |

### Module 7 · Branches (optional)
| | Lesson | Scene |
| --- | --- | --- |
| [ ] | Mobile with Maestro | page |
| [ ] | Load testing with k6 | timing |
| [ ] | OWASP for testers | request |
| [ ] | Contract tests with Pact | request |

### Module 8 · Capstone
| | Lesson | Scene |
| --- | --- | --- |
| [ ] | Test strategy for a new feature | board |
