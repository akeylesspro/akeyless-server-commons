"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.nextjs_init = exports.basic_init = exports.start_server = void 0;
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const managers_1 = require("../managers");
const _1 = require("./");
const start_server = (main_router, project_name, version) => __awaiter(void 0, void 0, void 0, function* () {
    const app = (0, express_1.default)();
    const env_data = (0, _1.init_env_variables)(["port", "mode"]);
    app.use((0, cors_1.default)());
    app.use(express_1.default.json());
    main_router(app);
    return new Promise((resolve, reject) => {
        app.listen(Number(env_data.port), () => {
            managers_1.logger.log(`Server is running at http://localhost:${env_data.port}`);
            managers_1.logger.log("project status", { project_name, version, environment: env_data.mode });
            resolve();
        });
    });
});
exports.start_server = start_server;
const basic_init = (main_router, project_name, version) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { init_snapshots } = yield Promise.resolve().then(() => __importStar(require("./firebase_helpers")));
        yield init_snapshots();
        yield (0, exports.start_server)(main_router, project_name, version);
    }
    catch (error) {
        managers_1.logger.error("Error from init function: ", error);
        process.exit(1);
    }
});
exports.basic_init = basic_init;
const nextjs_init = (project_name, version) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        yield (0, _1.init_snapshots)();
        console.log("project name:", project_name);
        console.log("version :", version);
    }
    catch (error) {
        managers_1.logger.error("Error from init function: ", error);
        process.exit(1);
    }
});
exports.nextjs_init = nextjs_init;
//# sourceMappingURL=start.js.map