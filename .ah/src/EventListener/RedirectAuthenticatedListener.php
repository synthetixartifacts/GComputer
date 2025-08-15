<?php
// src/EventListener/RedirectAuthenticatedListener.php

namespace App\EventListener;

use App\Service\User\TermsOfUseService;
use Symfony\Component\HttpFoundation\RedirectResponse;
use Symfony\Component\HttpKernel\Event\RequestEvent;
use Symfony\Component\Routing\RouterInterface;
use Symfony\Bundle\SecurityBundle\Security;
use Symfony\Component\HttpKernel\KernelEvents;
use Symfony\Component\EventDispatcher\EventSubscriberInterface;

class RedirectAuthenticatedListener implements EventSubscriberInterface
{
    private $security;
    private $router;
    private $termOfUseService;

    public function __construct(
        Security $security,
        RouterInterface $router,
        TermsOfUseService $termOfUseService
    ) {
        $this->security = $security;
        $this->router = $router;
        $this->termOfUseService = $termOfUseService;
    }

    public function onKernelRequest(RequestEvent $event): void
    {
        if (!$event->isMainRequest()) {
            return;
        }

        $request      = $event->getRequest();
        $currentRoute = $request->attributes->get('_route');
        $currentPath  = $request->getPathInfo();

        // Guest LOGIC
        // LOGIN ROUTE
        $routesToRedirect = [
            'app_login',
            'app_forgot_password',
            'set_password',
        ];

        $user       = $this->security->getUser();
        $isLoggedIn = $this->security->isGranted('ROLE_USER');

        // Check if the user is already logged in and trying to access one of the specified routes
        if ($isLoggedIn && in_array($currentRoute, $routesToRedirect, true)) {
            $event->setResponse(new RedirectResponse($this->router->generate('app_chatbot')));
            return;
        }

        // TERM & CONDITIONS
        // Redirect to chatbot if user has already accepted terms
        if ($isLoggedIn &&
            in_array($currentRoute, ['app_terms_of_use', 'app_terms_of_use_accept'], true)) {
            $acceptedLastTerm = $this->termOfUseService->hasUserAcceptedLatestTerms($user);
            if ($acceptedLastTerm) {
                $event->setResponse(new RedirectResponse($this->router->generate('app_chatbot')));
                return;
            }
        }

        // If user is logged in but did not accept the latest terms and conditions
        // Except for admin section
        if ($isLoggedIn &&
            !in_array($currentRoute, ['app_terms_of_use', 'app_terms_of_use_accept'], true) &&
            !str_starts_with($currentPath, '/admin')) {
            $acceptedLastTerm = $this->termOfUseService->hasUserAcceptedLatestTerms($user);

            if (!$acceptedLastTerm) {
                $event->setResponse(new RedirectResponse($this->router->generate('app_terms_of_use')));
                return;
            }
        }
    }

    public static function getSubscribedEvents()
    {
        return [
            KernelEvents::REQUEST => ['onKernelRequest', 1],
        ];
    }
}