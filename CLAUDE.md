# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

Social messaging API: REST with Express + Sequelize/PostgreSQL, plus a real-time messaging channel
with socket.io. See [README.md](README.md) for the user-facing description.

## Stack

- Node.js (>=16.19.1) + Express
- PostgreSQL via Sequelize (ORM) and `sequelize-cli` (migrations)
- socket.io for real-time (rooms = conversations)
- jsonwebtoken to verify the user JWT (see "Authentication" below)
- Jest + Supertest + socket.io-client for tests

## Commands

The project runs locally on the user's machine — **don't run these commands yourself**
(install, tests, lint, git status/diff); tell the user which one to run and let them run it
and verify.

The only exception is the Stop hook (`.claude/hooks/verify.sh`), which runs `npm run lint` and
`npm test` automatically after each turn when code changed. If it reports failures, fix them;
don't run the commands yourself to double-check.

```bash
npm install                        # install dependencies
cp .env.example .env               # fill in local credentials
npx sequelize-cli db:migrate       # run migrations (requires Postgres running)
npm run dev                        # run with nodemon
npm start                          # run in normal mode
npm run lint                       # ESLint
npm test                           # run the test suite (no Postgres needed, everything mocked)
npx jest tests/routes/v1/messages.test.js   # single test file
npx jest -t 'part of the test name'        # single test by name
```

## Structure

- `app.js` — builds the Express app: middlewares, `routes/v1` mounted under `/api/v1`, and a
  centralized error handler at the end (`err.status` → HTTP code; routers just call `next(error)`,
  they don't build the error response by hand). The handler also maps Postgres `22P02` (bad
  uuid/integer/date format in a param or body) to a 400, so routes don't need to validate formats,
  and masks every 5xx message as `Internal server error`. Doesn't start the server. All logic about which auth
  applies to which part of `/api/v1` lives in `routes/v1/index.js`, not here.
- `bin/www` — creates the `http.Server`, passes it to `initSockets`, stores the result with
  `app.set('io', io)` (so REST routes can emit to socket rooms), and starts listening.
- `db.js` — single Sequelize instance, read from `config/config.js` based on `NODE_ENV`.
- `config/config.js` — connection config for the app **and** for `sequelize-cli`. `.sequelizerc`
  points here.
- `models/` — `User`, `Conversation`, `ConversationParticipant` (join User↔Conversation), `Message`,
  `Notification`. Each model defines `static associate(models)` but doesn't self-associate;
  `models/index.js` requires every model and only then calls `associate` on each one (avoids
  circular requires). When using associations (`include`, `belongsToMany`, transactions via
  `sequelize`), import from `require('../models')`, not from the individual file.
- `migrations/` — must reflect the models. Order matters: `User` → `Conversation` →
  `ConversationParticipant` → `Message` → `Notification` → `deletedAt` on `User` (soft-delete).
- `utils/HttpError.js` — `class HttpError extends Error { constructor(status, message) }`. Services
  throw this for business errors (404/409/422/etc); `app.js`'s error handler translates it to the
  HTTP code. Don't use `res.status().json()` by hand in routes for these cases.
- `utils/corsOrigins.js` — parses `CORS_ORIGINS` (comma-separated whitelist); used by **both**
  Express `cors` in `app.js` and the socket.io server. Unset/empty means no cross-origin caller is
  allowed (deliberately not `*`).
- `utils/apiResponse.js` — `sendData(res, data, status = 200)`, the only way routes send a
  successful body: wraps it as `{ data }`. Pairs with `app.js`'s error handler, which always responds
  `{ error: { message } }`. A 204 (no content) just calls `res.status(204).send()` directly — there's
  no body to wrap.
- `middlewares/auth.js` — protects **all** of `/api/v1`: validates `Authorization: Bearer <jwt>`
  signed with `SECRET_KEY`. A single mechanism for two kinds of caller, distinguished by the claim in
  the payload: `uuid` → user (`req.userUuid`), `service` → service call (`req.service`, e.g.
  `'social-api'`). See "Authentication".
