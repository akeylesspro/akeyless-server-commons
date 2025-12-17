import express, { Express } from "express";
import cors from "cors";
import { logger } from "../managers";
import { init_env_variables, init_snapshots } from "./";
import { AppOptions, LogRequests, MainRouter } from "../types";
import { error_handler } from "../middlewares/error_handling";
import { request_logger, trim_body_middleware } from "../middlewares";
import { init_redis } from "./redis/initialize";

export const start_server = async (
    main_router: MainRouter,
    project_name: string,
    version: string,
    { port, log_requests, initialize_redis = true }: AppOptions = {}
): Promise<Express> => {
    const app: Express = express();
    let env_data = init_env_variables(["mode"]);
    port = port || Number(env_data.port);
    app.use(cors());
    app.use(express.json({ limit: "10mb" }));
    app.use(express.urlencoded({ limit: "10mb", extended: true }));
    app.use(trim_body_middleware());
    app.use(request_logger(log_requests || {}));
    main_router(app);
    app.use(error_handler);

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

export const basic_init = async (
    main_router: MainRouter,
    project_name: string,
    version: string,
    { port, log_requests, init_snapshot_options, initialize_redis }: AppOptions = {}
): Promise<Express> => {
    try {
        const app = await start_server(main_router, project_name, version, { port, log_requests, initialize_redis });
        await init_snapshots(init_snapshot_options);
        return app;
    } catch (error) {
        logger.error("Error from init function: ", error);
        process.exit(1);
    }
};
