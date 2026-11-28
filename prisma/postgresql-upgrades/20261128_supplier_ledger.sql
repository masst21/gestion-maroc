-- PostgreSQL ONLY. Run on a verified backup/test database first.
-- No existing purchase or supplier record is changed.
BEGIN;
CREATE TABLE "SupplierProfile" (
  "supplierId" TEXT PRIMARY KEY REFERENCES "Supplier"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  "contactName" TEXT, "email" TEXT, "address" TEXT, "city" TEXT,
  "country" TEXT NOT NULL DEFAULT 'Maroc', "taxId" TEXT, "tradeRegister" TEXT,
  "bankName" TEXT, "bankAccount" TEXT, "swift" TEXT,
  "paymentTermDays" INTEGER NOT NULL DEFAULT 30 CHECK ("paymentTermDays" BETWEEN 0 AND 365),
  "preferredCurrency" TEXT NOT NULL DEFAULT 'MAD',
  "notes" TEXT
);
CREATE TABLE "SupplierInvoice" (
  "id" TEXT PRIMARY KEY,
  "supplierId" TEXT NOT NULL REFERENCES "Supplier"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  "invoiceNo" TEXT NOT NULL,
  "invoiceDate" DATE NOT NULL, "dueDate" DATE NOT NULL,
  "currency" TEXT NOT NULL, "amount" DECIMAL(18,4) NOT NULL CHECK ("amount" > 0),
  "rate" DECIMAL(20,10) NOT NULL CHECK ("rate" > 0), "rateDate" DATE NOT NULL,
  "amountMad" DECIMAL(18,2) NOT NULL CHECK ("amountMad" > 0),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "createdBy" TEXT NOT NULL,
  CHECK ("dueDate" >= "invoiceDate")
);
CREATE UNIQUE INDEX "SupplierInvoice_supplierId_invoiceNo_key" ON "SupplierInvoice"("supplierId","invoiceNo");
CREATE INDEX "SupplierInvoice_supplierId_dueDate_idx" ON "SupplierInvoice"("supplierId","dueDate");
CREATE TABLE "SupplierPayment" (
  "id" TEXT PRIMARY KEY,
  "invoiceId" TEXT NOT NULL REFERENCES "SupplierInvoice"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  "requestId" TEXT NOT NULL,
  "amount" DECIMAL(18,4) NOT NULL CHECK ("amount" > 0), "currency" TEXT NOT NULL,
  "rate" DECIMAL(20,10) NOT NULL CHECK ("rate" > 0), "rateDate" DATE NOT NULL,
  "amountMad" DECIMAL(18,2) NOT NULL CHECK ("amountMad" > 0),
  "paidAt" DATE NOT NULL, "method" TEXT NOT NULL, "reference" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "createdBy" TEXT NOT NULL
);
CREATE UNIQUE INDEX "SupplierPayment_invoiceId_requestId_key" ON "SupplierPayment"("invoiceId","requestId");
CREATE INDEX "SupplierPayment_invoiceId_paidAt_idx" ON "SupplierPayment"("invoiceId","paidAt");
COMMIT;
