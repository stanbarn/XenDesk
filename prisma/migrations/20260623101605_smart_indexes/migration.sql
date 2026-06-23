-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- DropIndex
DROP INDEX "Ticket_agentId_idx";

-- DropIndex
DROP INDEX "Ticket_customerId_idx";

-- DropIndex
DROP INDEX "Ticket_status_idx";

-- CreateIndex
CREATE INDEX "Ticket_customerId_createdAt_idx" ON "Ticket"("customerId", "createdAt");

-- CreateIndex
CREATE INDEX "Ticket_status_createdAt_idx" ON "Ticket"("status", "createdAt");

-- CreateIndex
CREATE INDEX "Ticket_agentId_createdAt_idx" ON "Ticket"("agentId", "createdAt");

-- CreateIndex
CREATE INDEX "Ticket_title_idx" ON "Ticket" USING GIN ("title" gin_trgm_ops);

-- CreateIndex
CREATE INDEX "Ticket_description_idx" ON "Ticket" USING GIN ("description" gin_trgm_ops);

