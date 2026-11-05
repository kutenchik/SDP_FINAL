# Hackathon Hub design system

UI UX Pro Max was installed locally with the official `npx --yes --package ui-ux-pro-max-cli uipro init --ai codex` workflow on November 8, 2026. The redesign check confirmed the skill, scripts, searchable datasets, and MIT license were available in the local `.agents/skills/ui-ux-pro-max/` directory. Its `SKILL.md` was read before frontend changes. Local agent tooling is excluded from version control.

## Design decisions

This is an operational dashboard for organizers, participants, and judges. The current visual reference is the user's HackerEarth light/dark leaderboard screenshots, supported by the [HackerEarth leaderboard](https://www.hackerearth.com/leaderboard/practice/basic-programming/). Hackathon Hub retains its own name and icon. The skill's **Minimalism & Swiss Style** recommendation supplies alignment, restraint, clear hierarchy, and useful data density. Generated marketing-page structure and green branding were excluded in favor of the explicit neutral dashboard reference.

The implementation source of truth is `frontend/src/styles.css`. It defines semantic light/dark colors, control borders, focus rings, spacing, radii, shadow, motion, and chart tokens. Components use those shared roles.

- Typography: Arial/Helvetica/system sans-serif to match the reference's compact interface; 20px page headings, 16px section headings, 13–16px content and controls, tabular score/rank figures. Phone form inputs use 16px text. The unused custom-font package was removed.
- Palette: white light surfaces, foreground `#17181c`, muted text `#626b7c`, primary buttons `#191a1e`, links `#2059ad`. Dark surfaces use `#18191c`, foreground `#f5f5f6`, muted `#adb1c0`, and links `#b3ceff`. Muted semantic badges always include status text.
- Spacing: 4/8px rhythm, 16/24px section spacing, desktop content gutters 64px, intermediate 32px, phone 16px.
- Components: 4–6px corners, thin table separators, no card shadows; shadow reserved for dialogs. Header cells are approximately 52px high and data rows 64px. Controls have visible boundaries, shared focus rings, and async/disabled states.
- Motion: 140ms control feedback and 160ms dialog entrance; reduced-motion removes transitions/animation. Charts have no entrance animation.
- Navigation: inset 240px charcoal sidebar, collapsible to 64px, selected gray row, theme and Quick Start at the bottom. At widths below 1024px, navigation moves into a native modal. Theme, collapse state, and role persist locally.
- Forms: controlled inputs, persistent visible labels, native input constraints, inline server errors, focused linked error summaries, retained drafts, disabled async submission, and useful guidance when prerequisite data is missing.
- Tables: shared filters, status buttons, keyboard-focusable overflow regions, actual row counts, and functional 10/25/50-row client pagination. Mobile status buttons wrap and table overflow stays inside its labeled region.
- Data: backend counts, timestamps, participants, evaluations, and scores only. Pending and unavailable scores remain distinct from zero. Connection failure never masquerades as a successfully loaded empty workspace. Recent Activity separates recorded actor, action, related project/hackathon, and timestamp.
- Charts: optional score-distribution disclosure below the leaderboard, direct values, theme-aware colors, and the full table as a text alternative.
- Roles: a shared permission map drives navigation, direct-route guards, and action visibility. The existing account-free demo role switch remains; this is UI gating rather than server authorization.

## Evidence and scoped guidance

The redesign used `"competitive programming dashboard neutral minimal" --design-system`, `"table filtering pagination" --stack react`, `"table keyboard sorting" --domain ux`, `"keyboard focus modal" --domain ux`, and `"empty loading error tables" --stack react`. Applied recommendations include semantic tokens, readable contrast, accessible names, keyboard controls, retained form drafts, focused errors, responsive containment, useful states, and reduced motion. Native-app-only guidance was excluded from this web application.

See [the current redesign review](../../docs/UI_REDESIGN_REVIEW.md) for page findings, measured contrast, the role matrix, automated/manual verification, and screenshots. [The earlier implementation review](../../docs/UI_UX_REVIEW.md) is retained as history.
