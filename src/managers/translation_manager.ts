import { TObject } from "akeyless-types-commons";
import { EntityOptions, LangOptions } from "../types";

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
    public setTranslationData(data: TObject<any>): void {
        this.data = data;
    }
    public getTranslationData(): TObject<any> {
        return this.data;
    }
    public get_translation(scope: string, lang: string, entity: string, key: string): string {
        key = entity + (entity === "" ? "" : "__") + key;
        return this.data[scope][lang][key] || key;
    }
    public get_sms(lang: LangOptions, entity: EntityOptions, key: string): string {
        try {
            return this.data["sms"][lang][entity + "__" + key];
        } catch (error) {
            return "N/A";
        }
    }
    public get_email(lang: LangOptions, entity: EntityOptions, key: string): string {
        try {
            return this.data["email"][lang][entity + "__" + key];
        } catch (error) {
            return "N/A";
        }
    }
}

export const translation_manager = TranslationManager.getInstance();
