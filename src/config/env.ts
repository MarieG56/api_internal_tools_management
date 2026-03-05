const parsedPort = Number.parseInt(process.env.PORT ?? "3000", 10);

export const port = Number.isNaN(parsedPort) ? 3000 : parsedPort;
export const nodeEnv = process.env.NODE_ENV ?? "development";
export const databaseUrl = process.env.DATABASE_URL;
