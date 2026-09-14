# CLAUDE.md

Guía para trabajar en este repo. Léela antes de tocar código.

## Qué es esto

API de mensajería social: REST con Express + Sequelize/PostgreSQL, y un canal de mensajería en
tiempo real con socket.io. Ver [README.md](README.md) para la descripción orientada a usuario.

## Stack

- Node.js (>=16.19.1) + Express
- PostgreSQL vía Sequelize (ORM) y `sequelize-cli` (migraciones)
- socket.io para tiempo real (rooms = group chats)
- Jest + Supertest + socket.io-client para tests

## Comandos

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

- `app.js` — arma la app de Express (middlewares + routers). No levanta el servidor.
- `bin/www` — crea el `http.Server`, lo pasa a `initSockets` y lo pone a escuchar.
- `db.js` — instancia única de Sequelize, leída desde `config/config.js` según `NODE_ENV`.
- `config/config.js` — config de conexión para la app **y** para `sequelize-cli` (mismo archivo,
  para no duplicar la lectura de env vars). `.sequelizerc` apunta acá.
- `models/` — modelos Sequelize: `User`, `Conversation`, `ConversationParticipant` (join
  User↔Conversation), `Message`, `Notification`. Cada modelo define `static associate(models)` pero
  no se auto-asocia; `models/index.js` requiere todos los modelos y recién ahí llama `associate` en
  cada uno (evita requires circulares entre archivos de modelos). Al usar asociaciones (`include`,
  `belongsToMany`, etc.) importar desde `require('../models')`, no desde el archivo individual.
- `migrations/` — migraciones de `sequelize-cli`, deben reflejar los modelos. Orden importa: `User`
  → `Conversation` → `ConversationParticipant` → `Message` → `Notification` (cada una referencia FKs
  de las anteriores).
- `routes/v1/` — routers de Express de la versión 1, agregados en `routes/v1/index.js` y montados
  bajo `/api/v1` en `app.js`. Hoy: `users.js` (consulta de usuario) y `messages.js` (consulta de
  mensajes de una conversación, `GET /conversations/:conversationId/messages`). Los paths dentro de
  estos archivos van sin el prefijo `v1` (eso lo pone el mount en `app.js`). Una `routes/v2/` a
  futuro se agrega sin tocar `v1/`.
- `services/Service.js` — lógica de negocio de mensajes (`createMessage`, `getMessagesByConversation`),
  compartida entre el router REST de mensajes y el handler de sockets. Nueva lógica de dominio va
  acá (o en un service nuevo si crece mucho), no directo en las rutas.
- `sockets/index.js` — `initSockets(httpServer)`. Eventos actuales: `joinRoom` (unirse a la room de
  un `conversationId`) y `sendMessage` (persiste vía `Service` y hace broadcast de `newMessage` a esa
  conversación).
- `tests/` — espeja la estructura de arriba (`tests/routes/`, `tests/services/`, etc). Los tests
  mockean los modelos Sequelize (`jest.mock('../../models/...')`) para no requerir Postgres.

## Convenciones

- Código nuevo: `const`/`let`, no `var` (el boilerplate viejo de `bin/www` usa `var`, no hace falta
  tocarlo).
- Async/await + try/catch con `next(error)` en las rutas Express, no callbacks de Sequelize.
- Variables de entorno: `PORT`, `NODE_ENV`, `POSTGRES_USER`, `POSTGRES_PASSWORD`, `DB_HOST`,
  `SECRET_KEY`. Ver `.env.example`. `.env` está gitignoreado — nunca commitear credenciales reales.
- Al agregar un modelo nuevo: crear el modelo en `models/`, la migración correspondiente en
  `migrations/`, y si expone datos por REST o sockets, hacerlo a través de un service, no accediendo
  al modelo directo desde la ruta/handler (salvo lecturas simples como en `routes/users.js`).

## Modelo de datos

`User` **no** es dueño de la identidad/auth — según `doc/Social App-architecture.drawio.png` esta
API (Node/Postgres) es la "Messaging API", separada de una "Social API" (Rails) que maneja el perfil
completo y el login. Por eso `User` acá solo tiene `uuid` (referencia externa a esa Social API),
`name`, `lastname`, `fullName` — sin `password`/`email`/auth propios. Nada crea usuarios localmente
todavía (eso depende de cómo se sincronicen desde la Social API — no resuelto aún).

`Conversation` puede ser 1:1 o grupal (`isGroup`); sus miembros están en `ConversationParticipant`
(join table `User`↔`Conversation`, único por `(conversationId, userId)`). `Message.conversationId`
reemplazó al viejo `roomId` string. `Notification` referencia un `User` (destinatario) y un
`Message` (origen), con `isRead` para marcar leído/no leído.

## Todavía no implementado

El README describe features que **no** existen todavía en el código — no asumas que sí:

- **Auth de usuarios**: no hay JWT/sesiones ni middleware de auth (y no debería vivir acá, ver
  arriba). `SECRET_KEY` está reservado pero no se usa en ningún lado hoy.
- **Notificaciones**: el modelo `Notification` existe, pero no hay ninguna ruta REST, ningún emisor
  de eventos de socket, ni lógica que las genere automáticamente al crear un `Message`.
- **API de conversaciones**: no hay rutas para crear conversaciones, listar las de un usuario, ni
  gestionar `ConversationParticipant` (agregar/sacar miembros). Solo existe la consulta de mensajes
  de una conversación ya conocida.

## Testing

`npm test` corre sin Postgres levantado porque los tests mockean los modelos Sequelize. Para probar
contra una base real: levantar Postgres, `NODE_ENV=test npx sequelize-cli db:migrate` contra la DB
`social-messaging-api-test`, y escribir/correr tests de integración aparte (hoy no existen).

## CI

`.github/workflows/ci.yml` corre en cada push (a cualquier rama) y en cada PR, con dos jobs independientes
(`lint` y `test`), para que un fallo de lint no oculte el resultado de los tests ni viceversa.
Ninguno de los dos requiere Postgres. Si agregás un paso nuevo (build, audit, etc.), que sea su
propio job por la misma razón.
