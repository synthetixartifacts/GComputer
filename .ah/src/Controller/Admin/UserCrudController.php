<?php

namespace App\Controller\Admin;

use App\Entity\Admin\AdminSettings;
use App\Entity\User\User;
use App\Repository\AdminSettingsRepository;
use App\Repository\User\UserRepository;
use App\Service\User\EmailService;

use Doctrine\ORM\EntityManagerInterface;
use EasyCorp\Bundle\EasyAdminBundle\Config\Crud;
use EasyCorp\Bundle\EasyAdminBundle\Config\Action;
use EasyCorp\Bundle\EasyAdminBundle\Config\Actions;
use EasyCorp\Bundle\EasyAdminBundle\Controller\AbstractCrudController;
use EasyCorp\Bundle\EasyAdminBundle\Field\AssociationField;
use EasyCorp\Bundle\EasyAdminBundle\Field\BooleanField;
use EasyCorp\Bundle\EasyAdminBundle\Field\ChoiceField;
use EasyCorp\Bundle\EasyAdminBundle\Field\DateTimeField;
use EasyCorp\Bundle\EasyAdminBundle\Field\EmailField;
use EasyCorp\Bundle\EasyAdminBundle\Field\TextareaField;
use EasyCorp\Bundle\EasyAdminBundle\Field\TextField;
use RuntimeException;

class UserCrudController extends AbstractCrudController
{
    public function __construct(
        private EmailService $emailService,
        private EntityManagerInterface $entityManager,
        private UserRepository $userRepository,
        private AdminSettingsRepository $adminSettingsRepository,
    ) {}

    public static function getEntityFqcn(): string
    {
        return User::class;
    }

    public function configureActions(Actions $actions): Actions
    {
        $maxUsers = (int) $this->adminSettingsRepository->getSetting('max_user');
        $currentUserCount = $this->userRepository->count([]);

        if ($currentUserCount >= $maxUsers) {
            $this->addFlash('warning', sprintf('Maximum number of users (%d) reached. Cannot create new users.', $maxUsers));
            $actions->disable(Action::NEW);
        }

        return $actions;
    }

    public function configureCrud(Crud $crud): Crud
    {
        return $crud->setDefaultSort(['lastLogin' => 'DESC']);
    }

    public function configureFields(string $pageName): iterable
    {
        return [
            EmailField::new('email')->hideOnIndex(),
            TextField::new('firstName'),
            TextField::new('lastName'),
            TextField::new('jobTitle')->setRequired(false),
            TextareaField::new('bio')->hideOnIndex()->setRequired(false),
            TextareaField::new('memory')->hideOnIndex()->setRequired(false),
            TextField::new('password')
                ->hideOnIndex()
                ->hideOnDetail()
                ->onlyOnForms(),
            ChoiceField::new('roles')
                ->setChoices([
                    'User'  => 'ROLE_USER',
                    'User Manager' => 'ROLE_USER_MANAGER',
                    'Agent Manager' => 'ROLE_AGENT_MANAGER',
                    'System Manager' => 'ROLE_SYSTEM_MANAGER',
                    'Admin' => 'ROLE_ADMIN',
                ])
                ->allowMultipleChoices()
                ->renderAsBadges(),
            ChoiceField::new('language')
                ->setChoices([
                    'English' => 'en',
                    'French'  => 'fr',
                ])
                ->renderAsBadges(),
            AssociationField::new('personalAgent'),
            AssociationField::new('teams'),
            BooleanField::new('enable'),
            BooleanField::new('isVerified'),
            DateTimeField::new('lastLogin')
                ->setFormat('yyyy-MM-dd HH:mm:ss')
                ->setFormTypeOption('disabled', true)
        ];
    }

    public function persistEntity(EntityManagerInterface $entityManager, $entityInstance): void
    {
        $maxUsers = (int) $this->adminSettingsRepository->getSetting('max_user');
        $currentUserCount = $this->userRepository->count([]);

        if ($currentUserCount >= $maxUsers) {
            throw new RuntimeException(sprintf('Maximum number of users (%d) reached', $maxUsers));
        }

        $entityInstance->generateConfirmationToken();

        parent::persistEntity($entityManager, $entityInstance);

        // Send Invitation link
        $this->emailService->sendConfirmationEmail($entityInstance);
    }

}
