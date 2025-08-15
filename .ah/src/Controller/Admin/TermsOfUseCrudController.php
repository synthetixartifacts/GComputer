<?php

namespace App\Controller\Admin;

use App\Entity\Term\TermsOfUse;
use EasyCorp\Bundle\EasyAdminBundle\Controller\AbstractCrudController;
use EasyCorp\Bundle\EasyAdminBundle\Field\IdField;
use EasyCorp\Bundle\EasyAdminBundle\Field\TextEditorField;
use EasyCorp\Bundle\EasyAdminBundle\Field\TextField;
use EasyCorp\Bundle\EasyAdminBundle\Field\TextareaField;
use EasyCorp\Bundle\EasyAdminBundle\Field\DateTimeField;
use EasyCorp\Bundle\EasyAdminBundle\Field\IntegerField;
use EasyCorp\Bundle\EasyAdminBundle\Config\Crud;
use EasyCorp\Bundle\EasyAdminBundle\Config\Action;
use EasyCorp\Bundle\EasyAdminBundle\Config\Actions;
use Doctrine\ORM\EntityManagerInterface;

class TermsOfUseCrudController extends AbstractCrudController
{
    private $entityManager;

    public function __construct(EntityManagerInterface $entityManager)
    {
        $this->entityManager = $entityManager;
    }

    public static function getEntityFqcn(): string
    {
        return TermsOfUse::class;
    }

    public function configureFields(string $pageName): iterable
    {
        return [
            TextEditorField::new('content')->hideOnIndex(),
            IntegerField::new('version')->hideOnForm()->setFormTypeOption('disabled', true),
            DateTimeField::new('createdAt')->hideOnForm(),
        ];
    }

    public function configureCrud(Crud $crud): Crud
    {
        return $crud
            ->setDefaultSort(['version' => 'DESC'])
            ->setEntityPermission('ROLE_ADMIN')
            ->showEntityActionsInlined(false);
    }

    // Correct the way you are adding and disabling actions.
    public function configureActions(Actions $actions): Actions
    {
        return $actions
            ->disable(Action::DELETE)
            ->disable(Action::SAVE_AND_ADD_ANOTHER)
            ->disable(Action::SAVE_AND_CONTINUE)
            ->update(Crud::PAGE_EDIT, Action::SAVE_AND_RETURN, static function (Action $action) {
                // Hide the SAVE_AND_RETURN button by making it always return false.
                return $action->displayIf(static fn($entity) => false);
            });
    }

    public function createEntity(string $entityFqcn)
    {
        $termsOfUse  = new TermsOfUse();
        $latestTerms = $this->entityManager->getRepository(TermsOfUse::class)->findOneBy([], ['version' => 'DESC']);
        $newVersion  = $latestTerms ? $latestTerms->getVersion() + 1 : 1;
        $termsOfUse->setVersion($newVersion);
        $termsOfUse->setCreatedAt(new \DateTime());
        return $termsOfUse;
    }
}
