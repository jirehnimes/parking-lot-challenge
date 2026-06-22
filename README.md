# Parking Lot Challenge

A Node.js REST API built with Express, TypeScript, and InversifyJS.

## Requirements

- Node.js >= 20
- npm >= 9

## Installation

```bash
npm install
```

## Usage

### Development

Start the server with hot-reload:

```bash
npm run dev
```

### Production

Type-check, bundle, and start:

```bash
npm run build
npm start
```

The server listens on port `3000` by default. Set the `PORT` environment variable to override:

```bash
PORT=8080 npm start
```

## Scripts

| Script | Description |
|---|---|
| `npm run dev` | Start dev server with file watching (`tsx`) |
| `npm run build` | Type-check, then bundle `src/` to `dist/` (`tsup`) |
| `npm start` | Run the bundled output |
| `npm test` | Run test suite |
| `npm run test:watch` | Run tests in watch mode |

## Tech Stack

- **[Express](https://expressjs.com/)** — HTTP framework
- **[Helmet](https://helmetjs.github.io/)** — Security headers middleware
- **[InversifyJS](https://inversify.io/)** — IoC / dependency injection container
- **[reflect-metadata](https://www.npmjs.com/package/reflect-metadata)** — Decorator metadata reflection, required by InversifyJS
- **[TypeScript](https://www.typescriptlang.org/)** — Type-safe JavaScript, compiled as native ESM
- **[Jest](https://jestjs.io/) + [ts-jest](https://kulshekhar.github.io/ts-jest/)** — Unit and integration testing
- **[tsx](https://tsx.is/)** — TypeScript execution with watch mode for local development
- **[tsup](https://tsup.egoist.dev/)** — esbuild-based bundler for the production build
- **[Biome](https://biomejs.dev/)** — Formatting and linting
- **[date-fns](https://date-fns.org/)** — Date utility library
- **[class-validator](https://github.com/typestack/class-validator)** — Decorator-based request payload validation
- **[class-transformer](https://github.com/typestack/class-transformer)** — Plain object → DTO class instance transformation

## Project Structure

```
src/
├── app.ts               # Express app (middleware + routes)
├── server.ts            # Process entry point
├── container.ts         # InversifyJS IoC container bindings
├── routes.ts            # Route → controller wiring
├── constants/           # Shared enums (HTTP status codes, parking domain values)
├── controllers/         # Express route handlers
├── data/                # Seed data (e.g. initial parking slot layout)
├── database/            # Models, repositories, and the in-memory mock database service
│   ├── models/          # Domain models
│   └── repositories/    # Repository interface and implementations (data access layer)
├── dto/                 # Request payload DTOs (validated via class-validator)
├── services/            # Business logic (parking slot/lot, transactions, fare calculation)
├── types/               # Shared TypeScript types
├── utils/               # Pure helper functions (date math, etc.)
└── validators/          # Decorators for DTO-based request validation
```

## License

ISC
