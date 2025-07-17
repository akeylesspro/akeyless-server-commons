import express, { Express } from "express";
import cors from "cors";
import { logger } from "../managers";
import { init_env_variables, init_snapshots } from "./";
import { LogRequests, MainRouter } from "../types";
import { error_handler } from "../middlewares/error_handling";
import { request_logger, trim_body_middleware } from "../middlewares";

export const start_server = async (
    main_router: MainRouter,
    project_name: string,
    version: string,
    port?: number,
    log_requests: LogRequests = {}
): Promise<Express> => {
    const app: Express = express();
    let env_data = init_env_variables(["mode"]);
    port = port || Number(env_data.port);
    app.use(cors());
    app.use(express.json());
    app.use(trim_body_middleware());
    app.use(request_logger(log_requests));
    main_router(app);
    app.use(error_handler);

    return new Promise<Express>((resolve, reject) => {
        app.listen(port, () => {
            logger.log(`Server is running at http://localhost:${port}`);
            logger.log("project status", { project_name, version, environment: env_data.mode });
            resolve(app);
        });
    });
};

export const basic_init = async (main_router: MainRouter, project_name: string, version: string, port?: number): Promise<Express> => {
    try {
        await init_snapshots();
        const app = await start_server(main_router, project_name, version, port);
        return app;
    } catch (error) {
        logger.error("Error from init function: ", error);
        process.exit(1);
    }
};
