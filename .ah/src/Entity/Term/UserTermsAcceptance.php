<?php

namespace App\Entity\Term;

use App\Entity\User\User;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;

#[ORM\Entity]
class UserTermsAcceptance
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column(type: 'integer')]
    private ?int $id = null;

    #[ORM\ManyToOne(targetEntity: User::class)]
    #[ORM\JoinColumn(nullable: false)]
    private User $user;

    #[ORM\ManyToOne(targetEntity: TermsOfUse::class)]
    #[ORM\JoinColumn(nullable: false)]
    private TermsOfUse $termsOfUse;

    #[ORM\Column(type: 'datetime')]
    private \DateTimeInterface $acceptedAt;

    // Getters and setters

    public function getId(): ?int
    {
        return $this->id;
    }

    public function getAcceptedAt(): ?\DateTimeInterface
    {
        return $this->acceptedAt;
    }

    public function setAcceptedAt(\DateTimeInterface $acceptedAt): static
    {
        $this->acceptedAt = $acceptedAt;

        return $this;
    }

    public function getUser(): ?User
    {
        return $this->user;
    }

    public function setUser(?User $user): static
    {
        $this->user = $user;

        return $this;
    }

    public function getTermsOfUse(): ?TermsOfUse
    {
        return $this->termsOfUse;
    }

    public function setTermsOfUse(?TermsOfUse $termsOfUse): static
    {
        $this->termsOfUse = $termsOfUse;

        return $this;
    }
}