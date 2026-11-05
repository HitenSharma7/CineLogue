
import "dotenv/config";
import { z } from "zod";

const envSchema = z.object({
  REELDB_API_KEY: z.string().trim().min(1, "REELDB_API_KEY is required"),

  REELDB_BASE_URL: z
    .string()
    .url()
    .startsWith("https://")
    .default("https://api.reeldb.io"),

  REELDB_TIMEOUT_MS: z.coerce
    .number()
    .int()
    .min(1000)
    .max(30000)
    .default(8000),

  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),

  PORT: z.coerce.number().int().min(1).max(65535).default(5000),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("Invalid environment configuration:");

  for (const issue of parsed.error.issues) {
    console.error(`- ${issue.path.join(".")}: ${issue.message}`);
  }

  process.exit(1);
}

export const env = parsed.data;
