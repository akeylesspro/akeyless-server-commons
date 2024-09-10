declare class CacheManager {
    private static instance;
    private data;
    private constructor();
    static getInstance(): CacheManager;
    setArrayData(key: string, data: any[]): void;
    getArrayData(key: string): any[];
    setObjectData(key: string, data: any): void;
    getObjectData(key: string, default_value?: any): any;
}
export declare const cache_manager: CacheManager;
export {};
