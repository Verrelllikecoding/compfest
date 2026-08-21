const REQUIRED_BACKEND_ENVIRONMENT_VARIABLES = [
  "DATABASE_URL",
  "JWT_SECRET",
  "JWT_REFRESH_SECRET",
] as const;

export function getRequiredEnvironmentVariable(name: string): string {
  const value = process.env[name];

  if (!value || value.trim() === "") {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

export function validateBackendEnvironment(): void {
  const missing = REQUIRED_BACKEND_ENVIRONMENT_VARIABLES.filter(
    (name) => !process.env[name] || process.env[name]!.trim() === ""
  );

  if (missing.length > 0) {
    throw new Error(
      `Missing required backend environment variables: ${missing.join(", ")}`
    );
  }
}
