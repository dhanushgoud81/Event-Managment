import { prisma } from '../config/database';
import { ApiError } from '../utils/api-error';
import { logAudit } from '../middleware/audit.middleware';
import { FormFieldType, Prisma } from '@prisma/client';
import type { CreateFormFieldInput, UpdateFormFieldInput, ReorderFormFieldsInput } from './form.validator';
import { Request } from 'express';

export class FormService {
  /**
   * Add a custom form field to an event's registration form
   */
  async createFormField(eventId: string, data: CreateFormFieldInput, userId: string, req?: Request) {
    const event = await prisma.event.findUnique({
      where: { id: eventId },
    });

    if (!event) {
      throw ApiError.notFound('Event not found');
    }

    // Check permissions
    const isAdmin = req?.user && ['SUPER_ADMIN', 'ADMIN'].includes(req.user.role);
    if (!isAdmin && event.createdBy !== userId) {
      throw ApiError.forbidden('You are not authorized to edit this event form');
    }

    const formField = await prisma.formField.create({
      data: {
        label: data.label,
        fieldType: data.fieldType,
        placeholder: data.placeholder,
        helpText: data.helpText,
        isRequired: data.isRequired,
        displayOrder: data.displayOrder,
        options: data.options ? (data.options as any) : Prisma.JsonNull,
        validationRules: data.validationRules ? (data.validationRules as any) : Prisma.JsonNull,
        eventId,
      },
    });

    await logAudit(userId, 'FormField', formField.id, 'CREATE_FORM_FIELD', null, formField, req);
    return formField;
  }

  /**
   * Get all form fields for an event
   */
  async listFormFields(eventId: string) {
    const fields = await prisma.formField.findMany({
      where: { eventId },
      orderBy: { displayOrder: 'asc' },
    });

    return fields;
  }

  /**
   * Update form field definition
   */
  async updateFormField(id: string, data: UpdateFormFieldInput, userId: string, req?: Request) {
    const field = await prisma.formField.findUnique({
      where: { id },
      include: { event: true },
    });

    if (!field) {
      throw ApiError.notFound('Form field not found');
    }

    // Check permissions
    const isAdmin = req?.user && ['SUPER_ADMIN', 'ADMIN'].includes(req.user.role);
    if (!isAdmin && field.event.createdBy !== userId) {
      throw ApiError.forbidden('You are not authorized to update this field');
    }

    const previousValue = { ...field };
    delete (previousValue as any).event;

    const updatedField = await prisma.formField.update({
      where: { id },
      data: {
        label: data.label,
        fieldType: data.fieldType,
        placeholder: data.placeholder,
        helpText: data.helpText,
        isRequired: data.isRequired,
        displayOrder: data.displayOrder,
        options: data.options !== undefined ? (data.options === null ? Prisma.JsonNull : (data.options as any)) : undefined,
        validationRules: data.validationRules !== undefined ? (data.validationRules === null ? Prisma.JsonNull : (data.validationRules as any)) : undefined,
      },
    });

    await logAudit(userId, 'FormField', id, 'UPDATE_FORM_FIELD', previousValue, updatedField, req);
    return updatedField;
  }

  /**
   * Delete a form field definition
   */
  async deleteFormField(id: string, userId: string, req?: Request) {
    const field = await prisma.formField.findUnique({
      where: { id },
      include: {
        event: true,
        _count: {
          select: { formResponses: true },
        },
      },
    });

    if (!field) {
      throw ApiError.notFound('Form field not found');
    }

    // Check permissions
    const isAdmin = req?.user && ['SUPER_ADMIN', 'ADMIN'].includes(req.user.role);
    if (!isAdmin && field.event.createdBy !== userId) {
      throw ApiError.forbidden('You are not authorized to delete this field');
    }

    // Prevent deletion if registrations with responses exist
    if (field._count.formResponses > 0) {
      throw ApiError.badRequest(
        'Cannot delete form field because attendees have already submitted answers for it.'
      );
    }

    await prisma.formField.delete({
      where: { id },
    });

    await logAudit(userId, 'FormField', id, 'DELETE_FORM_FIELD', field, null, req);
    return { message: 'Form field deleted successfully' };
  }

  /**
   * Reorder displayOrder of form fields in bulk
   */
  async reorderFields(eventId: string, data: ReorderFormFieldsInput, userId: string, req?: Request) {
    const event = await prisma.event.findUnique({
      where: { id: eventId },
    });

    if (!event) {
      throw ApiError.notFound('Event not found');
    }

    // Check permissions
    const isAdmin = req?.user && ['SUPER_ADMIN', 'ADMIN'].includes(req.user.role);
    if (!isAdmin && event.createdBy !== userId) {
      throw ApiError.forbidden('You are not authorized to edit this event');
    }

    // Perform atomic transaction updates
    await prisma.$transaction(
      data.fields.map((f) =>
        prisma.formField.update({
          where: { id: f.id },
          data: { displayOrder: f.displayOrder },
        })
      )
    );

    await logAudit(userId, 'EventForm', eventId, 'REORDER_FORM_FIELDS', null, data.fields, req);
    return { message: 'Form fields reordered successfully' };
  }
}

export const formService = new FormService();
