import express, { Express } from "express";
import cors from "cors";
import { logger } from "../managers";
import { init_env_variables, init_snapshots } from "./";
import { AppOptions, MainRouter } from "../types";
import { error_handler } from "../middlewares/error_handling";
import { request_logger, trim_body_middleware } from "../middlewares";
import { init_redis } from "./redis/initialize";
import axios from "axios";
import https from "https";
import http from "http";
import { rabbitmq } from "../managers/rabbitmq_manager";

export const start_server = async (main_router: MainRouter, project_name: string, version: string, options: AppOptions = {}): Promise<Express> => {
    let env_data = init_env_variables(["mode"]);
    const { port = Number(env_data.port), log_requests, initialize_redis = true, enable_axios_keep_alive = true } = options;
    const app: Express = express();
    app.use(cors());
    app.use(express.json({ limit: "10mb" }));
    app.use(express.urlencoded({ limit: "10mb", extended: true }));
    app.use(trim_body_middleware());
    app.use(request_logger(log_requests || {}));
    main_router(app);
    app.use(error_handler);
    if (enable_axios_keep_alive) {
        keep_axios_alive();
    }

    return new Promise<Express>((resolve) => {
        app.listen(port, async () => {
            logger.log(`Server is running at http://localhost:${port}`);
            logger.log("project status", { project_name, version, environment: env_data.mode });
            if (initialize_redis) {
                try {
                    logger.log("Initializing Redis...");
                    await init_redis();
                } catch (err) {
                    logger.warn("Redis unavailable, continuing without it", { err });
                }
            }
            resolve(app);
        });
    });
};

export const basic_init = async (main_router: MainRouter, project_name: string, version: string, options: AppOptions = {}): Promise<Express> => {
    const { init_snapshot_options, on_shutdown } = options;
    try {
        const app = await start_server(main_router, project_name, version, options);
        await init_snapshots(init_snapshot_options);

        const shutdown = async (signal: NodeJS.Signals) => {
            logger.log(`Received ${signal}, shutting down...`);
            try {
                await rabbitmq.cancel_subscriptions();
                await rabbitmq.close();
                await on_shutdown?.();
            } catch (err) {
                logger.error("Shutdown error", err);
                process.exit(1);
            }
            process.exit(0);
        };
        process.once("SIGINT", () => void shutdown("SIGINT"));
        process.once("SIGTERM", () => void shutdown("SIGTERM"));

        return app;
    } catch (error) {
        logger.error("Error from init function: ", error);
        process.exit(1);
    }
};

const keep_axios_alive = () => {
    axios.defaults.httpsAgent = new https.Agent({
        keepAlive: true,
        maxSockets: 100,
        maxFreeSockets: 20,
        timeout: 60000,
    });
    axios.defaults.httpAgent = new http.Agent({
        keepAlive: true,
        maxSockets: 100,
        maxFreeSockets: 20,
        timeout: 60000,
    });
};
