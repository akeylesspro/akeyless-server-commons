import { FieldValue, Timestamp } from "firebase-admin/firestore";
import { db } from "./firebase_helpers";
import { TObject } from "akeyless-types-commons";
import { logger } from "../managers";

const POSTPONED_ACTIONS_COLLECTION = "nx-postponed-actions";

enum PostponedActionStatus {
    pending = "pending",
    processing = "processing",
    completed = "completed",
    cancelled = "cancelled",
    failed = "failed",
}

type PostponedActionTime = Date | string | { minutes?: number; hours?: number };

type JsonPayload = TObject<any>;

interface PostponedAction {
    key: string;
    details: JsonPayload;
    action_type: string;
    description: string;
    execute_at: Date;
    status: PostponedActionStatus;
    attempt_count: number;
    created_at: Date;
    updated_at: Date;
    started_at?: Date;
    completed_at?: Date;
    cancelled_at?: Date;
    failed_at?: Date;
    error?: string;
}

interface AddPostponedAction {
    key: string;
    details: JsonPayload;
    action_type: string;
    description: string;
    execute_at: PostponedActionTime;
}

interface UpdatePostponedAction {
    details?: JsonPayload;
    action_type?: string;
    description?: string;
    execute_at?: PostponedActionTime;
}

const get_ref = (key: string) => {
    if (!key.trim()) {
        throw new Error("postponed action key must not be empty");
    }
    if (key.includes("/")) {
        throw new Error("postponed action key must not contain '/'");
    }
    return db.collection(POSTPONED_ACTIONS_COLLECTION).doc(key);
};

const resolve_postponed_action_time = (value: PostponedActionTime, now = new Date()): Date => {
    if (value instanceof Date || typeof value === "string") {
        const date = value instanceof Date ? new Date(value.getTime()) : new Date(value);
        if (!Number.isFinite(date.getTime())) {
            throw new Error("execute_at must be a valid date");
        }
        return date;
    }

    const { minutes = 0, hours = 0 } = value;
    if (!Number.isFinite(minutes) || !Number.isFinite(hours) || minutes < 0 || hours < 0 || minutes + hours <= 0) {
        throw new Error("relative execute_at must contain positive finite minutes or hours");
    }
    return new Date(now.getTime() + (minutes + hours * 60) * 60_000);
};

const validate_text = (value: string, field_name: "action_type" | "description"): void => {
    if (!value.trim()) {
        throw new Error(`postponed action ${field_name} must not be empty`);
    }
};

const validate_details = (details: JsonPayload): void => {
    if (!details || Array.isArray(details) || typeof details !== "object") {
        throw new Error("postponed action details must be a JSON object");
    }
    try {
        JSON.stringify(details, (_key, value: unknown) => {
            if (value === undefined || typeof value === "bigint" || typeof value === "function" || typeof value === "symbol") {
                throw new Error("unsupported JSON value");
            }
            if (typeof value === "number" && !Number.isFinite(value)) {
                throw new Error("JSON numbers must be finite");
            }
            return value;
        });
    } catch (error) {
        throw new Error("postponed action details must be JSON serializable", { cause: error });
    }
};

const timestamp_to_date = (value: unknown, field_name: string): Date => {
    if (value instanceof Timestamp) return value.toDate();
    if (value instanceof Date) return value;
    throw new Error(`postponed action has invalid ${field_name}`);
};

const optional_timestamp_to_date = (value: unknown, field_name: string): Date | undefined => {
    return value === undefined ? undefined : timestamp_to_date(value, field_name);
};

