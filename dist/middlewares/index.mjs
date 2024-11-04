import {
  convert_to_short_phone_number,
  get_users_by_phone,
  json_failed,
  logger,
  query_document,
  verify_token
} from "./chunk-DG2FVHEH.mjs";

// src/middlewares/global_mw.ts
var validateParameter = (data, parameter) => {
  if (data[parameter.key] === void 0) {
    throw `missing mandatory parameter: ${parameter.key}`;
  }
  if (parameter.type === "array" && !Array.isArray(data[parameter.key])) {
    throw `parameter ${parameter.key} must be of type: Array`;
  }
  if (typeof data[parameter.key] !== parameter.type && parameter.type !== "array") {
    throw `parameter ${parameter.key} must be of type: ${parameter.type}`;
  }
  if (Array.isArray(data[parameter.key]) && parameter.length && data[parameter.key].length < parameter.length || parameter.type === "string" && parameter.length && data[parameter.key].length < parameter.length) {
    throw `parameter ${parameter.key} must have minimum length: ${parameter.length}`;
  }
  if (parameter.type === "object" && parameter.required_keys) {
    const missingKeys = parameter.required_keys.filter((key) => data[parameter.key][key] === void 0);
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
var mandatory = ({ body, headers }) => {
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

// src/middlewares/user_mw.ts
var verify_user_auth = async (req, res, next) => {
  try {
    const authorization = req.headers.authorization;
    await verify_token(authorization);
    next();
  } catch (error) {
    logger.error("error from verify user auth", error);
    res.status(403).send(json_failed(error));
  }
};
var get_users_login = async (req, res, next) => {
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
      ...users
    };
    next();
  } catch (error) {
    logger.error("error from verify user auth", error);
    res.status(403).send(json_failed(error));
  }
};
var installer_login = async (req, res, next) => {
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
  } catch (error) {
    res.status(403).send(json_failed(error));
  }
};
var nx_user_login = async (req, res, next) => {
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
  } catch (error) {
    res.status(403).send(json_failed(error));
  }
};
export {
  get_users_login,
  installer_login,
  mandatory,
  nx_user_login,
  verify_user_auth
};
