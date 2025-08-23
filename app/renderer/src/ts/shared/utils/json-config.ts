/**
 * JSON configuration parsing utilities
 * Provides safe JSON parsing and stringifying with error handling
 */

/**
 * Safely parse JSON string
 * @param jsonString - JSON string to parse
 * @param fallback - Fallback value if parsing fails
 * @returns Parsed object or fallback
 */
export function safeJsonParse<T = any>(jsonString: string, fallback: T): T {
  try {
    return JSON.parse(jsonString);
  } catch (error) {
    console.error('Failed to parse JSON:', error);
    return fallback;
  }
}

/**
 * Safely stringify object to JSON
 * @param obj - Object to stringify
 * @param replacer - Optional replacer function
 * @param space - Optional spacing for formatting
 * @returns JSON string or empty string on error
 */
export function safeJsonStringify(
  obj: unknown,
  replacer?: (key: string, value: any) => any,
  space?: string | number
): string {
  try {
    return JSON.stringify(obj, replacer, space);
  } catch (error) {
    console.error('Failed to stringify JSON:', error);
    return '';
  }
}

/**
 * Parse configuration string (JSON or fallback to empty object)
 * @param configString - Configuration string
 * @returns Parsed configuration object
 */
export function parseConfiguration(configString: string | null | undefined): Record<string, any> {
  if (!configString || configString.trim() === '') {
    return {};
  }
  return safeJsonParse(configString, {});
}

/**
 * Stringify configuration object with formatting
 * @param config - Configuration object
 * @returns Formatted JSON string
 */
export function stringifyConfiguration(config: Record<string, any>): string {
  return safeJsonStringify(config, undefined, 2);
}