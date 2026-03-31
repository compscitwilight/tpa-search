-- CreateIndex
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE INDEX "Node_displayName_idx" ON "Node" USING GIN ("displayName" gin_trgm_ops);
