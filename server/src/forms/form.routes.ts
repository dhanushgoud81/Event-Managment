import { Router } from 'express';
import { formController } from './form.controller';
import { authenticate } from '../middleware/auth.middleware';
import { isAdmin } from '../middleware/rbac.middleware';
import { validateBody } from '../middleware/validate.middleware';
import { createFormFieldSchema, updateFormFieldSchema, reorderFormFieldsSchema } from './form.validator';

const router = Router({ mergeParams: true });

// Public route to view form fields
router.get('/', formController.listFormFields.bind(formController));

// Protected routes (Admin/Organizer only)
router.post(
  '/',
  authenticate,
  isAdmin(),
  validateBody(createFormFieldSchema),
  formController.createFormField.bind(formController)
);

router.put(
  '/:id',
  authenticate,
  isAdmin(),
  validateBody(updateFormFieldSchema),
  formController.updateFormField.bind(formController)
);

router.delete(
  '/:id',
  authenticate,
  isAdmin(),
  formController.deleteFormField.bind(formController)
);

router.patch(
  '/reorder',
  authenticate,
  isAdmin(),
  validateBody(reorderFormFieldsSchema),
  formController.reorderFields.bind(formController)
);

export default router;
