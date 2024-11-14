import { Timestamp } from "firebase-admin/firestore";
import { init_env_variables, init_snapshots, push_event_to_mobile_users, snapshot_bulk_by_names } from "./helpers";
import { EventFromDevice } from "akeyless-types-commons";

(async () => {
    const env_vars = init_env_variables();
    await init_snapshots();
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
})();
