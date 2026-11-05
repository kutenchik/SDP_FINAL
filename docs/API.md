# REST API

Base URL: `http://127.0.0.1:8080/api`. JSON requests use `Content-Type: application/json`. IDs are numeric. Dates are ISO-8601 instants with offsets, stored as UTC instants. The account-free demo has no authentication headers.

| Method | Route | Purpose |
|---|---|---|
| GET | `/health` | Running application status |
| GET | `/dashboard` | Counts, events, and recent activity |
| GET / POST | `/hackathons` | List / create an event |
| GET / PUT / DELETE | `/hackathons/{id}` | Read / edit / delete an event with no teams |
| GET / POST | `/hackathons/{id}/tasks` | List / create a challenge through Factory Method |
| GET / PUT | `/hackathons/{id}/criteria` | Read / replace the complete normalized criterion set |
| GET / POST | `/teams` | List / create teams; optional `hackathonId` filter |
| PUT | `/teams/{id}` | Update team details and status |
| POST | `/teams/{id}/participants` | Add a participant |
| DELETE | `/teams/{id}/participants/{participantId}` | Remove membership |
| GET / POST | `/submissions` | List / build a submission; optional `hackathonId` filter |
| PUT | `/submissions/{id}` | Edit an unlocked submission |
| GET | `/submissions/{id}/evaluations` | Original judge evaluations |
| POST | `/evaluations` | Evaluate through the Facade; returns recalculated leaderboard |
| PUT | `/submissions/{id}/modifiers` | Persist compatible modifier flags and return recalculated rankings |
| GET | `/hackathons/{id}/leaderboard` | Calculate the current leaderboard |
| PUT | `/hackathons/{id}/strategy` | Persist model and recalculate |
| GET | `/notifications` | Latest 50 observer notifications |
| PUT | `/notifications/{id}/read` | Mark a notification as read |
| GET | `/audit` | Latest 100 persistent audit entries |
| GET | `/hackathons/{id}/export/json` | Download event, teams, criteria, submissions/modifiers, and rankings |
| GET | `/hackathons/{id}/export/pdf` | Download a paginated PDF report |

Create endpoints return 201; successful deletes and notification read updates return 204. Other successful responses return 200. Errors use 400 for validation/domain rules, 404 for missing entities, and 409 for uniqueness/in-use conflicts. Unapproved cross-origin requests return 403.

## Example request bodies

```json
{
  "name": "Community sprint",
  "description": "Build something useful for your community.",
  "startDate": "2026-11-08T09:00:00Z",
  "submissionDeadline": "2026-11-10T09:00:00Z",
  "endDate": "2026-11-11T09:00:00Z",
  "status": "ACTIVE"
}
```

```json
{
  "title": "A useful idea",
  "description": "The problem, solution, and intended impact.",
  "repositoryUrl": "https://github.com/example/project",
  "presentationUrl": null,
  "demoUrl": null,
  "teamId": 1,
  "taskId": null
}
```

```json
{
  "submissionId": 1,
  "judgeName": "Demo Judge",
  "scores": {"9": 8, "10": 7, "11": 9, "12": 8},
  "comment": "A promising direction with thoughtful execution."
}
```

Score keys are the actual criterion IDs returned by the event's criteria endpoint, not fixed positions. Supply exactly one finite score in `[0,maxScore]` for every criterion.

```json
{"strategy": "WEIGHTED"}
```

```json
{"earlyBonus": true, "latePenalty": false, "originalityBonus": true}
```

```json
{
  "message": "Please check the highlighted fields.",
  "errors": {"title": "must not be blank"}
}
```

Domain errors have the same shape with an empty `errors` object. Internal exceptions are logged on the server and return a generic message, without stack traces. Export responses include attachment filenames and the appropriate JSON/PDF content type.
