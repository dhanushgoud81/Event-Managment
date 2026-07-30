import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';

/**
 * Validation middleware factory
 * Validates request body, query, and/or params against Zod schemas
 */
export function validate(schemas: {
  body?: ZodSchema;
  query?: ZodSchema;
  params?: ZodSchema;
}) {
  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    try {
      if (schemas.body) {
        req.body = await schemas.body.parseAsync(req.body);
      }

      if (schemas.query) {
        req.query = await schemas.query.parseAsync(req.query) as any;
      }

      if (schemas.params) {
        req.params = await schemas.params.parseAsync(req.params) as any;
      }

      next();
    } catch (error) {
      if (error instanceof ZodError) {
        next(error);
      } else {
        next(error);
      }
    }
  };
}

/**
 * Shorthand for body-only validation
 */
export function validateBody(schema: ZodSchema) {
  return validate({ body: schema });
}

/**
 * Shorthand for query-only validation
 */
export function validateQuery(schema: ZodSchema) {
  return validate({ query: schema });
}

/**
 * Shorthand for params-only validation
 */
export function validateParams(schema: ZodSchema) {
  return validate({ params: schema });
}
