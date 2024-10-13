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
    get_sms(lang, entity, key) {
        try {
            return this.data["sms"][lang][entity + "__" + key];
        }
        catch (error) {
            return "N/A";
        }
    }
    get_email(lang, entity, key) {
        try {
            return this.data["email"][lang][entity + "__" + key];
        }
        catch (error) {
            return "N/A";
        }
    }
}
exports.TranslationManager = TranslationManager;
exports.translation_manager = TranslationManager.getInstance();
//# sourceMappingURL=translation_manager.js.map