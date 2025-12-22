/*
  Warnings:

  - You are about to drop the column `salt` on the `RefreshToken` table. All the data in the column will be lost.
  - You are about to drop the column `plan` on the `Workspace` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "RefreshToken" DROP COLUMN "salt";

-- AlterTable
ALTER TABLE "Workspace" DROP COLUMN "plan";

-- CreateTable
CREATE TABLE "Subscription" (
    "id" TEXT NOT NULL,
    "worspace_id" TEXT NOT NULL,
    "plan" "WorkspacePlan" NOT NULL DEFAULT 'FREE',
    "currentPeriodStart" TIMESTAMP(3),
    "currentPeriodEnd" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Subscription_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Subscription_worspace_id_key" ON "Subscription"("worspace_id");

-- AddForeignKey
ALTER TABLE "Subscription" ADD CONSTRAINT "Subscription_worspace_id_fkey" FOREIGN KEY ("worspace_id") REFERENCES "Workspace"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