const to_postponed_action = (snapshot: FirebaseFirestore.DocumentSnapshot): PostponedAction => {
    const value = snapshot.data();
    if (!snapshot.exists || !value) {
        throw new Error(`postponed action '${snapshot.id}' does not exist`);
    }

    return {
        key: snapshot.id,
        details: value.details as JsonPayload,
        action_type: value.action_type as string,
        description: value.description as string,
        execute_at: timestamp_to_date(value.execute_at, "execute_at"),
        status: value.status as PostponedActionStatus,
        attempt_count: typeof value.attempt_count === "number" ? value.attempt_count : 0,
        created_at: timestamp_to_date(value.created_at, "created_at"),
        updated_at: timestamp_to_date(value.updated_at, "updated_at"),
        started_at: optional_timestamp_to_date(value.started_at, "started_at"),
        completed_at: optional_timestamp_to_date(value.completed_at, "completed_at"),
        cancelled_at: optional_timestamp_to_date(value.cancelled_at, "cancelled_at"),
        failed_at: optional_timestamp_to_date(value.failed_at, "failed_at"),
        error: typeof value.error === "string" ? value.error : undefined,
    };
};

const assert_status = (key: string, actual: unknown, allowed: PostponedActionStatus[]): void => {
    if (!allowed.includes(actual as PostponedActionStatus)) {
        throw new Error(`postponed action '${key}' has status '${String(actual)}'; expected ${allowed.join(" or ")}`);
    }
};

const get_postponed_action_core = async (key: string): Promise<PostponedAction | null> => {
    const snapshot = await get_ref(key).get();
    return snapshot.exists ? to_postponed_action(snapshot) : null;
};

const add_postponed_action_core = async (input: AddPostponedAction): Promise<PostponedAction> => {
    validate_details(input.details);
    validate_text(input.action_type, "action_type");
    validate_text(input.description, "description");
    const ref = get_ref(input.key);
    const execute_at = resolve_postponed_action_time(input.execute_at);
    const now = new Date();

    return db.runTransaction(async (transaction) => {
        const snapshot = await transaction.get(ref);
        if (snapshot.exists) {
            assert_status(input.key, snapshot.get("status"), [PostponedActionStatus.pending]);
            transaction.update(ref, {
                details: input.details,
                action_type: input.action_type,
                description: input.description,
                execute_at,
                updated_at: now,
            });
            return {
                ...to_postponed_action(snapshot),
                details: input.details,
                action_type: input.action_type,
                description: input.description,
                execute_at,
                updated_at: now,
            };
        }

        const action: PostponedAction = {
            key: input.key,
            details: input.details,
            action_type: input.action_type,
            description: input.description,
            execute_at,
            status: PostponedActionStatus.pending,
            attempt_count: 0,
            created_at: now,
            updated_at: now,
        };
        transaction.create(ref, action);
        return action;
    });
};

const update_postponed_action_core = async (key: string, input: UpdatePostponedAction): Promise<void> => {
    if (input.details === undefined && input.action_type === undefined && input.description === undefined && input.execute_at === undefined) {
        throw new Error("postponed action update must contain details, action_type, description or execute_at");
    }
    if (input.details !== undefined) validate_details(input.details);
    if (input.action_type !== undefined) validate_text(input.action_type, "action_type");
    if (input.description !== undefined) validate_text(input.description, "description");

    const ref = get_ref(key);
    await db.runTransaction(async (transaction) => {
        const snapshot = await transaction.get(ref);
        if (!snapshot.exists) throw new Error(`postponed action '${key}' does not exist`);
        assert_status(key, snapshot.get("status"), [PostponedActionStatus.pending]);

        transaction.update(ref, {
            ...(input.details === undefined ? {} : { details: input.details }),
            ...(input.action_type === undefined ? {} : { action_type: input.action_type }),
            ...(input.description === undefined ? {} : { description: input.description }),
            ...(input.execute_at === undefined ? {} : { execute_at: resolve_postponed_action_time(input.execute_at) }),
            updated_at: new Date(),
        });
    });
};

