import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { products } from "@/lib/schema";
import { getOrCreateUser } from "@/lib/auth";
import { eq, desc } from "drizzle-orm";

const createSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  rate: z.number().positive("Rate must be positive"),
  unit: z.string().optional().default("pcs"),
});

export async function GET() {
  try {
    const user = await getOrCreateUser();
    const list = await db
      .select()
      .from(products)
      .where(eq(products.userId, user.id))
      .orderBy(desc(products.createdAt));
    return NextResponse.json({ success: true, data: list });
  } catch (err) {
    console.error("[GET /api/products]", err);
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

    const { name, description, rate, unit } = parsed.data;
    const [created] = await db
      .insert(products)
      .values({
        userId: user.id,
        name,
        description: description || null,
        rate: rate.toString(),
        unit: unit || "pcs",
      })
      .returning();

    return NextResponse.json({ success: true, data: created }, { status: 201 });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    const status = msg === "Unauthorized" ? 401 : 500;
    return NextResponse.json({ success: false, error: msg }, { status });
  }
}
