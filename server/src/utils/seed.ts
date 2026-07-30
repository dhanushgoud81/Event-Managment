import { prisma } from '../config/database';
import { hashPassword } from './hash';
import { generateReferralCode } from './generate-code';
import { config } from '../config';
import { logger } from './logger';
import { UserRole } from '@prisma/client';

/**
 * Seeds the super admin account if it doesn't exist
 */
export async function seedSuperAdmin(): Promise<void> {
  try {
    const existingAdmin = await prisma.user.findFirst({
      where: { role: UserRole.SUPER_ADMIN },
    });

    if (existingAdmin) {
      logger.debug('Super admin already exists, skipping seed');
      return;
    }

    const passwordHash = await hashPassword(config.superAdmin.password);
    let referralCode = generateReferralCode();

    // Ensure unique referral code
    let exists = await prisma.user.findUnique({ where: { referralCode } });
    while (exists) {
      referralCode = generateReferralCode();
      exists = await prisma.user.findUnique({ where: { referralCode } });
    }

    await prisma.$transaction(async (tx) => {
      const admin = await tx.user.create({
        data: {
          email: config.superAdmin.email,
          passwordHash,
          firstName: config.superAdmin.firstName,
          lastName: config.superAdmin.lastName,
          role: UserRole.SUPER_ADMIN,
          referralCode,
          emailVerified: true,
          isActive: true,
        },
      });

      // Create wallet for super admin
      await tx.wallet.create({
        data: {
          userId: admin.id,
          balance: 0,
        },
      });

      logger.info(
        { email: config.superAdmin.email },
        '🔑 Super admin account created successfully'
      );
    });
  } catch (error) {
    logger.error({ error }, 'Failed to seed super admin');
  }
}