const repostpone_postponed_action_core = async (key: string, execute_at: PostponedActionTime): Promise<void> => {
    const ref = get_ref(key);
    await db.runTransaction(async (transaction) => {
        const snapshot = await transaction.get(ref);
        if (!snapshot.exists) throw new Error(`postponed action '${key}' does not exist`);
        assert_status(key, snapshot.get("status"), [
            PostponedActionStatus.pending,
            PostponedActionStatus.completed,
            PostponedActionStatus.cancelled,
            PostponedActionStatus.failed,
        ]);

        transaction.update(ref, {
            execute_at: resolve_postponed_action_time(execute_at),
            status: PostponedActionStatus.pending,
            updated_at: new Date(),
            started_at: FieldValue.delete(),
            completed_at: FieldValue.delete(),
            cancelled_at: FieldValue.delete(),
            failed_at: FieldValue.delete(),
            error: FieldValue.delete(),
        });
    });
};

const cancel_postponed_action_core = async (key: string): Promise<void> => {
    const ref = get_ref(key);
    await db.runTransaction(async (transaction) => {
        const snapshot = await transaction.get(ref);
        if (!snapshot.exists) throw new Error(`postponed action '${key}' does not exist`);
        assert_status(key, snapshot.get("status"), [PostponedActionStatus.pending]);
        const now = new Date();
        transaction.update(ref, { status: PostponedActionStatus.cancelled, cancelled_at: now, updated_at: now });
    });
};

const complete_postponed_action_core = async (key: string): Promise<void> => {
    const ref = get_ref(key);
    await db.runTransaction(async (transaction) => {
        const snapshot = await transaction.get(ref);
        if (!snapshot.exists) throw new Error(`postponed action '${key}' does not exist`);
        assert_status(key, snapshot.get("status"), [PostponedActionStatus.processing]);
        const now = new Date();
        transaction.update(ref, { status: PostponedActionStatus.completed, completed_at: now, updated_at: now });
    });
};

const fail_postponed_action_core = async (key: string, error: unknown): Promise<void> => {
    const ref = get_ref(key);
    await db.runTransaction(async (transaction) => {
        const snapshot = await transaction.get(ref);
        if (!snapshot.exists) throw new Error(`postponed action '${key}' does not exist`);
        assert_status(key, snapshot.get("status"), [PostponedActionStatus.processing]);
        const now = new Date();
        transaction.update(ref, {
            status: PostponedActionStatus.failed,
            failed_at: now,
            updated_at: now,
            error: error instanceof Error ? error.message : String(error),
        });
    });
    logger.error(`[PostponedActions] action '${key}' failed`, error);
};

const delete_postponed_action_core = async (key: string): Promise<void> => {
    await get_ref(key).delete();
};

const claim_postponed_action_core = async (key: string, action_type: string, now = new Date()): Promise<PostponedAction | null> => {
    validate_text(action_type, "action_type");
    const ref = get_ref(key);
    return db.runTransaction(async (transaction) => {
        const snapshot = await transaction.get(ref);
        if (!snapshot.exists || snapshot.get("status") !== PostponedActionStatus.pending || snapshot.get("action_type") !== action_type) {
            return null;
        }

        const action = to_postponed_action(snapshot);
        if (action.execute_at.getTime() > now.getTime()) return null;

        const claimed: PostponedAction = {
            ...action,
            status: PostponedActionStatus.processing,
            attempt_count: action.attempt_count + 1,
            started_at: now,
            updated_at: now,
        };
        transaction.update(ref, {
            status: claimed.status,
            attempt_count: claimed.attempt_count,
            started_at: now,
            updated_at: now,
        });
        return claimed;
    });
};

const claim_due_postponed_actions_core = async (action_type: string, limit = 100, now = new Date()): Promise<PostponedAction[]> => {
    validate_text(action_type, "action_type");
    if (!Number.isInteger(limit) || limit <= 0) {
        throw new Error("limit must be a positive integer");
    }

    const snapshot = await db
        .collection(POSTPONED_ACTIONS_COLLECTION)
        .where("action_type", "==", action_type)
        .where("status", "==", PostponedActionStatus.pending)
        .where("execute_at", "<=", now)
        .orderBy("execute_at")
        .limit(limit)
        .get();

    const claimed = await Promise.all(snapshot.docs.map((document) => claim_postponed_action_core(document.id, action_type, now)));
    return claimed.filter((action): action is PostponedAction => action !== null);
};

