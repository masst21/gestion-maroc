DO $test$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM "Supplier" WHERE "id"='test-supplier' AND "name"='Existing supplier' AND "phone"='0600000000' AND "ice"='123456789012345') THEN RAISE EXCEPTION 'Legacy supplier changed'; END IF;
  IF NOT EXISTS (SELECT 1 FROM "Purchase" WHERE "id"='test-purchase' AND "totalAmount"=1250) THEN RAISE EXCEPTION 'Legacy purchase changed'; END IF;
  IF EXISTS (SELECT 1 FROM "SupplierInvoice") OR EXISTS (SELECT 1 FROM "SupplierPayment") THEN RAISE EXCEPTION 'Unexpected legacy debt'; END IF;
END $test$;
INSERT INTO "SupplierProfile" ("supplierId","paymentTermDays","preferredCurrency") VALUES ('test-supplier',30,'EUR');
INSERT INTO "SupplierInvoice" ("id","supplierId","invoiceNo","invoiceDate","dueDate","currency","amount","rate","rateDate","amountMad","createdBy")
VALUES ('test-invoice','test-supplier','TEST-001','2026-11-01','2026-12-01','EUR',1000,10.8,'2026-11-01',10800,'test-user');
INSERT INTO "SupplierPayment" ("id","invoiceId","requestId","amount","currency","rate","rateDate","amountMad","paidAt","method","createdBy")
VALUES ('test-payment','test-invoice','request-one',300,'EUR',10.9,'2026-11-10',3270,'2026-11-10','bank','test-user');
DO $test$
BEGIN
  IF (SELECT i.amount-COALESCE(SUM(p.amount),0) FROM "SupplierInvoice" i LEFT JOIN "SupplierPayment" p ON p."invoiceId"=i.id WHERE i.id='test-invoice' GROUP BY i.id) <> 700 THEN RAISE EXCEPTION 'Incorrect remaining balance'; END IF;
  BEGIN
    INSERT INTO "SupplierProfile" ("supplierId","paymentTermDays") VALUES ('missing-supplier',30);
    RAISE EXCEPTION 'Missing FK';
  EXCEPTION WHEN foreign_key_violation THEN NULL;
  END;
  BEGIN
    UPDATE "SupplierInvoice" SET "dueDate"='2026-10-01' WHERE id='test-invoice';
    RAISE EXCEPTION 'Invalid due date accepted';
  EXCEPTION WHEN check_violation THEN NULL;
  END;
  BEGIN
    UPDATE "SupplierPayment" SET amount=-1 WHERE id='test-payment';
    RAISE EXCEPTION 'Negative payment accepted';
  EXCEPTION WHEN check_violation THEN NULL;
  END;
  BEGIN
    INSERT INTO "SupplierPayment" ("id","invoiceId","requestId","amount","currency","rate","rateDate","amountMad","paidAt","method","createdBy")
    SELECT 'test-duplicate',"invoiceId","requestId",amount,currency,rate,"rateDate","amountMad","paidAt",method,"createdBy" FROM "SupplierPayment" WHERE id='test-payment';
    RAISE EXCEPTION 'Duplicate payment request accepted';
  EXCEPTION WHEN unique_violation THEN NULL;
  END;
END $test$;
SELECT 'SQL migration smoke tests passed' AS result;
