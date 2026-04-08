import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { customers } from "@/lib/schema";
import { getOrCreateUser } from "@/lib/auth";
import { eq, desc } from "drizzle-orm";

const createSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
  shopName: z.string().optional(),
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

    const { name, email, shopName } = parsed.data;
    const [created] = await db
      .insert(customers)
      .values({
        userId: user.id,
        name,
        email: email || null,
        shopName: shopName || null,
      })
      .returning();

    return NextResponse.json({ success: true, data: created }, { status: 201 });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    const status = msg === "Unauthorized" ? 401 : 500;
    return NextResponse.json({ success: false, error: msg }, { status });
  }
}
