<?php

namespace App\Controller\Admin;

use App\Entity\User\Team;
use EasyCorp\Bundle\EasyAdminBundle\Controller\AbstractCrudController;
use EasyCorp\Bundle\EasyAdminBundle\Field\IdField;
use EasyCorp\Bundle\EasyAdminBundle\Field\TextEditorField;
use EasyCorp\Bundle\EasyAdminBundle\Field\AssociationField;
use EasyCorp\Bundle\EasyAdminBundle\Field\TextField;
use EasyCorp\Bundle\EasyAdminBundle\Field\TextareaField;

class TeamCrudController extends AbstractCrudController
{
    public static function getEntityFqcn(): string
    {
        return Team::class;
    }

    public function configureFields(string $pageName): iterable
    {
        return [
            IdField::new('id')->hideOnForm(),
            TextField::new('name'),
            TextField::new('code'),
            TextareaField::new('memory')->hideOnIndex()->setRequired(false),
            AssociationField::new('agents')
                ->setFormTypeOptions([
                    'by_reference' => false,
                ]),
            AssociationField::new('users')
                ->setFormTypeOptions([
                    'by_reference' => false,
                ]),
        ];
    }
}
