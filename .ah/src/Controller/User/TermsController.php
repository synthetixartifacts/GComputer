<?php

namespace App\Controller\User;

use App\Entity\User\User;
use App\Entity\Term\TermsOfUse;
use App\Service\User\TermsOfUseService;
use App\Form\ForgotPasswordType;
use App\Service\User\EmailService;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Authentication\AuthenticationUtils;
use Symfony\Component\HttpFoundation\Request;

class TermsController extends AbstractController
{
    public function __construct(
        private TermsOfUseService $termOfUseService
    ) {}

    #[Route(path: '/terms-of-use', name: 'app_terms_of_use')]
    public function term(Request $request): Response
    {
        $latestTerms = $this->termOfUseService->getLatestTerms();

        return $this->render('pages/single/term.html.twig', [
            'terms' => $latestTerms
        ]);
    }

    #[Route('/terms/accept', name: 'app_terms_of_use_accept', methods: ['POST'])]
    public function acceptTerms(): Response
    {
        $user        = $this->getUser();
        $latestTerms = $this->termOfUseService->getLatestTerms();

        if ($user && $latestTerms) {
            $this->termOfUseService->acceptTerms($user, $latestTerms);
        }

        return $this->redirectToRoute('app_chatbot');
    }

}