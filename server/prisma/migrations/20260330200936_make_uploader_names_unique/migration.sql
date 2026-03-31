/*
  Warnings:

  - A unique constraint covering the columns `[name]` on the table `Uploader` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Uploader_name_key" ON "Uploader"("name");
