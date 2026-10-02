import { MEB_ESER_DICT, type EserInfo } from './edebiyat-eser-dict.ts';
import { MEB_YAZAR_DICT, type YazarInfo } from './edebiyat-yazar-dict.ts';

export type EdebiyatEntity = EserInfo | YazarInfo;

export { MEB_ESER_DICT, type EserInfo };
export { MEB_YAZAR_DICT, type YazarInfo };
