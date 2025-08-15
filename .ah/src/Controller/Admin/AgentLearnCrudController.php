<?php
namespace App\Controller\Admin;

use App\Entity\Memory\AgentLearn;
use EasyCorp\Bundle\EasyAdminBundle\Config\Crud;
use EasyCorp\Bundle\EasyAdminBundle\Config\Filters;
use EasyCorp\Bundle\EasyAdminBundle\Controller\AbstractCrudController;
use EasyCorp\Bundle\EasyAdminBundle\Field\AssociationField;
use EasyCorp\Bundle\EasyAdminBundle\Field\TextareaField;

class AgentLearnCrudController extends AbstractCrudController
{
    public static function getEntityFqcn(): string
    {
        return AgentLearn::class;
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
            ->setEntityLabelInSingular('Learning')
            ->setEntityLabelInPlural('Learnings')
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