<?php

namespace App\Entity\User;

use App\Entity\User\Team;
use App\Entity\Ai\AIAgent;
use App\Entity\Term\UserTermsAcceptance;
use App\Repository\User\UserRepository;
use Doctrine\Common\Collections\Collection;
use Doctrine\Common\Collections\ArrayCollection;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Bridge\Doctrine\Validator\Constraints\UniqueEntity;
use Symfony\Component\Security\Core\User\PasswordAuthenticatedUserInterface;
use Symfony\Component\Security\Core\User\UserInterface;
use Symfony\Component\Uid\Uuid;

#[ORM\Entity(repositoryClass: UserRepository::class)]
#[ORM\HasLifecycleCallbacks]
#[ORM\UniqueConstraint(name: 'UNIQ_IDENTIFIER_EMAIL', fields: ['email'])]
#[UniqueEntity(fields: ['email'], message: 'There is already an account with this email')]
class User implements UserInterface, PasswordAuthenticatedUserInterface
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    #[ORM\Column(length: 180)]
    private ?string $email = null;

    #[ORM\Column]
    private array $roles = [];

    #[ORM\Column]
    private ?string $password = null;

    #[ORM\Column]
    private bool $isVerified = false;

    #[ORM\Column]
    private bool $enable = true;

    #[ORM\Column(length: 255)]
    private ?string $firstName = null;

    #[ORM\Column(length: 255)]
    private ?string $lastName = null;

    #[ORM\Column(length: 255, nullable: true)]
    private ?string $jobTitle = null;

    #[ORM\Column(type: 'text', nullable: true)]
    private ?string $bio = null;

    #[ORM\Column(length: 5)]
    private ?string $language = null;

    #[ORM\Column(type: 'text', nullable: true)]
    private ?string $memory = null;

    #[ORM\OneToOne(targetEntity: AIAgent::class, cascade: ['persist', 'remove'])]
    #[ORM\JoinColumn(nullable: true)]
    private ?AIAgent $personalAgent = null;

    #[ORM\ManyToMany(targetEntity: Team::class)]
    private Collection $teams;

    #[ORM\Column(nullable: true)]
    private ?string $oauthProvider = null;

    #[ORM\Column(nullable: true)]
    private ?string $oauthId = null;

    #[ORM\Column(type: 'json', nullable: true)]
    private ?array $oauthData = [];

    #[ORM\Column(type: 'datetime')]
    private \DateTime $createdAt;

    #[ORM\Column(type: 'datetime')]
    private \DateTime $updatedAt;

    #[ORM\Column(type: 'datetime', nullable: true)]
    private ?\DateTime $lastLogin = null;

    #[ORM\Column(length: 255, nullable: true)]
    private ?string $confirmationToken = null;

    #[ORM\OneToMany(targetEntity: UserTermsAcceptance::class, mappedBy: 'user')]
    private Collection $termsAcceptances;

    public function __construct()
    {
        $this->teams            = new ArrayCollection();
        $this->termsAcceptances = new ArrayCollection();
    }

    public function toArray() {
        return [
            // 'id'             => $this->getId(),
            'email'          => $this->getEmail(),
            'first_name'     => $this->getFirstName(),
            'last_name'      => $this->getLastName(),
            'job_title'      => $this->getJobTitle(),
            'bio'            => $this->getBio(),
            'language'       => $this->getLanguage(),
            'memory'         => $this->getMemory(),
            // 'enable'         => $this->isEnable(),
            // 'is_verified'    => $this->isVerified(),
            // 'personal_agent' => $this->getPersonalAgent(),
            // 'teams'          => $this->getTeams(),
            // 'created_at'     => $this->getCreatedAt(),
            // 'updated_at'     => $this->getUpdatedAt(),
            // 'last_login'     => $this->getLastLogin(),
        ];
    }

    public function __toString(): string
    {
        return $this->firstName . ' ' . $this->lastName;
    }

    public function getId(): ?int
    {
        return $this->id;
    }

    public function getFirstName(): ?string
    {
        return $this->firstName;
    }

    public function setFirstName(string $firstName): static
    {
        $this->firstName = $firstName;

        return $this;
    }

    public function getLastName(): ?string
    {
        return $this->lastName;
    }

    public function setLastName(string $lastName): static
    {
        $this->lastName = $lastName;

        return $this;
    }

    public function getJobTitle(): ?string
    {
        return $this->jobTitle;
    }

    public function setJobTitle(?string $jobTitle): static
    {
        $this->jobTitle = $jobTitle;

        return $this;
    }

    public function getBio(): ?string
    {
        return $this->bio;
    }

    public function setBio(?string $bio): static
    {
        $this->bio = $bio;

        return $this;
    }

    public function getLanguage(): ?string
    {
        return $this->language;
    }

    public function setLanguage(string $language): static
    {
        $this->language = $language;

        return $this;
    }

    public function getMemory(): ?string
    {
        return $this->memory;
    }

    public function setMemory(?string $memory): static
    {
        $this->memory = $memory;

        return $this;
    }

    public function getEmail(): ?string
    {
        return $this->email;
    }

    public function setEmail(string $email): static
    {
        $this->email = $email;

        return $this;
    }

    public function getUserIdentifier(): string
    {
        return (string) $this->email;
    }

    public function getRoles(): array
    {
        $roles = $this->roles;

        // guarantee every user at least has ROLE_USER
        $roles[] = 'ROLE_USER';

        return array_unique($roles);
    }

    public function setRoles(array $roles): static
    {
        $this->roles = $roles;

        return $this;
    }

    public function isUserManager(): bool
    {
        return in_array('ROLE_USER_MANAGER', $this->getRoles());
    }

    public function isAgentManager(): bool
    {
        return in_array('ROLE_AGENT_MANAGER', $this->getRoles());
    }

    public function isSystemManager(): bool
    {
        return in_array('ROLE_SYSTEM_MANAGER', $this->getRoles());
    }

    public function getTeams(): array
    {
        return $this->teams->toArray();
    }

    public function addTeam(Team $team): static
    {
        if (!$this->teams->contains($team)) {
            $this->teams->add($team);
        }
        return $this;
    }

    public function removeTeam(Team $team): static
    {
        $this->teams->removeElement($team);
        return $this;
    }

    public function getOauthProvider(): ?string
    {
        return $this->oauthProvider;
    }

    public function setOauthProvider(?string $oauthProvider): static
    {
        $this->oauthProvider = $oauthProvider;
        return $this;
    }

    public function getOauthId(): ?string
    {
        return $this->oauthId;
    }

    public function setOauthId(?string $oauthId): static
    {
        $this->oauthId = $oauthId;
        return $this;
    }

    public function getOauthData(): ?array
    {
        return $this->oauthData;
    }

    public function setOauthData(?array $oauthData): static
    {
        $this->oauthData = $oauthData;
        return $this;
    }

    /**
     * @see PasswordAuthenticatedUserInterface
     */
    public function getPassword(): string
    {
        return $this->password;
    }

    public function setPassword(string $password): static
    {
        $this->password = $password;

        return $this;
    }

    public function eraseCredentials(): void
    {
        // If you store any temporary, sensitive data on the user, clear it here
        // $this->plainPassword = null;
    }

    public function isVerified(): bool
    {
        return $this->isVerified;
    }

    public function setVerified(bool $isVerified): static
    {
        $this->isVerified = $isVerified;

        return $this;
    }

    public function isEnable(): bool
    {
        return $this->enable;
    }

    public function setEnable(bool $enable): static
    {
        $this->enable = $enable;

        return $this;
    }

    public function getPersonalAgent(): ?AIAgent
    {
        return $this->personalAgent;
    }

    public function setPersonalAgent(?AIAgent $personalAgent): static
    {
        $this->personalAgent = $personalAgent;
        return $this;
    }

    public function getCreatedAt(): ?\DateTimeInterface
    {
        return $this->createdAt;
    }

    public function setCreatedAt(\DateTimeInterface $createdAt): static
    {
        $this->createdAt = $createdAt;

        return $this;
    }

    public function getUpdatedAt(): ?\DateTimeInterface
    {
        return $this->updatedAt;
    }

    public function setUpdatedAt(\DateTimeInterface $updatedAt): static
    {
        $this->updatedAt = $updatedAt;

        return $this;
    }

    #[ORM\PrePersist]
    public function setCreatedAtValue(): void
    {
        $this->createdAt = new \DateTime();
    }

    #[ORM\PrePersist]
    #[ORM\PreUpdate]
    public function setUpdatedAtValue(): void
    {
        $this->updatedAt = new \DateTime();
    }

    public function getLastLogin(): ?\DateTimeInterface
    {
        return $this->lastLogin;
    }

    public function setLastLogin(?\DateTimeInterface $lastLogin): static
    {
        $this->lastLogin = $lastLogin;

        return $this;
    }

    public function generateConfirmationToken(): void
    {
        $this->confirmationToken = Uuid::v4()->toRfc4122();
    }

    public function getConfirmationToken(): ?string
    {
        return $this->confirmationToken;
    }

    public function setConfirmationToken(?string $confirmationToken): static
    {
        $this->confirmationToken = $confirmationToken;

        return $this;
    }

    public function getTermsAcceptances(): Collection
    {
        return $this->termsAcceptances;
    }

    public function addTermsAcceptance(UserTermsAcceptance $termsAcceptance): static
    {
        if (!$this->termsAcceptances->contains($termsAcceptance)) {
            $this->termsAcceptances[] = $termsAcceptance;
            $termsAcceptance->setUser($this);
        }

        return $this;
    }

    public function removeTermsAcceptance(UserTermsAcceptance $termsAcceptance): static
    {
        if ($this->termsAcceptances->removeElement($termsAcceptance)) {
            // set the owning side to null (unless already changed)
            if ($termsAcceptance->getUser() === $this) {
                $termsAcceptance->setUser(null);
            }
        }

        return $this;
    }

    public function getLastAcceptedTermsVersion(): ?int
    {
        if ($this->termsAcceptances->isEmpty()) {
            return null;
        }

        $lastAcceptance = $this->termsAcceptances->reduce(function(?UserTermsAcceptance $carry, UserTermsAcceptance $acceptance) {
            if ($carry === null || $acceptance->getAcceptedAt() > $carry->getAcceptedAt()) {
                return $acceptance;
            }
            return $carry;
        });

        return $lastAcceptance ? $lastAcceptance->getTermsOfUse()->getVersion() : null;
    }
}
