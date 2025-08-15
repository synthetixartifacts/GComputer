<?php

namespace App\Trait;

trait ArrayToolTrait
{
    /**
     * Recursively replaces occurrences of a key with a value in an array
     */
    public function replaceKeyByValue(array $data = [], string $key = '', mixed $value = null): array
    {
        foreach ($data as $k => $v) {
            if (is_array($v)) {
                $data[$k] = $this->replaceKeyByValue($v, $key, $value);
            } elseif (is_string($v) && str_contains($v, $key)) {
                if ($v === $key) {
                    $data[$k] = $value;
                } else {
                    $stringValue = (string) $value;
                    $data[$k] = str_replace($key, $stringValue, $v);
                }
            }
        }

        return $data;
    }

    /**
     * Extracts a nested value from an array using a dot notation path
     */
    public function extractNestedValue(array $array, string $path): string
    {
        try {
            $keys  = preg_split('/\[|\]\.|]|\./i', $path);
            $value = $array;

            foreach ($keys as $key) {
                if ($key === '') {
                    continue;
                }

                if (is_array($value) && array_key_exists($key, $value)) {
                    $value = $value[$key];
                } elseif (is_object($value) && property_exists($value, $key)) {
                    $value = $value->$key;
                } else {
                    return '';
                }
            }

            return is_scalar($value) ? (string)$value : 'Invalid response value';
        } catch (\Throwable $e) {
            return '';
        }
    }

    /**
     * Creates a nested array structure from a path string with a message value
     */
    private function createResponseFromPath(string $message, string $location): array
    {
        $paths = explode('|', $location);

        // Use the first path as the primary structure
        $path   = trim($paths[0]);
        $keys   = preg_split('/\[|\]\.|\.|](?!\.)/', $path);
        $result = [];

        $current = &$result;
        foreach ($keys as $i => $key) {
            if ($key === '') {
                continue;
            }

            if ($i === count($keys) - 1) {
                $current[$key] = $message;
            } else {
                $current[$key] = [];
                $current = &$current[$key];
            }
        }

        return $result;
    }
}