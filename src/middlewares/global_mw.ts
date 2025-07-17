import { Request, Response, NextFunction, RequestHandler } from "express";
import { json_failed } from "../helpers";
import { LogRequests, MandatoryObject, MandatoryParams, MW, Route, Service } from "../types";
import { logger } from "../managers";

const validateParameter = (data: any, parameter: MandatoryObject) => {
    if (data[parameter.key] === undefined) {
        throw `missing mandatory parameter: ${parameter.key}`;
    }

    if (parameter.type === "array" && !Array.isArray(data[parameter.key])) {
        throw `parameter ${parameter.key} must be of type: Array`;
    }
    if (typeof data[parameter.key] !== parameter.type && parameter.type !== "array") {
        throw `parameter ${parameter.key} must be of type: ${parameter.type}`;
    }

    if (
        (Array.isArray(data[parameter.key]) && parameter.length && data[parameter.key].length < parameter.length) ||
        (parameter.type === "string" && parameter.length && data[parameter.key].length < parameter.length)
    ) {
        throw `parameter ${parameter.key} must have minimum length: ${parameter.length}`;
    }

    if (parameter.type === "object" && parameter.required_keys) {
        const missingKeys = parameter.required_keys.filter((key) => data[parameter.key][key] === undefined);

        if (missingKeys.length > 0) {
            throw `parameter ${parameter.key} is missing required keys: ${missingKeys.join(", ")}`;
        }
        parameter.required_keys.forEach((key) => {
            const value = data[parameter.key][key];
            if ((typeof value === "string" || Array.isArray(value)) && value.length === 0) {
                throw `parameter ${key} in ${parameter.key} must have some length `;
            }
        });
    }
};

export const mandatory = ({ body, headers }: MandatoryParams): MW => {
    return (req, res, next) => {
        try {
            const body_data = req.body;
            const headers_data = req.headers;

            if (body) {
                body.forEach((parameter) => {
                    validateParameter(body_data, parameter);
                });
            }

            if (headers) {
                headers.forEach((parameter) => {
                    validateParameter(headers_data, parameter);
                });
            }

            next();
        } catch (error) {
            return res.status(500).send(json_failed(error));
        }
    };
};

export const request_logger = (log_requests: LogRequests): RequestHandler => {
    return (req: Request, res: Response, next: NextFunction) => {
        if (log_requests?.url) {
            logger.log(`${req.method} ${req.originalUrl}`);
        }
        if (log_requests?.headers) {
            logger.log("Headers:", req.headers);
        }
        if (log_requests?.query) {
            logger.log("Query:", req.query);
        }
        if (log_requests?.body) {
            if (["POST", "PUT", "PATCH"].includes(req.method)) {
                logger.log("Body:", req.body);
            }
        }
        next();
    };
};
