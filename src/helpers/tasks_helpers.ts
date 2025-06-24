import { TObject } from "akeyless-types-commons";
import { cache_manager, logger } from "../managers";
import { get_document_by_id_optional, set_document } from "./firebase_helpers";
import admin from "firebase-admin";

export enum TaskName {
    collect_gprs_balances = "collect_gprs_balances",
    send_reset_sms = "send_reset_sms",
    collect_devices_health = "collect_devices_health",
    collect_billing_balance = "collect_billing_balance",
}

export enum TaskStatus {
    running = "running",
    completed = "completed",
    failed = "failed",
    suspeneded = "suspeneded",
}

export type TaskSaveOptions = "storage" | "db";

const save_task_data_in_cache = (task_name: TaskName, data: any[] | TObject<any>) => {
    if (Array.isArray(data)) {
        cache_manager.setArrayData(task_name, data);
    } else {
        cache_manager.setObjectData(task_name, data);
    }
};

export const execute_task = async <T = any>(source: string, task_name: TaskName, task: () => Promise<T>, options?: { save_in?: TaskSaveOptions }) => {
    try {
        await set_document(
            "nx-tasks",
            task_name,
            {
                source,
                status: TaskStatus.running,
                started: new Date(),
                timestamp: new Date(),
                results: "",
            },
            false
        );
        logger.log(`Task [${task_name}] started`);
        const start = performance.now();

        const data = await task();
        const update: TObject<any> = {
            status: TaskStatus.completed,
            completed: new Date(),
            timestamp: new Date(),
        };

        if (data) {
            if (options?.save_in === "storage" && typeof data === "object") {
                save_task_data_in_cache(task_name, data);
                const url = await keep_task_data_in_storage(task_name, data);
                update.data = url;
            } else {
                save_task_data_in_cache(task_name, data);
                update.data = data;
            }
        }
        await set_document("nx-tasks", task_name, update);
        logger.log(`Task [${task_name}] ended. It took ${Math.round(performance.now() - start)} ms`);
    } catch (exception: unknown) {
        const error_for_db = exception instanceof Error ? exception.message : exception;
        logger.error(`Task [${task_name}] error`, error_for_db);
        await set_document("nx-tasks", task_name, {
            status: TaskStatus.failed,
            completed: new Date(),
            timestamp: new Date(),
            data: `Error: ${error_for_db}`,
        });
    }
};

export const get_task_data = async <T = any>(task_name: TaskName): Promise<T> => {
    const cached_data = cache_manager.getArrayData(task_name);
    const cached_data_object = cache_manager.getObjectData(task_name, null);
    if (cached_data.length > 0) {
        return cached_data as T;
    }
    if (cached_data_object) {
        return cached_data as T;
    }
    const task_data = await get_document_by_id_optional("nx-tasks", task_name);
    if (typeof task_data?.data === "string" && task_data.data.startsWith("http")) {
        const storage_data = await get_task_data_from_storage(task_name);
        if (storage_data) {
            const value = task_data?.data === "object" && task_data.data ? storage_data : [];
            save_task_data_in_cache(task_name, value);
            return value;
        }
    }
    const value = typeof task_data?.data === "object" ? task_data.data : null;
    if (value) {
        save_task_data_in_cache(task_name, value);
    }
    return value || [];
};

export const get_task_data_from_storage = async <T = any>(task_name: TaskName): Promise<T | null> => {
    const bucket = admin.storage().bucket();
    const file = bucket.file(`tasks_data/${task_name}.json`);
    try {
        const [contents] = await file.download();
        return JSON.parse(contents.toString("utf-8"));
    } catch (error) {
        logger.error("Task error reading file from Firebase Storage:", error);
        return null;
    }
};

export const keep_task_data_in_storage = async (task_name: TaskName, data: any[] | TObject<any>): Promise<string> => {
    const bucket = admin.storage().bucket();
    const file = bucket.file(`tasks_data/${task_name}.json`);

    try {
        if (typeof data !== "object") {
            throw new Error("Only arrays or objects can be written");
        }
        const json_string = JSON.stringify(data, null);
        await file.save(json_string, {
            contentType: "application/json",
        });
        const [signed_url] = await file.getSignedUrl({
            action: "read",
            expires: Date.now() + 1000 * 60 * 60 * 24 * 7,
        });

        return signed_url;
    } catch (error) {
        logger.error("Error writing file to Firebase Storage:", error);
        return "";
    }
};
