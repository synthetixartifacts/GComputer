<?php

namespace App\Repository;

use App\Entity\Discussion\Discussion;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

class DiscussionRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, Discussion::class);
    }

    public function save(Discussion $discussion, bool $flush = false): void
    {
        if ($discussion->getId() === null) {
            $discussion->setUniqueKey($this->generateUniqueKey());
        }

        $this->getEntityManager()->persist($discussion);

        if ($flush) {
            $this->getEntityManager()->flush();
        }
    }

    private function generateUniqueKey(): string
    {
        $timestamp    = microtime(true);
        $randomString = bin2hex(random_bytes(8));
        return hash('sha256', $timestamp . $randomString);
    }

    public function remove(Discussion $discussion, bool $flush = false): void
    {
        $this->getEntityManager()->remove($discussion);

        if ($flush) {
            $this->getEntityManager()->flush();
        }
    }

    public function findLastByUser($userId)
    {
        return $this->createQueryBuilder('d')
            ->andWhere('d.user = :userId')
            ->andWhere('d.enable = :enable')
            ->setParameter('userId', $userId)
            ->setParameter('enable', true)
            ->orderBy('d.updatedAt', 'DESC')
            ->setMaxResults(40)
            ->getQuery()
            ->getResult();
    }

    public function findByUser($userId)
    {
        return $this->createQueryBuilder('d')
            ->andWhere('d.user = :userId')
            ->andWhere('d.enable = :enable')
            ->setParameter('userId', $userId)
            ->setParameter('enable', true)
            ->orderBy('d.updatedAt', 'ASC')
            ->getQuery()
            ->getResult();
    }

    public function findFavorites($userId)
    {
        return $this->createQueryBuilder('d')
            ->andWhere('d.user = :userId')
            ->andWhere('d.isFavorite = :isFavorite')
            ->andWhere('d.enable = :enable')
            ->setParameter('userId', $userId)
            ->setParameter('isFavorite', true)
            ->setParameter('enable', true)
            ->orderBy('d.updatedAt', 'DESC')
            ->getQuery()
            ->getResult();
    }

    public function findByKeyAndUser(string $key, $userId): ?Discussion
    {
        return $this->createQueryBuilder('d')
            ->andWhere('d.uniqueKey = :key')
            ->andWhere('d.user = :userId')
            ->andWhere('d.enable = :enable')
            ->setParameter('key', $key)
            ->setParameter('userId', $userId)
            ->setParameter('enable', true)
            ->getQuery()
            ->getOneOrNullResult();
    }


    public function getWeeklyDiscussionsLast2Months(): array
    {
        $conn = $this->getEntityManager()->getConnection();
        $end = new \DateTime();
        $start = (clone $end)->modify('-2 months');

        $sql = "
            SELECT COUNT(d.id) as count,
                   DATE_FORMAT(d.created_at, '%Y-%v') as weekYear
            FROM discussion d
            WHERE d.created_at BETWEEN ? AND ?
            AND (d.user_id IS NULL OR d.user_id NOT IN (3, 19))
            GROUP BY weekYear
            ORDER BY weekYear ASC
        ";

        $stmt = $conn->executeQuery($sql, [
            $start->format('Y-m-d H:i:s'),
            $end->format('Y-m-d H:i:s'),
        ]);

        return $stmt->fetchAllAssociative();
    }

    public function getMonthlyDiscussionsLastYear(): array
    {
        $conn = $this->getEntityManager()->getConnection();
        $end = new \DateTime();
        $start = (clone $end)->modify('-1 year');

        $sql = "
            SELECT COUNT(d.id) as count,
                   DATE_FORMAT(d.created_at, '%Y-%m') as monthYear
            FROM discussion d
            WHERE d.created_at BETWEEN ? AND ?
            AND (d.user_id IS NULL OR d.user_id NOT IN (3, 19))
            GROUP BY monthYear
            ORDER BY monthYear ASC
        ";

        $stmt = $conn->executeQuery($sql, [
            $start->format('Y-m-d H:i:s'),
            $end->format('Y-m-d H:i:s'),
        ]);

        return $stmt->fetchAllAssociative();
    }

    /**
     * Gets the weekly message count for the last 2 months
     */
    public function getWeeklyMessagesLast2Months(): array
    {
        $conn = $this->getEntityManager()->getConnection();
        $end = new \DateTime();
        $start = (clone $end)->modify('-2 months');

        $sql = "
            SELECT COUNT(m.id) as count,
                   DATE_FORMAT(m.created_at, '%Y-%v') as weekYear
            FROM message m
            INNER JOIN discussion d ON m.discussion_id = d.id
            WHERE m.created_at BETWEEN ? AND ?
            AND (d.user_id IS NULL OR d.user_id NOT IN (3, 19))
            GROUP BY weekYear
            ORDER BY weekYear ASC
        ";

        $stmt = $conn->executeQuery($sql, [
            $start->format('Y-m-d H:i:s'),
            $end->format('Y-m-d H:i:s'),
        ]);

        return $stmt->fetchAllAssociative();
    }

    /**
     * Gets the monthly message count for the last year
     */
    public function getMonthlyMessagesLastYear(): array
    {
        $conn = $this->getEntityManager()->getConnection();
        $end = new \DateTime();
        $start = (clone $end)->modify('-1 year');

        $sql = "
            SELECT COUNT(m.id) as count,
                   DATE_FORMAT(m.created_at, '%Y-%m') as monthYear
            FROM message m
            INNER JOIN discussion d ON m.discussion_id = d.id
            WHERE m.created_at BETWEEN ? AND ?
            AND (d.user_id IS NULL OR d.user_id NOT IN (3, 19))
            GROUP BY monthYear
            ORDER BY monthYear ASC
        ";

        $stmt = $conn->executeQuery($sql, [
            $start->format('Y-m-d H:i:s'),
            $end->format('Y-m-d H:i:s'),
        ]);

        return $stmt->fetchAllAssociative();
    }


    /**
     * Retrieves usage stats in an optional date range.
     * If no $startDate and $endDate are provided, it returns global usage stats.
     * Excludes users with IDs 3 and 19 from statistics.
     *
     * @param \DateTimeInterface|null $startDate
     * @param \DateTimeInterface|null $endDate
     * @return array Example: [
     *     'nbDiscussions' => int,
     *     'nbMessages'   => int,
     *     'activeUsers'  => int
     * ]
     */
    public function getUsageStats(\DateTimeInterface $startDate = null, \DateTimeInterface $endDate = null): array
    {
        $qb = $this->createQueryBuilder('d')
            ->select(
                'COUNT(DISTINCT d.id) AS nbDiscussions',
                'COUNT(m.id) AS nbMessages'
            )
            ->leftJoin('d.messages', 'm')
            ->andWhere('d.user IS NULL OR d.user NOT IN (:excludedUserIds)')
            ->setParameter('excludedUserIds', [3, 19]);

        // Date range filter if provided
        if ($startDate && $endDate) {
            $qb->andWhere('d.createdAt BETWEEN :start AND :end')
            ->setParameter('start', $startDate)
            ->setParameter('end', $endDate);
        }

        $result = $qb->getQuery()->getSingleResult();

        // Get active users count (users with at least one message in the time period)
        $activeUsersQb = $this->createQueryBuilder('d')
            ->select('COUNT(DISTINCT d.user) AS activeUsers')
            ->innerJoin('d.messages', 'm')
            ->andWhere('d.user IS NOT NULL')
            ->andWhere('d.user NOT IN (:excludedUserIds)')
            ->setParameter('excludedUserIds', [3, 19]);

        // Apply same date filter for active users
        if ($startDate && $endDate) {
            $activeUsersQb->andWhere('m.createdAt BETWEEN :start AND :end')
                ->setParameter('start', $startDate)
                ->setParameter('end', $endDate);
        }

        $activeUsersResult = $activeUsersQb->getQuery()->getSingleResult();

        return [
            'nbDiscussions' => (int) ($result['nbDiscussions'] ?? 0),
            'nbMessages'    => (int) ($result['nbMessages'] ?? 0),
            'activeUsers'   => (int) ($activeUsersResult['activeUsers'] ?? 0),
        ];
    }

    /**
     * Gets quarterly stats for a fiscal year (starts in April)
     * Fiscal quarters: Q1 (Apr-Jun), Q2 (Jul-Sep), Q3 (Oct-Dec), Q4 (Jan-Mar)
     * 
     * @param int $fiscalYear The fiscal year (e.g., 2024 for fiscal year Apr 2024 - Mar 2025)
     * @return array Quarters with stats, example: [
     *     'Q1' => ['nbDiscussions' => int, 'nbMessages' => int, 'activeUsers' => int],
     *     'Q2' => ['nbDiscussions' => int, 'nbMessages' => int, 'activeUsers' => int],
     *     'Q3' => ['nbDiscussions' => int, 'nbMessages' => int, 'activeUsers' => int],
     *     'Q4' => ['nbDiscussions' => int, 'nbMessages' => int, 'activeUsers' => int],
     * ]
     */
    public function getQuarterlyStats(int $fiscalYear): array
    {
        $quarters = [];
        
        // Define fiscal quarters (fiscal year starts in April)
        $quarterDefinitions = [
            'Q1' => [
                'start' => new \DateTime("$fiscalYear-04-01 00:00:00"),
                'end' => new \DateTime("$fiscalYear-06-30 23:59:59")
            ],
            'Q2' => [
                'start' => new \DateTime("$fiscalYear-07-01 00:00:00"),
                'end' => new \DateTime("$fiscalYear-09-30 23:59:59")
            ],
            'Q3' => [
                'start' => new \DateTime("$fiscalYear-10-01 00:00:00"),
                'end' => new \DateTime("$fiscalYear-12-31 23:59:59")
            ],
            'Q4' => [
                'start' => new \DateTime(($fiscalYear + 1) . "-01-01 00:00:00"),
                'end' => new \DateTime(($fiscalYear + 1) . "-03-31 23:59:59")
            ]
        ];

        foreach ($quarterDefinitions as $quarter => $dates) {
            $quarters[$quarter] = $this->getUsageStats($dates['start'], $dates['end']);
        }

        return $quarters;
    }

}
