import type { AdminFieldConfig, RelationshipConfig } from './types';

/**
 * Generic utilities for handling relationship fields
 * Provides clean, reusable functions for relationship data extraction and management
 */

/**
 * Extracts relationship value from entity data based on field configuration
 * @param data The entity data object
 * @param field The field configuration with relationship settings
 * @returns The relationship value (ID) or empty string if not found
 */
export function extractRelationshipValue<T extends Record<string, any>>(
  data: T | null | undefined,
  field: AdminFieldConfig<T>
): string | number {
  if (!data || !field.relationship) {
    return '';
  }

  const { entityKey, valueField } = field.relationship;
  
  // First, try to get the direct ID field value (e.g., data.providerId)
  const directValue = data[field.id];
  if (directValue !== undefined && directValue !== null && directValue !== '') {
    return directValue;
  }
  
  // Then, try to extract from nested relationship object (e.g., data.provider.id)
  const nestedEntity = data[entityKey];
  if (nestedEntity && typeof nestedEntity === 'object' && nestedEntity[valueField] !== undefined) {
    return nestedEntity[valueField];
  }
  
  return '';
}

/**
 * Extracts relationship label from entity data based on field configuration
 * @param data The entity data object
 * @param field The field configuration with relationship settings
 * @returns The relationship label or 'Unknown' if not found
 */
export function extractRelationshipLabel<T extends Record<string, any>>(
  data: T | null | undefined,
  field: AdminFieldConfig<T>
): string {
  if (!data || !field.relationship) {
    return 'Unknown';
  }

  const { entityKey, labelField } = field.relationship;
  
  // Try to extract from nested relationship object (e.g., data.provider.name)
  const nestedEntity = data[entityKey];
  if (nestedEntity && typeof nestedEntity === 'object' && nestedEntity[labelField]) {
    return String(nestedEntity[labelField]);
  }
  
  return 'Unknown';
}

/**
 * Checks if a field is a relationship field
 * @param field The field configuration
 * @returns True if the field is a relationship field
 */
export function isRelationshipField<T>(field: AdminFieldConfig<T>): boolean {
  return field.type === 'relationship' && field.relationship !== undefined;
}

/**
 * Prepares form data by extracting relationship values from entity data
 * @param data The raw entity data
 * @param fields The field configurations
 * @returns Form data with properly extracted relationship values
 */
export function prepareFormData<T extends Record<string, any>>(
  data: T | null | undefined,
  fields: AdminFieldConfig<T>[]
): Record<string, any> {
  const formData: Record<string, any> = {};
  
  fields.forEach(field => {
    if (field.showInForm === false) return;
    
    const fieldKey = field.id;
    
    if (isRelationshipField(field)) {
      // For relationship fields, extract the relationship value
      formData[fieldKey] = extractRelationshipValue(data, field);
    } else {
      // For regular fields, use the direct value
      formData[fieldKey] = data?.[fieldKey] ?? field.defaultValue ?? getDefaultValueForType(field.type);
    }
  });
  
  return formData;
}

/**
 * Gets default value for a field type
 * @param type The field type
 * @returns Default value for the type
 */
export function getDefaultValueForType(type?: string): any {
  switch (type) {
    case 'number': return null;
    case 'boolean': return false;
    case 'text':
    case 'email':
    case 'url':
    case 'textarea':
    case 'relationship': return '';
    default: return '';
  }
}

/**
 * Validates that a relationship field has proper configuration
 * @param field The field configuration
 * @returns True if the relationship field is properly configured
 */
export function validateRelationshipField<T>(field: AdminFieldConfig<T>): boolean {
  if (field.type !== 'relationship') return true;
  
  if (!field.relationship) {
    console.warn(`Relationship field '${field.id}' missing relationship configuration`);
    return false;
  }
  
  const { entityKey, valueField, labelField } = field.relationship;
  
  if (!entityKey || !valueField || !labelField) {
    console.warn(`Relationship field '${field.id}' has incomplete relationship configuration`);
    return false;
  }
  
  return true;
}