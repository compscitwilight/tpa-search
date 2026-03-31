-- AddForeignKey
ALTER TABLE "Node" ADD CONSTRAINT "Node_creator_fkey" FOREIGN KEY ("creator") REFERENCES "Uploader"("id") ON DELETE SET NULL ON UPDATE CASCADE;
