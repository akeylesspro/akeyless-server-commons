import Redis from "ioredis";
import { REDIS_UPDATES_PREFIX } from "akeyless-types-commons";
import { get_collection_keys } from "./keys";
import { init_env_variables } from "../global_helpers";
import { logger } from "../../managers";
import dotenv from "dotenv";

dotenv.config();
const { redis_ip } = init_env_variables(["redis_ip"]);

export let redis_commander_connected = false;
export let redis_listener_connected = false;

const MAX_RETRY_ATTEMPTS = 5;

function create_redis_instance(role: "commander" | "listener") {
    let retry_attempts = 0;

    const client = new Redis({
        host: redis_ip,
        lazyConnect: true,
        enableOfflineQueue: false,
        maxRetriesPerRequest: 0,
        reconnectOnError: () => false,
        retryStrategy(times) {
            retry_attempts = times;
            if (retry_attempts >= MAX_RETRY_ATTEMPTS) {
                logger.error(`❌ Redis ${role} failed after ${MAX_RETRY_ATTEMPTS} attempts. Stopping retries.`);
                return null;
            }
            const delay = 1000
            logger.warn(`⚠️ Redis ${role} retry attempt ${retry_attempts}/${MAX_RETRY_ATTEMPTS} in ${delay}ms...`);
            return delay;
        },
    });

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

export const redis_commander = create_redis_instance("commander");
export const redis_listener = create_redis_instance("listener");

redis_listener.on("connect", () => {
    const redis_pattern = get_collection_keys(REDIS_UPDATES_PREFIX);
    redis_listener
        .psubscribe(redis_pattern)
        .then(() => logger.log(`✅ Subscribed to Redis pattern: ${redis_pattern}`))
        .catch((err) => logger.error(`❌ Failed to psubscribe to ${redis_pattern}`, err));
});

process.on("unhandledRejection", (err) => {
    logger.error("❌ Unhandled promise rejection", err);
});
process.on("uncaughtException", (err) => {
    logger.error("❌ Uncaught exception", err);
});
