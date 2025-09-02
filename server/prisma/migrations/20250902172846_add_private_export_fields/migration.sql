/*
  Warnings:

  - A unique constraint covering the columns `[privateOnceToken]` on the table `KeyPair` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "KeyPair" ADD COLUMN     "privateOnceToken" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "KeyPair_privateOnceToken_key" ON "KeyPair"("privateOnceToken");
