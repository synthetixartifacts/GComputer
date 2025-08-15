<?php

namespace App\Controller\Admin;

use App\Entity\Ai\AIProvider;
use EasyCorp\Bundle\EasyAdminBundle\Config\Crud;
use EasyCorp\Bundle\EasyAdminBundle\Controller\AbstractCrudController;
use EasyCorp\Bundle\EasyAdminBundle\Field\ChoiceField;
use EasyCorp\Bundle\EasyAdminBundle\Field\TextField;
use EasyCorp\Bundle\EasyAdminBundle\Field\UrlField;
use EasyCorp\Bundle\EasyAdminBundle\Field\TextareaField;

class AIProviderCrudController extends AbstractCrudController
{
    public static function getEntityFqcn(): string
    {
        return AIProvider::class;
    }

    public function persistEntity($entityManager, $entity): void
    {
        /** @var AIProvider $entity */
        $apiSecret = $entity->getEncryptedApiSecret();
        if ($apiSecret !== null) {
            $entity->setApiSecret($apiSecret, $_ENV['ENCRYPTION_KEY']);
        }

        parent::persistEntity($entityManager, $entity);
    }

    public function updateEntity($entityManager, $entity): void
    {
        /** @var AIProvider $entity */
        $apiSecret = $entity->getEncryptedApiSecret();
        if ($apiSecret !== null) {
            $entity->setApiSecret($apiSecret, $_ENV['ENCRYPTION_KEY']);
        }

        parent::updateEntity($entityManager, $entity);
    }

    public function configureCrud(Crud $crud): Crud
    {
        return $crud
            ->setEntityLabelInSingular('AI Provider')
            ->setEntityLabelInPlural('AI Providers')
            ->setSearchFields(['code', 'name', 'url'])
            ->setDefaultSort(['name' => 'ASC']);
    }

    public function configureFields(string $pageName): iterable
    {
        return [
            TextField::new('name'),
            TextField::new('code'),
            UrlField::new('url'),
            ChoiceField::new('authentication')
                ->setChoices([
                    'Bearer'      => 'bearer',
                    'x-api-key'   => 'x-api-key',
                    'Credentials' => 'credentials',
                    'no'          => 'no',
                ]),
            TextareaField::new('encryptedApiSecret')
                ->hideOnIndex()
                ->setHelp('This field will be encrypted before storage.'),
            TextareaField::new('configuration')
                ->hideOnIndex(),
        ];
    }
}