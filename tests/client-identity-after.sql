DO $test$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM "Client" WHERE id='test-client' AND name='Synthetic client' AND phone='0600000001' AND "creditLimit"=1000 AND balance=250 AND cin IS NULL AND address IS NULL) THEN RAISE EXCEPTION 'Legacy client changed'; END IF;
END $test$;
UPDATE "Client" SET cin='AB123456',address='Synthetic address' WHERE id='test-client';
INSERT INTO "Client" (id,"storeId",name,cin,address) VALUES ('test-client-other','test-store-two','Other synthetic client','AB123456','Other synthetic address');
INSERT INTO "Client" (id,"storeId",name) VALUES ('test-client-null','test-store','No CIN synthetic client');
DO $test$
BEGIN
  BEGIN
    INSERT INTO "Client" (id,"storeId",name,cin) VALUES ('duplicate-client','test-store','Duplicate CIN','AB123456');
    RAISE EXCEPTION 'Duplicate CIN accepted in same store';
  EXCEPTION WHEN unique_violation THEN NULL;
  END;
  IF NOT EXISTS (SELECT 1 FROM "Client" WHERE id='test-client' AND cin='AB123456' AND address='Synthetic address' AND balance=250) THEN RAISE EXCEPTION 'Client update failed'; END IF;
END $test$;
SELECT 'Combined SQL migration smoke tests passed' AS result;
