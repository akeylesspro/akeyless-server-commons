import { verify_token, json_failed, query_document_optional, get_user_by_identifier } from "../helpers";
import { logger } from "../managers";
import { MW } from "../types";
import { NxUser, Client } from "akeyless-types-commons";

export const verify_user_auth: MW = async (req, res, next) => {
    try {
        const authorization = req.headers.authorization;
        const user = await verify_token(authorization);
        req.body.firebase_user = user;
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
        const { phone_number, email } = user_data;
        if (!phone_number && !email) {
            throw "Invalid authorization token";
        }
        const nx_user: NxUser = await get_user_by_identifier(phone_number || email!);
        req.body.user = nx_user;
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
            throw new Error(`No client found with token: ${token} .`);
        }
        req.body.client = client_data;
        next();
    } catch (error: any) {
        res.status(403).send(json_failed(error.message || error));
    }
};
