<?php

namespace App\Controller\Admin;

use App\Entity\Memory\Memory;
use EasyCorp\Bundle\EasyAdminBundle\Controller\AbstractCrudController;
use EasyCorp\Bundle\EasyAdminBundle\Field\IdField;
use EasyCorp\Bundle\EasyAdminBundle\Field\TextEditorField;
use EasyCorp\Bundle\EasyAdminBundle\Field\TextField;
use EasyCorp\Bundle\EasyAdminBundle\Field\TextareaField;
use EasyCorp\Bundle\EasyAdminBundle\Field\DateTimeField;
use EasyCorp\Bundle\EasyAdminBundle\Field\ChoiceField;
use EasyCorp\Bundle\EasyAdminBundle\Config\Crud;

class MemoryCrudController extends AbstractCrudController
{
    public static function getEntityFqcn(): string
    {
        return Memory::class;
    }

    public function configureFields(string $pageName): iterable
    {
        return [
            TextField::new('code'),
            TextField::new('title'),
            TextareaField::new('description'),
            ChoiceField::new('type')
                ->setChoices([
                    'Text'       => 'text',
                    'Link'       => 'link',
                    'Website'    => 'website',
                    'Sharepoint' => 'sharepoint',
                ]),
            TextareaField::new('value')->hideOnIndex(),
            DateTimeField::new('updatedAt')->hideOnForm(),
        ];
    }

    public function configureCrud(Crud $crud): Crud
    {
        return $crud
            ->setDefaultSort(['updatedAt' => 'DESC']);
    }
}
