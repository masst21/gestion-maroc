INSERT INTO "Store" (id,name) VALUES ('test-store','Synthetic test store'),('test-store-two','Second synthetic store');
INSERT INTO "User" (id,"storeId",email,password,"fullName",role) VALUES
 ('test-admin','test-store','catalog-test@example.invalid','not-a-real-password','Synthetic admin','admin'),
 ('test-admin-other','test-store-two','catalog-other@example.invalid','not-a-real-password','Second synthetic admin','admin');
INSERT INTO "Client" (id,"storeId",name,phone,"creditLimit",balance) VALUES ('test-client','test-store','Synthetic client','0600000001',1000,250);
INSERT INTO "Article" (id,"storeId",reference,name,barcode,"salePriceHt","vatRate","stockQty") VALUES ('test-article','test-store','LEGACY','Synthetic existing article','000123456789',10,20,5);
