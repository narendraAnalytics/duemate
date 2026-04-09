import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";
import { z } from "zod";
import { db } from "@/lib/db";
import { invoices, PaymentHistoryEntry } from "@/lib/schema";
import { getOrCreateUser } from "@/lib/auth";
import { eq, and } from "drizzle-orm";

const paymentSchema = z.object({
  additionalPayment: z.number().positive("Payment amount must be greater than zero"),
  paymentType: z.enum(["cash", "online"]),
  paymentReference: z.string().optional(),
  paymentNotes: z.string().optional(),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getOrCreateUser();
    const { id } = await params;
    const body = await req.json();
    const parsed = paymentSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { additionalPayment, paymentType, paymentReference, paymentNotes } = parsed.data;

    const newEntry: PaymentHistoryEntry = {
      amount: additionalPayment,
      type: paymentType,
      reference: paymentReference ?? "",
      notes: paymentNotes ?? "",
      paidAt: new Date().toISOString(),
    };

    // Fetch current invoice (must belong to this user)
    const [inv] = await db
      .select({
        id: invoices.id,
        amount: invoices.amount,
        paidAmount: invoices.paidAmount,
        paidCash: invoices.paidCash,
        paidOnline: invoices.paidOnline,
        balanceAmount: invoices.balanceAmount,
        paymentHistory: invoices.paymentHistory,
      })
      .from(invoices)
      .where(and(eq(invoices.id, id), eq(invoices.userId, user.id)))
      .limit(1);

    if (!inv) {
      return NextResponse.json({ success: false, error: "Invoice not found." }, { status: 404 });
    }

    const totalAmount = Number(inv.amount ?? 0);
    const existingPaid = Number(inv.paidAmount ?? 0);
    const currentPaidCash = Number(inv.paidCash ?? 0);
    const currentPaidOnline = Number(inv.paidOnline ?? 0);
    const currentBalance = Number(inv.balanceAmount ?? totalAmount);

    if (additionalPayment > currentBalance + 0.001) {
      return NextResponse.json(
        { success: false, error: `Payment exceeds balance due (${currentBalance.toFixed(2)}).` },
        { status: 400 }
      );
    }

    const newPaid = existingPaid + additionalPayment;
    const newBalance = Math.max(0, totalAmount - newPaid);
    const isFullyPaid = newBalance <= 0.001;

    const existingHistory: PaymentHistoryEntry[] = Array.isArray(inv.paymentHistory) ? inv.paymentHistory : [];
    const updatedHistory = [...existingHistory, newEntry];

    const [updated] = await db
      .update(invoices)
      .set({
        paidAmount: String(newPaid),
        ...(paymentType === "cash" ? { paidCash: String(currentPaidCash + additionalPayment) } : {}),
        ...(paymentType === "online" ? { paidOnline: String(currentPaidOnline + additionalPayment) } : {}),
        balanceAmount: String(newBalance),
        paymentType,
        status: isFullyPaid ? "paid" : "pending",
        paidAt: isFullyPaid ? new Date() : null,
        lastPaymentAt: new Date(),
        ...(paymentReference ? { paymentReference } : {}),
        ...(paymentNotes !== undefined ? { paymentNotes: paymentNotes || null } : {}),
        paymentHistory: updatedHistory,
      })
      .where(and(eq(invoices.id, id), eq(invoices.userId, user.id)))
      .returning();

    return NextResponse.json({ success: true, data: updated });
  } catch (err) {
    console.error("[PATCH /api/invoices/:id]", err);
    const msg = err instanceof Error ? err.message : "Unknown error";
    const status = msg === "Unauthorized" ? 401 : 500;
    return NextResponse.json({ success: false, error: msg }, { status });
  }
}
