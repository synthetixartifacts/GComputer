<?php

namespace App\Controller\User;

use App\Entity\User\User;
use App\Entity\User\Team;
use App\Form\RegistrationFormType;
use App\Repository\Ai\AgentRepository;
use App\Repository\User\UserRepository;
use App\Security\EmailVerifier;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bridge\Twig\Mime\TemplatedEmail;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Mime\Address;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Contracts\Translation\TranslatorInterface;
use SymfonyCasts\Bundle\VerifyEmail\Exception\VerifyEmailExceptionInterface;
use Symfony\Component\Security\Core\Authentication\Token\UsernamePasswordToken;
use Symfony\Component\Security\Core\Authentication\Token\Storage\TokenStorageInterface;
use Symfony\Component\Form\Extension\Core\Type\PasswordType;
use Symfony\Component\Form\Extension\Core\Type\RepeatedType;
use Symfony\Component\Validator\Constraints\NotBlank;
use Symfony\Component\Validator\Constraints\Length;

class RegistrationController extends AbstractController
{
    public function __construct(
        private EmailVerifier $emailVerifier,
        private AgentRepository $agentRepository
    ) {}


    #[Route('/set-password/{token}', name: 'set_password')]
    public function setPassword(
        string $token,
        Request $request,
        UserPasswordHasherInterface $passwordHasher,
        EntityManagerInterface $entityManager,
        AgentRepository $agentRepository,
        TokenStorageInterface $tokenStorage
    ): Response {

        $user = $entityManager->getRepository(User::class)->findOneBy(['confirmationToken' => $token]);

        if (!$user) {
            throw $this->createNotFoundException('Invalid token');
        }

        $form = $this->createFormBuilder()
            ->add('password', RepeatedType::class, [
                'type'            => PasswordType::class,
                'invalid_message' => 'The password fields must match.',
                'required'        => true,
                'first_options'   => ['label' => 'Password'],
                'second_options'  => ['label' => 'Repeat Password'],
                'constraints'     => [
                    new NotBlank(['message' => 'Please enter a password']),
                    new Length([
                        'min' => 6,
                        'minMessage' => 'Your password should be at least {{ limit }} characters',
                        'max' => 4096,
                    ]),
                ],
            ])
            ->getForm();

        $form->handleRequest($request);

        if ($form->isSubmitted() && $form->isValid()) {
            $password = $form->get('password')->getData();

            $user->setPassword($passwordHasher->hashPassword($user, $password));
            $user->setVerified(true);
            $user->setRoles(['ROLE_USER']);
            $user->setLastLogin(new \DateTime());
            $user->setConfirmationToken(null);

            $defaultTeam = $entityManager->getRepository(Team::class)->findOneBy(['code' => 'default']);

            if ($defaultTeam) {
                $user->addTeam($defaultTeam);
            }

            $entityManager->persist($user);
            $entityManager->flush();
            $agentRepository->createMaiAgentForUser($user);

            // Log the user in
            $token = new UsernamePasswordToken($user, 'main', $user->getRoles());

            $tokenStorage->setToken($token);

            $this->addFlash('success', 'Your account has been configured and password was set.');

            return $this->redirectToRoute('app_chatbot');
        }

        return $this->render('guest/set_pass.html.twig', [
            'form' => $form->createView(),
        ]);
    }

    // #[Route('/register', name: 'app_register')]
    // public function register(Request $request, UserPasswordHasherInterface $userPasswordHasher, EntityManagerInterface $entityManager): Response
    // {
    //     $user = new User();
    //     $form = $this->createForm(RegistrationFormType::class, $user);
    //     $form->handleRequest($request);

    //     if ($form->isSubmitted() && $form->isValid()) {
    //         // encode the plain password
    //         $user->setPassword(
    //             $userPasswordHasher->hashPassword(
    //                 $user,
    //                 $form->get('plainPassword')->getData()
    //             )
    //         );

    //         // Default association to user
    //         $user->setRoles(['ROLE_USER']);

    //         $defaultTeam = $entityManager->getRepository(Team::class)->findOneBy(['code' => 'default']);
    //         if ($defaultTeam) {
    //             $user->addTeam($defaultTeam);
    //         }

    //         $entityManager->persist($user);
    //         $entityManager->flush();

    //         // Create new Mai agent for user
    //         $this->agentRepository->createMaiAgentForUser($user);

    //         // generate a signed url and email it to the user
    //         $this->emailVerifier->sendEmailConfirmation('app_verify_email', $user,
    //             (new TemplatedEmail())
    //                 ->from(new Address('noreply@group-era.com', 'CIA - Groupe Conseil Era'))
    //                 ->to($user->getEmail())
    //                 ->subject('Please Confirm your Email')
    //                 ->htmlTemplate('registration/confirmation_email.html.twig')
    //         );

    //         $this->addFlash('success', 'Registration successful, please check your inbox to validate your email.');

    //         return $this->redirectToRoute('app_login');
    //     }

    //     return $this->render('guest/register.html.twig', [
    //         'registrationForm' => $form,
    //     ]);
    // }

    // #[Route('/verify/email', name: 'app_verify_email')]
    // public function verifyUserEmail(Request $request, TranslatorInterface $translator, UserRepository $userRepository): Response
    // {
    //     $id = $request->query->get('id');

    //     if (null === $id) {
    //         return $this->redirectToRoute('app_register');
    //     }

    //     $user = $userRepository->find($id);

    //     if (null === $user) {
    //         return $this->redirectToRoute('app_register');
    //     }

    //     // validate email confirmation link, sets User::isVerified=true and persists
    //     try {
    //         $this->emailVerifier->handleEmailConfirmation($request, $user);
    //     } catch (VerifyEmailExceptionInterface $exception) {
    //         $this->addFlash('verify_email_error', $translator->trans($exception->getReason(), [], 'VerifyEmailBundle'));

    //         return $this->redirectToRoute('app_register');
    //     }

    //     $this->addFlash('success', 'Your email address has been verified.');

    //     return $this->redirectToRoute('app_login');
    // }

}
