<?php

namespace App\Service\File;

use App\Entity\File;
use App\Service\File\FileProcessor;
use App\Service\File\ImageService;
use App\Service\File\FileEntityService;

use Symfony\Component\HttpFoundation\File\UploadedFile;
use Symfony\Component\DependencyInjection\ParameterBag\ParameterBagInterface;
use Psr\Log\LoggerInterface;

class FileService
{
    public function __construct(
        private ParameterBagInterface $params,
        private FileProcessor $fileProcessor,
        private ImageService $imageService,
        private FileEntityService $fileEntityService,
        private LoggerInterface $logger
    ) {}

    public function saveUploadedFile(UploadedFile $uploadedFile, string $userMessage): File
    {
        try {

            $fileInfos   = $this->savePhysicalFile($uploadedFile);
            $fileContent = $this->fileProcessor->parseDocument($fileInfos['full_path'], $userMessage);
            $fileEntity  = $this->fileEntityService->saveEntityFile($fileInfos, $fileContent);

        } catch (\Exception $e) {
            throw new \Exception('Issue while processing file : ' . $e->getMessage());
        }

        return $fileEntity;
    }

    public function savePhysicalFile(UploadedFile $uploadedFile): array
    {
        $dateFolder   = date('Y-m-d');
        $uploadFolder = $this->params->get('kernel.project_dir') . '/var/uploads/' . $dateFolder;

        if (!is_dir($uploadFolder)) {
            mkdir($uploadFolder, 0755, true);
        }

        $fileName = substr(md5(uniqid()), 0, 8) . '.' . $uploadedFile->getClientOriginalExtension();
        $filePath = $uploadFolder . '/' . $fileName;

        $uploadedFile->move($uploadFolder, $fileName);

        if (in_array(mime_content_type($filePath), ImageService::IMAGE_MIME_TYPES)) {
            $this->imageService->resizeImage($filePath);
        }

        return [
            'full_path'     => $filePath,
            'short_path'    => $dateFolder . '/' . $fileName,
            'original_name' => $uploadedFile->getClientOriginalName(),
            'name'          => $fileName
        ];
    }

    // TODO - Is this required to be here or can we put it in fileprocessor only
    public function translateDocument(int $fileId): string
    {
        return $this->fileProcessor->translateDocument($this->fileEntityService->getFileById($fileId));
    }

    // TODO - Is this required to be here or can we put it in fileprocessor only
    public function fixGrammarDocument(int $fileId): string
    {
        return $this->fileProcessor->fixGrammarDocument($this->fileEntityService->getFileById($fileId));
    }
}