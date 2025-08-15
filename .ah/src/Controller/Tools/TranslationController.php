<?php

// src/Controller/Tools/TranslationController.php
namespace App\Controller\Tools;

use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Annotation\Route;
use Symfony\Contracts\Translation\TranslatorInterface;

class TranslationController extends AbstractController
{
    #[Route('/public/translations.js', name: 'translations_js')]
    public function index(TranslatorInterface $translator): Response
    {
        $catalogues = $translator->getCatalogue()->all();
        $domains = array_keys($catalogues);

        return $this->render('tools/translations.js.twig', [
            'translations' => $catalogues,
            'domains'      => $domains,
        ], new Response('', 200, ['Content-Type' => 'application/javascript']));
    }
}