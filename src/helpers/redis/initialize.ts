import Redis from "ioredis";
import { REDIS_UPDATES_PREFIX } from "akeyless-types-commons";
import { get_collection_keys } from "./keys";
import { init_env_variables } from "../global_helpers";
import { logger } from "../../managers";

const { redis_ip } = init_env_variables(["redis_ip"]);

export const redis_commander = new Redis({ host: redis_ip });
export const redis_listener = new Redis({ host: redis_ip });

redis_commander.on("connect", () => logger.log("✅ Redis Commander connected"));

redis_commander.on("error", (err) => logger.error("❌ Redis Commander error", err));

redis_listener.on("connect", () => {
    const redis_pattern = get_collection_keys(REDIS_UPDATES_PREFIX);
    redis_listener
        .psubscribe(redis_pattern)
        .then(() => {
            logger.log(`✅ Successfully subscribed to Redis pattern: ${redis_pattern}`);
        })
        .catch((err) => logger.error(`❌ Failed to psubscribe to ${redis_pattern}`, err));
});

redis_listener.on("error", (err) => logger.error("❌ Redis Listener error", err));
