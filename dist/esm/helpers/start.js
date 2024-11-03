var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import express from "express";
import cors from "cors";
import { logger } from "../managers";
import { init_env_variables, init_snapshots } from "./";
export const start_server = (main_router, project_name, version) => __awaiter(void 0, void 0, void 0, function* () {
    const app = express();
    const env_data = init_env_variables(["port", "mode"]);
    app.use(cors());
    app.use(express.json());
    main_router(app);
    return new Promise((resolve, reject) => {
        app.listen(Number(env_data.port), () => {
            logger.log(`Server is running at http://localhost:${env_data.port}`);
            logger.log("project status", { project_name, version, environment: env_data.mode });
            resolve();
        });
    });
});
export const basic_init = (main_router, project_name, version) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { init_snapshots } = yield import("./firebase_helpers");
        yield init_snapshots();
        yield start_server(main_router, project_name, version);
    }
    catch (error) {
        logger.error("Error from init function: ", error);
        process.exit(1);
    }
});
export const nextjs_init = (project_name, version) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        yield init_snapshots();
        console.log("project name:", project_name);
        console.log("version :", version);
    }
    catch (error) {
        logger.error("Error from init function: ", error);
        process.exit(1);
    }
});
//# sourceMappingURL=start.js.map