import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";
import { z } from "zod";
import { db } from "@/lib/db";
import { customers } from "@/lib/schema";
import { getOrCreateUser } from "@/lib/auth";
import { eq, desc, sql } from "drizzle-orm";

const createSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email"),
  shopName: z.string().min(1, "Shop name is required"),
  phone: z.string().optional(),
  gstin: z.string().optional(),
});

export async function GET() {
  try {
    const user = await getOrCreateUser();
    const list = await db
      .select()
      .from(customers)
      .where(eq(customers.userId, user.id))
      .orderBy(desc(customers.createdAt));
    return NextResponse.json({ success: true, data: list });
  } catch (err) {
    console.error("[GET /api/customers]", err);
    const msg = err instanceof Error ? err.message : "Unknown error";
    const status = msg === "Unauthorized" ? 401 : 500;
    return NextResponse.json({ success: false, error: msg }, { status });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getOrCreateUser();
    const body = await req.json();
    const parsed = createSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    // Free plan: 10 total · Plus (starter): 200 total · Pro: unlimited
    if (user.plan === "free" || user.plan === "starter") {
      const limit = user.plan === "free" ? 10 : 200;
      const [{ total }] = await db
        .select({ total: sql<number>`count(*)::int` })
        .from(customers)
        .where(eq(customers.userId, user.id));
      if (total >= limit) {
        return NextResponse.json(
          { success: false, planLimit: true, limit, used: total, remaining: 0, resource: "customer" },
          { status: 403 }
        );
      }
    }

    const { name, email, shopName, phone, gstin } = parsed.data;
    const [created] = await db
      .insert(customers)
      .values({
        userId: user.id,
        name,
        email,
        shopName,
        phone: phone || null,
        gstin: gstin || null,
      })
      .returning();

    return NextResponse.json({ success: true, data: created }, { status: 201 });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    const status = msg === "Unauthorized" ? 401 : 500;
    return NextResponse.json({ success: false, error: msg }, { status });
  }
}
