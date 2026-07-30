-- CreateEnum
CREATE TYPE "ReferralRewardType" AS ENUM ('FIXED', 'PERCENTAGE');

-- AlterTable
ALTER TABLE "events" ADD COLUMN     "max_referral_discount_percent" DECIMAL(5,2) NOT NULL DEFAULT 100,
ADD COLUMN     "referral_reward_type" "ReferralRewardType" NOT NULL DEFAULT 'FIXED',
ADD COLUMN     "referral_reward_value" DECIMAL(10,2) NOT NULL DEFAULT 0;
