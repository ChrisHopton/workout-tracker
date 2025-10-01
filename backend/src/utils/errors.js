function notFound(req, res, next) {
  res.status(404).json({ error: { message: 'Not Found' } });
}

function errorHandler(err, req, res, next) {
  console.error(err);
  const status = err.status || 500;
  res.status(status).json({
    error: {
      message: err.message || 'Internal Server Error',
      details: err.details || null,
    },
  });
}

function createHttpError(status, message, details) {
  const error = new Error(message);
  error.status = status;
  if (details) {
    error.details = details;
  }
  return error;
}

module.exports = {
  notFound,
  errorHandler,
  createHttpError,
};
