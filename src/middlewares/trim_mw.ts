import { trim_strings } from "../helpers";
import { MW } from "../types";

export const trim_body_middleware = (): MW => (req, res, next) => {
    if (req.body && typeof req.body === "object") {
        req.body = trim_strings(req.body);
    }
    return next();
};
