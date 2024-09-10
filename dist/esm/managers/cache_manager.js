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
export const cache_manager = CacheManager.getInstance();
//# sourceMappingURL=cache_manager.js.map