"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.mandatory = void 0;
const helpers_1 = require("../helpers");
const validateParameter = (data, parameter) => {
    if (data[parameter.key] === undefined) {
        throw `missing mandatory parameter: ${parameter.key}`;
    }
    if (parameter.type === "array" && !Array.isArray(data[parameter.key])) {
        throw `parameter ${parameter.key} must be of type: Array`;
    }
    if (typeof data[parameter.key] !== parameter.type && parameter.type !== "array") {
        throw `parameter ${parameter.key} must be of type: ${parameter.type}`;
    }
    if ((Array.isArray(data[parameter.key]) && parameter.length && data[parameter.key].length < parameter.length) ||
        (parameter.type === "string" && parameter.length && data[parameter.key].length < parameter.length)) {
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
const mandatory = ({ body, headers }) => {
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
        }
        catch (error) {
            return res.status(500).send((0, helpers_1.json_failed)(error));
        }
    };
};
exports.mandatory = mandatory;
//# sourceMappingURL=global_mw.js.map