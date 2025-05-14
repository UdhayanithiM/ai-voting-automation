// File: backend/src/middleware/errorHandler.ts
import { Request, Response, NextFunction } from 'express';
import ErrorResponse from '../utils/ErrorResponse'; // Adjust path if your ErrorResponse.ts is elsewhere

/**
 * Express error handling middleware.
 * This should be the LAST piece of middleware added to your app.
 * It catches errors passed by next(error) and sends a structured JSON response.
 */
const errorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
  let error = { ...err }; // Create a copy to avoid mutating the original error object

  error.message = err.message; // Ensure message property is copied

  // Log to console for the developer (includes stack trace for debugging)
  console.error('ERROR 💥:', err.stack || err);

  // Mongoose Bad ObjectId (CastError)
  if (err.name === 'CastError' && err.kind === 'ObjectId') {
    const message = `Resource not found. Invalid ID: ${err.value}`;
    error = new ErrorResponse(message, 404); // 404 Not Found
  }

  // Mongoose Duplicate Key Error (code 11000)
  if (err.code === 11000) {
    // Extract the field that caused the duplicate error
    const field = Object.keys(err.keyValue)[0];
    const value = err.keyValue[field];
    const message = `Duplicate field value entered for '${field}': '${value}'. Please use another value.`;
    error = new ErrorResponse(message, 400); // 400 Bad Request
  }

  // Mongoose Validation Error (ValidationError)
  if (err.name === 'ValidationError') {
    // Extract all validation error messages
    const messages = Object.values(err.errors).map((val: any) => val.message);
    // Join messages if there are multiple, otherwise use the single message
    const message = messages.length > 1 ? messages.join('. ') : messages[0];
    error = new ErrorResponse(message, 400); // 400 Bad Request
  }

  // JWT Authentication Errors (JsonWebTokenError, TokenExpiredError)
  if (err.name === 'JsonWebTokenError') {
    const message = 'Not authorized, token failed (Invalid Token). Please log in again.';
    error = new ErrorResponse(message, 401); // 401 Unauthorized
  }

  if (err.name === 'TokenExpiredError') {
    const message = 'Not authorized, token expired. Please log in again.';
    error = new ErrorResponse(message, 401); // 401 Unauthorized
  }

  // Send the response to the client
  res.status(error.statusCode || 500).json({
    success: false,
    error: error.message || 'Server Error', // Default to 'Server Error' if no message
    // You might want to conditionally send the stack in development
    // stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
  });
};

export default errorHandler;
