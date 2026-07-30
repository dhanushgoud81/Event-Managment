import { User } from './auth.types';
import { Event, TicketCategory } from './event.types';

export type RegistrationStatus = 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'REFUNDED';

export interface FormFieldResponse {
  id: string;
  registrationId: string;
  formFieldId: string;
  value?: string | null;
  fileUrl?: string | null;
  formField?: {
    label: string;
  };
}

export interface QrCode {
  code: string;
  qrImageUrl: string;
  isScanned: boolean;
}

export interface Registration {
  id: string;
  userId: string;
  eventId: string;
  ticketCategoryId: string;
  registrationNumber: string;
  status: RegistrationStatus;
  amountPaid: number;
  paymentId?: string | null;
  createdAt: string;
  updatedAt: string;
  user?: User;
  event?: Event;
  ticketCategory?: TicketCategory;
  formResponses?: FormFieldResponse[];
  qrCode?: QrCode | null;
}

export interface CreateRegistrationRequest {
  eventId: string;
  ticketCategoryId: string;
  idempotencyKey?: string;
  responses: {
    formFieldId: string;
    value?: string | null;
    fileUrl?: string | null;
  }[];
}
