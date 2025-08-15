<?php

namespace App\Controller\User;

use App\Entity\User\User;
use App\Form\ForgotPasswordType;
use App\Service\User\EmailService;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Authentication\AuthenticationUtils;
use Symfony\Component\HttpFoundation\Request;
use Doctrine\ORM\EntityManagerInterface;

class SecurityController extends AbstractController
{
    public function __construct(
        private EmailService $emailService,
        private EntityManagerInterface $entityManager
    ) {}

    // private function setLocale(Request $request): void
    // {
    //     // $lang = $request->query->get('lang', 'en');
    //     // $request->setLocale($lang);
    //     // $request->getSession()->set('_locale', $lang);
    // }

    #[Route(path: '/login', name: 'app_login')]
    public function login(AuthenticationUtils $authenticationUtils, Request $request): Response
    {
        // $this->setLocale($request);

        // get the login error if there is one
        $error = $authenticationUtils->getLastAuthenticationError();

        // last username entered by the user
        $lastUsername = $authenticationUtils->getLastUsername();

        return $this->render('guest/login.html.twig', [
            'last_username' => $lastUsername,
            'error'         => $error,
        ]);
    }


    #[Route(path: '/logout', name: 'app_logout')]
    public function logout(): void
    {
        throw new \LogicException('This method can be blank - it will be intercepted by the logout key on your firewall.');
    }


    #[Route(path: '/forgot-password', name: 'app_forgot_password')]
    public function forgotPassword(Request $request): Response
    {
        // $this->setLocale($request);

        $form = $this->createForm(ForgotPasswordType::class);
        $form->handleRequest($request);

        if ($form->isSubmitted() && $form->isValid()) {
            $email = $form->get('email')->getData();
            $user  = $this->entityManager->getRepository(User::class)->findOneBy(['email' => $email]);

            if ($user) {
                $user->generateConfirmationToken();
                $this->entityManager->persist($user);
                $this->entityManager->flush();

                $this->emailService->sendForgetPassEmail($user);

                $this->addFlash('success', 'Password reset email sent. Please check your inbox.');

                $lang = $request->query->get('lang', $request->getLocale());
                return $this->redirectToRoute('app_login', ['lang' => $lang]);
            }

            $this->addFlash('error', 'No user found with this email address.');
        }
        return $this->render('guest/forgot_password.html.twig', [
            'form' => $form->createView(),
        ]);
    }
}
