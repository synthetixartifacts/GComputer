<?php

namespace App\Controller\Admin;

use App\Entity\Ai\AIModel;
use EasyCorp\Bundle\EasyAdminBundle\Controller\AbstractCrudController;
use EasyCorp\Bundle\EasyAdminBundle\Field\TextField;
use EasyCorp\Bundle\EasyAdminBundle\Field\TextareaField;
use EasyCorp\Bundle\EasyAdminBundle\Field\AssociationField;
use EasyCorp\Bundle\EasyAdminBundle\Field\NumberField;
use EasyCorp\Bundle\EasyAdminBundle\Config\Action;
use EasyCorp\Bundle\EasyAdminBundle\Config\Actions;
use EasyCorp\Bundle\EasyAdminBundle\Config\Crud;
use EasyCorp\Bundle\EasyAdminBundle\Router\AdminUrlGenerator;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\HttpFoundation\Response;

class AIModelCrudController extends AbstractCrudController
{
    public function __construct(
        private EntityManagerInterface $entityManager,
        private AdminUrlGenerator $adminUrlGenerator
    ) {}

    public static function getEntityFqcn(): string
    {
        return AIModel::class;
    }

    public function configureFields(string $pageName): iterable
    {
        return [
            TextField::new('name'),
            TextField::new('code'),
            TextField::new('model'),
            NumberField::new('inputPrice')
                ->setNumDecimals(4),
            NumberField::new('outputPrice')
                ->setNumDecimals(4),
            TextField::new('endpoint')->hideOnIndex(),
            TextareaField::new('params')
                ->hideOnIndex()
                ->setHelp('Enter params as a JSON object with variable %systemPrompt% and %userMsg% at the right places.'),
            TextField::new('messageLocation')->hideOnIndex(),
            TextField::new('streamMessageLocation')->hideOnIndex(),
            TextField::new('inputTokenCountLocation')->hideOnIndex(),
            TextField::new('outputTokenCountLocation')->hideOnIndex(),
            AssociationField::new('provider'),
            AssociationField::new('agents')
                ->hideOnIndex()
                ->setFormTypeOption('by_reference', false),
        ];
    }

    public function configureActions(Actions $actions): Actions
    {
        $duplicate = Action::new('duplicate')
            ->linkToCrudAction('duplicateModel')
            ->setLabel('Duplicate');

        return $actions
            ->add(Crud::PAGE_INDEX, $duplicate)
            ->reorder(Crud::PAGE_INDEX, ['duplicate', Action::EDIT, Action::DELETE]);
    }

    public function duplicateModel(): Response
    {
        $context = $this->getContext();
        $id = $context->getRequest()->query->get('entityId');
        $originalModel = $this->entityManager->getRepository(AIModel::class)->find($id);

        if (!$originalModel) {
            throw $this->createNotFoundException('Model not found');
        }

        $newModel = clone $originalModel;
        $randomSuffix = '_' . random_int(1000, 9999);
        $newModel->setCode($originalModel->getCode() . $randomSuffix);

        $this->entityManager->persist($newModel);
        $this->entityManager->flush();

        $url = $this->adminUrlGenerator
            ->setController(self::class)
            ->setAction(Action::DETAIL)
            ->setEntityId($newModel->getId())
            ->generateUrl();

        return $this->redirect($url);
    }
}