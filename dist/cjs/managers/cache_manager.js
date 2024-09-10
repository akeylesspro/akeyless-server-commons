"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.cache_manager = void 0;
class CacheManager {
    constructor() {
        this.data = {};
    }
    static getInstance() {
        if (!CacheManager.instance) {
            CacheManager.instance = new CacheManager();
        }
        return CacheManager.instance;
    }
    setArrayData(key, data) {
        this.data[key] = data;
    }
    getArrayData(key) {
        if (!this.data[key]) {
            return [];
        }
        return this.data[key];
    }
    setObjectData(key, data) {
        this.data[key] = data;
    }
    getObjectData(key, default_value = null) {
        return this.data[key] || default_value;
    }
}
exports.cache_manager = CacheManager.getInstance();
//# sourceMappingURL=cache_manager.js.map