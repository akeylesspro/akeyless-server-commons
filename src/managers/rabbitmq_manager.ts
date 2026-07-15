import amqp, { type ChannelModel, type ConfirmChannel, type ConsumeMessage, type GetMessage, type Message } from "amqplib";
import { randomUUID as random_uuid } from "node:crypto";
import { logger } from "./logger_manager";

const SAFE_NAME = /^[A-Za-z0-9_.:-]{1,120}$/;

export type JsonValue = null | boolean | number | string | JsonValue[] | { [key: string]: JsonValue };

export type EventHeaderValue = string | number | boolean;

export interface RabbitEvent<T extends JsonValue = JsonValue> {
    body: T;
    event_id?: string;
    created_at?: string;
    redelivered: boolean;
    headers: Record<string, unknown>;
}

export interface PushEventOptions {
    /** RabbitMQ message time-to-live, in seconds. */
    ttl_seconds?: number;
    headers?: Record<string, EventHeaderValue>;
}

export interface SubscribeOptions {
    /** Requeue messages when the handler throws or rejects. Defaults to true. */
    requeue_on_error?: boolean;
}

export interface Subscription {
    queue_name: string;
    consumer_tag: string;
    cancel(): Promise<void>;
}

export type EventHandler<T extends JsonValue = JsonValue> = (event: RabbitEvent<T>) => void | Promise<void>;

/**
 * JSON event transport backed by durable fanout exchanges and durable queues.
 *
 * Each channel name maps to an exchange. Each distinct subscriber name gets a
 * queue and therefore its own copy of every event. Instances sharing the same
 * subscriber name compete for work, which supports horizontal scaling.
 */
export class RabbitManager {
    readonly prefetch_count: number = 10;
    private connection: ChannelModel | undefined;
    private channel: ConfirmChannel | undefined;
    private connecting: Promise<void> | undefined;

    constructor() {
        if (!(process.env.RABBITMQ_URL ?? "")) {
            logger.warn("Missing ENV parameter RABBITMQ_URL");
        }
    }

    async connect(): Promise<void> {
        if (this.connection && this.channel) return;

        this.connecting ??= this.open_connection().finally(() => {
            this.connecting = undefined;
        });
        await this.connecting;
    }

    async close(): Promise<void> {
        const channel = this.channel;
        const connection = this.connection;
        this.channel = undefined;
        this.connection = undefined;

        if (channel) await channel.close().catch(() => undefined);
        if (connection) await connection.close().catch(() => undefined);
    }

    async push_event<T extends JsonValue>(channel_name: string, payload: T, options: PushEventOptions = {}): Promise<string> {
        const channel = await this.declare_exchange(channel_name);
        const { ttl_seconds, headers = {} } = options;

        if (ttl_seconds !== undefined && (!Number.isFinite(ttl_seconds) || ttl_seconds <= 0)) {
            throw new Error("ttl_seconds must be a finite number greater than zero");
        }

        let encoded: string;
        try {
            encoded = JSON.stringify(payload);
        } catch (error) {
            throw new Error("payload must be JSON serializable", { cause: error });
        }
        if (encoded === undefined) throw new Error("payload must be JSON serializable");

        const event_id = random_uuid();
        const created_at = new Date().toISOString();
        channel.publish(channel_name, "", Buffer.from(encoded, "utf8"), {
            contentType: "application/json",
            contentEncoding: "utf-8",
            persistent: true,
            messageId: event_id,
            timestamp: Math.floor(Date.now() / 1_000),
            ...(ttl_seconds === undefined ? {} : { expiration: String(Math.round(ttl_seconds * 1_000)) }),
            headers: { created_at, ...headers },
        });
        await channel.waitForConfirms();
        return event_id;
    }

    private subscriptions: Subscription[] = [];

    async subscribe_for_channel<T extends JsonValue>(
        channel_name: string,
        subscriber_name: string,
        handler: EventHandler<T>,
        options: SubscribeOptions = {}
    ): Promise<Subscription> {
        const { channel, queue_name } = await this.declare_subscription(channel_name, subscriber_name);
        const requeue_on_error = options.requeue_on_error ?? true;

        const reply = await channel.consume(
            queue_name,
            (message) => {
                if (!message) return;
                void this.handle_message(channel, message, handler, requeue_on_error);
            },
            { noAck: false }
        );

        const subscription = {
            queue_name,
            consumer_tag: reply.consumerTag,
            cancel: async () => {
                await channel.cancel(reply.consumerTag);
            },
        };
        this.subscriptions.push(subscription);

        return subscription;
    }

