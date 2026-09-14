# CLAUDE.md

Guía para trabajar en este repo. Léela antes de tocar código.

## Qué es esto

API de mensajería social: REST con Express + Sequelize/PostgreSQL, y un canal de mensajería en
tiempo real con socket.io. Ver [README.md](README.md) para la descripción orientada a usuario.

## Stack

- Node.js (>=16.19.1) + Express
- PostgreSQL vía Sequelize (ORM) y `sequelize-cli` (migraciones)
- socket.io para tiempo real (rooms = conversaciones)
- jsonwebtoken para verificar el JWT de usuario (ver "Autenticación" más abajo)
- Jest + Supertest + socket.io-client para tests

## Comandos

El proyecto corre local en la máquina del usuario — **no correr estos comandos por mi cuenta**
(instalación, tests, lint, git status/diff); indicar cuál correr y dejar que el usuario lo ejecute
y valide.

```bash
npm install                        # instalar dependencias
cp .env.example .env               # completar credenciales locales
npx sequelize-cli db:migrate       # correr migraciones (requiere Postgres levantado)
npm run dev                        # levantar con nodemon
npm start                          # levantar en modo normal
npm run lint                       # ESLint
npm test                           # correr la test suite (no requiere Postgres, todo mockeado)
```

## Estructura

- `app.js` — arma la app de Express: middlewares, `routes/v1` bajo `/api/v1`, y un error handler
  centralizado al final (`err.status` → código HTTP; los routers solo hacen `next(error)`, no arman
  la respuesta de error a mano). No levanta el servidor. Toda la lógica de qué auth aplica a qué
  parte de `/api/v1` vive en `routes/v1/index.js`, no acá.
- `bin/www` — crea el `http.Server`, lo pasa a `initSockets` y lo pone a escuchar.
- `db.js` — instancia única de Sequelize, leída desde `config/config.js` según `NODE_ENV`.
- `config/config.js` — config de conexión para la app **y** para `sequelize-cli`. `.sequelizerc`
  apunta acá.
- `models/` — `User`, `Conversation`, `ConversationParticipant` (join User↔Conversation), `Message`,
  `Notification`. Cada modelo define `static associate(models)` pero no se auto-asocia;
  `models/index.js` requiere todos los modelos y recién ahí llama `associate` en cada uno (evita
  requires circulares). Al usar asociaciones (`include`, `belongsToMany`, transacciones vía
  `sequelize`) importar desde `require('../models')`, no desde el archivo individual.
- `migrations/` — deben reflejar los modelos. Orden importa: `User` → `Conversation` →
  `ConversationParticipant` → `Message` → `Notification` → `deletedAt` en `User` (soft-delete).
- `utils/HttpError.js` — `class HttpError extends Error { constructor(status, message) }`. Los
  services tiran esto para errores de negocio (404/409/422/etc); el error handler de `app.js` lo
  traduce al código HTTP. No usar `res.status().json()` a mano en las rutas para estos casos.
- `middlewares/auth.js` — protege **todo** `/api/v1`: valida `Authorization: Bearer <jwt>` firmado
  con `SECRET_KEY`. Un único mecanismo para dos tipos de caller, distinguidos por el claim del
  payload: `uuid` → usuario (`req.userUuid`), `service` → llamada de servicio (`req.service`, ej.
  `'social-api'`). Ver "Autenticación".
- `middlewares/requireService.js` — corre *después* de `auth`, solo en `/internal/*`. Autenticación
  (¿tenés un JWT válido?) no es lo mismo que autorización (¿tenés permiso para esto puntual?): un
  usuario autenticado normal (token con `uuid`) pasa `auth` sin problema pero no tiene `req.service`,
  así que `requireService` lo rechaza con 403 antes de llegar a las rutas de sync.
- `routes/v1/index.js` — `router.use(auth)` primero (aplica a todo `/api/v1`), después
  `router.use('/internal', requireService, ...)` para el sync, y recién ahí el resto (`users.js`,
  `conversations.js`, `messages.js`, `notifications.js`).
- `routes/v1/internal/` — `users.js` (`PUT`/`DELETE /api/v1/internal/users/:uuid`, sync desde la
  Social API). Vive adentro de `/api/v1` (versionado junto con el resto); lo que lo distingue no es
  un mecanismo de auth distinto, sino el claim `service` que exige `requireService`.
- `services/` — un service por recurso (`UserService`, `ConversationService`, `MessageService`,
  `NotificationService`), reusado entre rutas REST y el handler de sockets. Nueva lógica de dominio
  va acá, no directo en las rutas/handlers.
- `sockets/index.js` — `initSockets(httpServer)`. El handshake requiere `auth: { token }` (mismo JWT
  que en REST) vía `io.use(...)`; expone `socket.userUuid`. Eventos: `joinRoom` (valida que
  `socket.userUuid` sea `ConversationParticipant` de esa conversación antes de unir — si no, no
  pasa nada, sin error explícito al cliente) y `sendMessage` (persiste vía `MessageService`, que
  además genera un `Notification` por cada otro participante, y hace broadcast de `newMessage` a la
  room). Nota: `sendMessage` todavía toma `senderId` del payload del cliente, no de
  `socket.userUuid` — no se llegó a blindar eso, ver "Todavía no implementado".
- `tests/` — espeja la estructura de arriba. Los tests mockean modelos/services
  (`jest.mock('../../models', ...)`, `jest.mock('../../services/XService', ...)`) para no requerir
  Postgres.

## Convenciones

- Código nuevo: `const`/`let`, no `var` (el boilerplate viejo de `bin/www` usa `var`, no hace falta
  tocarlo).
