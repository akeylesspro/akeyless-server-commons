import { RedisUpdatePayload, RedisUpdateType, SocketCallbackResponse, SocketEventMap } from "akeyless-types-commons";
import { io, Socket } from "socket.io-client";
import { OnSnapshotCallback, OnSnapshotConfig } from "../types";
import { init_env_variables } from "../helpers";

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

    private init_socket(): void {
        if (!this.socket) {
            const { socket_server_url } = init_env_variables(["socket_server_url"]);
            this.socket = io(socket_server_url, {
                path: "/api/data-socket/connect",
                transports: ["websocket"],
            });

            this.socket.on("connect", () => {
                console.log("Socket connected:", this.socket?.id);
                this.connect_callbacks.forEach((cb) => cb());
            });

            this.socket.on("disconnect", (reason: Socket.DisconnectReason) => {
                console.log("Socket disconnected:", reason);
                this.disconnect_callbacks.forEach((cb) => cb());
            });

            this.socket.on("connect_error", (error: Error) => {
                console.error("Socket connection error:", error);
            });
        }
    }

    private constructor() {}

    public static get_instance(): SocketService {
        if (!SocketService.instance) {
            SocketService.instance = new SocketService();
        }
        return SocketService.instance;
    }

    private get_socket_instance(): Socket {
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

    public subscribe_to_collections(config: OnSnapshotConfig[]): () => void {
        this.init_socket();
        const socket = this.get_socket_instance();
        const collection_names = config.map((c) => c.collection_name);

        const event_handlers: Array<{
            event_name: string;
            handler: OnSnapshotCallback;
        }> = [];

        config.forEach((configuration) => {
            const { collection_name, on_add, on_first_time, on_modify, on_remove, extra_parsers } = configuration;
            if (on_first_time) {
                socket.on(`initial:${collection_name}`, on_first_time);
                event_handlers.push({
                    event_name: `initial:${collection_name}`,
                    handler: on_first_time,
                });
            }
            if (on_add) {
                socket.on(`add:${collection_name}`, on_add);
                event_handlers.push({
                    event_name: `add:${collection_name}`,
                    handler: on_add,
                });
            }
            if (on_modify) {
                socket.on(`update:${collection_name}`, on_modify);
                event_handlers.push({
                    event_name: `update:${collection_name}`,
                    handler: on_modify,
                });
            }
            if (on_remove) {
                socket.on(`delete:${collection_name}`, on_remove);
                event_handlers.push({
                    event_name: `delete:${collection_name}`,
                    handler: on_remove,
                });
            }

            extra_parsers?.forEach((parsers) => {
                const { on_add: extra_on_add, on_first_time: extra_on_first_time, on_modify: extra_on_modify, on_remove: extra_on_remove } = parsers;
                if (extra_on_first_time) {
                    socket.on(`initial:${collection_name}`, extra_on_first_time);
                    event_handlers.push({
                        event_name: `initial:${collection_name}`,
                        handler: extra_on_first_time,
                    });
                }
                if (extra_on_add) {
                    socket.on(`add:${collection_name}`, extra_on_add);
                    event_handlers.push({
                        event_name: `add:${collection_name}`,
                        handler: extra_on_add,
                    });
                }
                if (extra_on_modify) {
                    socket.on(`update:${collection_name}`, extra_on_modify);
                    event_handlers.push({
                        event_name: `update:${collection_name}`,
                        handler: extra_on_modify,
                    });
                }
                if (extra_on_remove) {
                    socket.on(`delete:${collection_name}`, extra_on_remove);
                    event_handlers.push({
                        event_name: `delete:${collection_name}`,
                        handler: extra_on_remove,
                    });
                }
            });
        });

        socket.emit("subscribe_collections", collection_names, (callback: SocketCallbackResponse) => {
            if (callback.success) {
                console.log(`Successfully subscribed to: ${collection_names.join(", ")}`);
            } else {
                console.error(`Failed to subscribe: ${callback.message}`);
            }
        });

        return () => {
            console.log(`Cleaning up subscriptions for: ${collection_names.join(", ")}`);
            socket.emit("unsubscribe_collections", collection_names);
            event_handlers.forEach((eh) => {
                socket.off(eh.event_name, eh.handler);
            });
        };
    }

    public set_data<UpdateType extends RedisUpdateType, DataType = any>(
        payload: RedisUpdatePayload<UpdateType, DataType>
    ): Promise<SocketCallbackResponse> {
        const socket = this.get_socket_instance();

        return new Promise((resolve, reject) => {
            socket.emit("set_data", payload, (callback: SocketCallbackResponse) => {
                if (callback.success) {
                    console.log("Data saved successfully:", payload);
                    resolve(callback);
                } else {
                    reject(new Error(callback.message || "Save operation failed"));
                }
            });
        });
    }

    public get_collection_data<T>(payload: Omit<GetDataPayload<T>, "key">): void {
        const socket = this.get_socket_instance();
        socket.emit("get_data", { collection_name: payload.collection_name }, (callback: SocketCallbackResponse) => {
            if (callback.success && callback.data) {
                payload.callback(callback.data as T);
            } else {
                payload.callback(payload.default_value);
            }
        });
    }

    public get_document_data<T>(payload: GetDataPayload<T>): void {
        const socket = this.get_socket_instance();
        socket.emit("get_data", { collection_name: payload.collection_name, key: payload.key }, (callback: SocketCallbackResponse) => {
            if (callback.success && callback.data) {
                payload.callback(callback.data as T);
            } else {
                payload.callback(payload.default_value);
            }
        });
    }

    public delete_data(payload: { key: string; collection_name: string }): Promise<SocketCallbackResponse> {
        const socket = this.get_socket_instance();
        return new Promise((resolve, reject) => {
            socket.emit("delete_data", payload, (callback: SocketCallbackResponse) => {
                if (callback.success) {
                    console.log("Data deleted successfully:", payload);
                    resolve(callback);
                } else {
                    reject(new Error(callback.message || "Delete operation failed"));
                }
            });
        });
    }

    public clear_all_redis_data(): Promise<SocketCallbackResponse> {
        const socket = this.get_socket_instance();
        return new Promise((resolve, reject) => {
            socket.emit("clear_all_redis_data", (callback: SocketCallbackResponse) => {
                if (callback.success) {
                    resolve(callback);
                } else {
                    reject(new Error(callback.message || "Clear all Redis data operation failed"));
                }
            });
        });
    }

    public on_connect(callback: () => void): void {
        this.connect_callbacks.push(callback);
        if (this.socket?.connected) {
            callback();
        }
    }

    public off_connect(callback: () => void): void {
        this.connect_callbacks = this.connect_callbacks.filter((cb) => cb !== callback);
    }

    public on_disconnect(callback: () => void): void {
        this.disconnect_callbacks.push(callback);
        if (this.socket && !this.socket.connected) {
            callback();
        }
    }

    public off_disconnect(callback: () => void): void {
        this.disconnect_callbacks = this.disconnect_callbacks.filter((cb) => cb !== callback);
    }

    public is_connected(): boolean {
        return this.socket?.connected || false;
    }
}

export const socket_manager = SocketService.get_instance();
