import { CacheManager } from "./managers";

declare global {
    namespace NodeJS {
        interface Global {
            cache_manager?: CacheManager;
        }
    }
}

export {};
