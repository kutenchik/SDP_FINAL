# Verification results

Executed on **November 8, 2026**, using Java 21.0.1, Node 24.19.0, Maven wrapper 3.9.9, and PostgreSQL 15.4. This file distinguishes automated tests from interactive browser checks.

## Automated checks

| Command | Actual result |
|---|---|
| `./mvnw -B verify` / `.\mvnw.cmd -B verify` | Passed: 22 tests, zero failures/errors; executable Spring Boot JAR produced |
| `npm test` in `frontend/` | Passed: 23 tests in two component-test files |
| `npm run build` | Passed: TypeScript checks and Vite production build; routes and charts split into chunks |
| `npm audit` | Zero reported vulnerabilities after updating the test runner |
| `docker compose config -q` | Passed; Compose configuration parses |

Maven suite breakdown: **PatternTests 8**, **WorkflowTests 13**, **ExportTests 1**. Spring integration tests use H2 with the actual Flyway migration and PostgreSQL compatibility mode, with test transactions rolled back. Live PostgreSQL verification is recorded separately below.

## Eight required scenarios

| Scenario | Input / trigger | Expected | Actual |
|---|---|---|---|
| Complete successful journey | Create event, pitch task, team/member, submission; judge scores 8/10; Weighted model; two +5 bonuses | Real IDs and relations; base 80; final 90; valid JSON and PDF | Passed through MockMvc; both attachment endpoints checked |
| Switch scoring strategies | Three judges; two criteria with 75/25 weights; totals chosen to distinguish formulas | Standard 43.33; Olympic 50; Weighted 51.67; 3 original evaluations retained | Passed; original score map checked |
| Observer after submission | Create a project | Persistent `SubmissionCreated` notification and matching audit entry | Passed; both observer stores checked |
| Save and reload | Save scores, flush and clear JPA context, reload | Team relation and all 4 score values remain | Passed; live backend restart also verified below |
| Missing submission title | Empty title with otherwise valid request | HTTP 400 and field-specific title error | Passed |
| Invalid evaluation score | Every criterion scored 11 when max is 10 | HTTP 400; no evaluation or notification written | Passed |
| Duplicate team | Same event, same name in different casing | HTTP 409 | Passed |
| Submission after deadline | Deadline one hour in the past | HTTP 400 with deadline explanation | Passed |

## Additional automated coverage

- Builder trims titles, constructs a submission, rejects missing information and unsafe URL schemes.
- Factory Method creates Coding/Pitch/Quiz subclasses and validates pitch duration and quiz question count.
- Strategies normalize different criterion maxima. Olympic covers zero, one, two, and three judges; Weighted rejects weights that do not sum to one.
- Decorators compose through the shared interface without mutating the base component. Workflow tests check incompatible early/late flags and final score clamping at 100.
- Observer explicitly registers, deduplicates, removes, and notifies listeners. Mockito verifies Facade persistence/calculation/notification order.
- Workflows reject invalid emails, unsupported state transitions, nonexistent submissions, duplicate judges, and criterion changes after judging begins.
- A browser-origin regression test permits `http://127.0.0.1:5173` and rejects an unrelated origin.
- PDF testing checks Cyrillic/Kazakh text extraction, page headers, and pagination across 60 ranking rows.
- React tests exercise submission validation and payload construction, draft retention across steps, retained input after a server conflict, normalized criterion weights, mutually exclusive modifiers, draft preservation during background refresh, and a focused error summary linking to its invalid input.
- Redesign regression tests verify role navigation and route guards, management-action visibility, dialog cancellation without writes, persisted theme/collapse choices, recorded activity actors, historical project titles, functional pagination/filter resets, backend scores versus pending values, evaluation deep links, and loading/error/retry behavior without false zero statistics.

The [current redesign review](UI_REDESIGN_REVIEW.md) records the subsequent isolated browser workflow, real downloads, 56 responsive/theme checks, measured contrast, and final screenshots. Backend architecture and business logic were unchanged by that frontend redesign.

## Live PostgreSQL and browser journey

Flyway applied version 1 against a new PostgreSQL 15 database; Hibernate schema validation succeeded. The initial live dataset contained **2 events, 6 teams, 12 participants, 6 challenges, 5 submissions, and 12 evaluations**, with one pending project. Restarting did not duplicate the seed dataset.

A separate `hackathon_hub_review` database, backend on 8081, and preview on 5174 isolated browser mutations from the demonstration dataset. The following steps were performed through the actual interface:

1. Create “Design patterns demonstration” as an active event.
2. Create a coding challenge, a 7-minute pitch, and a 6-question quiz.
3. Change weights from 25/25/25/25 to 40/30/20/10. Saving was disabled while the total was 115%.
4. Switch to Participant, create “Pattern Pioneers”, and add a member.
5. Verify an empty title prevents continuing. Submit “Access for everyone” with repository, slides, demo, and coding-task assignment.
6. Switch to Judge and record `[10,8,6,4]`, `[8,8,8,8]`, and `[2,2,2,2]` under three distinct names.
7. Switch to Organizer. The GUI showed **Standard 56.67**, **Olympic 70**, and **Weighted 60**. Original evaluations remained visible.
8. Enable early submission and originality bonuses. The breakdown showed **60 + 5 + 5 = 70**.
9. Expand the leaderboard breakdown and download JSON and PDF through their buttons. The JSON contained Weighted strategy, final 70, and both adjustments. The PDF contained the team, project, and score and was rendered for visual inspection.
10. Stop and restart the review backend, then compare the full exported event data plus raw evaluations against a saved snapshot. **Exact equality passed**, with final score 70.
11. Temporarily stop only the review backend. Refresh showed a real error state; restoring it and pressing Try again restored the rankings.

Browser evidence is stored in `docs/screenshots/`. These interactive checks are not represented as an unexecuted Playwright test suite.

## Visual verification and limits

All seven major views were checked at **375, 768, 1024, and 1440px** in light mode; all seven were also checked at 375 and 1440px in dark mode. No page-level horizontal overflow was found. Scrollbar width is excluded from the reported document client width. Native modal Escape dismissal restored the triggering navigation button. Reduced-motion emulation produced a zero-second button transition.

See [UI/UX review](UI_UX_REVIEW.md) for findings and fixes. This is not a formal WCAG certification or a claim of physical-device testing. Docker Desktop was stopped, so the container image itself was not launched; live PostgreSQL was verified using the installed server. Test runner/JDK warnings about Mockito's current dynamic agent attachment did not fail the Java 21 tests.
