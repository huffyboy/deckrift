/**
 * Factory function to create error handlers
 * @param {string} userMessage - Message to show to the user
 * @param {boolean} isDev - Whether we're in development mode
 * @returns {Function} Express error handler middleware
 */
export const createErrorHandler = (userMessage = 'An unexpected error occurred', isDev = process.env.NODE_ENV === 'development') => {
    return (err, req, res, next) => {
      // Log the error for debugging
      console.error('\x1b[31m%s\x1b[0m', 'Error:', err.message);
      if (isDev) {
        // print stack trace in grey
        console.error('\x1b[90m%s\x1b[0m', err.stack);
      }
  
      // Handle MongoDB errors
      if (err.name === 'CastError') {
        return res.status(400).json({
          error: {
            status: 400,
            message: 'Invalid ID format',
            type: 'ValidationError'
          }
        });
      }
  
      if (err.name === 'ValidationError') {
        return res.status(400).json({
          error: {
            status: 400,
            message: err.message,
            type: 'ValidationError'
          }
        });
      }
  
      if (err.name === 'MongoServerError' && err.code === 11000) {
        // Extract the field that caused the duplicate error
        const field = Object.keys(err.keyPattern)[0];
        let message = 'This record already exists';
        
        // Provide more specific messages for known unique fields
        if (field === 'phone') {
          message = 'This phone number is already registered';
        } else if (field === 'email') {
          message = 'This email address is already registered';
        } else if (field === 'username') {
          message = 'This username is already taken';
        } else if (field === 'org_handle') {
          message = 'This organization handle is already taken';
        }
  
        return res.status(409).json({
          error: {
            status: 409,
            message,
            type: 'DuplicateError'
          }
        });
      }
  
      // Handle our custom API errors
      if (err instanceof ApiError) {
        return res.status(err.status).json({
          error: {
            status: err.status,
            message: err.message,
            type: err.name
          }
        });
      }
  
      // Default error (500)
      res.status(500).json({
        error: {
          status: 500,
          message: userMessage,
          type: 'InternalError'
        }
      });
    };
  };
  
  /**
   * Custom error class for API errors
   */
  export class ApiError extends Error {
    constructor(status, message) {
      super(message);
      this.status = status;
      this.name = 'ApiError';
    }
  }
  
  /**
   * Not found middleware
   */
  export const notFound = (req, res, next) => {
    // Check if this is an API request
    const isApiRequest = req.path.startsWith('/api/');
    
    if (isApiRequest) {
      return res.status(404).json({
        error: {
          status: 404,
          message: `Not Found - ${req.originalUrl}`,
          type: 'NotFoundError'
        }
      });
    }
    
    // For web requests, render the 404 page from the errors directory
    res.status(404).render('errors/404');
  }; 