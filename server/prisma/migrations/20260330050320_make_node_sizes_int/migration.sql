/*
  Warnings:

  - The `ogSize` column on the `Node` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "Node" DROP COLUMN "ogSize",
ADD COLUMN     "ogSize" INTEGER;
