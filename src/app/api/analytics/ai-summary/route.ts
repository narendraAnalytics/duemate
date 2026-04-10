import { NextRequest, NextResponse } from "next/server";
import { getOrCreateUser } from "@/lib/auth";
import { GoogleGenerativeAI } from "@google/generative-ai";

export async function POST(req: NextRequest) {
  try {
    await getOrCreateUser();

    const body = await req.json();
    const {
      totalRevenue = 0,
      totalCollected = 0,
      totalOutstanding = 0,
      overdueCount = 0,
      overdueAmount = 0,
      topCustomer = "",
      topProduct = "",
      invoiceCount = 0,
    } = body;

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ success: false, error: "Gemini API key not configured" }, { status: 500 });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: process.env.GEMINI_MODEL ?? "gemini-3.1-flash-lite-preview",
      generationConfig: { temperature: 0.4 },
    });

    const collectionRate =
      totalRevenue > 0 ? Math.round((totalCollected / totalRevenue) * 100) : 0;

    const prompt = `You are a concise business advisor for a small Indian business. Analyze this invoice data and give a 2–3 sentence actionable business health summary. Be specific and helpful. Use ₹ for currency.

Business stats:
- Total Revenue Billed: ₹${Number(totalRevenue).toLocaleString("en-IN")}
- Total Collected: ₹${Number(totalCollected).toLocaleString("en-IN")} (${collectionRate}% collection rate)
- Outstanding Balance: ₹${Number(totalOutstanding).toLocaleString("en-IN")}
- Overdue: ${overdueCount} invoices worth ₹${Number(overdueAmount).toLocaleString("en-IN")}
- Total Invoices: ${invoiceCount}
- Top Customer: ${topCustomer || "N/A"}
- Top Product: ${topProduct || "N/A"}

Write 2–3 sentences of practical insight. Mention what is going well and what needs immediate attention.`;

    const result = await model.generateContent(prompt);
    const text = result.response.text().trim();

    return NextResponse.json({ success: true, data: text });
  } catch (err) {
    console.error("[ai-summary]", err);
    return NextResponse.json({ success: false, error: "Failed to generate summary" }, { status: 500 });
  }
}
