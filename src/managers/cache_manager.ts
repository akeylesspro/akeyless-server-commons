import { TObject } from "../types";

class CacheManager {
    private static instance: CacheManager;
    private data: TObject<any[]> | TObject<any> = {};

    private constructor() {}

    public static getInstance(): CacheManager {
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

export const cache_manager = CacheManager.getInstance();
