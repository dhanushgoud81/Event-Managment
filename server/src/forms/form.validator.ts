import { z } from 'zod';
import { FormFieldType } from '@prisma/client';

export const formFieldValidationRulesSchema = z.object({
  min: z.coerce.number().optional(),
  max: z.coerce.number().optional(),
  pattern: z.string().optional(),
  fileTypes: z.array(z.string()).optional(),
  maxSize: z.coerce.number().optional(), // In bytes
});

export const createFormFieldSchema = z.object({
  label: z
    .string()
    .min(1, 'Label is required')
    .max(100, 'Label cannot exceed 100 characters')
    .trim(),
  fieldType: z.nativeEnum(FormFieldType),
  placeholder: z.string().max(100).optional().nullable(),
  helpText: z.string().max(200).optional().nullable(),
  isRequired: z.boolean().default(false),
  displayOrder: z.coerce.number().int().default(0),
  options: z.array(z.string()).optional().nullable(), // For dropdowns, checkboxes, etc.
  validationRules: formFieldValidationRulesSchema.optional().nullable(),
});

export const updateFormFieldSchema = createFormFieldSchema.partial();

export const reorderFormFieldsSchema = z.object({
  fields: z.array(
    z.object({
      id: z.string().uuid(),
      displayOrder: z.coerce.number().int(),
    })
  ),
});

export type CreateFormFieldInput = z.infer<typeof createFormFieldSchema>;
export type UpdateFormFieldInput = z.infer<typeof updateFormFieldSchema>;
export type ReorderFormFieldsInput = z.infer<typeof reorderFormFieldsSchema>;
