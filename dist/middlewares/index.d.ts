import { Request, Response, NextFunction } from 'express';

type MW = (req: Request, res: Response, next: NextFunction) => void;

interface MandatoryObject {
    key: string;
    type: "string" | "number" | "boolean" | "object" | "array";
    length?: number;
    required_keys?: string[];
}
interface MandatoryParams {
    body?: MandatoryObject[];
    headers?: MandatoryObject[];
}

declare const mandatory: ({ body, headers }: MandatoryParams) => MW;

declare const verify_user_auth: MW;
declare const get_users_login: MW;
declare const installer_login: MW;
declare const nx_user_login: MW;

export { get_users_login, installer_login, mandatory, nx_user_login, verify_user_auth };
