<?php

namespace App\Controller\Admin;

use App\Entity\Ai\AIAgentArchive;
use EasyCorp\Bundle\EasyAdminBundle\Controller\AbstractCrudController;
use EasyCorp\Bundle\EasyAdminBundle\Field\IdField;
use EasyCorp\Bundle\EasyAdminBundle\Field\TextField;
use EasyCorp\Bundle\EasyAdminBundle\Field\TextareaField;
use EasyCorp\Bundle\EasyAdminBundle\Field\AssociationField;
use EasyCorp\Bundle\EasyAdminBundle\Field\DateTimeField;
use EasyCorp\Bundle\EasyAdminBundle\Field\BooleanField;

class AIAgentArchiveCrudController extends AbstractCrudController
{
    public static function getEntityFqcn(): string
    {
        return AIAgentArchive::class;
    }

    public function configureFields(string $pageName): iterable
    {
        return [
            TextField::new('name'),
            TextField::new('code'),
            TextField::new('version'),
            BooleanField::new('enable'),
            BooleanField::new('isSystem'),
            TextareaField::new('systemPrompt')->hideOnIndex(),
            TextareaField::new('memory')->hideOnIndex()->setRequired(false),
            TextareaField::new('params')->hideOnIndex()
                ->setFormTypeOption('attr', ['rows' => 10])
                ->formatValue(function ($value) {
                    return is_array($value) ? json_encode($value, JSON_PRETTY_PRINT) : $value;
                }),
            TextareaField::new('configuration')->hideOnIndex()
                ->setFormTypeOption('attr', ['rows' => 10])
                ->formatValue(function ($value) {
                    return is_array($value) ? json_encode($value, JSON_PRETTY_PRINT) : $value;
                }),
            AssociationField::new('model'),
            AssociationField::new('teams'),
            DateTimeField::new('updatedAt')
                ->setFormat('yyyy-MM-dd HH:mm:ss')
                ->setFormTypeOption('disabled', true)
        ];
    }
}
