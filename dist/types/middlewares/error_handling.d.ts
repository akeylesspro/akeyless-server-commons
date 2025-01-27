import { Request, Response, NextFunction } from "express";
import { Service } from "../types";
/**
 * Utility to handle async errors
 */
declare const async_error_handler: (service: Service) => (req: Request, res: Response, next: NextFunction) => void;
/**
 * Global error-handling middleware.
 */
declare const error_handler: (err: Error, req: Request, res: Response, next: NextFunction) => void;
export { error_handler, async_error_handler };
