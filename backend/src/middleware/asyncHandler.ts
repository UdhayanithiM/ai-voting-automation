// File: backend/src/middleware/asyncHandler.ts
import { Request, Response, NextFunction } from 'express';

/**
 * Wraps an asynchronous Express route handler to catch any promise rejections
 * and pass them to the next error-handling middleware.
 * @param fn The asynchronous function to wrap.
 * @returns A new function that Express can use as a route handler.
 */
const asyncHandler = (fn: (req: Request, res: Response, next: NextFunction) => Promise<any>) =>
    (req: Request, res: Response, next: NextFunction): Promise<void> => // Explicitly return Promise<void>
        Promise.resolve(fn(req, res, next)).catch(next);

export default asyncHandler;
