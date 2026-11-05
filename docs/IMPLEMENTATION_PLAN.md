# Implementation plan

1. Preserve the existing starter, inspect remote history, install and read UI UX Pro Max.
2. Create a Spring Boot 3 / Java 21 backend, PostgreSQL migration, DTOs, repositories, transaction boundaries, validation, seed data, and environment configuration.
3. Implement and integrate Builder, Factory Method, Strategy, Observer, Decorator, and Facade. Keep original evaluations immutable and recalculate derived results.
4. Test all six patterns and the eight required application scenarios. Verify Flyway and durable storage against PostgreSQL.
5. Build the React / TypeScript / Vite frontend using one semantic token system, reusable accessible controls, responsive navigation, real API requests, and explicit asynchronous states.
6. Exercise the complete journey, exports, invalid inputs, and role switching. Inspect every page at desktop and phone widths using the UI UX Pro Max checklist; fix observed issues.
7. Document architecture, formulas, UML, evidence, startup, limitations, and contributions without invented attribution. Build, test, commit logical groups, and push to the verified target remote.

## Intended screen layouts

- Dashboard: real metrics, Active Hackathons table, structured Recent Activity, and Upcoming Deadlines.
- Hackathons: filterable event table and a detail workspace for dates, criteria, task types, and permitted teams.
- Teams: searchable team directory with participant management and status changes.
- Submissions: project list and guided submission form; clear deadline and repository context.
- Evaluation: project selector, criterion score form, previous judges, strategy and compatible modifier settings.
- Leaderboard: ranked table, score breakdown, labeled comparison chart, JSON and PDF downloads.

## Verification gates

- Maven tests and executable package.
- TypeScript build and meaningful frontend component tests.
- PostgreSQL migrations, sample dataset, API journey, persistence after restart, and export signatures/content.
- Live browser visual and interaction review; accessible forms, dialogs, keyboard focus, contrast, narrow widths, empty/error/loading states.
- Verified remote push.

## Completion evidence

- Backend, all six patterns, migrated PostgreSQL storage, seed data, and both exports implemented.
- React screens completed and reviewed through the installed UI UX Pro Max workflow.
- 22 backend and 23 frontend tests executed successfully; both builds passed. The subsequent HackerEarth redesign and UI review are documented in `UI_REDESIGN_REVIEW.md`.
- Complete GUI journey, four responsive widths, both themes, reduced motion, native dialog focus, empty/error recovery, and downloads verified.
- Exact PostgreSQL-backed data comparison passed after a backend restart.
- Documentation, UML, screenshots, and Windows startup/stop scripts completed.
