import { verify_token, json_failed, get_users_by_phone, query_document, convert_to_short_phone_number, query_document_optional } from "../helpers";
import { logger } from "../managers";
import { MW } from "../types";
import { NxUser, Client } from "akeyless-types-commons";

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

export const nx_user_login: MW = async (req, res, next) => {
    try {
        const authorization = req.headers.authorization;
        const user_data = await verify_token(authorization);
        const { phone_number } = user_data;
        if (!phone_number) {
            throw "Invalid authorization token";
        }
        const nx_user: NxUser = await query_document("nx-users", "phone_number", "in", [convert_to_short_phone_number(phone_number), phone_number]);
        req.body.nx_user = nx_user;
        next();
    } catch (error: any) {
        res.status(403).send(json_failed(error));
    }
};

export const client_login: MW = async (req, res, next) => {
    try {
        const token = req.headers.authorization;
        if (!token) {
            throw new Error("Authorization token not found.");
        }
        const client_data = (await query_document_optional("nx-clients", "api_token", "==", token)) as Client | undefined;
        if (!client_data) {
            throw new Error(`No client found with token: "${token}" .`);
        }
        req.body.client = client_data;
        next();
    } catch (error: any) {
        res.status(403).send(json_failed(error.message || error));
    }
};
