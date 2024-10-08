import express, { Express } from "express";
import cors from "cors";
import { init_env_variables } from "./global_helpers";
import { logger } from "../managers";
import { init_snapshots } from "./firebase_helpers";
import { MainRouter } from "../types";

export const start_server = async (main_router: MainRouter, project_name: string, version: string) => {
    const app: Express = express();
    const env_data = init_env_variables(["port", "mode"]);
    app.use(cors());
    app.use(express.json());
    main_router(app);
    return new Promise<void>((resolve, reject) => {
        app.listen(Number(env_data.port), () => {
            logger.log(`Server is running at http://localhost:${env_data.port}`);
            logger.log("project status", { project_name, version, environment: env_data.mode });
            resolve();
        });
    });
};

export const basic_init = async (main_router: MainRouter, project_name: string, version: string) => {
    try {
        await init_snapshots();
        await start_server(main_router, project_name, version);
    } catch (error) {
        logger.error("Error from init function: ", error);
        process.exit(1);
    }
};
