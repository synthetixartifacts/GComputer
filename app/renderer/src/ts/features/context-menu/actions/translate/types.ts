/**
 * Translate Action Types
 */

export interface TranslateOptions {
  targetLanguage?: string;
  sourceLanguage?: string;
  preserveFormatting?: boolean;
}

export interface TranslateResult {
  originalText: string;
  translatedText: string;
  sourceLanguage?: string;
  targetLanguage?: string;
}