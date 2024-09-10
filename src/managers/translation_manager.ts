import { TObject } from "../types";

export class TranslationManager {
    private static instance: TranslationManager;
    private data: TObject<any> = {};
    private constructor() {}
    public static getInstance(): TranslationManager {
        if (!TranslationManager.instance) {
            TranslationManager.instance = new TranslationManager();
        }
        return TranslationManager.instance;
    }
    public setTranslation(data: TObject<any>): void {
        this.data = data;
    }
    public get_translation(scope: string, lang: string, entity: string, key: string): string {
        return this.data[scope][lang][entity + "__" + key] || "N/A";
    }
    public get_sms(key: string): string {
        return this.data["sms"]["he"]["nx_devices__" + key] || "N/A";
    }
}

export const translation_manager = TranslationManager.getInstance();
