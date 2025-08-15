<?php

namespace App\Service\User;

use App\Entity\User\User;
use Symfony\Component\Mailer\MailerInterface;
use Symfony\Bridge\Twig\Mime\TemplatedEmail;
use Symfony\Component\Mime\Address;
use Symfony\Contracts\Translation\TranslatorInterface;

class EmailService
{
    public function __construct(
        private MailerInterface $mailer,
        private TranslatorInterface $translator
    ) {}

    public function sendConfirmationEmail(User $user): void
    {
        $locale = $user->getLanguage();

        $email = (new TemplatedEmail())
            ->from(new Address('noreply@group-era.com', 'CIA - Groupe Conseil Era'))
            ->to($user->getEmail())
            ->subject($this->translator->trans('emails.welcome.title', [], null, $locale))
            ->htmlTemplate('emails/email_confirm_set_pass.html.twig')
            ->context([
                'firstName'         => $user->getFirstName(),
                'lastName'          => $user->getLastName(),
                'confirmationToken' => $user->getConfirmationToken(),
                'locale'            => $locale,
            ]);
        $this->mailer->send($email);
    }

    public function sendForgetPassEmail(User $user): void
    {
        $email = (new TemplatedEmail())
            ->from(new Address('noreply@group-era.com', 'CIA - Groupe Conseil Era'))
            ->to($user->getEmail())
            ->subject($this->translator->trans('emails.reset_password.title'))
            ->htmlTemplate('emails/email_reset_pass.html.twig')
            ->context([
                'firstName'         => $user->getFirstName(),
                'lastName'          => $user->getLastName(),
                'confirmationToken' => $user->getConfirmationToken(),
            ]);
        $this->mailer->send($email);
    }
}
