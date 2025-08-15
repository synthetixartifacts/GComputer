<?php

declare(strict_types=1);

namespace App\Service\Api;

use App\Entity\Ai\AIAgent;
use App\Entity\User\User;
use App\Repository\Ai\AgentRepository;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Bundle\SecurityBundle\Security;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\DependencyInjection\ParameterBag\ParameterBagInterface;
use Symfony\Component\Security\Csrf\CsrfToken;
use Symfony\Component\Security\Csrf\CsrfTokenManagerInterface;

class ApiHelperService
{
    private const HTTP_OK              = 200;
    private const HTTP_BAD_REQUEST     = 400;
    private const HTTP_UNAUTHORIZED    = 401;
    private const HTTP_FORBIDDEN       = 403;
    private const HTTP_NOT_FOUND       = 404;
    private const HTTP_NOT_IMPLEMENTED = 501;

    private const ERROR_MESSAGES = [
        'INVALID_CSRF'    => 'Invalid CSRF token',
        'UNAUTHORIZED'    => 'Unauthorized',
        'NOT_IMPLEMENTED' => 'Not Implemented Yet',
        'AGENT_NOT_FOUND' => 'No AI Agent found with given code',
        'INVALID_JSON'    => 'Invalid JSON payload',
    ];

    public function __construct(
        private readonly AgentRepository $agentRepository,
        private readonly Security $security,
        private readonly CsrfTokenManagerInterface $csrfTokenManager,
        private readonly ParameterBagInterface $params,
    ) {}

    public function extractRequestData(Request $request): array
    {
        $content = $request->getContent();
        if (empty($content)) {
            return [];
        }

        $data = json_decode($content, true);
        if (json_last_error() !== JSON_ERROR_NONE) {
            throw new \InvalidArgumentException(self::ERROR_MESSAGES['INVALID_JSON']);
        }

        return $data ?? [];
    }

    public function getLastestAgentByCode(string $agent_code): ?AIAgent
    {
        return $this->agentRepository->findLatestByCode($agent_code);
    }

    public function getUser(): User|null
    {
        return $this->security->getUser();
    }

    public function validateUserRequest(Request $request): User|JsonResponse
    {
        // TODO - Enable this
        // if (!$this->isValidCsrfToken($request)) {
        //     return $this->invalidCsrfResponse();
        // }

        $user = $this->getUser();
        if (!$user instanceof User) {
            return $this->errorUnauthorizedResponse();
        }

        return $user;
    }

    public function validateAgentExists(string $agent_code): AIAgent|JsonResponse
    {
        $agent = $this->getLastestAgentByCode($agent_code);
        if (!$agent) {
            return $this->jsonResponse([
                'message' => self::ERROR_MESSAGES['AGENT_NOT_FOUND'],
                'agent'   => null
            ], self::HTTP_NOT_FOUND);
        }

        return $agent;
    }

    public function validateAgentAccessRequest(string $agent_code, Request $request): AIAgent|JsonResponse
    {
        // Check if agent exists
        $agent = $this->validateAgentExists($agent_code);
        if ($agent instanceof JsonResponse) {
            return $agent;
        }

        // Check if agent is public
        if (!$agent->isPublic()) {

            // Validate user request
            $user = $this->validateUserRequest($request);
            if ($user instanceof JsonResponse) {
                return $user;
            }

             // Check if user has access to this agent
            if (!$this->userHasAccessToAgent($agent, $user)) {
                return $this->errorUnauthorizedResponse();
            }
        }

        return $agent;
    }

    public function userHasAccessToAgent(AIAgent $agent, User $user): bool
    {
        return $this->agentRepository->userHasAccessToAgent($agent, $user);
    }

    public function isValidCsrfToken(Request $request): bool
    {
        if ($this->params->get('kernel.environment') !== 'prod') {
            return true;
        }

        $submittedToken = $request->headers->get('X-CSRF-TOKEN');
        if (!$submittedToken) {
            return false;
        }

        return $this->csrfTokenManager->isTokenValid(
            new CsrfToken('api_token', $submittedToken)
        );
    }

    public function invalidCsrfResponse(): JsonResponse
    {
        return $this->jsonResponse([
            'message' => self::ERROR_MESSAGES['INVALID_CSRF'],
        ], self::HTTP_FORBIDDEN);
    }

    public function errorUnauthorizedResponse(): JsonResponse
    {
        return $this->jsonResponse([
            'message' => self::ERROR_MESSAGES['UNAUTHORIZED']
        ], self::HTTP_UNAUTHORIZED);
    }

    public function notImplementedYetResponse(): JsonResponse
    {
        return $this->jsonResponse([
            'message' => self::ERROR_MESSAGES['NOT_IMPLEMENTED']
        ], self::HTTP_NOT_IMPLEMENTED);
    }

    public function jsonResponse(array $data, int $status = self::HTTP_OK): JsonResponse
    {
        $response = array_merge([
            'version' => 'v1',
            'status'  => $status,
        ], $data);

        return new JsonResponse($response, $status);
    }

    public function validateRequiredParameters(array $data, array $required): ?JsonResponse
    {
        $missing = array_filter($required, fn($param) => !isset($data[$param]));

        if (!empty($missing)) {
            return $this->jsonResponse([
                'message' => 'Missing required parameters: ' . implode(', ', $missing)
            ], self::HTTP_BAD_REQUEST);
        }

        return null;
    }
}