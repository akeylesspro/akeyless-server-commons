import { verify_token, json_failed, get_users_by_phone, query_document, get_document_by_id, convert_to_short_phone_number } from "../helpers";
import { logger } from "../managers";
import { MW } from "../types";
import { NxUser, Installer, TObject } from "akeyless-types-commons";

export const verify_user_auth: MW = async (req, res, next) => {
    try {
        const authorization = req.headers.authorization;
        await verify_token(authorization);
        next();
    } catch (error: any) {
        logger.error("error from verify user auth", error);
        res.status(403).send(json_failed(error));
    }
};

export const get_users_login: MW = async (req, res, next) => {
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
    } catch (error: any) {
        logger.error("error from verify user auth", error);
        res.status(403).send(json_failed(error));
    }
};

export const installer_login: MW = async (req, res, next) => {
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
    } catch (error: any) {
        res.status(403).send(json_failed(error));
    }
};

export const nx_user_login: MW = async (req, res, next) => {
    try {
        const authorization = req.headers.authorization;
        const user_data = await verify_token(authorization);
        const { phone_number } = user_data;
        if (!phone_number) {
            throw "Invalid authorization token";
        }
        const nx_user: NxUser = await query_document("nx-users", "phone_number", "==", convert_to_short_phone_number(phone_number));
        req.body.nx_user = nx_user;
        next();
    } catch (error: any) {
        res.status(403).send(json_failed(error));
    }
};
