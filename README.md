# Social Messaging API

## Table of Contents

- [Description](#description)
- [Features](#features)
- [System Architecture](#system-architecture)
- [Class Diagram](#class-diagram)
- [Technologies Used](#technologies-used)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Usage](#usage)

## Description

La API de Social Messaging es una aplicación basada en Node.js diseñada para permitir la mensajería en tiempo real mediante el protocolo WebSocket. Esta API facilita la comunicación instantánea, chats grupales y notificaciones fluidas entre los usuarios. Además, ofrece la capacidad de consultar conversaciones y otros detalles a través de una API REST para una experiencia de usuario completa.

**Features:**

- **Real-Time Messaging:** Users can send and receive messages in real-time, creating a seamless and interactive chat experience.

- **Group Chats:** Users have the ability to create and participate in group chats with multiple participants, facilitating team communication.

- **Notifications:** The API supports sending notifications to users about new messages and important updates, keeping them informed at all times.

- **User Authentication:** User authentication is performed securely, ensuring that only authorized users can access messaging features and maintain the privacy of their conversations.

- **Conversation Query:** In addition to real-time messaging, the API allows users to query their previous conversations and access historical information through a REST API.

These combined features provide users with a complete social messaging experience, from real-time communication to the ability to access past conversations and stay informed about important notifications.

## System Architecture

This diagram outlines the system's architecture, illustrating how clients interact with the Social Messaging API:

![System Architecture](doc/Social%20App-architecture.drawio.png)

The architecture diagram provides an overview of the communication flow between clients and the server. It highlights the essential components that ensure a smooth interaction experience

## Class Diagram

Here is the class diagram illustrating models and their relationships:

![Class Diagram](doc//Social%20App-messaging-api.drawio.png)

## Technologies Used

This API leverages various technologies and tools, including:

- Node.js 16.19.1
- Express.js for handling HTTP requests.
- PostgreSQL as the database for storing message history and user data.
- pg and pg-hstore for PostgreSQL database interaction.
- Sequelize as the ORM (Object-Relational Mapping) for database operations.
- socket.io for real-time WebSocket messaging.
- Jest and Supertest for the test suite.

## Prerequisites

Before getting started with this Social Messaging API, ensure you have the following prerequisites:

- Node.js 16.19.1 or a compatible version installed on your system.
- PostgreSQL database server set up and configured for message storage.
- ...

## Installation

Follow these steps to set up and run the Social Messaging API:

1. **Clone the repository:**

   ```bash
   git clone git@github.com:brusatimatias/social-messaging-api.git
   cd social-messaging-api
   ```

2. **Install the required packages:**

   ```bash
   npm install
   ```

   This command installs packages used including Express, Sequelize, and the PostgreSQL drivers.

3. **Configure environment variables:**

   Copy `.env.example` to `.env` and adjust it to match your PostgreSQL setup:

   ```bash
   cp .env.example .env
   ```

   ```env
   PORT=3001
   NODE_ENV=development
   POSTGRES_USER=yourusername
   POSTGRES_PASSWORD=yourpassword
   DB_HOST=localhost
   SECRET_KEY=yoursecretkey
   ```

4. **Run Sequelize migrations:**

   ```bash
   npx sequelize-cli db:migrate
   ```

   This command will create the necessary database tables based on your Sequelize models.

5. **Start the Social Messaging API:**

   ```bash
   npm start
   ```

   The API should now be running locally and accessible at `http://localhost:3001`. Use `npm run dev` instead to start it with `nodemon` for local development.

6. **Run the test suite:**

   ```bash
   npm test
   ```

   The tests mock the Sequelize models, so they run without a live PostgreSQL connection.

## Usage

The Social Messaging API enables real-time messaging via WebSocket connections (socket.io). Clients
connect, emit `joinRoom` with a room id to join a group chat, and emit `sendMessage` with
`{ roomId, senderId, content }` to send a message — the server persists it and broadcasts a
`newMessage` event to everyone in that room. Users can also use RESTful endpoints to query
conversations and messages for historical data access (e.g. `GET /api/v1/conversations/:roomId/messages`).

If you're a developer interested in using our API or have any questions, please don't hesitate to get in touch:

- Email: [mformento8@gmail.com](mailto:mformento8@gmail.com)
