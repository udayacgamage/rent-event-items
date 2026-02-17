export const errorHandler = (error, req, res, next) => {
  if (res.headersSent) {
    return next(error);
  }

  // Mongoose validation errors
  if (error.name === 'ValidationError') {
    const messages = Object.values(error.errors).map((e) => e.message);
    return res.status(400).json({ message: messages.join(', ') });
  }

  // Mongoose cast errors (bad ObjectId, etc.)
  if (error.name === 'CastError') {
    return res.status(400).json({ message: `Invalid ${error.path}: ${error.value}` });
  }

  // Duplicate key errors
  if (error.code === 11000) {
    const field = Object.keys(error.keyValue || {})[0];
    return res.status(409).json({ message: `Duplicate value for ${field}` });
  }

  const statusCode = error.statusCode || 500;
  return res.status(statusCode).json({
    message: error.message || 'Server error'
  });
};
