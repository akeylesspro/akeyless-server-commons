import { TObject } from "akeyless-types-commons";
import { EntityOptions, LangOptions } from "../types";
export declare class TranslationManager {
    private static instance;
    private data;
    private constructor();
    static getInstance(): TranslationManager;
    setTranslationData(data: TObject<any>): void;
    getTranslationData(): TObject<any>;
    get_translation(scope: string, lang: string, entity: string, key: string): string;
    get_sms(lang: LangOptions, entity: EntityOptions, key: string): string;
    get_email(lang: LangOptions, entity: EntityOptions, key: string): string;
}
export declare const translation_manager: TranslationManager;
