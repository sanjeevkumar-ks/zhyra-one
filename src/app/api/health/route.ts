import { db, getDatabaseUrl } from "@/db";
import { sql } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET() {
  const url = getDatabaseUrl();
  if (!url) {
    return Response.json(
      {
        ok: false,
        status: "unconfigured",
        message:
          "Database connection string is not configured. Please set DATABASE_URL or POSTGRES_URL.",
      },
      { status: 503 }
    );
  }

  try {
    await db.execute(sql`select 1`);
    return Response.json({ ok: true, status: "healthy" });
  } catch (err) {
    return Response.json(
      {
        ok: false,
        status: "unhealthy",
        error: err instanceof Error ? err.message : "Database connection failed",
      },
      { status: 500 }
    );
  }
}
