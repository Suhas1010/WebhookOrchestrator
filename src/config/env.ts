import "dotenv/config";

function getRequiredEnv(name: string): string {
  const value = process.env[name];

  if (!value || value.trim() === "") {
    throw new Error(
      `Missing required environment variable: ${name}`
    );
  }

  return value;
}

function getPort(name: string, defaultValue: number): number {
  const value = process.env[name];

  if (value === undefined || value.trim() === "") {
    return defaultValue;
  }

  const port = Number(value);

  if (
    !Number.isInteger(port) ||
    port < 1 ||
    port > 65535
  ) {
    throw new Error(`Invalid port value for ${name}`);
  }

  return port;
}

export const env = {
  NODE_ENV: process.env.NODE_ENV || "development",
  PORT: getPort("PORT", 3000),
  PGHOST: getRequiredEnv("PGHOST"),
  PGPORT: getPort("PGPORT", 5432),
  PGDATABASE: getRequiredEnv("PGDATABASE"),
  PGUSER: getRequiredEnv("PGUSER"),
  PGPASSWORD: getRequiredEnv("PGPASSWORD"),
  JWT_SECRET: getRequiredEnv("JWT_SECRET"),
};
