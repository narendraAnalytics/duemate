import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";
import { z } from "zod";
import { db } from "@/lib/db";
import { products } from "@/lib/schema";
import { getOrCreateUser } from "@/lib/auth";
import { eq, and } from "drizzle-orm";

const updateSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional().nullable(),
  rate: z.number().positive().optional(),
  unit: z.string().optional(),
  quantity: z.number().int().min(0).optional(),
  gstRate: z.number().min(0).optional(),
  purchaseRate: z.number().positive().optional().nullable(),
  purchaseDate: z.string().optional().nullable(),
  supplierShop: z.string().optional().nullable(),
  supplierPhone: z.string().optional().nullable(),
  supplierGstin: z.string().optional().nullable(),
  hsnCode: z.string().optional().nullable(),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getOrCreateUser();
    const { id } = await params;
    const body = await req.json();
    const parsed = updateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const data = parsed.data;
    const [updated] = await db
      .update(products)
      .set({
        ...(data.name !== undefined && { name: data.name }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.rate !== undefined && { rate: data.rate.toString() }),
        ...(data.unit !== undefined && { unit: data.unit }),
        ...(data.quantity !== undefined && { quantity: data.quantity }),
        ...(data.gstRate !== undefined && { gstRate: data.gstRate.toString() }),
        ...(data.purchaseRate !== undefined && { purchaseRate: data.purchaseRate ? data.purchaseRate.toString() : null }),
        ...(data.purchaseDate !== undefined && { purchaseDate: data.purchaseDate ? new Date(data.purchaseDate) : null }),
        ...(data.supplierShop !== undefined && { supplierShop: data.supplierShop }),
        ...(data.supplierPhone !== undefined && { supplierPhone: data.supplierPhone }),
        ...(data.supplierGstin !== undefined && { supplierGstin: data.supplierGstin }),
        ...(data.hsnCode !== undefined && { hsnCode: data.hsnCode }),
      })
      .where(and(eq(products.id, id), eq(products.userId, user.id)))
      .returning();

    if (!updated) {
      return NextResponse.json(
        { success: false, error: "Product not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: updated });
  } catch (err) {
    console.error("[PATCH /api/products/:id]", err);
    const msg = err instanceof Error ? err.message : "Unknown error";
    const status = msg === "Unauthorized" ? 401 : 500;
    return NextResponse.json({ success: false, error: msg }, { status });
  }
}
