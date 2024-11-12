import { verify_token, json_failed, get_users_by_phone, query_document, convert_to_short_phone_number } from "../helpers";
import { logger } from "../managers";
export const verify_user_auth = async (req, res, next) => {
    try {
        const authorization = req.headers.authorization;
        await verify_token(authorization);
        next();
    }
    catch (error) {
        logger.error("error from verify user auth", error);
        res.status(403).send(json_failed(error));
    }
};
export const get_users_login = async (req, res, next) => {
    try {
        const authorization = req.headers.authorization;
        const user_data = await verify_token(authorization);
        const { phone_number } = user_data;
        if (!phone_number) {
            return next();
        }
        const users = await get_users_by_phone(phone_number);
        req.body = {
            ...req.body,
            ...users,
        };
        next();
    }
    catch (error) {
        logger.error("error from verify user auth", error);
        res.status(403).send(json_failed(error));
    }
};
export const installer_login = async (req, res, next) => {
    try {
        const authorization = req.headers.authorization;
        const user_data = await verify_token(authorization);
        const { phone_number } = user_data;
        if (!phone_number) {
            throw "Invalid authorization token";
        }
        const users = await get_users_by_phone(phone_number);
        const installer = users.installer;
        if (!installer) {
            throw "Installer not fund";
        }
        req.body.user = installer;
        next();
    }
    catch (error) {
        res.status(403).send(json_failed(error));
    }
};
export const nx_user_login = async (req, res, next) => {
    try {
        const authorization = req.headers.authorization;
        const user_data = await verify_token(authorization);
        const { phone_number } = user_data;
        if (!phone_number) {
            throw "Invalid authorization token";
        }
        const nx_user = await query_document("nx-users", "phone_number", "==", convert_to_short_phone_number(phone_number));
        req.body.nx_user = nx_user;
        next();
    }
    catch (error) {
        res.status(403).send(json_failed(error));
    }
};
