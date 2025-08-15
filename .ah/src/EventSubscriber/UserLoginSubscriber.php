<?php

namespace App\EventSubscriber;

use App\Entity\User\User;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\EventDispatcher\EventSubscriberInterface;
use Symfony\Component\Security\Http\Event\LoginSuccessEvent;
use Symfony\Component\HttpFoundation\RequestStack;

class UserLoginSubscriber implements EventSubscriberInterface
{
    private $entityManager;
    private $requestStack;

    public function __construct(EntityManagerInterface $entityManager, RequestStack $requestStack)
    {
        $this->entityManager = $entityManager;
        $this->requestStack = $requestStack;
    }

    public static function getSubscribedEvents(): array
    {
        return [
            LoginSuccessEvent::class => 'onLoginSuccess',
        ];
    }

    public function onLoginSuccess(LoginSuccessEvent $event): void
    {
        $user = $event->getUser();
        if ($user instanceof User) {
            $user->setLastLogin(new \DateTime());
            $this->entityManager->flush();

            // Set locale
            $session = $this->requestStack->getSession();
            $locale  = $user->getLanguage() ?? 'en';       // Assuming User entity has a getLanguage() method
            $session->set('_locale', $locale);
        }
    }
}