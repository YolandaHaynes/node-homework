function errorHandler(err, req, res, next) {
  res.status(500).json({
    message: "Something went wrong.",
  });
}

module.exports = errorHandler;

// Export an error-handling middleware function with four parameters: err, req, res, next
// Return status 500
// Return a JSON response
