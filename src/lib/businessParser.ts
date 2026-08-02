/**
 * Biztriach - WhatsApp Business Operations Parser
 * Parses natural language business messages into structured operations
 * 
 * Examples:
 * "Sold 5 bags of rice for ₦85,000 each" -> Sale
 * "Bought 100 bags of rice at ₦70k each" -> Purchase/Inventory increase + Expense
 * "Paid rent ₦150,000" -> Expense
 * "Received payment from John ₦50k" -> Customer payment -> Sale
 */

export type ParsedOpType = "SALE" | "PURCHASE" | "EXPENSE" | "CUSTOMER_PAYMENT" | "STOCK_UPDATE" | "UNKNOWN";

export interface ParsedBusinessOp {
  type: ParsedOpType;
  confidence: number;
  rawText: string;
  productName?: string;
  quantity?: number;
  unitPrice?: number;
  totalAmount?: number;
  customerName?: string;
  expenseCategory?: string;
  description?: string;
  paymentMethod?: string;
  metadata: Record<string, any>;
}

const NARIA_REGEX = /(?:₦|naira|\bNGN\b)/i;
const NUMBER_REGEX = /(\d+(?:[,\.]\d+)?)\s*(k|thousand)?/i;

function extractAmount(text: string): { amount: number; raw: string } | null {
  // Matches: ₦85,000, 85000, 85k, 85 thousand, N85,000, etc.
  const patterns = [
    /₦\s*([\d,]+(?:\.\d+)?)\s*(k)?/i,
    /([\d,]+)\s*₦/i,
    /NGN\s*([\d,]+)/i,
    /(\d+(?:,\d+)*(?:\.\d+)?)\s*(k|thousand)/i, // 85k
    /for\s+₦?([\d,]+)/i,
    /at\s+₦?([\d,]+)/i,
    /paid\s+₦?([\d,]+)/i,
  ];

  for (const pat of patterns) {
    const m = text.match(pat);
    if (m) {
      let numStr = m[1].replace(/,/g, "");
      let num = parseFloat(numStr);
      if (isNaN(num)) continue;
      const suffix = m[2]?.toLowerCase();
      if (suffix === "k" || suffix === "thousand") num *= 1000;
      return { amount: num, raw: m[0] };
    }
  }

  // Fallback: find largest number that looks like money (>100)
  const allNumbers = Array.from(text.matchAll(/(\d+(?:,\d+)*)/g)).map(n => parseFloat(n[1].replace(/,/g, ""))).filter(n => n >= 100);
  if (allNumbers.length > 0) {
    return { amount: Math.max(...allNumbers), raw: String(Math.max(...allNumbers)) };
  }

  return null;
}

function extractQuantity(text: string): number | null {
  const patterns = [
    /(\d+)\s*bags?/i,
    /(\d+)\s*pcs?/i,
    /(\d+)\s*units?/i,
    /(\d+)\s*cartons?/i,
    /(\d+)\s*pieces?/i,
    /sold\s+(\d+)/i,
    /bought\s+(\d+)/i,
    /(\d+)\s*x\s/i,
  ];

  for (const pat of patterns) {
    const m = text.match(pat);
    if (m) {
      const n = parseInt(m[1], 10);
      if (!isNaN(n) && n > 0 && n < 100000) return n;
    }
  }
  return null;
}

function extractProductName(text: string): string | null {
  // Heuristic: words after quantity or before "for"
  // "Sold 5 bags of rice for" -> rice
  // "Bought 100 bags of rice" -> rice
  const lower = text.toLowerCase();

  // Remove common verbs
  let cleaned = lower
    .replace(/^(sold|buy|bought|purchase|paid|received|collect)\s+/i, "")
    .replace(/\s+(for|at|each|per|@).*$/i, "")
    .replace(/^\d+\s*(bags?|pcs?|units?|cartons?|pieces?)\s*(of)?\s*/i, "")
    .trim();

  // If still contains "bags of", extract after
  const bagsMatch = cleaned.match(/(?:bags?|pcs?|cartons?)\s+of\s+(.+)/i);
  if (bagsMatch) cleaned = bagsMatch[1];

  // Limit to first 3-4 words that look like product
  const words = cleaned.split(/\s+/).filter(w => w.length > 2 && !["with", "from", "each"].includes(w));
  if (words.length === 0) return null;

  // Take up to 3 words as product name
  return words.slice(0, 3).join(" ");
}

function detectExpenseCategory(text: string): string {
  const lower = text.toLowerCase();
  if (lower.includes("rent")) return "Rent";
  if (lower.includes("fuel") || lower.includes("diesel") || lower.includes("petrol")) return "Fuel";
  if (lower.includes("transport") || lower.includes("delivery") || lower.includes("logistics")) return "Transportation";
  if (lower.includes("salary") || lower.includes("wage") || lower.includes("staff")) return "Salary";
  if (lower.includes("electricity") || lower.includes("nepa") || lower.includes("light bill")) return "Electricity";
  if (lower.includes("purchase") || lower.includes("bought") || lower.includes("stock")) return "Purchases";
  if (lower.includes("internet") || lower.includes("data")) return "Internet";
  if (lower.includes("food") || lower.includes("lunch")) return "Food";
  return "Other";
}

