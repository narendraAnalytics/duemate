import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";
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
  quantity: z.number().int().min(0).default(0),
  gstRate: z.number().min(0).default(0),
  purchaseRate: z.number().positive().optional(),
  purchaseDate: z.string().optional(),
  supplierShop: z.string().optional(),
  supplierPhone: z.string().optional(),
  supplierGstin: z.string().optional(),
  hsnCode: z.string().optional(),
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

    const { name, description, rate, unit, quantity, gstRate, purchaseRate, purchaseDate, supplierShop, supplierPhone, supplierGstin, hsnCode } = parsed.data;
    const [created] = await db
      .insert(products)
      .values({
        userId: user.id,
        name,
        description: description || null,
        rate: rate.toString(),
        unit: unit || "pcs",
        quantity,
        gstRate: gstRate.toString(),
        purchaseRate: purchaseRate ? purchaseRate.toString() : null,
        purchaseDate: purchaseDate ? new Date(purchaseDate) : null,
        supplierShop: supplierShop || null,
        supplierPhone: supplierPhone || null,
        supplierGstin: supplierGstin || null,
        hsnCode: hsnCode || null,
      })
      .returning();

    return NextResponse.json({ success: true, data: created }, { status: 201 });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    const status = msg === "Unauthorized" ? 401 : 500;
    return NextResponse.json({ success: false, error: msg }, { status });
  }
}
