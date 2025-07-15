import { RedisUpdatePayload, RedisUpdateType, SocketCallbackResponse, SocketEventMap } from "akeyless-types-commons";
import { io, Socket } from "socket.io-client";
import { OnSnapshotCallback, OnSnapshotConfig } from "../types";
import { get_custom_fb_token, init_env_variables, initialize_firebase_client_app } from "../helpers";
import { logger } from "./logger_manager";

interface GetDataPayload<T = any> {
    key: string;
    collection_name: string;
    callback: (value: T) => void;
    default_value: T;
}
class SocketService {
    private static instance: SocketService;
    private socket: Socket<SocketEventMap> | null = null;
    private connect_callbacks: Array<() => void> = [];
    private disconnect_callbacks: Array<() => void> = [];
    private auth_token: string | null = null;
    private session_id: string | null = null;
    private constructor() {}

    /// Initialize the socket connection
    private init_socket(): void {
        if (!this.socket) {
            const { mode } = init_env_variables(["mode"]) || {};
            const is_qa = mode === "qa";
            const socket_server_url = is_qa ? "https://nx-api.xyz" : "https://nx-api.info";
            this.socket = io(socket_server_url, {
                path: "/api/data-socket/connect",
                auth: (cb: any) => {
                    const auth_payload: Record<string, string> = {};
                    if (this.auth_token) auth_payload.token = this.auth_token;
                    if (this.session_id) auth_payload.sessionId = this.session_id;
                    cb(auth_payload);
                },
                transports: ["websocket"],
                reconnection: true,
                reconnectionAttempts: 30,
                reconnectionDelay: 2 * 1000,
            });

            this.socket.on("connect", () => {
                logger.log(`🟢 Socket connected: ${this.socket?.id} (recovered - ${this.socket?.recovered})`);
                this.connect_callbacks.forEach((cb) => cb());
            });

            this.socket.on("disconnect", (reason: Socket.DisconnectReason) => {
                logger.log("Socket disconnected: " + reason);
                this.disconnect_callbacks.forEach((cb) => cb());
            });

            this.socket.on("session", ({ session_id }: { session_id: string }) => {
                if (session_id) {
                    this.session_id = session_id;
                }
            });

            this.socket.on("connect_error", (error: Error) => {
                console.error("Socket connection error:", error);
            });
        }
    }

    public static get_instance(): SocketService {
        if (!SocketService.instance) {
            SocketService.instance = new SocketService();
        }
        return SocketService.instance;
    }

    /// get socket instance
    public get_socket_instance(): Socket {
        if (!this.socket) {
            this.init_socket();
        }
        if (!this.socket) {
            throw new Error("Socket not initialized");
        }
        if (!this.socket.connected) {
            this.socket.connect();
        }
        return this.socket;
    }

    /// connection management methods

    public async start_session(session_id: string): Promise<Socket> {
        const token = await get_custom_fb_token(initialize_firebase_client_app());
        this.auth_token = token;
        this.session_id = session_id;
        return this.get_socket_instance();
    }

    public on_connect(callback: () => void): () => void {
        if (!this.connect_callbacks.includes(callback)) {
            this.connect_callbacks.push(callback);
        }
        if (this.socket?.connected) {
            callback();
        }
        return () => this.off_connect(callback);
    }

    public off_connect(callback: () => void): void {
        this.connect_callbacks = this.connect_callbacks.filter((cb) => cb !== callback);
    }

    public on_disconnect(callback: () => void): () => void {
        if (!this.disconnect_callbacks.includes(callback)) {
            this.disconnect_callbacks.push(callback);
        }
        if (this.socket && !this.socket.connected) {
            callback();
        }
        return () => this.off_disconnect(callback);
    }

    public off_disconnect(callback: () => void): void {
        this.disconnect_callbacks = this.disconnect_callbacks.filter((cb) => cb !== callback);
    }

    public is_connected(): boolean {
        return this.socket?.connected || false;
    }

    public set_auth_token(token: string): void {
        this.auth_token = token;
        if (this.socket) {
            this.socket.connect();
        }
    }

    public disconnect_socket(): void {
        if (this.socket) {
            logger.log("Manually disconnecting socket: " + this.socket.id);
            this.socket.io.engine.close();
        }
    }

    /// Get the current session ID
    public get_session_id(): string | null {
        return this.session_id;
    }

