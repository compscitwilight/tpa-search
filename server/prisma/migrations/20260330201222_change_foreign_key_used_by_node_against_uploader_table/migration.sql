-- DropForeignKey
ALTER TABLE "Node" DROP CONSTRAINT "Node_creator_fkey";

-- AddForeignKey
ALTER TABLE "Node" ADD CONSTRAINT "Node_creator_fkey" FOREIGN KEY ("creator") REFERENCES "Uploader"("name") ON DELETE SET NULL ON UPDATE CASCADE;
