# Internal Tools API

## Technologies
- Language: TypeScript (Node.js)
- Framework: Express
- Database: PostgreSQL
- ORM: Prisma
- API Port: `3000` (configurable via `PORT`)

## Quick Start
1. Start PostgreSQL from the `back_env` directory:
   - `docker-compose --profile postgres up -d`
2. Install dependencies in `back_end`:
   - `npm install`
3. Generate Prisma Client:
   - `npm run prisma:generate`
4. Start the API:
   - `npm run dev`
5. API available at `http://localhost:3000`
6. Swagger documentation at `http://localhost:3000/api/docs`

## Configuration
- Environment variables: see `.env`
- Default DB configuration:
  - `DATABASE_URL=postgresql://dev:dev123@localhost:5433/internal_tools`
- Optional logging level:
  - `LOG_LEVEL=info`
- The database is initialized via `back_env/postgresql/init.sql` (schema + seed data)
- Prisma uses its built-in connection pool from `DATABASE_URL` (the app reuses one singleton client).

## Tests
- `npm test` - basic tests (API health check)

## Architecture
- `src/controllers`: HTTP layer (request/response)
- `src/services`: business logic and Prisma queries
- `src/validators`: reusable Zod validation schemas
- `src/middlewares`: centralized error handling + 404 handling
- `src/docs`: OpenAPI specification exposed through Swagger UI
- `src/lib/prisma.ts`: shared Prisma client singleton
- `src/lib/logger.ts`: structured JSON logging (INFO/WARN/ERROR)

## Implemented Endpoints
- `GET /api/tools`: list with combinable filters, pagination, and sorting
- `GET /api/tools/:id`: full details + usage metrics (last 30 days)
- `POST /api/tools`: create with business validations
- `PUT /api/tools/:id`: partial update with validations and 404 handling

## Useful Scripts
- `npm run dev`: development mode
- `npm run build`: compile TypeScript to `dist/`
- `npm start`: local production mode
- `npm run prisma:generate`: generate Prisma Client
- `npm run prisma:db-pull`: introspect schema from the DB
