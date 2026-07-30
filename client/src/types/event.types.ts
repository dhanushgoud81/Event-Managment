import { User } from './auth.types';

export type EventStatus = 'DRAFT' | 'PUBLISHED' | 'CLOSED' | 'CANCELLED' | 'ARCHIVED';
export type TicketStatus = 'ACTIVE' | 'INACTIVE' | 'SOLD_OUT';

export interface TicketCategory {
  id: string;
  eventId: string;
  name: string;
  description?: string | null;
  price: number;
  maxQuantity: number;
  soldQuantity: number;
  saleStart: string;
  saleEnd: string;
  status: TicketStatus;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface FormField {
  id: string;
  eventId: string;
  label: string;
  fieldType: 'TEXT' | 'EMAIL' | 'PHONE' | 'NUMBER' | 'DATE' | 'TEXTAREA' | 'DROPDOWN' | 'RADIO' | 'CHECKBOX' | 'MULTI_SELECT' | 'FILE_UPLOAD';
  placeholder?: string | null;
  helpText?: string | null;
  isRequired: boolean;
  displayOrder: number;
  options?: any; // JSON string or array of options
  validationRules?: any;
  createdAt: string;
  updatedAt: string;
}

export interface Event {
  id: string;
  createdBy: string;
  name: string;
  slug: string;
  description: string;
  bannerUrl?: string | null;
  venue: string;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  country?: string | null;
  startDate: string;
  endDate: string;
  regStartDate: string;
  regEndDate: string;
  maxParticipants: number;
  currentCount: number;
  status: EventStatus;
  organizerName?: string | null;
  organizerEmail?: string | null;
  organizerPhone?: string | null;
  organizerWebsite?: string | null;
  contactEmail?: string | null;
  contactPhone?: string | null;
  tags: string[];
  isFeatured: boolean;
  createdAt: string;
  updatedAt: string;
  creator?: User;
  ticketCategories?: TicketCategory[];
  formFields?: FormField[];
  _count?: {
    registrations: number;
  };
}

export interface CreateEventRequest {
  name: string;
  description: string;
  venue: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  startDate: string;
  endDate: string;
  regStartDate: string;
  regEndDate: string;
  maxParticipants: number;
  organizerName?: string;
  organizerEmail?: string;
  organizerPhone?: string;
  organizerWebsite?: string;
  contactEmail?: string;
  contactPhone?: string;
  tags?: string[];
  isFeatured?: boolean;
}

export interface UpdateEventRequest extends Partial<CreateEventRequest> {
  status?: EventStatus;
}

export interface CreateTicketRequest {
  name: string;
  description?: string;
  price: number;
  maxQuantity: number;
  saleStart: string;
  saleEnd: string;
  status?: TicketStatus;
  sortOrder?: number;
}

export interface UpdateTicketRequest extends Partial<CreateTicketRequest> {}
