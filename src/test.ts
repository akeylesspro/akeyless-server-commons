import { Timestamp } from "firebase-admin/firestore";
import { init_snapshots, init_snapshots_cars, init_snapshots_mobile, push_event_to_mobile_users } from "./helpers";
import { EventFromDevice } from "akeyless-types-commons";

const event: EventFromDevice = {
    car_number: "8313952",
    event_id: 3,
    source: "jimi",
    timestamp: Timestamp.now(),
    spd: 10,
    vin: 12.4,
    latitude: 32.29867,
    longitude: 34.87002,
    event_name: "Vibration",
};

(async () => {
    await init_snapshots();
    await init_snapshots_cars();
    await init_snapshots_mobile();
    //await push_event_to_mobile_users(event);
})();
