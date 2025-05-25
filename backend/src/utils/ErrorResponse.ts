// backend/src/utils/ErrorResponse.ts
class ErrorResponse extends Error {
  statusCode: number;
  details?: string; // Optional field for additional error details

  constructor(message: string, statusCode: number, details?: string) {
    super(message);
    this.statusCode = statusCode;
    this.details = details;

    // Maintaining stack trace (optional, but good practice)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, ErrorResponse);
    }
  }
}

export default ErrorResponse;