- Async/await + try/catch con `next(error)` en las rutas Express. Para errores de negocio, tirar
  `new HttpError(status, message)` desde el service y dejar que el error handler de `app.js` lo
  traduzca — no armar la respuesta de error a mano en cada ruta.
- Variables de entorno: `PORT`, `NODE_ENV`, `POSTGRES_USER`, `POSTGRES_PASSWORD`, `DB_HOST`,
  `SECRET_KEY`. Ver `.env.example`. `.env` está gitignoreado — nunca commitear credenciales reales.
  `SECRET_KEY` es el único secreto para todo: firma/verifica tanto los JWT de usuario como los de
  servicio (decisión consciente, no accidental). Si se compromete, se compromete todo `/api/v1`.
- Al agregar un modelo nuevo: modelo en `models/` (+ `associate` si aplica), migración en
  `migrations/`, y si expone datos por REST o sockets, un service dedicado — no acceder al modelo
  directo desde la ruta/handler salvo lecturas simples de un solo modelo (ej. `routes/v1/users.js`).

## Modelo de datos

`User` **no** es dueño de la identidad/auth — según `doc/Social App-architecture.drawio.png` esta
API (Node/Postgres) es la "Messaging API", separada de una "Social API" (Rails) que maneja el perfil
completo y el login. Por eso `User` acá solo tiene `uuid` (referencia externa a esa Social API),
`name`, `lastname`, `fullName` — sin `password`/`email`/auth propios, y es `paranoid: true`
(soft-delete: `User.destroy()` marca `deletedAt` en vez de borrar la fila, para no romper la FK de
`Message.senderId`, que a propósito no tiene `onDelete`).

`Conversation` puede ser 1:1 o grupal (`isGroup`); sus miembros están en `ConversationParticipant`
(join table `User`↔`Conversation`, único por `(conversationId, userId)`). No hay dedupe de
conversaciones 1:1 repetidas — crear dos veces la conversación entre los mismos dos usuarios crea dos
filas (simplificación conocida). `Message.conversationId` reemplazó al viejo `roomId` string.
`Notification` referencia un `User` (destinatario) y un `Message` (origen), con `isRead`
(default `false`) para marcar leído/no leído — hoy nada la marca como leída, solo se generan.

## Sync de usuarios (Social API → acá)

`PUT /api/v1/internal/users/:uuid` (upsert idempotente) y `DELETE /api/v1/internal/users/:uuid`
(soft-delete), protegidos por `auth` + `requireService` (ver "Autenticación"). La Social API (fuera
de este repo) es responsable de llamarlos al crear/actualizar/borrar un usuario, con un JWT de
servicio (`{ service: 'social-api' }`, sin `uuid`) firmado con el mismo `SECRET_KEY` — ver el detalle
de qué le toca a ese lado del sistema en el plan guardado de esta sesión si hace falta retomarlo.

## Autenticación

Esta API no maneja login/passwords — solo **verifica** JWT firmados con `SECRET_KEY` (HS256). Un
solo mecanismo (`middlewares/auth.js`) para dos tipos de caller, distinguidos por el claim presente
en el payload:
- `uuid` → usuario final (Social API lo emite al loguear a alguien) → `req.userUuid`.
- `service` → la Social API llamando en nombre propio, no de un usuario (ej. el sync) →
  `req.service`.

`auth` se aplica a **todo** `/api/v1` (`router.use(auth)` en `routes/v1/index.js`, no ruta por
ruta) — no hay caso de uso anónimo real acá. En sockets, `sockets/index.js` hace lo mismo en el
handshake, pero solo acepta tokens de usuario (`socket.userUuid`); un token de servicio no tiene
`uuid` y el handshake lo rechaza.

Autenticación (¿tenés un JWT válido?) no es autorización (¿tenés permiso para *esto*?):
- Para `/api/v1/internal/*`, `middlewares/requireService.js` corre después de `auth` y exige
  `req.service` — un usuario autenticado normal (token con `uuid`) pasa `auth` pero no tiene
  `req.service`, así que le devuelve 403.
- Para el resto, hoy solo se valida identidad, no permiso fino sobre el recurso puntual (ej. sacar a
  alguien de una conversación ajena no está bloqueado), salvo `joinRoom` en sockets, que sí chequea
  membership.

## Todavía no implementado

- `sendMessage` (socket) sigue tomando `senderId` del payload del cliente en vez de resolverlo desde
  `socket.userUuid` — a diferencia de `joinRoom`, no se blindó. El fallback REST `POST
  /conversations/:id/messages` tiene el mismo nivel de confianza (toma `senderId` explícito en el
  body, sin auth) — quedó así a propósito para esta vuelta, no por descuido.
- No hay push en vivo de `newNotification` por socket — las notificaciones se generan y persisten,
  pero solo se leen vía `GET /api/v1/notifications`. Requeriría trackear qué usuario está en qué
  socket.
- No hay endpoint para marcar una `Notification` como leída.
- Deduplicar conversaciones 1:1 (ver arriba).

## Testing

`npm test` corre sin Postgres levantado porque los tests mockean modelos/services. Para probar contra
una base real: levantar Postgres, `NODE_ENV=test npx sequelize-cli db:migrate` contra la DB
`social-messaging-api-test`, y escribir/correr tests de integración aparte (hoy no existen).

## CI

`.github/workflows/ci.yml` corre en cada push (a cualquier rama) y en cada PR, con dos jobs
independientes (`lint` y `test`), para que un fallo de lint no oculte el resultado de los tests ni
viceversa. Ninguno de los dos requiere Postgres. Si agregás un paso nuevo (build, audit, etc.), que
sea su propio job por la misma razón.
