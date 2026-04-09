import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";
import { z } from "zod";
import { db } from "@/lib/db";
import { customers } from "@/lib/schema";
import { getOrCreateUser } from "@/lib/auth";
import { and, eq } from "drizzle-orm";

const updateSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email"),
  shopName: z.string().min(1, "Shop name is required"),
  phone: z.string().optional(),
  gstin: z.string().optional(),
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

    const { name, email, shopName, phone, gstin } = parsed.data;
    const [updated] = await db
      .update(customers)
      .set({
        name,
        email,
        shopName,
        phone: phone || null,
        gstin: gstin || null,
      })
      .where(and(eq(customers.id, id), eq(customers.userId, user.id)))
      .returning();

    if (!updated) {
      return NextResponse.json({ success: false, error: "Not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: updated });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    const status = msg === "Unauthorized" ? 401 : 500;
    return NextResponse.json({ success: false, error: msg }, { status });
  }
}
