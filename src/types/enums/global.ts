export enum SimProvider {
    partner = "partner",
    pelephone = "pelephone",
    celcom = "celcom",
    monogoto = "monogoto",
    unknown = "unknown",
}

export type NxServiceName = "bi" | "call_center" | "dashboard" | "devices" | "installer" | "ox_server" | "toolbox" | "end_users" | "notifications";

export type NxServiceNameMap = Record<NxServiceName, string>;
