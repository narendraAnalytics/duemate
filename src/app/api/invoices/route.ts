import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";
import { z } from "zod";
import { db } from "@/lib/db";
import { invoices, customers, products } from "@/lib/schema";
import { getOrCreateUser } from "@/lib/auth";
import { eq, desc, and, sql } from "drizzle-orm";

const lineItemSchema = z.object({
  productId: z.string(),
  name: z.string(),
  rate: z.number(),
  quantity: z.number().positive(),
  subtotal: z.number(),
  unit: z.string().optional(),
});

const createSchema = z.object({
  customerId: z.string().uuid().optional().nullable(),
  invoiceNumber: z.string().min(1, "Invoice number is required"),
  amount: z.number().positive("Amount must be greater than zero"),
  currency: z.string().default("INR"),
  issueDate: z.string(),
  dueDate: z.string(),
  notes: z.string().optional(),
  discountType: z.enum(["flat", "percent"]).default("flat"),
  discountAmount: z.number().min(0).default(0),
  taxRate: z.number().min(0).max(100).default(0),
  taxAmount: z.number().min(0).default(0),
  paymentType: z.enum(["cash", "online"]).optional().nullable(),
  paidAmount: z.number().min(0).default(0),
  extractedData: z
    .object({ lineItems: z.array(lineItemSchema) })
    .optional()
    .nullable(),
});

export async function GET() {
  try {
    const user = await getOrCreateUser();

    const rows = await db
      .select({
        id: invoices.id,
        invoiceNumber: invoices.invoiceNumber,
        amount: invoices.amount,
        currency: invoices.currency,
        dueDate: invoices.dueDate,
        issueDate: invoices.issueDate,
        status: invoices.status,
        discountType: invoices.discountType,
        discountAmount: invoices.discountAmount,
        taxRate: invoices.taxRate,
        taxAmount: invoices.taxAmount,
        paymentType: invoices.paymentType,
        paidAmount: invoices.paidAmount,
        paidCash: invoices.paidCash,
        paidOnline: invoices.paidOnline,
        balanceAmount: invoices.balanceAmount,
        paidAt: invoices.paidAt,
        lastPaymentAt: invoices.lastPaymentAt,
        paymentReference: invoices.paymentReference,
        paymentNotes: invoices.paymentNotes,
        notes: invoices.notes,
        extractedData: invoices.extractedData,
        paymentHistory: invoices.paymentHistory,
        createdAt: invoices.createdAt,
        customerId: invoices.customerId,
        customerName: customers.name,
        customerShopName: customers.shopName,
      })
      .from(invoices)
      .leftJoin(customers, eq(invoices.customerId, customers.id))
      .where(eq(invoices.userId, user.id))
      .orderBy(desc(invoices.createdAt));

    return NextResponse.json({ success: true, data: rows });
  } catch (err) {
    console.error("[GET /api/invoices]", err);
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

    const {
      customerId,
      invoiceNumber,
      amount,
      currency,
      issueDate,
      dueDate,
      notes,
      discountType,
      discountAmount,
      taxRate,
      taxAmount,
      paymentType,
      paidAmount,
      extractedData,
    } = parsed.data;

    // Uniqueness check
    const existing = await db
      .select({ id: invoices.id })
      .from(invoices)
      .where(and(eq(invoices.userId, user.id), eq(invoices.invoiceNumber, invoiceNumber)))
      .limit(1);

    if (existing.length > 0) {
      return NextResponse.json(
        { success: false, error: `Invoice number "${invoiceNumber}" already exists.` },
        { status: 400 }
      );
    }

    const balanceAmount = Math.max(0, amount - paidAmount);
    const isFullyPaid = paidAmount >= amount && paidAmount > 0;
    const invoiceStatus = isFullyPaid ? "paid" : "pending";
    const paidAt = isFullyPaid ? new Date() : null;

    const [created] = await db
      .insert(invoices)
      .values({
        userId: user.id,
        customerId: customerId ?? null,
        invoiceNumber,
        amount: String(amount),
        currency,
        issueDate: new Date(issueDate),
        dueDate: new Date(dueDate),
        notes: notes ?? null,
        discountType,
        discountAmount: String(discountAmount),
        taxRate: String(taxRate),
        taxAmount: String(taxAmount),
        paymentType: paymentType ?? null,
        paidAmount: String(paidAmount),
        balanceAmount: String(balanceAmount),
        status: invoiceStatus,
        paidAt,
        extractedData: extractedData ?? null,
        paymentHistory: (paidAmount > 0 && paymentType)
          ? [{ amount: paidAmount, type: paymentType as "cash" | "online", reference: "", notes: "", paidAt: new Date().toISOString() }]
          : [],
      })
      .returning();

    // Reduce stock for each line item
    if (extractedData?.lineItems?.length) {
      await Promise.all(
        extractedData.lineItems.map((item) =>
          db
            .update(products)
            .set({ quantity: sql`GREATEST(0, quantity - ${item.quantity})` })
            .where(and(eq(products.id, item.productId), eq(products.userId, user.id)))
        )
      );
    }

    return NextResponse.json({ success: true, data: created }, { status: 201 });
  } catch (err) {
    console.error("[POST /api/invoices]", err);
    const msg = err instanceof Error ? err.message : "Unknown error";
    const status = msg === "Unauthorized" ? 401 : 500;
    return NextResponse.json({ success: false, error: msg }, { status });
  }
}
