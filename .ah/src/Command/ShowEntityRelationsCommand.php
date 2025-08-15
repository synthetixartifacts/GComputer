<?php

// src/Command/ShowEntityRelationsCommand.php

namespace App\Command;

use Doctrine\ORM\EntityManagerInterface;
use Doctrine\ORM\Mapping\ClassMetadata;
use Symfony\Component\Console\Attribute\AsCommand;
use Symfony\Component\Console\Command\Command;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Output\OutputInterface;
use Symfony\Component\Console\Style\SymfonyStyle;

#[AsCommand(
    name: 'app:show-relations',
    description: 'Show entity relationships',
)]
class ShowEntityRelationsCommand extends Command
{
    public function __construct(
        private EntityManagerInterface $entityManager,
    ) {
        parent::__construct();
    }

    protected function execute(InputInterface $input, OutputInterface $output): int
    {
        $io = new SymfonyStyle($input, $output);
        $metadataFactory = $this->entityManager->getMetadataFactory();
        $entities = $metadataFactory->getAllMetadata();

        foreach ($entities as $metadata) {
            $className = str_replace('App\\Entity\\', '', $metadata->getName());
            $io->section($className);

            if (empty($metadata->associationMappings)) {
                $io->writeln('<comment>No relationships</comment>');
                continue;
            }

            foreach ($metadata->associationMappings as $fieldName => $mapping) {
                $targetEntity = str_replace('App\\Entity\\', '', $mapping->targetEntity);
                $relationType = $this->getRelationType($mapping);
                $io->writeln(sprintf(
                    '<info>%s</info> -> %s [<comment>%s</comment>]',
                    $fieldName,
                    $targetEntity,
                    $relationType
                ));
            }
        }

        return Command::SUCCESS;
    }

    private function getRelationType(object $mapping): string
    {
        return match(true) {
            $mapping instanceof \Doctrine\ORM\Mapping\OneToOneAssociationMapping => 'OneToOne',
            $mapping instanceof \Doctrine\ORM\Mapping\ManyToOneAssociationMapping => 'ManyToOne',
            $mapping instanceof \Doctrine\ORM\Mapping\OneToManyAssociationMapping => 'OneToMany',
            $mapping instanceof \Doctrine\ORM\Mapping\ManyToManyAssociationMapping => 'ManyToMany',
            default => 'Unknown'
        };
    }
}