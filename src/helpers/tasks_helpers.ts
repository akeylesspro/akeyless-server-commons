import { TObject } from "akeyless-types-commons";
import { cache_manager, logger } from "../managers";
import { get_document_by_id, get_document_by_id_optional, set_document } from "./firebase_helpers";

export enum TaskName {
    collect_gprs_balances = "collect_gprs_balances",
    send_reset_sms = "send_reset_sms",
    collect_devices_health = "collect_devices_health",
}

export enum TaskStatus {
    running = "running",
    completed = "completed",
    failed = "failed",
    suspeneded = "suspeneded",
}

export const execute_task = async (source: string, task_name: TaskName, task: () => Promise<any[] | null | TObject<any>>) => {
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
            update.data = data;
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
            data: error_for_db,
        });
    }
};

export const get_task_data = async <T = any>(task_name: TaskName): Promise<T[]> => {
    const cached_data = cache_manager.getArrayData(task_name);
    if (cached_data.length > 0) {
        return cached_data;
    }
    const task_data = await get_document_by_id_optional("nx-tasks", task_name);
    return Array.isArray(task_data?.data) ? task_data.data : [];
};
