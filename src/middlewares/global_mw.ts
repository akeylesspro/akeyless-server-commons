import { Request, Response, NextFunction, RequestHandler } from "express";
import { json_failed } from "../helpers";
import { LogRequests, MandatoryObject, MandatoryParams, MW, Route, Service } from "../types";
import { logger } from "../managers";

const validateParameter = (data: any, parameter: MandatoryObject, is_mandatory: boolean) => {
    if (data[parameter.key] === undefined) {
        if (is_mandatory) {
            throw `missing mandatory parameter: ${parameter.key}`;
        } else {
            return;
        }
    }

    if (parameter.type === "array" && !Array.isArray(data[parameter.key])) {
        throw `parameter ${parameter.key} must be of type: Array`;
    }

    if (typeof data[parameter.key] !== parameter.type && parameter.type !== "array") {
        throw `parameter ${parameter.key} must be of type: ${parameter.type}`;
    }

    if (parameter.type === "string" && parameter.length && data[parameter.key].length < parameter.length) {
        throw `parameter ${parameter.key} must be string and must have minimum length of: ${parameter.length}`;
    }
    const is_array = Array.isArray(data[parameter.key]);
    if (is_array) {
        if (parameter.length && data[parameter.key].length < parameter.length) {
            throw `parameter ${parameter.key} must be array and must have minimum length of: ${parameter.length}`;
        }
        if (Array.isArray(parameter.array_types) && parameter.array_types.length > 0) {
            data[parameter.key].forEach((item: any, index: number) => {
                const item_type = typeof item;
                if (!parameter.array_types!.includes(item_type as any)) {
                    throw `item at index ${index} in parameter ${parameter.key} must be of type: ${parameter.array_types!.join(" | ")}`;
                }
            });
        }
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
                    validateParameter(body_data, parameter, true);
                });
            }

            if (headers) {
                headers.forEach((parameter) => {
                    validateParameter(headers_data, parameter, true);
                });
            }

            next();
        } catch (error) {
            return res.send(json_failed(error));
        }
    };
};

export const optional = ({ body, headers }: MandatoryParams): MW => {
    return (req, res, next) => {
        try {
            const body_data = req.body;
            const headers_data = req.headers;

            if (body) {
                body.forEach((parameter) => {
                    validateParameter(body_data, parameter, false);
                });
            }

            if (headers) {
                headers.forEach((parameter) => {
                    validateParameter(headers_data, parameter, false);
                });
            }

            next();
        } catch (error) {
            return res.send(json_failed(error));
        }
    };
};

export const request_logger = (log_requests: LogRequests): RequestHandler => {
    return (req: Request, res: Response, next: NextFunction) => {
        if (log_requests?.url || log_requests?.headers || log_requests?.query || log_requests?.body) {
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
