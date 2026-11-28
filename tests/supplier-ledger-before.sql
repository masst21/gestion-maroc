INSERT INTO "Store" ("id","name") VALUES ('test-store','Synthetic test store');
INSERT INTO "Supplier" ("id","storeId","name","phone","ice") VALUES ('test-supplier','test-store','Existing supplier','0600000000','123456789012345');
INSERT INTO "Purchase" ("id","storeId","supplierId","totalAmount") VALUES ('test-purchase','test-store','test-supplier',1250);

INSERT INTO "Client" ("id","storeId","name","phone","creditLimit","balance") VALUES ('test-client','test-store','Synthetic client','0600000001',1000,250);
INSERT INTO "Store" ("id","name") VALUES ('test-store-two','Second synthetic store');
