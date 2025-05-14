import express, { Express } from "express";
import cors from "cors";
import { logger } from "../managers";
import { init_env_variables, init_snapshots } from "./";
import { MainRouter } from "../types";
import { error_handler } from "../middlewares/error_handling";

export const start_server = async (main_router: MainRouter, project_name: string, version: string, port?: number): Promise<Express> => {
    const app: Express = express();
    let env_data = init_env_variables(["mode"]);
    port = port || Number(env_data.port);
    app.use(cors());
    app.use(express.json());
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
export const nextjs_init = async (project_name: string, version: string) => {
    try {
        await init_snapshots();
        console.log("project name:", project_name);
        console.log("version :", version);
    } catch (error) {
        logger.error("Error from nextjs init function: ", error);
        process.exit(1);
    }
};
