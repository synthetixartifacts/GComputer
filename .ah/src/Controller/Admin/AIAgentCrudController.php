<?php

namespace App\Controller\Admin;

use App\Entity\Ai\AIAgent;
use App\Entity\Ai\AIAgentArchive;
use App\Entity\Memory\Memory;
use App\Repository\Ai\AgentRepository;

use EasyCorp\Bundle\EasyAdminBundle\Controller\AbstractCrudController;
use EasyCorp\Bundle\EasyAdminBundle\Field\TextField;
use EasyCorp\Bundle\EasyAdminBundle\Field\TextareaField;
use EasyCorp\Bundle\EasyAdminBundle\Field\AssociationField;
use EasyCorp\Bundle\EasyAdminBundle\Field\DateTimeField;
use EasyCorp\Bundle\EasyAdminBundle\Field\BooleanField;
use EasyCorp\Bundle\EasyAdminBundle\Field\ChoiceField;
use EasyCorp\Bundle\EasyAdminBundle\Config\Crud;
use EasyCorp\Bundle\EasyAdminBundle\Config\Filters;
use EasyCorp\Bundle\EasyAdminBundle\Field\ImageField;
use Symfony\Component\HttpFoundation\File\UploadedFile;
use EasyCorp\Bundle\EasyAdminBundle\Field\ArrayField;
use EasyCorp\Bundle\EasyAdminBundle\Field\FormField;
use Doctrine\ORM\EntityManagerInterface;
use EasyCorp\Bundle\EasyAdminBundle\Config\Action;
use EasyCorp\Bundle\EasyAdminBundle\Config\Actions;
use EasyCorp\Bundle\EasyAdminBundle\Router\AdminUrlGenerator;
use Symfony\Component\HttpFoundation\Response;

class AIAgentCrudController extends AbstractCrudController
{
    public const PARAMS_FIELDS = [
        // 'max_tokens' => [
        //     'type'    => 'number',
        //     'default' => 4000,
        //     'label'   => 'Max Tokens',
        // ],
    ];

    public function __construct(
        private EntityManagerInterface $entityManager,
        private AgentRepository $agentRepository,
        private AdminUrlGenerator $adminUrlGenerator
    ) {}

    public static function getEntityFqcn(): string
    {
        return AIAgent::class;
    }

