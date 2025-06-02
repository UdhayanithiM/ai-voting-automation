// File: backend/src/middleware/asyncHandler.ts
import { Request, Response, NextFunction, RequestHandler } from 'express';
import { ParsedQs } from 'qs'; // ** ADD THIS IMPORT **

// Use generics for Request (P = Params, ResBody = Response Body, ReqBody = Request Body, ReqQuery = QueryString)
// and Response types to allow more specific handler signatures.
const asyncHandler = <
    P = {}, // ParamsDictionary by default
    ResBody = any,
    ReqBody = any,
    ReqQuery = ParsedQs, // ParsedQs is now recognized
    Locals extends Record<string, any> = Record<string, any>
>(
    fn: (
        req: Request<P, ResBody, ReqBody, ReqQuery, Locals>,
        res: Response<ResBody, Locals>,
        next: NextFunction
    ) => Promise<any>
): RequestHandler<P, ResBody, ReqBody, ReqQuery, Locals> => // Ensure return type matches express RequestHandler
    (
        req: Request<P, ResBody, ReqBody, ReqQuery, Locals>,
        res: Response<ResBody, Locals>,
        next: NextFunction
    ): Promise<void> =>
        Promise.resolve(fn(req, res, next)).catch(next);

export default asyncHandler;