- `middlewares/requireService.js` — runs *after* `auth`, only on `/internal/*`. Authentication (do
  you have a valid JWT?) isn't the same as authorization (are you allowed to do this specific
  thing?): a normal authenticated user (token with `uuid`) passes `auth` fine but doesn't have
  `req.service`, so `requireService` rejects it with 403 before it reaches the sync routes.
- `routes/v1/index.js` — `router.use(auth)` first (applies to all of `/api/v1`), then
  `router.use('/internal', requireService, ...)` for sync, and only then the rest (`users.js`,
  `conversations.js`, `messages.js`, `notifications.js`).
- `routes/v1/internal/` — `users.js` (`PUT`/`DELETE /api/v1/internal/users/:uuid`, sync from the
  Social API). Lives inside `/api/v1` (versioned along with everything else); what sets it apart
  isn't a different auth mechanism, but the `service` claim that `requireService` requires.
- `services/` — one service per resource (`UserService`, `ConversationService`, `MessageService`,
  `NotificationService`), reused between REST routes and the socket handler. New domain logic goes
  here, not directly in routes/handlers.
- `sockets/index.js` — `initSockets(httpServer)`. The handshake requires `auth: { token }` (same JWT
  as REST) via `io.use(...)`; exposes `socket.userUuid`. Events: `joinRoom` (validates that
  `socket.userUuid` is a `ConversationParticipant` of that conversation before joining — if not,
  nothing happens, no explicit error to the client) and `sendMessage` (persists via `MessageService`,
  which also generates a `Notification` for each other participant, and broadcasts `newMessage` to
  the room). The REST `POST /conversations/:conversationId/messages` emits the same `newMessage`
  via `req.app.get('io')`, guarded with `if (io)` because tests build `app` without `bin/www`, so
  there's no `io`. Note: `sendMessage` still takes `senderId` from the client payload, not from
  `socket.userUuid` — that hasn't been locked down yet, see "Not implemented yet".
- `tests/` — mirrors the structure above. Tests mock models/services
  (`jest.mock('../../models', ...)`, `jest.mock('../../services/XService', ...)`) so they don't need
  Postgres. `tests/factories/` has one `buildX(overrides)` per model (`buildUser`, `buildConversation`,
  `buildConversationParticipant`, `buildMessage`, `buildNotification`) returning a plain object with
  sane defaults — use them instead of inline literals for mock data (`User.findOne.mockResolvedValue`,
  etc.) to avoid repeating the same fake record across files; pass overrides for whatever the test
  actually asserts on (uuid, id, etc.). `tests/helpers/authHeader(uuid)` and
  `serviceAuthHeader(service)` build the `Authorization` header for user/service tokens in
  Supertest requests — every `/api/v1` request needs one.

## Conventions

- New code: `const`/`let`, not `var` (the old `bin/www` boilerplate uses `var`, no need to touch it).
- Async/await + try/catch with `next(error)` in Express routes. For business errors, throw
  `new HttpError(status, message)` from the service and let `app.js`'s error handler translate it —
  don't build the error response by hand in each route.
- Environment variables: `PORT`, `NODE_ENV`, `POSTGRES_USER`, `POSTGRES_PASSWORD`, `DB_HOST`,
  `SECRET_KEY`, `CORS_ORIGINS`. See `.env.example`. `.env` is gitignored — never commit real credentials.
  `SECRET_KEY` is the single secret for everything: it signs/verifies both user and service JWTs
  (a conscious decision, not an accident). If it's compromised, all of `/api/v1` is compromised.
- When adding a new model: model in `models/` (+ `associate` if applicable), migration in
  `migrations/`, and if it exposes data over REST or sockets, a dedicated service — don't access the
  model directly from the route/handler except for simple single-model reads (e.g.
  `routes/v1/users.js`).
- After changing routes, services, models, migrations, middlewares, sockets or tests, delegate a
  review to the `social-messaging-api-reviewer` subagent before finishing, passing it the list of
  files you modified or created.

