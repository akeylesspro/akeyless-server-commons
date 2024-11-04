import { TObject } from 'akeyless-types-commons';

declare const cache_manager: any;

type LangOptions = "he" | "en" | "ru" | (string & {});
type EntityOptions = "nx_devices" | (string & {});

declare class TranslationManager {
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
declare const translation_manager: TranslationManager;

declare class LoggerManager {
    private static instance;
    private constructor();
    static getInstance(): LoggerManager;
    private get_date;
    log(msg: string, data?: TObject<any> | any[]): void;
    error(msg: string, data?: any): void;
    warn(msg: string, data?: any): void;
}
declare const logger: LoggerManager;

export { TranslationManager, cache_manager, logger, translation_manager };
