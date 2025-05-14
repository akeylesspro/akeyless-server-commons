// import { TObject } from "akeyless-types-commons";

// export class CacheManager {
//     private static instance: CacheManager;
//     private data: TObject<any[]> | TObject<any> = {};

//     private constructor() {}

//     public static getInstance(): CacheManager {
//         if (!CacheManager.instance) {
//             CacheManager.instance = new CacheManager();
//         }
//         return CacheManager.instance;
//     }

//     public setArrayData(key: string, data: any[]): void {
//         this.data[key] = data;
//     }

//     public getArrayData(key: string): any[] {
//         if (!this.data[key]) {
//             return [];
//         }

//         return this.data[key];
//     }

//     public setObjectData(key: string, data: any): void {
//         this.data[key] = data;
//     }

//     public getObjectData(key: string, default_value: any = null): any {
//         return this.data[key] || default_value;
//     }
// }

// export const cache_manager: CacheManager = CacheManager.getInstance();

import { TObject } from "akeyless-types-commons";

export class CacheManager<T extends TObject<any> = TObject<any>> {
    private static instance: CacheManager<TObject<any>>;
    private data: T;

    private constructor() {
        this.data = {} as T;
    }
    /// singleton instance
    public static get_instance<U extends TObject<any>>(): CacheManager<U> {
        if (!CacheManager.instance) {
            CacheManager.instance = new CacheManager<U>();
        }
        return CacheManager.instance as CacheManager<U>;
    }

    /// set
    public set<K extends keyof T>(key: K, value: T[K] | T[K]): void;
    public set<K extends string>(key: K extends keyof T ? never : K, value: any): void;
    public set(key: string, value: any): void {
        (this.data as any)[key] = value;
    }

    /// get
    public get<K extends keyof T>(key: K): T[K];
    public get<K extends string = string, V = any>(key: K extends keyof T ? never : K, default_value?: V): typeof default_value;
    public get<K extends keyof T>(key: K, default_value: T[K]): T[K];
    public get(key: string, default_value?: any): any {
        const val = (this.data as any)[key];
        return val === undefined ? default_value : val;
    }

    /// old methods
    // public setArrayData(key: string, data: any[]): void {
    //     this.set(key, data as any);
    // }

    // public getArrayData(key: string): any[] {
    //     return this.get(key) ?? [];
    // }

    // public setObjectData(key: string, data: any): void {
    //     this.set(key, data);
    // }

    // public getObjectData(key: string, default_value: any = null): any {
    //     return this.get(key) ?? default_value;
    // }
}

export const default_cache_manager = CacheManager.get_instance();