## Data model

`User` is **not** the owner of identity/auth — per `doc/Social App-architecture.drawio v2.png` this API
(Node/Postgres) is the "Messaging API", separate from a "Social API" (Rails) that owns the full
profile and login. That's why `User` here only has `uuid` (external reference to that Social API),
`name`, `lastname`, `fullName` — no `password`/`email`/auth of its own, and it's `paranoid: true`
(soft-delete: `User.destroy()` marks `deletedAt` instead of deleting the row, so it doesn't break the
FK on `Message.senderId`, which intentionally has no `onDelete`).

`Conversation` can be 1:1 or group (`isGroup`); its members live in `ConversationParticipant` (join
table `User`↔`Conversation`, unique per `(conversationId, userId)`). There's no dedupe of repeated
1:1 conversations — creating the conversation between the same two users twice creates two rows
(known simplification). `Message.conversationId` replaced the old `roomId` string. `Notification`
references a `User` (recipient) and a `Message` (source), with `isRead` (default `false`) to mark
read/unread — today nothing marks it as read, they're only generated.

## User sync (Social API → here)

`PUT /api/v1/internal/users/:uuid` (idempotent upsert) and `DELETE /api/v1/internal/users/:uuid`
(soft-delete), protected by `auth` + `requireService` (see "Authentication"). The Social API (outside
this repo) is responsible for calling these on user create/update/delete, with a service JWT
(`{ service: 'social-api' }`, no `uuid`) signed with the same `SECRET_KEY`.

## Authentication

This API doesn't handle login/passwords — it only **verifies** JWTs signed with `SECRET_KEY`
(HS256). A single mechanism (`middlewares/auth.js`) for two kinds of caller, distinguished by the
claim present in the payload:
- `uuid` → end user (the Social API issues it when logging someone in) → `req.userUuid`.
- `service` → the Social API calling on its own behalf, not a user's (e.g. sync) → `req.service`.

`auth` applies to **all** of `/api/v1` (`router.use(auth)` in `routes/v1/index.js`, not route by
route) — there's no real anonymous use case here. On sockets, `sockets/index.js` does the same in
the handshake, but only accepts user tokens (`socket.userUuid`); a service token has no `uuid` and
the handshake rejects it.

Authentication (do you have a valid JWT?) isn't authorization (are you allowed to do *this*?):
- For `/api/v1/internal/*`, `middlewares/requireService.js` runs after `auth` and requires
  `req.service` — a normal authenticated user (token with `uuid`) passes `auth` but doesn't have
  `req.service`, so it gets a 403.
- For everything else, today only identity is validated, not fine-grained permission on the specific
  resource (e.g. removing someone from a conversation you're not part of isn't blocked), except for
  `joinRoom` in sockets, which does check membership.

## Not implemented yet

- `sendMessage` (socket) still takes `senderId` from the client payload instead of resolving it from
  `socket.userUuid` — unlike `joinRoom`, that hasn't been locked down. The REST fallback `POST
  /conversations/:id/messages` has the same level of trust (requires a valid JWT like all of
  `/api/v1`, but takes an explicit `senderId` in the body instead of deriving it from `req.userUuid`) — left that way on purpose for this round, not by oversight.
- No live `newNotification` push over sockets — notifications are generated and persisted, but only
  read via `GET /api/v1/notifications`. Would require tracking which user is on which socket.
- No endpoint to mark a `Notification` as read.
- Deduplicating 1:1 conversations (see above).

## Testing

`npm test` runs without Postgres up because the tests mock models/services. To test against a real
database: start Postgres, `NODE_ENV=test npx sequelize-cli db:migrate` against the
`social-messaging-api-test` DB, and write/run integration tests separately (none exist today).

## CI

`.github/workflows/ci.yml` runs on every push (to any branch) and every PR, with two independent
jobs (`lint` and `test`), so a lint failure doesn't hide the test results or vice versa. Neither one
requires Postgres. If you add a new step (build, audit, etc.), give it its own job for the same
reason.
