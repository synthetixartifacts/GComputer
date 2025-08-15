<?php

namespace App\Repository;

use App\Entity\Settings;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

class SettingsRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, Settings::class);
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
        return $setting ? $setting->getValue() : null;
    }

    public function setSetting(string $code, string $value): void
    {
        $setting = $this->findOneBy(['code' => $code]);
        if (!$setting) {
            $setting = new Settings();
            $setting->setCode($code);
        }
        $setting->setValue($value);
        $this->getEntityManager()->persist($setting);
        $this->getEntityManager()->flush();
    }
}