    async cancel_subscriptions(): Promise<void> {
        await Promise.all(this.subscriptions.map((subscription) => subscription.cancel()));
    }

    async pull_and_delete<T extends JsonValue>(channel_name: string, subscriber_name: string): Promise<RabbitEvent<T> | undefined> {
        const { channel, queue_name } = await this.declare_subscription(channel_name, subscriber_name);
        const message = await channel.get(queue_name, { noAck: false });
        if (!message) return undefined;

        const event = this.to_event<T>(message);
        channel.ack(message);
        return event;
    }

    /**
     * Diagnostic peek implemented as get + nack + requeue.
     * It is not a reliable queue browser: the same event can repeat or move.
     */
    async pull_and_leave<T extends JsonValue>(channel_name: string, subscriber_name: string): Promise<RabbitEvent<T> | undefined> {
        const { channel, queue_name } = await this.declare_subscription(channel_name, subscriber_name);
        const message = await channel.get(queue_name, { noAck: false });
        if (!message) return undefined;

        const event = this.to_event<T>(message);
        channel.nack(message, false, true);
        return event;
    }

    private async open_connection(): Promise<void> {
        const connection_url = new URL(process.env.RABBITMQ_URL!);
        if (!connection_url.searchParams.has("heartbeat")) {
            connection_url.searchParams.set("heartbeat", "30");
        }
        const connection = await amqp.connect(connection_url.toString(), { timeout: 30_000 });
        const channel = await connection.createConfirmChannel();
        await channel.prefetch(this.prefetch_count);
        this.connection = connection;
        this.channel = channel;
    }

    private async get_channel(): Promise<ConfirmChannel> {
        await this.connect();
        if (!this.channel) throw new Error("RabbitMQ channel is not available");
        return this.channel;
    }

    private async declare_exchange(channel_name: string): Promise<ConfirmChannel> {
        this.validate_name(channel_name, "channel_name");
        const channel = await this.get_channel();
        await channel.assertExchange(channel_name, "fanout", { durable: true });
        return channel;
    }

    private async declare_subscription(channel_name: string, subscriber_name: string): Promise<{ channel: ConfirmChannel; queue_name: string }> {
        this.validate_name(channel_name, "channel_name");
        this.validate_name(subscriber_name, "subscriber_name");
        const channel = await this.declare_exchange(channel_name);
        const queue_name = `${channel_name}.${subscriber_name}`;
        await channel.assertQueue(queue_name, { durable: true });
        await channel.bindQueue(queue_name, channel_name, "");
        return { channel, queue_name };
    }

    private async handle_message<T extends JsonValue>(
        channel: ConfirmChannel,
        message: ConsumeMessage,
        handler: EventHandler<T>,
        requeue_on_error: boolean
    ): Promise<void> {
        try {
            await handler(this.to_event<T>(message));
            channel.ack(message);
        } catch (error) {
            console.error(`RabbitMQ handler failed for ${message.properties.messageId ?? "unknown"}`, error);
            channel.nack(message, false, requeue_on_error);
        }
    }

    private to_event<T extends JsonValue>(message: ConsumeMessage | GetMessage): RabbitEvent<T> {
        let body: T;
        try {
            body = JSON.parse(message.content.toString("utf8")) as T;
        } catch (error) {
            throw new Error("received a message that is not valid JSON", { cause: error });
        }

        const headers: Record<string, unknown> = { ...message.properties.headers };
        const created_at = headers.created_at;
        return {
            body,
            redelivered: message.fields.redelivered,
            headers,
            ...(message.properties.messageId ? { event_id: message.properties.messageId } : {}),
            ...(typeof created_at === "string" ? { created_at } : {}),
        };
    }

    private validate_name(value: string, parameter: string): void {
        if (!SAFE_NAME.test(value)) {
            throw new Error(`${parameter} must be 1-120 characters using letters, digits, _, ., :, or -`);
        }
    }
}

export const rabbitmq = new RabbitManager();
