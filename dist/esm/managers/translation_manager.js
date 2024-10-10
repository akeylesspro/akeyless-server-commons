export class TranslationManager {
    constructor() {
        this.data = {};
    }
    static getInstance() {
        if (!TranslationManager.instance) {
            TranslationManager.instance = new TranslationManager();
        }
        return TranslationManager.instance;
    }
    setTranslation(data) {
        this.data = data;
    }
    get_translation(scope, lang, entity, key) {
        return this.data[scope][lang][entity + "__" + key] || "N/A";
    }
    get_sms(key) {
        return this.data["sms"]["he"]["nx_devices__" + key] || "N/A";
    }
    get_email(key) {
        return this.data["email"]["he"]["nx_devices__" + key] || "N/A";
    }
}
export const translation_manager = TranslationManager.getInstance();
//# sourceMappingURL=translation_manager.js.map