    public function configureFields(string $pageName): iterable
    {
        $context = $this->getContext();
        $entity  = $context?->getEntity()?->getInstance();

        // Format JSON fields if entity exists
        $paramsValue = $entity ? $this->formatJsonField($entity->getParams() ?? '{}', true) : $this->formatJsonField(null, true);
        $configValue = $entity ? $this->formatJsonField($entity->getConfiguration() ?? '{}', false) : $this->formatJsonField(null, false);

        return [
            FormField::addPanel('Basic Information')
                ->setIcon('fas fa-info-circle')
                ->collapsible()
                ->renderCollapsed(),
            TextField::new('name'),
            TextField::new('code'),
            TextField::new('version'),
            TextField::new('description')->hideOnIndex(),
            ImageField::new('image')
                ->hideOnIndex()
                ->setBasePath('uploads/agents/')
                ->setUploadDir('public/uploads/agents/')
                ->setUploadedFileNamePattern(
                    fn(UploadedFile $file): string => $this->generateFilename($file)
                )
                ->setRequired(false),

            FormField::addPanel('Settings')
                ->setIcon('fas fa-cogs')
                ->collapsible()
                ->renderCollapsed(),
            BooleanField::new('enable'),
            BooleanField::new('isSystem'),
            BooleanField::new('public'),

            FormField::addPanel('Prompt')
                ->setIcon('fas fa-file-contract')
                ->collapsible()
                ->renderCollapsed(),
            TextareaField::new('defaultMessage')
                ->hideOnIndex()
                ->setFormTypeOption('attr', [
                    'rows' => 10,
                ]),
            TextareaField::new('systemPrompt')
                ->hideOnIndex()
                ->setFormTypeOption('attr', [
                    'rows' => 60,
                ]),

            FormField::addPanel('Configuration')
                ->setIcon('fas fa-robot')
                ->collapsible()
                ->renderCollapsed(),
            AssociationField::new('model'),
            TextareaField::new('params')
                ->hideOnIndex()
                ->setFormTypeOption('attr', [
                    'data-json-editor' => true,
                    'rows' => 3,
                ])
                ->setFormTypeOption('data', $paramsValue),
            TextareaField::new('configuration')
                ->hideOnIndex()
                ->setFormTypeOption('attr', [
                    'data-json-editor' => true,
                    'rows' => 25,
                ])
                ->setFormTypeOption('data', $configValue)
                ->setHelp('customInstruction: no | default | user'),

            FormField::addPanel('Memory Configuration')
                ->setIcon('fas fa-memory')
                ->collapsible()
                ->renderCollapsed(),
            ChoiceField::new('memoryList')
                ->hideOnIndex()
                ->setChoices($this->getMemoryList())
                ->allowMultipleChoices(true)
                ->renderExpanded()
                ->setFormTypeOption('mapped', false)
                ->setFormTypeOption('multiple', true)
                ->setFormTypeOption('data', $entity ? $this->getCurrentEntityMemoryArray($entity) : []),

            FormField::addPanel('Actions Configuration')
                ->setIcon('fas fa-bolt')
                ->collapsible()
                ->renderCollapsed(),
            AssociationField::new('actions'),

            FormField::addPanel('Teams & Timestamps')
                ->setIcon('fas fa-users')
                ->collapsible()
                ->renderCollapsed(),
            AssociationField::new('managers')->hideOnIndex(),
            AssociationField::new('teams')->hideOnIndex(),
            DateTimeField::new('updatedAt')
                ->setFormat('yyyy-MM-dd HH:mm:ss')
                ->setFormTypeOption('disabled', true)
        ];
    }

    public function configureActions(Actions $actions): Actions
    {
        $duplicate = Action::new('duplicate')
            ->linkToCrudAction('duplicateAgent')
            ->setLabel('Duplicate')
            ->addCssClass('btn btn-info');

        return $actions
            ->add(Crud::PAGE_INDEX, $duplicate)
            ->reorder(Crud::PAGE_INDEX, [Action::EDIT, Action::DELETE, 'duplicate']);
    }

    public function duplicateAgent(): Response
    {
        $context = $this->getContext();
        $id = $context->getRequest()->query->get('entityId');
        $originalAgent = $this->entityManager->getRepository(AIAgent::class)->find($id);

        if (!$originalAgent) {
            throw $this->createNotFoundException('Agent not found');
        }

        $newAgent = clone $originalAgent;
        $randomSuffix = '_' . random_int(1000, 9999);
        $newAgent->setCode($originalAgent->getCode() . $randomSuffix);
        $newAgent->setVersion('1'); // Reset version for the new agent

        // Handle relationships properly
        // Note: Some relationships may need special handling depending on your entity structure

        $this->entityManager->persist($newAgent);
        $this->entityManager->flush();

        $url = $this->adminUrlGenerator
            ->setController(self::class)
            ->setAction(Action::DETAIL)
            ->setEntityId($newAgent->getId())
            ->generateUrl();

        return $this->redirect($url);
    }

