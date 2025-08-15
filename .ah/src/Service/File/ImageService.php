<?php

namespace App\Service\File;

use App\Entity\File;


class ImageService
{
    private const STANDARD_FORMATS = [
        // OpenAI Vision optimized formats (based on GPT-4 Vision best practices)
        // Landscape formats - optimized for screenshots and wide content
        '16:9' => ['width' => 1456, 'height' => 819],   // ~1.78 - Screenshots, widescreen
        '3:2'  => ['width' => 1152, 'height' => 768],   // ~1.50 - Classic photo landscape
        '4:3'  => ['width' => 1024, 'height' => 768],   // ~1.33 - Classic monitor
        '5:4'  => ['width' => 960, 'height' => 768],    // ~1.25 - Closer to square landscape

        // Square format
        '1:1'  => ['width' => 768, 'height' => 768],    // 1.00 - Perfect square

        // Portrait formats
        '4:5'  => ['width' => 768, 'height' => 960],    // ~0.80 - Slight portrait
        '3:4'  => ['width' => 768, 'height' => 1024],   // ~0.75 - Standard portrait
        '2:3'  => ['width' => 768, 'height' => 1152],   // ~0.67 - Classic photo portrait
        '9:16' => ['width' => 819, 'height' => 1456],   // ~0.56 - Mobile portrait
    ];

    // Threshold for considering an image close enough to square to avoid cropping
    private const SQUARE_THRESHOLD = 0.05;

    public const IMAGE_MIME_TYPES = [
        'image/jpeg',
        'image/png',
        'image/gif',
        'image/webp'
    ];

    public function resizeImage(string $filePath): void
    {
        list($originalWidth, $originalHeight) = getimagesize($filePath);

        if ($originalWidth === false || $originalHeight === false) {
            throw new \Exception('Unable to determine image dimensions');
        }

        $originalRatio = $originalWidth / $originalHeight;

        // Find the best matching format
        $bestFormat    = $this->findBestFormat($originalRatio);
        $newDimensions = self::STANDARD_FORMATS[$bestFormat];

        // Create new image
        $sourceImage = $this->createImageFromFile($filePath);
        $newImage    = imagecreatetruecolor($newDimensions['width'], $newDimensions['height']);

        // Preserve transparency for PNG images
        if (mime_content_type($filePath) === 'image/png') {
            imagealphablending($newImage, false);
            imagesavealpha($newImage, true);
        }

        // Calculate scaling and positioning for center crop
        $sourceX      = 0;
        $sourceY      = 0;
        $sourceWidth  = $originalWidth;
        $sourceHeight = $originalHeight;

        $targetRatio = $newDimensions['width'] / $newDimensions['height'];

        // Only crop if ratios are significantly different (avoid precision issues)
        if (abs($originalRatio - $targetRatio) > 0.001) {
            if ($originalRatio > $targetRatio) {
                // Original is wider than target - crop width
                $sourceWidth = round($originalHeight * $targetRatio);
                $sourceX     = round(($originalWidth - $sourceWidth) / 2);
            } else {
                // Original is taller than target - crop height
                $sourceHeight = round($originalWidth / $targetRatio);
                $sourceY      = round(($originalHeight - $sourceHeight) / 2);
            }
        }

        // Resize and crop
        imagecopyresampled(
            $newImage,
            $sourceImage,
            0,
            0,
            $sourceX,
            $sourceY,
            $newDimensions['width'],
            $newDimensions['height'],
            $sourceWidth,
            $sourceHeight
        );

        // Save image
        $this->saveImage($newImage, $filePath);

        // Free memory
        imagedestroy($sourceImage);
        imagedestroy($newImage);
    }

    public function findBestFormat(float $originalRatio): string
    {
        $closestDiff = PHP_FLOAT_MAX;
        $bestFormat  = null;

        // For debugging - you can remove this in production
        $formatAnalysis = [];

        foreach (self::STANDARD_FORMATS as $format => $dimensions) {
            $formatRatio = $dimensions['width'] / $dimensions['height'];
            $diff = abs($formatRatio - $originalRatio);

            $formatAnalysis[$format] = [
                'ratio' => $formatRatio,
                'diff' => $diff
            ];

            if ($diff < $closestDiff) {
                $closestDiff = $diff;
                $bestFormat = $format;
            }
        }

        // If no format was found (shouldn't happen), intelligently default
        if ($bestFormat === null) {
            $bestFormat = $this->getIntelligentDefault($originalRatio);
        }

        // Additional validation: if we're defaulting to square but there's a much better landscape/portrait option
        if ($bestFormat === '1:1' && $closestDiff > self::SQUARE_THRESHOLD) {
            $alternativeFormat = $this->getIntelligentDefault($originalRatio);
            if ($alternativeFormat !== '1:1') {
                $bestFormat = $alternativeFormat;
            }
        }

        return $bestFormat;
    }

    private function getIntelligentDefault(float $originalRatio): string
    {
        // Landscape images (ratio > 1.0)
        if ($originalRatio > 1.0) {
            if ($originalRatio >= 1.7) {
                return '16:9';  // Wide landscape like screenshots
            } elseif ($originalRatio >= 1.4) {
                return '3:2';   // Standard landscape
            } elseif ($originalRatio >= 1.15) {
                return '4:3';   // Classic monitor
            } else {
                return '5:4';   // Slight landscape
            }
        }
        // Portrait images (ratio < 1.0)
        elseif ($originalRatio < 1.0) {
            if ($originalRatio <= 0.6) {
                return '9:16';  // Mobile portrait
            } elseif ($originalRatio <= 0.7) {
                return '2:3';   // Photo portrait
            } elseif ($originalRatio <= 0.8) {
                return '3:4';   // Standard portrait
            } else {
                return '4:5';   // Slight portrait
            }
        }
        // Very close to square (within threshold)
        else {
            return '1:1';
        }
    }

    public function saveImage($image, string $filePath): void
    {
        $mimeType = mime_content_type($filePath);
        match($mimeType) {
            'image/jpeg' => imagejpeg($image, $filePath, 90),
            'image/png'  => imagepng($image, $filePath, 9),
            'image/gif'  => imagegif($image, $filePath),
            'image/webp' => imagewebp($image, $filePath, 90),
            default      => throw new \Exception('Unsupported image type: ' . $mimeType),
        };
    }

    public function createImageFromFile(string $filePath)
    {
        $mimeType = mime_content_type($filePath);
        return match($mimeType) {
            'image/jpeg' => imagecreatefromjpeg($filePath),
            'image/png'  => imagecreatefrompng($filePath),
            'image/gif'  => imagecreatefromgif($filePath),
            'image/webp' => imagecreatefromwebp($filePath),
            default      => throw new \Exception('Unsupported image type: ' . $mimeType),
        };
    }
}