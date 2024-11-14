"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const helpers_1 = require("./helpers");
(() => __awaiter(void 0, void 0, void 0, function* () {
    const env_vars = (0, helpers_1.init_env_variables)();
    yield (0, helpers_1.init_snapshots)();
    // await snapshot_bulk_by_names([
    //     {
    //         collection_name: "units",
    //         extra_parsers: [
    //             {
    //                 on_first_time: (docs, config) => {
    //                     console.log(`on_first_time: ${config.collection_name} / ${docs.length}`);
    //                 },
    //                 on_add: (docs, config) => {
    //                     console.log(`on_add: ${config.collection_name} / ${docs.length}`);
    //                 },
    //                 on_modify: (docs, config) => {
    //                     console.log(`on_modify: ${config.collection_name} / ${docs.length}`);
    //                 },
    //                 on_remove: (docs, config) => {
    //                     console.log(`on_remove: ${config.collection_name} / ${docs.length}`);
    //                 },
    //             },
    //         ],
    //     },
    //     "usersUnits",
    //     "mobile_users_app_pro",
    //     "cars and mobile users",
    //     {
    //         collection_name: "app_pro_extra_pushes",
    //         extra_parsers: [
    //             {
    //                 on_first_time: (docs, config) => {
    //                     console.log(`on_first_time: ${config.collection_name} / ${docs.length}`);
    //                 },
    //                 on_add: (docs, config) => {
    //                     console.log(`on_add: ${config.collection_name} / ${docs.length}`);
    //                 },
    //                 on_modify: (docs, config) => {
    //                     console.log(`on_modify: ${config.collection_name} / ${docs.length}`);
    //                 },
    //                 on_remove: (docs, config) => {
    //                     console.log(`on_remove: ${config.collection_name} / ${docs.length}`);
    //                 },
    //             },
    //         ],
    //     },
    // ]);
    // const event: EventFromDevice = {
    //     car_number: "8313952",
    //     event_id: 3,
    //     source: "jimi",
    //     timestamp: Timestamp.now(),
    //     spd: 10,
    //     vin: 12.4,
    //     latitude: 32.29867,
    //     longitude: 34.87002,
    //     event_name: "Vibration",
    // };
    // await push_event_to_mobile_users(event);
}))();
//# sourceMappingURL=test.js.map