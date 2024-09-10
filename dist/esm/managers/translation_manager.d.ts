import { TObject } from "../types";
export declare class TranslationManager {
    private static instance;
    private data;
    private constructor();
    static getInstance(): TranslationManager;
    setTranslation(data: TObject<any>): void;
    get_translation(scope: string, lang: string, entity: string, key: string): string;
    get_sms(key: string): string;
}
export declare const translation_manager: TranslationManager;
