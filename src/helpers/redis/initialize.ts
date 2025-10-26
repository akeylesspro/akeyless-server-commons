import Redis from "ioredis";
import { REDIS_UPDATES_PREFIX } from "akeyless-types-commons";
import { get_collection_keys } from "./keys";
import { init_env_variables } from "../global_helpers";
import { logger } from "../../managers";
import dotenv from "dotenv";

dotenv.config();

export let redis_commander_connected = false;
export let redis_listener_connected = false;

const MAX_RETRY_ATTEMPTS = 2;

let redis_commander: Redis;
let redis_listener: Redis;
let redis_initialized = false;

function create_redis_instance(role: "commander" | "listener") {
    let retry_attempts = 0;

    const base_config = {
        host: init_env_variables(["redis_ip"]).redis_ip,
        lazyConnect: true,
        enableOfflineQueue: false,
        maxRetriesPerRequest: 0,
        reconnectOnError: () => false,
        retryStrategy(times: number) {
            retry_attempts = times;
            if (retry_attempts >= MAX_RETRY_ATTEMPTS) {
                logger.error(`❌ Redis ${role} failed after ${MAX_RETRY_ATTEMPTS} attempts. Stopping retries.`);
                return null;
            }
            const delay = 1000;
            logger.warn(`⚠️ Redis ${role} retry attempt ${retry_attempts}/${MAX_RETRY_ATTEMPTS} in ${delay}ms...`);
            return delay;
        },
    };

    // Listener needs enableReadyCheck: false because it will be in subscriber mode
    // and cannot respond to PING commands
    const config = role === "listener" 
        ? { ...base_config, enableReadyCheck: false }
        : base_config;

    const client = new Redis(config);

    client.on("connect", () => {
        logger.log(`✅ Redis ${role} connected`);
        if (role === "commander") redis_commander_connected = true;
        if (role === "listener") redis_listener_connected = true;
    });

    client.on("error", (err) => logger.error(`❌ Redis ${role} error`, err));

    client.on("close", () => {
        logger.warn(`ℹ️ Redis ${role} connection closed`);
        if (role === "commander") redis_commander_connected = false;
        if (role === "listener") redis_listener_connected = false;
    });

    client.on("end", () => {
        logger.warn(`ℹ️ Redis ${role} connection ended`);
        if (role === "commander") redis_commander_connected = false;
        if (role === "listener") redis_listener_connected = false;
    });

    client.connect().catch((err) => {
        logger.error(`❌ Redis ${role} initial connect failed`, err);
    });

    return client;
}

export const init_redis = () => {
    return new Promise<void>((resolve, reject) => {
        if (redis_initialized) {
            resolve();
            return;
        }

        redis_commander = create_redis_instance("commander");
        redis_listener = create_redis_instance("listener");
        redis_initialized = true;

        let commander_ready = false;
        let listener_ready = false;
        let listener_subscribed = false;

        const check_and_resolve = () => {
            if (commander_ready && listener_ready) {
                resolve();
            }
        };

        redis_commander.on("connect", () => {
            commander_ready = true;
            check_and_resolve();
        });

        redis_listener.on("connect", () => {
            listener_ready = true;
            
            // Only subscribe once, not on every reconnect
            // ioredis will automatically resubscribe on reconnection
            if (!listener_subscribed) {
                listener_subscribed = true;
                const redis_pattern = get_collection_keys(REDIS_UPDATES_PREFIX);
                redis_listener!
                    .psubscribe(redis_pattern)
                    .then(() => logger.log(`✅ Subscribed to Redis pattern: ${redis_pattern}`))
                    .catch((err) => logger.error(`❌ Failed to psubscribe to ${redis_pattern}`, err));
            }
            
            check_and_resolve();
        });

        // Handle case where Redis connections fail
        const connection_timeout = setTimeout(() => {
            if (!commander_ready || !listener_ready) {
                logger.warn("⚠️ Redis connection timeout, proceeding without Redis");
                resolve();
            }
        }, 5000);

        redis_commander.on("error", () => {
            if (!commander_ready && !listener_ready) {
                clearTimeout(connection_timeout);
                reject();
            }
        });

        redis_listener.on("error", () => {
            if (!commander_ready && !listener_ready) {
                clearTimeout(connection_timeout);
                reject();
            }
        });

        process.on("unhandledRejection", (err) => {
            logger.error("❌ Unhandled promise rejection", err);
        });
        process.on("uncaughtException", (err) => {
            logger.error("❌ Uncaught exception", err);
        });
    });
};

export const get_redis_commander = (): Redis => {
    if (!redis_commander) {
        throw new Error("Redis commander not initialized. Call init_redis() first.");
    }
    return redis_commander;
};

export const get_redis_listener = (): Redis => {
    if (!redis_listener) {
        throw new Error("Redis listener not initialized. Call init_redis() first.");
    }
    return redis_listener;
};