const with_error_logging = <Args extends unknown[], Result>(
    operation: string,
    action: (...args: Args) => Promise<Result>,
    get_key?: (...args: Args) => string | undefined
) => {
    return async (...args: Args): Promise<Result> => {
        try {
            return await action(...args);
        } catch (error) {
            const key = get_key?.(...args);
            logger.error(`[PostponedActions] ${operation} failed${key ? ` for '${key}'` : ""}`, error);
            throw error;
        }
    };
};

const get_postponed_action = with_error_logging("get", get_postponed_action_core, (key) => key);
const add_postponed_action = with_error_logging("add", add_postponed_action_core, (input) => input.key);
const update_postponed_action = with_error_logging("update", update_postponed_action_core, (key) => key);
const repostpone_postponed_action = with_error_logging("repostpone", repostpone_postponed_action_core, (key) => key);
const cancel_postponed_action = with_error_logging("cancel", cancel_postponed_action_core, (key) => key);
const complete_postponed_action = with_error_logging("complete", complete_postponed_action_core, (key) => key);
const fail_postponed_action = with_error_logging("mark as failed", fail_postponed_action_core, (key) => key);
const delete_postponed_action = with_error_logging("delete", delete_postponed_action_core, (key) => key);
const claim_postponed_action = with_error_logging("claim", claim_postponed_action_core, (key) => key);
const claim_due_postponed_actions = with_error_logging("claim due", claim_due_postponed_actions_core);

/**
 * @example Add an action for a specific date and time.
 * ```ts
 * await postponed_actions.add({
 *     key: "subscription:123:expire",
 *     action_type: "subscription_expiration",
 *     description: "Expire subscription 123",
 *     details: { subscription_id: "123", notify_customer: true },
 *     execute_at: new Date("2026-08-01T12:00:00Z"),
 * });
 * ```
 *
 * @example Add an action relative to the current time. Adding the same key
 * updates the pending action.
 * ```ts
 * await postponed_actions.add({
 *     key: "invoice:456:reminder",
 *     action_type: "invoice_reminder",
 *     description: "Send invoice 456 reminder",
 *     details: { invoice_id: "456" },
 *     execute_at: { hours: 2, minutes: 30 },
 * });
 * ```
 *
 * @example Update, repostpone, or cancel a pending action.
 * ```ts
 * await postponed_actions.update("invoice:456:reminder", {
 *     description: "Send the final invoice reminder",
 *     execute_at: { minutes: 15 },
 * });
 * await postponed_actions.repostpone("invoice:456:reminder", { hours: 1 });
 * await postponed_actions.cancel("invoice:456:reminder");
 * ```
 *
 * @example Claim and execute due actions. Claiming is atomic, so concurrent
 * workers cannot claim the same action.
 * ```ts
 * const actions = await postponed_actions.claim_due("invoice_reminder", 25);
 * for (const action of actions) {
 *     try {
 *         await execute_action(action.details);
 *         await postponed_actions.complete(action.key);
 *     } catch (error) {
 *         await postponed_actions.fail(action.key, error);
 *     }
 * }
 * ```
 */

export const postponed_actions = {
    get: get_postponed_action,
    add: add_postponed_action,
    update: update_postponed_action,
    repostpone: repostpone_postponed_action,
    cancel: cancel_postponed_action,
    complete: complete_postponed_action,
    fail: fail_postponed_action,
    delete: delete_postponed_action,
    claim: claim_postponed_action,
    claim_due: claim_due_postponed_actions,
};