    private function formatJsonField(?string $json, bool $isParams = false): string
    {
        if (empty($json)) {
            return json_encode($isParams ? $this->getDefaultParams() : $this->getDefaultConfiguration(),
                JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES
            );
        }

        $array = json_decode($json, true) ?? [];
        $defaults = $isParams ? $this->getDefaultParams() : $this->getDefaultConfiguration();

        // Merge existing values with defaults, ensuring new fields are added
        $merged = array_merge($defaults, $array);

        return json_encode($merged, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    }

    private function getDefaultParams(): array
    {
        $params = [];
        foreach (self::PARAMS_FIELDS as $key => $config) {
            $params[$key] = $config['default'];
        }
        return $params;
    }

    private function getDefaultConfiguration(): array
    {
        $config = [];
        foreach (AIAgent::CONFIGURATION_FIELDS as $key => $field) {
            $config[$key] = $field['default'];
        }
        return $config;
    }


    /*********
     * Memory
     *********/
    private function getMemoryList(): array
    {
        $memories = $this->entityManager
            ->getRepository(Memory::class)
            ->createQueryBuilder('m')
            ->orderBy('m.title', 'ASC')
            ->getQuery()
            ->getResult();

        $memoryChoices = [];
        foreach ($memories as $memory) {
            $label = $memory->getTitle() . ' - ['. $memory->getType() . ']';
            $memoryChoices[$label] = $memory->getCode();
        }

        return $memoryChoices;
    }

    private function getCurrentEntityMemoryArray(AIAgent $agent): array
    {
        $memoryList  = $this->agentRepository->getMemoryListArrayForAgent($agent);
        $returnArray = [];

        foreach ($memoryList as $memory) {
            $returnArray[] = $memory->getCode();
        }

        return $returnArray;
    }

    private function parseAndSetMemory(AIAgent $agent): void
    {
        $request = $this->getContext()->getRequest();
        $memoryList = $request->request->all()['AIAgent']['memoryList'] ?? [];

        if (!empty($memoryList)) {
            $memory = '- ' . implode("\n- ", $memoryList);
            $agent->setMemory($memory);
        }
    }

    private function generateFilename(UploadedFile $file): string
    {
        $originalFilename = pathinfo($file->getClientOriginalName(), PATHINFO_FILENAME);
        $safeFilename = $this->slugify($originalFilename);
        return sprintf('%s-%s.%s', $safeFilename, uniqid(), $file->guessExtension());
    }

    private function slugify(string $string): string
    {
        return strtolower(trim(preg_replace('/[^A-Za-z0-9-]+/', '-', $string), '-'));
    }

    public function configureCrud(Crud $crud): Crud
    {
        return $crud
            ->setDefaultSort(['updatedAt' => 'DESC'])
            ->setSearchFields(['name', 'code', 'version']);
    }

    public function configureFilters(Filters $filters): Filters
    {
        return $filters
            ->add('enable')
            ->add('isSystem')
            ->add('model')
            ->add('teams');
    }

    public function persistEntity(EntityManagerInterface $entityManager, $entityInstance): void
    {
        if (!$entityInstance instanceof AIAgent) {
            return;
        }

        // Manage memory
        $this->parseAndSetMemory($entityInstance);

        $entityInstance->setVersion('1');
        $entityManager->persist($entityInstance);
        $entityManager->flush();
    }

    public function updateEntity(EntityManagerInterface $entityManager, $entityInstance): void
    {
        if (!$entityInstance instanceof AIAgent) {
            return;
        }

        // Manage memory
        $this->parseAndSetMemory($entityInstance);

        // Check if the image field is empty and the entity already has an image
        if (empty($entityInstance->getImage()) && $entityInstance->getId()) {
            $originalEntity = $entityManager->getRepository(AIAgent::class)->find($entityInstance->getId());
            if ($originalEntity && $originalEntity->getImage()) {
                $entityInstance->setImage($originalEntity->getImage());
            }
        }

        $this->archiveAndSave($entityManager, $entityInstance);
    }

    private function archiveAndSave(EntityManagerInterface $entityManager, AIAgent $agent): void
    {
        $currentArchive = new AIAgentArchive();
        $currentArchive->setFromAIAgent($agent);
        $entityManager->persist($currentArchive);

        $agent->incrementVersion();

        $entityManager->flush();
    }


}
