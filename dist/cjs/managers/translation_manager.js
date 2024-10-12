"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.translation_manager = exports.TranslationManager = void 0;
class TranslationManager {
    constructor() {
        this.data = {};
    }
    static getInstance() {
        if (!TranslationManager.instance) {
            TranslationManager.instance = new TranslationManager();
        }
        return TranslationManager.instance;
    }
    setTranslationData(data) {
        this.data = data;
    }
    getTranslationData() {
        return this.data;
    }
    get_translation(scope, lang, entity, key) {
        return this.data[scope][lang][entity + "__" + key] || "N/A";
    }
    get_sms(key, options) {
        return this.data["sms"][(options === null || options === void 0 ? void 0 : options.lang) || "he"][(options === null || options === void 0 ? void 0 : options.entity) || "nx_devices" + "__" + key] || "N/A";
    }
    get_email(key, options) {
        return this.data["email"][(options === null || options === void 0 ? void 0 : options.lang) || "he"][(options === null || options === void 0 ? void 0 : options.entity) || "nx_devices" + "__" + key] || "N/A";
    }
}
exports.TranslationManager = TranslationManager;
exports.translation_manager = TranslationManager.getInstance();
//# sourceMappingURL=translation_manager.js.map