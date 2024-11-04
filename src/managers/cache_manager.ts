import { TObject } from "akeyless-types-commons";

class CacheManager {
    private static instance: CacheManager;
    private data: TObject<any[]> | TObject<any> = {};

    private constructor() {}

    public static getInstance(): CacheManager {
        console.log("hello from get instance");

        if (!CacheManager.instance) {
            CacheManager.instance = new CacheManager();
        }
        return CacheManager.instance;
    }

    public setArrayData(key: string, data: any[]): void {
        this.data[key] = data;
    }

    public getArrayData(key: string): any[] {
        if (!this.data[key]) {
            return [];
        }

        return this.data[key];
    }

    public setObjectData(key: string, data: any): void {
        this.data[key] = data;
    }

    public getObjectData(key: string, default_value: any = null): any {
        return this.data[key] || default_value;
    }
}

const cache_manager: CacheManager = global.cache_manager || CacheManager.getInstance();
global.cache_manager = cache_manager;

const get_global_cache_manager = (): CacheManager => {
    console.log("hello from get_global_cache_manager");

    return global.cache_manager;
};

export { cache_manager, get_global_cache_manager };
