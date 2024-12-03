"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.async_error_handler = exports.error_handler = exports.router = void 0;
const express_1 = require("express");
const router = (0, express_1.Router)();
exports.router = router;
/**
 * Utility to handle async errors
 */
const async_error_handler = (service) => {
    return (req, res, next) => {
        Promise.resolve(service(req, res)).catch(next);
    };
};
exports.async_error_handler = async_error_handler;
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
exports.error_handler = error_handler;
//# sourceMappingURL=error_handling.js.map