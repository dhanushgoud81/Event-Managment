import { prisma } from '../config/database';
import { ApiError } from '../utils/api-error';
import { generateQRCodeString } from '../utils/generate-code';
import { logAudit } from '../middleware/audit.middleware';
import { Request } from 'express';

export class QRService {
  /**
   * Generate QR Code for a registration
   */
  async generateQRCode(registrationId: string) {
    const registration = await prisma.registration.findUnique({
      where: { id: registrationId },
      include: {
        event: { select: { name: true } },
        user: { select: { firstName: true, lastName: true } },
      },
    });

    if (!registration) {
      throw ApiError.notFound('Registration not found');
    }

    // Check if QR already exists
    const existingQr = await prisma.qRCode.findUnique({
      where: { registrationId },
    });

    if (existingQr) {
      return existingQr;
    }

    // Generate secure check-in code
    const code = generateQRCodeString(registrationId);

    // Use a dynamic online QR provider or generate inline. In production we can use qr-image library.
    const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(
      code
    )}`;

    const qr = await prisma.qRCode.create({
      data: {
        registrationId,
        code,
        qrImageUrl,
        isScanned: false,
      },
    });

    return qr;
  }

  /**
   * Verify QR check-in scan (performed by admins/event managers on event day)
   */
  async scanQRCode(code: string, scannerId: string, req?: Request) {
    const qrCode = await prisma.qRCode.findUnique({
      where: { code },
      include: {
        registration: {
          include: {
            event: true,
            user: { select: { firstName: true, lastName: true, email: true } },
            ticketCategory: { select: { name: true } },
          },
        },
      },
    });

    if (!qrCode) {
      throw ApiError.notFound('Invalid QR code scan');
    }

    const { registration } = qrCode;

    // Check if ticket is confirmed
    if (registration.status !== 'CONFIRMED') {
      throw ApiError.badRequest('Ticket is not confirmed/paid for');
    }

    // Check if already scanned
    if (qrCode.isScanned) {
      throw ApiError.badRequest(
        `Ticket has already been scanned at ${qrCode.scannedAt?.toLocaleString()}`
      );
    }

    // Mark as scanned
    const updatedQr = await prisma.qRCode.update({
      where: { code },
      data: {
        isScanned: true,
        scannedAt: new Date(),
        scannedBy: scannerId,
      },
    });

    await logAudit(
      scannerId,
      'Registration',
      registration.id,
      'QR_CODE_SCANNED',
      { isScanned: false },
      { isScanned: true, scannedAt: updatedQr.scannedAt },
      req
    );

    return {
      success: true,
      message: 'Check-in successful! Ticket verified.',
      attendee: `${registration.user.firstName} ${registration.user.lastName}`,
      email: registration.user.email,
      event: registration.event.name,
      ticket: registration.ticketCategory.name,
      scannedAt: updatedQr.scannedAt,
    };
  }
}

export const qrService = new QRService();
