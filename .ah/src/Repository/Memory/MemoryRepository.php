<?php

namespace App\Repository\Memory;

use App\Entity\Memory\Memory;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

class MemoryRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, Memory::class);
    }

    public function getAllSettings(): array
    {
        return $this->createQueryBuilder('s')
            ->getQuery()
            ->getResult();
    }

    public function getMemoryByCode(string $code) {
        $setting = $this->findOneBy(['code' => $code]);
        return $setting ?? null;
    }

    public function getMemoryValue(string $code): ?string
    {
        $setting = $this->findOneBy(['code' => $code]);
        return $setting ? $setting->getValue() : null;
    }

    public function setMemory(string $code, string $value): void
    {
        $setting = $this->findOneBy(['code' => $code]);
        if (!$setting) {
            $setting = new Memory();
            $setting->setCode($code);
        }
        $setting->setValue($value);
        $this->getEntityManager()->persist($setting);
        $this->getEntityManager()->flush();
    }
}