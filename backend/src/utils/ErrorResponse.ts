// File: backend/src/utils/ErrorResponse.ts

/**
 * Custom error class to create errors with a specific HTTP status code.
 */
class ErrorResponse extends Error {
  statusCode: number;
  isOperational: boolean; // Optional: for distinguishing operational errors

  /**
   * @param message The error message.
   * @param statusCode The HTTP status code for this error.
   */
  constructor(message: string, statusCode: number) {
    super(message); // Call the parent Error constructor
    this.statusCode = statusCode;
    this.isOperational = true; // Mark as an operational error

    // Ensure the name of this error is the same as the class name
    this.name = this.constructor.name;

    // Capture the stack trace, excluding the constructor call from it.
    Error.captureStackTrace(this, this.constructor);
  }
}

export default ErrorResponse;
