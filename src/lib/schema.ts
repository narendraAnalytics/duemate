import {
  pgTable,
  text,
  uuid,
  numeric,
  integer,
  timestamp,
  boolean,
  jsonb,
  real,
  pgEnum,
} from "drizzle-orm/pg-core";

// ─── Enums ────────────────────────────────────────────────────────────────────

export const planEnum = pgEnum("plan", ["free", "starter", "pro"]);
export const invoiceStatusEnum = pgEnum("invoice_status", [
  "pending",
  "due_soon",
  "overdue",
  "paid",
  "cancelled",
]);
export const channelEnum = pgEnum("channel", ["email", "whatsapp", "both"]);
export const notificationStatusEnum = pgEnum("notification_status", [
  "delivered",
  "bounced",
  "failed",
  "read",
]);
export const reminderStatusEnum = pgEnum("reminder_status", [
  "scheduled",
  "sent",
  "failed",
  "cancelled",
]);

// ─── Users ────────────────────────────────────────────────────────────────────

export const users = pgTable("users", {
  id: text("id").primaryKey(), // Clerk userId
  email: text("email").notNull(),
  name: text("name"),
  businessName: text("business_name"),
  plan: planEnum("plan").default("free").notNull(),
  timezone: text("timezone").default("UTC"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

// ─── Customers (Buyers) ───────────────────────────────────────────────────────

export const customers = pgTable("customers", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  email: text("email"),
  shopName: text("shop_name"),
  phone: text("phone"),
  gstin: text("gstin"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type Customer = typeof customers.$inferSelect;
export type NewCustomer = typeof customers.$inferInsert;

// ─── Products (Goods / Materials the user sells) ─────────────────────────────

export const products = pgTable("products", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  description: text("description"),
  rate: numeric("rate", { precision: 10, scale: 2 }).notNull(),
  unit: text("unit").default("pcs"), // e.g. kg, pcs, litre, box
  quantity: integer("quantity").default(0).notNull(), // current stock count
  gstRate: numeric("gst_rate", { precision: 5, scale: 2 }).default("0"),
  purchaseRate: numeric("purchase_rate", { precision: 10, scale: 2 }),
  purchaseDate: timestamp("purchase_date"),
  supplierShop: text("supplier_shop"),
  supplierPhone: text("supplier_phone"),
  supplierGstin: text("supplier_gstin"),
  hsnCode: text("hsn_code"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type Product = typeof products.$inferSelect;
export type NewProduct = typeof products.$inferInsert;

// ─── Invoices ─────────────────────────────────────────────────────────────────

export const invoices = pgTable("invoices", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  customerId: uuid("customer_id").references(() => customers.id, {
    onDelete: "set null",
  }),
  invoiceNumber: text("invoice_number"),
  amount: numeric("amount", { precision: 12, scale: 2 }),
  currency: text("currency").default("INR"),
  dueDate: timestamp("due_date"),
  issueDate: timestamp("issue_date"),
  status: invoiceStatusEnum("status").default("pending").notNull(),
  discountType: text("discount_type").default("flat"),   // "flat" | "percent"
  discountAmount: numeric("discount_amount", { precision: 12, scale: 2 }).default("0"),
  taxRate: numeric("tax_rate", { precision: 5, scale: 2 }).default("0"),
  taxAmount: numeric("tax_amount", { precision: 12, scale: 2 }).default("0"),
  paymentType: text("payment_type"),           // "cash" | "online" | null
  paidAmount: numeric("paid_amount", { precision: 12, scale: 2 }).default("0"),
  paidCash: numeric("paid_cash", { precision: 12, scale: 2 }).default("0"),
  paidOnline: numeric("paid_online", { precision: 12, scale: 2 }).default("0"),
  balanceAmount: numeric("balance_amount", { precision: 12, scale: 2 }),
  paidAt: timestamp("paid_at"),
  lastPaymentAt: timestamp("last_payment_at"),
  paymentReference: text("payment_reference"),
  paymentNotes: text("payment_notes"),
  notes: text("notes"),
  extractedData: jsonb("extracted_data"),      // stores line items array
  fileUrl: text("file_url"),                   // future: uploaded invoice PDF
  aiConfidence: real("ai_confidence"),         // future: AI extraction confidence
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type Invoice = typeof invoices.$inferSelect;
export type NewInvoice = typeof invoices.$inferInsert;

// ─── Reminders ────────────────────────────────────────────────────────────────

export const reminders = pgTable("reminders", {
  id: uuid("id").defaultRandom().primaryKey(),
  invoiceId: uuid("invoice_id")
    .notNull()
    .references(() => invoices.id, { onDelete: "cascade" }),
  type: text("type"),
  channel: channelEnum("channel").default("email").notNull(),
  scheduledAt: timestamp("scheduled_at"),
  sentAt: timestamp("sent_at"),
  status: reminderStatusEnum("status").default("scheduled").notNull(),
  messageBody: text("message_body"),
  error: text("error"),
});

export type Reminder = typeof reminders.$inferSelect;

// ─── Reminder Settings ────────────────────────────────────────────────────────

export const reminderSettings = pgTable("reminder_settings", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: text("user_id")
    .notNull()
    .unique()
    .references(() => users.id, { onDelete: "cascade" }),
  day30: boolean("day_30").default(false),
  day14: boolean("day_14").default(false),
  day7: boolean("day_7").default(true),
  day3: boolean("day_3").default(true),
  day1: boolean("day_1").default(true),
  dueDay: boolean("due_day").default(true),
  overdue: boolean("overdue").default(true),
  emailEnabled: boolean("email_enabled").default(true),
  whatsappEnabled: boolean("whatsapp_enabled").default(false),
  customMessage: text("custom_message"),
  senderName: text("sender_name"),
});

export type ReminderSettings = typeof reminderSettings.$inferSelect;

// ─── Notifications (audit log) ────────────────────────────────────────────────

export const notifications = pgTable("notifications", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  reminderId: uuid("reminder_id").references(() => reminders.id, {
    onDelete: "set null",
  }),
  channel: channelEnum("channel").notNull(),
  recipient: text("recipient"),
  subject: text("subject"),
  status: notificationStatusEnum("status").notNull(),
  externalId: text("external_id"),
  sentAt: timestamp("sent_at").defaultNow().notNull(),
});

export type Notification = typeof notifications.$inferSelect;
