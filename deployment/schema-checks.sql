ALTER TABLE "SupplierProfile" ADD CHECK ("paymentTermDays" BETWEEN 0 AND 365);
ALTER TABLE "SupplierInvoice" ADD CHECK ("amount" > 0), ADD CHECK ("rate" > 0), ADD CHECK ("amountMad" > 0), ADD CHECK ("dueDate" >= "invoiceDate");
ALTER TABLE "SupplierPayment" ADD CHECK ("amount" > 0), ADD CHECK ("rate" > 0), ADD CHECK ("amountMad" > 0);