export function parseBusinessMessage(text: string): ParsedBusinessOp {
  const lower = text.toLowerCase().trim();
  const rawText = text;

  if (!lower || lower.length < 4) {
    return { type: "UNKNOWN", confidence: 0, rawText, metadata: {} };
  }

  const amountInfo = extractAmount(text);
  const quantity = extractQuantity(text);
  const productName = extractProductName(text);

  // SALE detection: sold, sale, received payment for goods
  if (/(sold|sale|supplied|delivered)/i.test(lower)) {
    const total = amountInfo?.amount || 0;
    const qty = quantity || 1;
    const unit = total && qty ? total / qty : total;

    // If amount mentions total for multiple units, we need to determine unit vs total
    // Heuristic: if "for ₦85,000 each" -> unitPrice = 85000
    const eachMatch = text.match(/for\s+₦?([\d,]+)\s*each/i);
    const unitPrice = eachMatch ? parseFloat(eachMatch[1].replace(/,/g, "")) : unit || total;
    const totalAmount = eachMatch ? unitPrice * qty : total;

    return {
      type: "SALE",
      confidence: productName && amountInfo ? 0.85 : 0.6,
      rawText,
      productName: productName || "General Product",
      quantity: qty,
      unitPrice,
      totalAmount: totalAmount || unitPrice,
      paymentMethod: lower.includes("transfer") ? "transfer" : lower.includes("pos") ? "pos" : "cash",
      metadata: { each: !!eachMatch, originalAmount: amountInfo }
    };
  }

  // PURCHASE detection: bought, purchased, restocked
  if (/(bought|buy|purchased|restock|stocked)/i.test(lower)) {
    const total = amountInfo?.amount || 0;
    const qty = quantity || 1;
    return {
      type: "PURCHASE",
      confidence: productName ? 0.8 : 0.55,
      rawText,
      productName: productName || "Stock",
      quantity: qty,
      totalAmount: total,
      unitPrice: qty ? total / qty : total,
      metadata: { isInventoryIncrease: true }
    };
  }

  // EXPENSE detection: paid, expense, spent
  if (/(paid|pay|expense|spent|payment for)/i.test(lower) && !lower.includes("received")) {
    // Avoid misclassifying sales as expenses
    if (quantity || productName && /(bag|rice|product)/i.test(lower)) {
      // Could still be purchase, handled above
    }

    if (amountInfo) {
      return {
        type: "EXPENSE",
        confidence: 0.75,
        rawText,
        totalAmount: amountInfo.amount,
        expenseCategory: detectExpenseCategory(lower),
        description: text,
        metadata: { categoryDetected: detectExpenseCategory(lower) }
      };
    }
  }

  // CUSTOMER PAYMENT: received payment from X
  if (/(received|collected|got)\s+(payment|money)/i.test(lower)) {
    const nameMatch = text.match(/from\s+([A-Za-z ]{2,30})/i);
    return {
      type: "CUSTOMER_PAYMENT",
      confidence: amountInfo ? 0.8 : 0.5,
      rawText,
      customerName: nameMatch ? nameMatch[1].trim() : undefined,
      totalAmount: amountInfo?.amount || 0,
      metadata: { payer: nameMatch?.[1] }
    };
  }

  return {
    type: "UNKNOWN",
    confidence: 0.2,
    rawText,
    metadata: { reason: "No business pattern matched", hasAmount: !!amountInfo, hasQuantity: !!quantity }
  };
}

// Format Nigerian Naira
export function formatNaira(amount: number): string {
  return `₦${amount.toLocaleString("en-NG", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

// Generate AI insight from parsed ops
export function generateBusinessInsight(ops: ParsedBusinessOp[]): string {
  if (ops.length === 0) return "No business operations detected today.";

  const sales = ops.filter(o => o.type === "SALE");
  const expenses = ops.filter(o => o.type === "EXPENSE" || o.type === "PURCHASE");

  const totalRevenue = sales.reduce((s, o) => s + (o.totalAmount || 0), 0);
  const totalExpenses = expenses.reduce((s, o) => s + (o.totalAmount || 0), 0);
  const profit = totalRevenue - totalExpenses;

  if (sales.length > 0 && expenses.length > 0) {
    return `Today: ${sales.length} sales totaling ${formatNaira(totalRevenue)}, expenses ${formatNaira(totalExpenses)}. Profit: ${formatNaira(profit)}. Keep tracking for accurate reports.`;
  }
  if (sales.length > 0) {
    return `Strong sales today! ${sales.length} transactions totaling ${formatNaira(totalRevenue)}. Remember to log expenses for profit calculation.`;
  }
  if (expenses.length > 0) {
    return `You logged ${expenses.length} expenses today (${formatNaira(totalExpenses)}). Don't forget to record sales to see profit.`;
  }
  return "Operations logged. Continue using WhatsApp to update inventory and sales for automatic reporting.";
}
