import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";
import { z } from "zod";
import { db } from "@/lib/db";
import { suppliers } from "@/lib/schema";
import { getOrCreateUser } from "@/lib/auth";
import { eq, and } from "drizzle-orm";

const patchSchema = z.object({
  name: z.string().min(1, "Supplier name is required"),
  shopName: z.string().min(1, "Shop name is required"),
  phone: z
    .string()
    .optional()
    .nullable()
    .refine((v) => !v || /^\d{10}$/.test(v), "Phone must be exactly 10 digits"),
  gstin: z
    .string()
    .optional()
    .nullable()
    .refine(
      (v) => !v || /^\d{2}[A-Z]{5}\d{4}[A-Z][A-Z0-9]Z[A-Z0-9]$/.test(v),
      "Invalid GSTIN format"
    ),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getOrCreateUser();
    const { id } = await params;
    const body = await req.json();
    const parsed = patchSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }
    const { name, shopName, phone, gstin } = parsed.data;
    const [updated] = await db
      .update(suppliers)
      .set({
        name,
        shopName,
        phone: phone || null,
        gstin: gstin || null,
      })
      .where(and(eq(suppliers.id, id), eq(suppliers.userId, user.id)))
      .returning();
    if (!updated) {
      return NextResponse.json({ success: false, error: "Not found." }, { status: 404 });
    }
    return NextResponse.json({ success: true, data: updated });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    const status = msg === "Unauthorized" ? 401 : 500;
    return NextResponse.json({ success: false, error: msg }, { status });
  }
}
