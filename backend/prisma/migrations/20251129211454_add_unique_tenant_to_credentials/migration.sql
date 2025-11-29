/*
  Warnings:

  - A unique constraint covering the columns `[tenantId]` on the table `ShopifyCredential` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "ShopifyCredential_tenantId_key" ON "ShopifyCredential"("tenantId");
