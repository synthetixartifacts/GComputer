<?php
namespace App\Controller\Admin;

use App\Entity\Memory\CustomInstruction;
use EasyCorp\Bundle\EasyAdminBundle\Config\Crud;
use EasyCorp\Bundle\EasyAdminBundle\Config\Filters;
use EasyCorp\Bundle\EasyAdminBundle\Controller\AbstractCrudController;
use EasyCorp\Bundle\EasyAdminBundle\Field\AssociationField;
use EasyCorp\Bundle\EasyAdminBundle\Field\TextareaField;

class CustomInstructionCrudController extends AbstractCrudController
{
    public static function getEntityFqcn(): string
    {
        return CustomInstruction::class;
    }

    public function configureFields(string $pageName): iterable
    {
        return [
            TextareaField::new('value'),
            AssociationField::new('agent'),
            AssociationField::new('user'),
        ];
    }

    public function configureCrud(Crud $crud): Crud
    {
        return $crud
            ->setEntityLabelInSingular('Custom Instruction')
            ->setEntityLabelInPlural('Custom Instructions')
            ->setSearchFields(['id', 'value'])
            ->setDefaultSort(['id' => 'DESC']);
    }

    public function configureFilters(Filters $filters): Filters
    {
        return $filters
            ->add('agent')
            ->add('user')
            ->add('createdAt');
    }
}