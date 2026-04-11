import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";
import { z } from "zod";
import { db } from "@/lib/db";
import { suppliers } from "@/lib/schema";
import { getOrCreateUser } from "@/lib/auth";
import { eq, desc } from "drizzle-orm";

const createSchema = z.object({
  name: z.string().min(1, "Supplier name is required"),
  shopName: z.string().min(1, "Shop name is required"),
  phone: z
    .string()
    .optional()
    .refine((v) => !v || /^\d{10}$/.test(v), "Phone must be exactly 10 digits"),
  gstin: z
    .string()
    .optional()
    .refine(
      (v) => !v || /^\d{2}[A-Z]{5}\d{4}[A-Z][A-Z0-9]Z[A-Z0-9]$/.test(v),
      "Invalid GSTIN format"
    ),
});

export async function GET() {
  try {
    const user = await getOrCreateUser();
    const list = await db
      .select()
      .from(suppliers)
      .where(eq(suppliers.userId, user.id))
      .orderBy(desc(suppliers.createdAt));
    return NextResponse.json({ success: true, data: list });
  } catch (err) {
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
    const { name, shopName, phone, gstin } = parsed.data;
    const [created] = await db
      .insert(suppliers)
      .values({
        userId: user.id,
        name,
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
