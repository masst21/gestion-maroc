-- PostgreSQL only; test on a restored copy first. Existing clients remain intact.
BEGIN;
ALTER TABLE "Client" ADD COLUMN "address" TEXT, ADD COLUMN "cin" TEXT;
CREATE UNIQUE INDEX "Client_storeId_cin_key" ON "Client"("storeId","cin");
COMMIT;
