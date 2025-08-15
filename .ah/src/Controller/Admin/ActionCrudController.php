<?php

namespace App\Controller\Admin;

use App\Entity\Action\Action;
use EasyCorp\Bundle\EasyAdminBundle\Controller\AbstractCrudController;
use EasyCorp\Bundle\EasyAdminBundle\Field\TextareaField;
use EasyCorp\Bundle\EasyAdminBundle\Field\DateTimeField;
use EasyCorp\Bundle\EasyAdminBundle\Field\ChoiceField;
use EasyCorp\Bundle\EasyAdminBundle\Field\TextField;
use EasyCorp\Bundle\EasyAdminBundle\Config\Crud;

class ActionCrudController extends AbstractCrudController
{
    public const SETTINGS_FIELDS = [
        'can_be_stopped' => [
            'type'    => 'boolean',
            'default' => true,
        ],
        'can_be_stacked' => [
            'type'    => 'boolean',
            'default' => true,
        ],
        'has_state' => [
            'type'    => 'boolean',
            'default' => false,
        ],
        'clear_others' => [
            'type'    => 'boolean',
            'default' => false,
        ]
    ];

    public static function getEntityFqcn(): string
    {
        return Action::class;
    }

    public function configureFields(string $pageName): iterable
    {
        $context = $this->getContext();
        $entity  = $context?->getEntity()?->getInstance();

        $paramsValue = $entity ? $this->formatJsonField($entity->getType() ?? '{}', true) : $this->formatJsonField(null, true);

        return [
            TextField::new('code'),
            TextField::new('title'),
            TextareaField::new('description'),
            ChoiceField::new('type')
                ->setChoices([
                    'actionFile' => 'actionFile',
                ]),
            TextareaField::new('value')->hideOnIndex()->setFormTypeOption('data', $paramsValue),
            DateTimeField::new('updatedAt')->hideOnForm(),
        ];
    }

    public function configureCrud(Crud $crud): Crud
    {
        return $crud
            ->setDefaultSort(['updatedAt' => 'DESC']);
    }

    private function getDefaultParams(): array
    {
        $params = [];
        foreach (self::SETTINGS_FIELDS as $key => $config) {
            $params[$key] = $config['default'];
        }
        return $params;
    }

    private function formatJsonField(?string $jsone): string
    {
        if (empty($json)) {
            return json_encode($this->getDefaultParams(),
                JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES
            );
        }

        $array    = json_decode($json, true) ?? [];
        $defaults = $this->getDefaultParams();

        // Merge existing values with defaults, ensuring new fields are added
        $merged = array_merge($defaults, $array);

        return json_encode($merged, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    }
}
