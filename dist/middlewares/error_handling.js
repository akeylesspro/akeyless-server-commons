/**
 * Utility to handle async errors
 */
const async_error_handler = (service) => {
    return (req, res, next) => {
        Promise.resolve(service(req, res)).catch(next);
    };
};
/**
 * Global error-handling middleware.
 */
const error_handler = (err, req, res, next) => {
    console.error("Global Error Handler:", err.stack);
    res.status(500).json({
        status: "error",
        message: err.message || "Internal Server Error",
    });
};
export { error_handler, async_error_handler };
