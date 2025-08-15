<?php

namespace App\Service\File;

use App\Entity\File;
use App\Service\File\ImageService;
use Doctrine\ORM\EntityManagerInterface;

class FileEntityService
{
    public function __construct(
        private EntityManagerInterface $entityManager,
    ) {}

    public function saveEntityFile(array $localFile, string $content): File
    {
        $mimeType = mime_content_type($localFile['full_path']);
        $fileSize = filesize($localFile['full_path']);

        $file = new File();
        $file->setFilename($localFile['name']);
        $file->setFullPath($localFile['full_path']);
        $file->setOriginalFilename($localFile['original_name']);
        $file->setMimeType($mimeType);
        $file->setExtension($this->getFileExtension($localFile['full_path']));
        $file->setSize($fileSize);
        $file->setPath($localFile['short_path']);
        $file->setContent($content);

        $this->entityManager->persist($file);
        $this->entityManager->flush();

        return $file;
    }

    public function getFileById(int $id): ?File
    {
        return $this->getFileByIdOrFail($id);
    }

    public function getFilesContentMsgByIdsForUserMsg(array $fileIds, bool $onlyContent = false): string
    {
        if (count($fileIds) < 1) {
            return '';
        }

        $filesMsgContent = '';

        foreach($fileIds as $fileId) {
            $filesMsgContent .= $this->getFileContentByFileId($fileId, $onlyContent);
        }

        if ($filesMsgContent == '') return '';

        if (!$onlyContent) {
            $filesMsgContent = $this->getFileHeaderContent($fileIds) . $filesMsgContent;
            $filesMsgContent .= '-----';
        }

        return $filesMsgContent;
    }

    public function getFileContentByFileId(int $fileId, bool $onlyContent = false): string
    {
        if (!$fileId) {
            return '';
        }

        $file = $this->getFileByIdOrFail($fileId);

        if (!$file) {
            return '';
        }

        return $this->getFileContent($file, $onlyContent);
    }

    public function getFileContent(File $file, bool $onlyContent): string
    {
        $content = $file->getContent() . '\n\n';

        if (in_array($file->getMimeType(), ImageService::IMAGE_MIME_TYPES)) {
            $content = 'Analysis of the image based on the user query, assume it is YOUR OWN analysis:\n' . $content;
        }

        return $onlyContent ? $content : sprintf('## File - %s\n%s', $file->getOriginalFilename(), $content);
    }

    private function getFileByIdOrFail(int $id): ?File
    {
        return $this->entityManager->getRepository(File::class)->find($id);
    }

    private function getFileHeaderContent(array $fileIds): string
    {
        if (count($fileIds) === 1) {
            return "# File\nUser uploaded a file for you to consider along with his query\n\n";
        }

        return sprintf("# Files\nUser uploaded %d files for you to consider along with his query\n\n", count($fileIds));
    }

    private function getFileExtension(string $filePath): string
    {
        return pathinfo($filePath, PATHINFO_EXTENSION);
    }
}