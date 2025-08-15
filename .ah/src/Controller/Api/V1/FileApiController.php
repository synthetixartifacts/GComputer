<?php

namespace App\Controller\Api\V1;

use App\Controller\Api\AbstractBaseApiController;
use App\Service\Api\ApiHelperService;
use App\Service\File\FileService;

use Symfony\Component\Routing\Annotation\Route;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;

#[Route('/api/v1', name: 'api_v1_')]
class FileApiController extends AbstractBaseApiController
{
    public function __construct(
        protected FileService $fileManager,
        protected ApiHelperService $apiHelperService,
    ) {
        parent::__construct(
            $apiHelperService,
        );
    }


    #[Route('/file/upload', name: 'file_upload', methods: ['POST'])]
    public function uploadFile(Request $request): JsonResponse
    {
        // Validate user request
        $user = $this->apiHelperService->validateUserRequest($request);
        if ($user instanceof JsonResponse) {
            return $user;
        }

        $uploadedFile = $request->files->get('file');
        $userMessage  = $request->request->get('userMsg');

        if (!$uploadedFile) {
            return $this->apiHelperService->jsonResponse([
                'message' => 'No file uploaded',
            ], 400);
        }

        // Save Physical + File Entity
        $fileEntity = $this->fileManager->saveUploadedFile($uploadedFile, $userMessage);

        if (!$fileEntity) {
            return $this->apiHelperService->jsonResponse([
                'message' => 'There was an issue during the file upload',
            ], 500);
        }

        return $this->apiHelperService->jsonResponse([
            'message' => 'File uploaded successfully',
            'file'    => [
                'id'               => $fileEntity->getId(),
                'filename'         => $fileEntity->getFilename(),
                'originalFilename' => $fileEntity->getOriginalFilename(),
                'path'             => $fileEntity->getPath(),
                'content'          => $fileEntity->getContent(),
            ]
        ]);
    }
}
