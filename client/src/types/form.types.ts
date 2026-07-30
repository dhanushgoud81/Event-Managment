import { FormField } from './event.types';

export interface FormFieldValidationRules {
  min?: number;
  max?: number;
  pattern?: string;
  fileTypes?: string[];
  maxSize?: number;
}

export interface CreateFormFieldRequest {
  label: string;
  fieldType: 'TEXT' | 'EMAIL' | 'PHONE' | 'NUMBER' | 'DATE' | 'TEXTAREA' | 'DROPDOWN' | 'RADIO' | 'CHECKBOX' | 'MULTI_SELECT' | 'FILE_UPLOAD';
  placeholder?: string | null;
  helpText?: string | null;
  isRequired: boolean;
  displayOrder: number;
  options?: string[] | null;
  validationRules?: FormFieldValidationRules | null;
}

export interface UpdateFormFieldRequest extends Partial<CreateFormFieldRequest> {}

export interface ReorderFieldsRequest {
  fields: { id: string; displayOrder: number }[];
}
