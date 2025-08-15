<?php

namespace App\Repository;

use App\Entity\Admin\AdminSettings;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

class AdminSettingsRepository extends ServiceEntityRepository
{
    /**
     * Default settings used when a configuration doesn't exist in the database
     */
    private const DEFAULT_SETTINGS = [
        'max_user'                   => '10',
        'email_creation_origin'      => 'group-era.com',
        'default_mai_model_code'     => 'gpt_4.1',
        'default_vision_agent_code'  => 'gpt_4.1-mini',
        'default_whisper_agent_code' => 'whisper',
    ];

    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, AdminSettings::class);
    }

    public function getAllSettings(): array
    {
        return $this->createQueryBuilder('s')
            ->getQuery()
            ->getResult();
    }

    public function getSetting(string $code): ?string
    {
        $setting = $this->findOneBy(['code' => $code]);

        if ($setting) {
            return $setting->getValue();
        }

        // Return default value if exists, otherwise null
        return self::DEFAULT_SETTINGS[$code] ?? null;
    }

    public function setSetting(string $code, string $value): void
    {
        $setting = $this->findOneBy(['code' => $code]);
        if (!$setting) {
            $setting = new AdminSettings();
            $setting->setCode($code);
        }
        $setting->setValue($value);
        $this->getEntityManager()->persist($setting);
        $this->getEntityManager()->flush();
    }

    /**
     * Get all available settings (database + defaults)
     */
    public function getAllAvailableSettings(): array
    {
        $dbSettings = [];
        $settings = $this->getAllSettings();

        foreach ($settings as $setting) {
            $dbSettings[$setting->getCode()] = $setting->getValue();
        }

        // Merge database settings with defaults (database settings take precedence)
        return array_merge(self::DEFAULT_SETTINGS, $dbSettings);
    }
}