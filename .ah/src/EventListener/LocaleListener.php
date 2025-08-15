<?php

namespace App\EventListener;

use Symfony\Bundle\SecurityBundle\Security;
use Symfony\Component\HttpKernel\Event\RequestEvent;
use Symfony\Component\HttpKernel\KernelEvents;
use Symfony\Component\EventDispatcher\EventSubscriberInterface;
use Symfony\Component\Security\Core\User\UserInterface;

class LocaleListener implements EventSubscriberInterface
{
    private $security;
    private $defaultLocale;

    public function __construct(
        Security $security,
        string $defaultLocale = 'en'
    ) {
        $this->security      = $security;
        $this->defaultLocale = $defaultLocale;
    }

    // only for guest pages
    public function onKernelRequest(RequestEvent $event)
    {
        $request = $event->getRequest();
        $session = $request->getSession();
        $locale  = $request->query->get('lang', $session->get('_locale', $this->defaultLocale));

        $request->setLocale($locale);
        $request->getSession()->set('_locale', $locale);
    }

    public static function getSubscribedEvents()
    {
        return [
            KernelEvents::REQUEST => ['onKernelRequest', 20],
        ];
    }
}