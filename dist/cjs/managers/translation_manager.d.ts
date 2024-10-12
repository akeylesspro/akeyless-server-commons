import { TObject } from "akeyless-types-commons";
import { TranslationOptions } from "../types";
export declare class TranslationManager {
    private static instance;
    private data;
    private constructor();
    static getInstance(): TranslationManager;
    setTranslationData(data: TObject<any>): void;
    getTranslationData(): TObject<any>;
    get_translation(scope: string, lang: string, entity: string, key: string): string;
    get_sms(key: string, options?: TranslationOptions): string;
    get_email(key: string, options?: TranslationOptions): string;
}
export declare const translation_manager: TranslationManager;
