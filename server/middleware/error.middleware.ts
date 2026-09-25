import { Request, Response, NextFunction } from 'express';
import { ZodError, ZodSchema } from 'zod';

export class AppError extends Error {
  statusCode: number;
  code: string;

  constructor(message: string, statusCode: number = 500, code: string = 'INTERNAL_ERROR') {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.name = 'AppError';
  }
}

export class ValidationError extends AppError {
  constructor(message: string) {
    super(message, 400, 'VALIDATION_ERROR');
    this.name = 'ValidationError';
  }
}

export class NotFoundError extends AppError {
  constructor(message: string = 'Resource not found') {
    super(message, 404, 'NOT_FOUND');
    this.name = 'NotFoundError';
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string = 'Unauthorized') {
    super(message, 401, 'UNAUTHORIZED');
    this.name = 'UnauthorizedError';
  }
}

export class ForbiddenError extends AppError {
  constructor(message: string = 'Forbidden') {
    super(message, 403, 'FORBIDDEN');
    this.name = 'ForbiddenError';
  }
}

export class WorkspaceAccessError extends AppError {
  constructor(message: string = 'Workspace access denied') {
    super(message, 403, 'WORKSPACE_ACCESS_DENIED');
    this.name = 'WorkspaceAccessError';
  }
}

export function errorHandler(err: Error, req: Request, res: Response, next: NextFunction): void {
  // Log error for debugging (in production, use proper logging service)
  if (process.env.NODE_ENV !== 'test') {
    console.error(`[ERROR] ${err.name}: ${err.message}`);
    if (process.env.NODE_ENV === 'development') {
      console.error(err.stack);
    }
  }

  // Handle Zod validation errors
  if (err instanceof ZodError) {
    res.status(400).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Validation failed',
        details: err.errors.map(e => ({
          path: e.path.join('.'),
          message: e.message,
        })),
      },
    });
    return;
  }

  // Handle our custom AppError
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      error: {
        code: err.code,
        message: err.message,
      },
    });
    return;
  }

  // Handle PostgreSQL errors
  if (err.name === 'PostgresError' || 'code' in err) {
    const pgError = err as any;
    
    // Unique constraint violation
    if (pgError.code === '23505') {
      res.status(409).json({
        error: {
          code: 'CONFLICT',
          message: 'Resource already exists',
        },
      });
      return;
    }

    // Foreign key violation
    if (pgError.code === '23503') {
      res.status(400).json({
        error: {
          code: 'INVALID_REFERENCE',
          message: 'Referenced resource does not exist',
        },
      });
      return;
    }

    // Check constraint violation
    if (pgError.code === '23514') {
      res.status(400).json({
        error: {
          code: 'INVALID_DATA',
          message: 'Data violates constraints',
        },
      });
      return;
    }
  }

  // Default to 500 for unknown errors
  res.status(500).json({
    error: {
      code: 'INTERNAL_ERROR',
      message: process.env.NODE_ENV === 'production' 
        ? 'An unexpected error occurred' 
        : err.message,
    },
  });
}

export function notFoundHandler(req: Request, res: Response): void {
  res.status(404).json({
    error: {
      code: 'NOT_FOUND',
      message: `Route ${req.method} ${req.path} not found`,
    },
  });
}

// Validation middleware factory
export function validate(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      schema.parse(req.body);
      next();
    } catch (error) {
      next(error);
    }
  };
}

export function validateParams(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      schema.parse(req.params);
      next();
    } catch (error) {
      next(error);
    }
  };
}

export function validateQuery(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      schema.parse(req.query);
      next();
    } catch (error) {
      next(error);
    }
  };
}
