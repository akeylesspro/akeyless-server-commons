import { Request, Response, NextFunction, Router } from "express";
import { Service } from "../types";

const router = Router();

/**
 * Utility to handle async errors
 */
const async_error_handler = (service: Service) => {
    return (req: Request, res: Response, next: NextFunction) => {
        Promise.resolve(service(req, res)).catch(next);
    };
};

/**
 * Global error-handling middleware.
 */
const error_handler = (err: Error, req: Request, res: Response, next: NextFunction) => {
    console.error("Global Error Handler:", err.stack);

    res.status(500).json({
        status: "error",
        message: err.message || "Internal Server Error",
    });
};

export { router, error_handler, async_error_handler };
