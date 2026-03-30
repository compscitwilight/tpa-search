-- CreateEnum
CREATE TYPE "NodeType" AS ENUM ('Video', 'Image', 'Audio', 'Text', 'Compressed', 'Unknown');

-- CreateTable
CREATE TABLE "Node" (
    "id" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "absolutePath" TEXT NOT NULL,
    "description" TEXT,
    "creator" TEXT,
    "tags" TEXT[],
    "categories" TEXT[],
    "ogSize" TEXT,
    "ogDate" TIMESTAMP(3),
    "scrapedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Node_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Node_absolutePath_key" ON "Node"("absolutePath");
