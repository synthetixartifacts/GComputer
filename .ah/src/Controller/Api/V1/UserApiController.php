<?php

namespace App\Controller\Api\V1;

use App\Controller\Api\AbstractBaseApiController;
use App\Repository\User\UserRepository;
use App\Repository\Memory\CustomInstructionRepository;
use App\Repository\Ai\AgentRepository;
use App\Service\Api\ApiHelperService;

use Symfony\Component\Routing\Annotation\Route;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Bundle\SecurityBundle\Security;
use Symfony\Component\HttpFoundation\Request;
use Doctrine\ORM\EntityManagerInterface;
use Psr\Log\LoggerInterface;
use Symfony\Component\Validator\Validator\ValidatorInterface;
use Symfony\Component\HttpKernel\Exception\BadRequestHttpException;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;

#[Route('/api/v1', name: 'api_v1_')]
class UserApiController extends AbstractBaseApiController
{
    public function __construct(
        protected UserRepository $userRepository,
        protected CustomInstructionRepository $customInstructionRepository,
        protected Security $security,
        protected EntityManagerInterface $entityManager,
        protected ValidatorInterface $validator,
        protected UserPasswordHasherInterface $passwordHasher,
        protected AgentRepository $agentRepository,
        protected ApiHelperService $apiHelperService,
    ) {
        parent::__construct(
            $apiHelperService,
        );
    }

    #[Route('/user/update-profile', name: 'user_update_profile', methods: ['POST'])]
    public function updateProfile(Request $request, LoggerInterface $logger): JsonResponse
    {
        // Validate user request
        $user = $this->apiHelperService->validateUserRequest($request);
        if ($user instanceof JsonResponse) {
            return $user;
        }

        try {
            $data = $this->apiHelperService->extractRequestData($request);

            $user->setFirstName($data['firstName']);
            $user->setLastName($data['lastName']);
            $user->setLanguage($data['language']);
            $user->setJobTitle($data['jobTitle']);
            $user->setBio($data['bio']);

            $errors = $this->validator->validate($user);

            if (count($errors) > 0) {
                return $this->apiHelperService->jsonResponse([
                    'message' => 'Validation failed',
                    'errors'  => (string) $errors
                ], 400);
            }

            $this->entityManager->flush();

            // Set the locale in the session
            $request->getSession()->set('_locale', $data['language'] ?? 'en');

            return $this->apiHelperService->jsonResponse([
                'message'  => 'User profile updated successfully',
            ]);
        } catch (\Exception $e) {
            $logger->error('Error updating user profile: ' . $e->getMessage());
            return $this->apiHelperService->jsonResponse([
                'message' => 'An error occurred while updating the profile'
            ], 500);
        }
    }



    #[Route('/user/update-password', name: 'user_update_password', methods: ['POST'])]
    public function updatePassword(Request $request, LoggerInterface $logger): JsonResponse
    {
        // Validate user request
        $user = $this->apiHelperService->validateUserRequest($request);
        if ($user instanceof JsonResponse) {
            return $user;
        }

        try {
            $data = $this->apiHelperService->extractRequestData($request);

            if (!$data || !isset($data['currentPass'], $data['newPass'], $data['confirmPass'])) {
                throw new BadRequestHttpException('Invalid request data');
            }

            $currentPass = $data['currentPass'];
            $newPass     = $data['newPass'];
            $confirmPass = $data['confirmPass'];

            if (!$this->passwordHasher->isPasswordValid($user, $currentPass)) {
                return $this->apiHelperService->jsonResponse([
                    'message' => 'Current password is incorrect'
                ], 400);
            }

            if ($newPass !== $confirmPass) {
                return $this->apiHelperService->jsonResponse([
                    'message' => 'New password and confirmation do not match'
                ], 400);
            }

            $user->setPassword($this->passwordHasher->hashPassword($user, $newPass));
            $errors = $this->validator->validate($user);

            if (count($errors) > 0) {
                return $this->apiHelperService->jsonResponse([
                    'message' => 'Validation failed',
                    'errors' => (string) $errors
                ], 400);
            }

            $this->entityManager->flush();

            return $this->apiHelperService->jsonResponse([
                'message'  => 'Password updated successfully',
            ]);
        } catch (BadRequestHttpException $e) {
            return $this->apiHelperService->jsonResponse([
                'message' => $e->getMessage()
            ], 400);
        } catch (\Exception $e) {
            $logger->error('Error updating user password: ' . $e->getMessage());
            return $this->apiHelperService->jsonResponse([
                'message' => 'An error occurred while updating the password'
            ], 500);
        }
    }



    #[Route('/user/update-agent-settings', name: 'user_update_agent_settigns', methods: ['POST'])]
    public function updateAgentSettings(Request $request, LoggerInterface $logger): JsonResponse
    {
        try {
            $data            = $this->apiHelperService->extractRequestData($request);
            $agent_code      = $data['agent_code'];
            $userInstruction = $data['user_instruction'];
            $teamInstruction = $data['team_instruction'];

            // Validation
            $agent = $this->apiHelperService->validateAgentAccessRequest($agent_code, $request);
            if ($agent instanceof JsonResponse) {
                return $agent;
            }

            $user = $this->apiHelperService->getUser();
            $this->customInstructionRepository->updateCustomInstructionForAgentByUser($userInstruction, $agent, $user);

            // If user Manager, we update the custom instruction
            if ($agent->isUserManager($user)) {
                $this->customInstructionRepository->updateCustomInstructionForAgent($teamInstruction, $agent);
            }

            return $this->apiHelperService->jsonResponse([
                'message'  => 'Settings were save properly',
            ]);

        } catch (\Exception $e) {
            $logger->error('Error updating user password: ' . $e->getMessage());
            return $this->apiHelperService->jsonResponse([
                'message' => 'An error occurred while saving settings'
            ], 500);
        }
    }
}
