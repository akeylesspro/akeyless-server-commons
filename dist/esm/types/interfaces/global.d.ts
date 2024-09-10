import { TObject } from "..";
import { Timestamp } from "@google-cloud/firestore";
export type FB_TIMESTAMP = {
    _seconds: number;
    _nanoseconds: number;
};
export interface CreatedUpdated {
    _nanoseconds: number;
    _seconds: number;
}
export interface NxUser {
    id?: string;
    client?: string;
    first_name?: string;
    last_name?: string;
    phone_number?: string;
    status?: string;
    roles?: string[];
    site?: string;
    sites?: string[];
    created?: CreatedUpdated;
    updated?: CreatedUpdated;
}
export interface Installer {
    id?: string;
    fullName?: string;
    phone?: string;
    superTechnician?: string;
    clients?: string[];
    customers?: string[];
}
export interface Client {
    created?: CreatedUpdated;
    updated?: CreatedUpdated;
    features?: string[];
    id?: string;
    name?: string;
    root_site?: string;
    status?: string;
    api_token?: string;
    key?: string;
}
export interface Car {
    confirmation_code: string;
    id?: string;
    install_confirmation_date: Timestamp;
    carId: string;
    mainDriver: string;
    installation_status: string;
    name: string;
    userPhone: string;
    camera_installation_details: TObject<string>;
    status: number;
    warrantyExpire: Timestamp;
    protectionType: string;
    protectionTypeId: string;
    warranty: boolean;
    statusMokedUser: string;
    isEnforcementCenterUser: boolean;
    sites: string[];
    client: string;
    installationDate: Timestamp;
    timestamp: number;
    customer: string;
    customerId: string;
    technician: string;
    technicianId: string;
    engine_type: string;
    gov_info: TObject<string | number>;
    brand: string;
    manufacturer: string;
    carYear: string;
    color: string;
    commandOption: string;
    chassisNumber: string;
    subEnforcmentUser: TObject<string | null | null[]>;
    peripherals: Peripheral[];
}
export interface Peripheral {
    boardRef: string;
    boardType: string;
    boardTypeId: string;
    installationLocationImageUrl: string;
    location: string;
    mac: string;
    relayType: null;
    status: number;
    technician: string;
    updateDate: Timestamp;
}
export interface MandatoryObject {
    key: string;
    type: "string" | "number" | "boolean" | "object" | "array";
    length?: number;
    required_keys?: string[];
}
export interface MandatoryParams {
    body?: MandatoryObject[];
    headers?: MandatoryObject[];
}
