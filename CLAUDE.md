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
npm test                           # correr la test suite (no requiere Postgres, todo mockeado)
```

## Estructura

- `app.js` — arma la app de Express (middlewares + routers). No levanta el servidor.
- `bin/www` — crea el `http.Server`, lo pasa a `initSockets` y lo pone a escuchar.
- `db.js` — instancia única de Sequelize, leída desde `config/config.js` según `NODE_ENV`.
- `config/config.js` — config de conexión para la app **y** para `sequelize-cli` (mismo archivo,
  para no duplicar la lectura de env vars). `.sequelizerc` apunta acá.
- `models/` — modelos Sequelize (`User`, `Message`). Cada uno importa la instancia de `db.js`.
- `migrations/` — migraciones de `sequelize-cli`, deben reflejar los modelos.
- `routes/v1/` — routers de Express de la versión 1, agregados en `routes/v1/index.js` y montados
  bajo `/api/v1` en `app.js`. Hoy: `users.js` (consulta de usuario) y `messages.js` (consulta de
  mensajes de una conversación/room). Los paths dentro de estos archivos van sin el prefijo `v1`
  (eso lo pone el mount en `app.js`). Una `routes/v2/` a futuro se agrega sin tocar `v1/`.
- `services/Service.js` — lógica de negocio de mensajes (`createMessage`, `getMessagesByRoom`),
  compartida entre el router REST de mensajes y el handler de sockets. Nueva lógica de dominio va
  acá (o en un service nuevo si crece mucho), no directo en las rutas.
- `sockets/index.js` — `initSockets(httpServer)`. Eventos actuales: `joinRoom` (unirse a un room) y
  `sendMessage` (persiste vía `Service` y hace broadcast de `newMessage` al room).
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

## Todavía no implementado

El README describe features que **no** existen todavía en el código — no asumas que sí:

- **Auth de usuarios**: no hay JWT/sesiones ni middleware de auth. `SECRET_KEY` está reservado para
  esto pero no se usa en ningún lado hoy.
- **Notificaciones**: no hay ningún sistema de notificaciones (push, email, etc).
- **Conversaciones/rooms como entidad**: `Message.roomId` es un string libre, no hay un modelo
  `Conversation`/`Room` con miembros, permisos, etc. Es la simplificación mínima para tener group
  chat funcionando.

## Testing

`npm test` corre sin Postgres levantado porque los tests mockean los modelos Sequelize. Para probar
contra una base real: levantar Postgres, `NODE_ENV=test npx sequelize-cli db:migrate` contra la DB
`social-messaging-api-test`, y escribir/correr tests de integración aparte (hoy no existen).
