# Intelligent Career Guidance Platform

Phase 1 provides the application foundation: a Vite React client, an Express API, environment configuration, a MongoDB connection layer with a development memory-store fallback, shared error handling, reusable layout components, and the dashboard shell.

## Project structure

- `client/` - React and Vite frontend
- `server/` - Express backend, services, algorithms, models, and tests
- `server/src/models/schemas/` - Mongoose models for Student, Skill, Career, Assessment, Problem, Concept, Resource, LearningTask, Submission, SkillProgress, CareerScore, Simulation, and LearningPlan

## Run locally

Install dependencies once in each application:

```text
cd client
npm install
cd ..\server
npm install
```

Start the backend:

```text
npm run server:dev
```

Start the frontend in a second terminal:

```text
npm run client:dev
```

Open `http://localhost:5173`. The backend health endpoint is `http://localhost:5000/health`.

## Configuration

Copy `server/.env.example` to `server/.env`. The server runs with its in-memory development data layer when `MONGODB_URI` is not set. To use MongoDB, set `MONGODB_URI` and start the server; the registered Mongoose models will then be available to the database layer.

Set `VITE_API_URL` in `client/.env` only when the API is not reachable through the Vite development proxy. The default API URL is `http://localhost:5000/api`.

## Verification

```text
npm run client:build
npm run client:lint
npm run server:test
```
