-- AlterTable
ALTER TABLE "Tag" ADD COLUMN     "color" TEXT NOT NULL DEFAULT '#667085';

-- AlterTable
ALTER TABLE "Ticket" ADD COLUMN     "number" SERIAL NOT NULL;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "company" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Ticket_number_key" ON "Ticket"("number");

