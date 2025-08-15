<?php

namespace App\Security;

use App\Entity\Admin\AdminSettings;
use App\Entity\User\Team;
use App\Entity\User\User;
use App\Repository\Ai\AgentRepository;
use App\Repository\User\UserRepository;
use Doctrine\ORM\EntityManagerInterface;
use KnpU\OAuth2ClientBundle\Client\ClientRegistry;
use KnpU\OAuth2ClientBundle\Security\Authenticator\OAuth2Authenticator;
use League\OAuth2\Client\Token\AccessTokenInterface;
use Psr\Log\LoggerInterface;
use Symfony\Component\HttpFoundation\RedirectResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\RouterInterface;
use Symfony\Component\Security\Core\Authentication\Token\TokenInterface;
use Symfony\Component\Security\Core\Exception\AuthenticationException;
use Symfony\Component\Security\Core\Exception\CustomUserMessageAuthenticationException;
use Symfony\Component\Security\Core\Exception\UserNotFoundException;
use Symfony\Component\Security\Core\User\UserInterface;
use Symfony\Component\Security\Http\EntryPoint\AuthenticationEntryPointInterface;
use Symfony\Component\Security\Http\RememberMe\RememberMeHandlerInterface;
use Symfony\Component\Security\Http\RememberMe\RememberMeDetails;
use Symfony\Component\Security\Http\Authenticator\Passport\Badge\UserBadge;
use Symfony\Component\Security\Http\Authenticator\Passport\Badge\RememberMeBadge;
use Symfony\Component\Security\Http\Authenticator\Passport\SelfValidatingPassport;
use Symfony\Component\Security\Http\Authenticator\Passport\Passport;

class AzureAuthenticator extends OAuth2Authenticator implements AuthenticationEntryPointInterface, RememberMeHandlerInterface
{
    private const ALLOWED_DOMAIN    = 'group-era.com';
    private const DEFAULT_MAX_USERS = 10;

    public function __construct(
        private readonly ClientRegistry         $clientRegistry,
        private readonly EntityManagerInterface $entityManager,
        private readonly RouterInterface        $router,
        private readonly UserRepository         $userRepository,
        private readonly AgentRepository        $agentRepository,
        private readonly LoggerInterface        $logger,
    ) {}

    public function supports(Request $request): ?bool
    {
        return $request->attributes->get('_route') === 'connect_azure_check';
    }

    public function authenticate(Request $request): Passport
    {
        try {
            $client      = $this->clientRegistry->getClient('azure');
            $accessToken = $this->fetchAccessToken($client);
            $azureUser   = $client->fetchUserFromToken($accessToken);
            $data        = $azureUser->toArray();
            $email       = $data['upn'];

            if (!$this->isCompanyEmail($email)) {
                throw new CustomUserMessageAuthenticationException('Only company emails are allowed.');
            }

            $user = $this->loadOrCreateUser($email, $data, $accessToken);

            return new SelfValidatingPassport(
                new UserBadge($email, fn(string $_): User => $user),
                [
                    // force Symfony to set a 5‑day remember‑me cookie
                    (new RememberMeBadge())->enable(),
                ]
            );
        } catch (\Exception $e) {
            $this->logger->error('Azure authentication error', ['error' => $e->getMessage()]);
            throw new AuthenticationException('Authentication failed. Please try again later.');
        }
    }

    public function onAuthenticationSuccess(Request $request, TokenInterface $token, string $firewallName): ?Response
    {
        return new RedirectResponse($this->router->generate('app_chatbot'));
    }

    public function onAuthenticationFailure(Request $request, AuthenticationException $exception): ?Response
    {
        if ($request->hasSession()) {
            $request->getSession()->set('security.authentication.error', $exception);
        }

        return new RedirectResponse($this->router->generate('app_login'));
    }

    public function start(Request $request, AuthenticationException $authException = null): Response
    {
        return new RedirectResponse(
            $this->router->generate('connect_azure_start'),
            Response::HTTP_TEMPORARY_REDIRECT
        );
    }

    // ——— RememberMeHandlerInterface ———

    public function createRememberMeCookie(UserInterface $user): void
    {
        // no custom logic; Symfony handles cookie creation
    }

    public function consumeRememberMeCookie(RememberMeDetails $details): UserInterface
    {
        $user = $this->userRepository->findOneBy([
            'email' => $details->getUserIdentifier(),
        ]);

        if (!$user || !$user->isEnable()) {
            throw new UserNotFoundException('User not found or disabled.');
        }

        return $user;
    }

    public function clearRememberMeCookie(): void
    {
        // no custom logic; Symfony handles cookie clearing
    }

    // ——— Helper Methods ———

    private function loadOrCreateUser(
        string                $email,
        array                 $azureData,
        AccessTokenInterface  $accessToken
    ): User {
        $user  = $this->userRepository->findOneBy(['email' => $email]);

        if (!$user) {
            // enforce max-user limit
            $maxSetting = $this->entityManager
                ->getRepository(AdminSettings::class)
                ->findOneBy(['code' => 'max_user']);
            $maxUsers   = $maxSetting ? (int)$maxSetting->getValue() : self::DEFAULT_MAX_USERS;

            if ($this->userRepository->count([]) >= $maxUsers) {
                throw new CustomUserMessageAuthenticationException(
                    "Maximum number of users ({$maxUsers}) reached. Please contact the administrator."
                );
            }

            $user = (new User())
                ->setEmail($email)
                ->setPassword('nopasswordF0rN0w')
                ->setLanguage('en')
                ->setVerified(true)
                ->setEnable(true)
                ->setRoles(['ROLE_USER'])
                // use \DateTime to match entity type
                ->setLastLogin(new \DateTime());

            if ($team = $this->entityManager->getRepository(Team::class)->findOneBy(['code' => 'default'])) {
                $user->addTeam($team);
            }
        }

        $this->syncUserData($user, $azureData, $accessToken);
        // update lastLogin again with current time
        $user->setLastLogin(new \DateTime());

        $this->entityManager->persist($user);
        $this->entityManager->flush();

        // Only create MAI agent if user doesn't have a personal agent yet
        if (!$user->getPersonalAgent()) {
            $this->agentRepository->createMaiAgentForUser($user);
        }

        if (!$user->isEnable()) {
            throw new CustomUserMessageAuthenticationException('Your account is disabled.');
        }

        return $user;
    }

    private function syncUserData(
        User                  $user,
        array                 $azureData,
        AccessTokenInterface  $accessToken
    ): void {
        $user
            ->setFirstName($azureData['given_name'])
            ->setLastName($azureData['family_name'])
            ->setOauthProvider('azure')
            ->setOauthId($azureData['oid'])
            ->setOauthData([
                'azure_id'      => $azureData['oid'],
                'name'          => $azureData['name'],
                'email'         => $azureData['upn'],
                'access_token'  => $accessToken->getToken(),
                'refresh_token' => $accessToken->getRefreshToken(),
                'token_expires' => (new \DateTime('+1 week'))->format(\DateTimeInterface::ATOM),
                'last_sync'     => (new \DateTime())->format(\DateTimeInterface::ATOM),
            ]);
    }

    private function isCompanyEmail(string $email): bool
    {
        $origin = $this->entityManager
            ->getRepository(AdminSettings::class)
            ->findOneBy(['code' => 'email_creation_origin']);

        $domain = $origin?->getValue() ?? self::ALLOWED_DOMAIN;
        return str_ends_with(strtolower($email), '@' . $domain);
    }
}