    /// Set the session ID (useful when restoring from persistent storage)
    public set_session_id(session_id: string | null): void {
        this.session_id = session_id;
    }

    /// subscribe to collections
    public subscribe_to_collections(config: OnSnapshotConfig[]): () => void {
        if (config.length === 0) {
            return () => {};
        }
        // Obtain socket instance but delay the first connection until listeners are attached.
        const s = this.get_socket_instance();
        const collection_names = config.map((c) => c.collection_name);

        const event_handlers: Array<{ event_name: string; handler: OnSnapshotCallback }> = [];

        config.forEach((configuration) => {
            const { collection_name, on_add, on_first_time, on_modify, on_remove, extra_parsers } = configuration;

            // Before attaching, make sure the specific handler is NOT already registered.
            const attach = (event_name: string, handler: OnSnapshotCallback | undefined) => {
                if (!handler) {
                    return;
                }
                this.socket!.off(event_name as any); // Remove all previous listeners
                this.socket!.on(event_name as any, handler);
                event_handlers.push({ event_name, handler });
            };

            attach(`initial:${collection_name}`, on_first_time);
            attach(`add:${collection_name}`, on_add);
            attach(`update:${collection_name}`, on_modify);
            attach(`delete:${collection_name}`, on_remove);

            extra_parsers?.forEach((parsers) => {
                const { on_add: extra_on_add, on_first_time: extra_on_first_time, on_modify: extra_on_modify, on_remove: extra_on_remove } = parsers;
                attach(`initial:${collection_name}`, extra_on_first_time);
                attach(`add:${collection_name}`, extra_on_add);
                attach(`update:${collection_name}`, extra_on_modify);
                attach(`delete:${collection_name}`, extra_on_remove);
            });
        });

        s.emit("subscribe_collections", collection_names, (callback: SocketCallbackResponse) => {
            if (callback.success) {
                logger.log(`Successfully subscribed to: ${collection_names.join(", ")}`);
            } else {
                console.error(`Failed to subscribe to ${collection_names.join(", ")}: ${callback.message}`);
            }
        });

        return () => {
            logger.log(`Cleaning up subscriptions for: ${collection_names.join(", ")}`);
            s.emit("unsubscribe_collections", collection_names);
            event_handlers.forEach((eh) => {
                s.off(eh.event_name, eh.handler);
            });
        };
    }

    /// set data
    public set_data<UpdateType extends RedisUpdateType, DataType = any>(
        payload: RedisUpdatePayload<UpdateType, DataType>
    ): Promise<SocketCallbackResponse> {
        const s = this.get_socket_instance();

        return new Promise((resolve, reject) => {
            s.emit("set_data", payload, (callback: SocketCallbackResponse) => {
                if (callback.success) {
                    logger.log("Data saved successfully:", payload);
                    logger.log("ack", callback);
                    resolve(callback);
                } else {
                    reject(new Error(callback.message || "Save operation failed"));
                }
            });
        });
    }

    /// get data
    public get_collection_data<T>(payload: Omit<GetDataPayload<T>, "key">): void {
        const s = this.get_socket_instance();
        s.emit("get_data", { collection_name: payload.collection_name }, (socket_callback: SocketCallbackResponse) => {
            if (socket_callback.success && socket_callback.data) {
                payload.callback(socket_callback.data as T);
            } else {
                payload.callback(payload.default_value);
            }
        });
    }

    public get_document_data<T>(payload: GetDataPayload<T>): void {
        const s = this.get_socket_instance();
        s.emit("get_data", { collection_name: payload.collection_name, key: payload.key }, (socket_callback: SocketCallbackResponse) => {
            if (socket_callback.success && socket_callback.data) {
                payload.callback(socket_callback.data as T);
            } else {
                payload.callback(payload.default_value);
            }
        });
    }

    /// delete data
    public delete_data(payload: { key: string; collection_name: string }): Promise<SocketCallbackResponse> {
        const s = this.get_socket_instance();
        return new Promise((resolve, reject) => {
            s.emit("delete_data", payload, (callback: SocketCallbackResponse) => {
                if (callback.success) {
                    logger.log("Data deleted successfully:", payload);
                    logger.log("delete ack", callback);
                    resolve(callback);
                } else {
                    reject(new Error(callback.message || "Delete operation failed"));
                }
            });
        });
    }
}

// Export a singleton instance of the service
export const socket_manager = SocketService.get_instance();
