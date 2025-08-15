<?php

namespace App\Entity\Ai;

use App\Entity\Ai\AIAgent;
use App\Entity\Ai\AIModel;
use App\Entity\User\Team;
use Doctrine\DBAL\Types\Types;
use Doctrine\Common\Collections\Collection;
use Symfony\Component\Validator\Constraints as Assert;
use Doctrine\Common\Collections\ArrayCollection;

use Doctrine\ORM\Mapping as ORM;
#[ORM\Entity]
#[ORM\HasLifecycleCallbacks]
class AIAgentArchive
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column(type: 'integer')]
    private ?int $id = null;

    #[ORM\Column(type: 'string', length: 50)]
    private ?string $code = null;

    #[ORM\Column(type: 'string', length: 255)]
    private string $name;

    #[ORM\Column(type: 'text')]
    private string $description = '';

    #[ORM\Column(type: 'string', length: 50)]
    private ?string $version = null;

    #[ORM\Column(type: 'boolean')]
    private bool $enable = true;

    #[ORM\Column(type: 'boolean')]
    private bool $isSystem = false;

    #[ORM\Column(type: 'text', nullable: true)]
    private ?string $systemPrompt = null;

    #[ORM\Column(type: 'text', nullable: true)]
    private ?string $memory = null;

    #[ORM\Column(type: 'text')]
    #[Assert\Json]
    private string $params = '{}';

    #[ORM\Column(type: 'text')]
    #[Assert\Json]
    private string $configuration = '{}';

    #[ORM\ManyToMany(targetEntity: Team::class, inversedBy: "agents")]
    private Collection $teams;

    #[ORM\ManyToOne(targetEntity: AIModel::class, inversedBy: 'agents')]
    #[ORM\JoinColumn(nullable: false)]
    private AIModel $model;

    #[ORM\Column(type: 'datetime')]
    private \DateTime $createdAt;

    #[ORM\Column(type: 'datetime')]
    private \DateTime $updatedAt;

    public function __construct()
    {
        $this->teams = new ArrayCollection();
    }

    public function toArray() {
        return [
            'id'            => $this->getId(),
            'code'          => $this->getCode(),
            'name'          => $this->getName(),
            'description'   => $this->getDescription(),
            'version'       => $this->getVersion(),
            'enable'        => $this->getEnable(),
            'isSystem'      => $this->isSystem(),
            'systemPrompt'  => $this->getSystemPrompt(),
            'memory'        => $this->getMemory(),
            'params'        => $this->getParamsArray(),
            'configuration' => $this->getConfigurationArray(),
            'model'         => $this->getModel()->toArray(),
            'created_at'    => $this->getCreatedAt(),
            'updated_at'    => $this->getUpdatedAt(),
        ];
    }

    public function __toString(): string
    {
        return $this->name . ' - ' . $this->version;
    }

    public function setFromAIAgent(AIAgent $agent): static
    {
        $this->setName($agent->getName());
        $this->setCode($agent->getCode());
        $this->setName($agent->getName());
        $this->setDescription($agent->getDescription());
        $this->setVersion($agent->getVersion());
        $this->setEnable(false);
        $this->setIsSystem($agent->isSystem());
        $this->setSystemPrompt($agent->getSystemPrompt());
        $this->setMemory($agent->getMemory());
        $this->setParams($agent->getParams());
        $this->setConfiguration($agent->getConfiguration());
        $this->setModel($agent->getModel());

        return $this;
    }

    public function getId(): ?int
    {
        return $this->id;
    }

    public function getEnable(): ?bool
    {
        return $this->enable;
    }

    public function setEnable(bool $enable): static
    {
        $this->enable = $enable;

        return $this;
    }

    public function isSystem(): ?bool
    {
        return $this->isSystem;
    }

    public function setIsSystem(bool $isSystem): static
    {
        $this->isSystem = $isSystem;

        return $this;
    }

    public function getCodeAndVersion(): string
    {
        return $this->code . '_' . $this->version;
    }

    public function getCode(): ?string
    {
        return $this->code;
    }

    public function setCode(string $code): static
    {
        $this->code = $code;

        return $this;
    }

    public function getName(): ?string
    {
        return $this->name;
    }

    public function setName(string $name): static
    {
        $this->name = $name;

        return $this;
    }

    public function getDescription(): ?string
    {
        return $this->description;
    }

    public function setDescription(string $description): static
    {
        $this->description = $description;

        return $this;
    }

    public function incrementVersion(): void
    {
        $this->version = $this->getVersion() + 1;
    }

    public function getVersion(): ?string
    {
        return $this->version;
    }

    public function setVersion(string $version): static
    {
        $this->version = $version;

        return $this;
    }

    public function getSystemPrompt(): ?string
    {
        return $this->systemPrompt;
    }

    public function setSystemPrompt(?string $systemPrompt): static
    {
        $this->systemPrompt = $systemPrompt;

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

    public function getParams(): string
    {
        return $this->params;
    }

    public function getParamsArray(): array
    {
        return json_decode($this->getParams(), true);
    }

    public function setParams(string $params): static
    {
        $this->params = $params;

        return $this;
    }

    public function getConfiguration(): string
    {
        return $this->configuration;
    }

    public function getConfigurationArray(): array
    {
        return json_decode($this->getConfiguration(), true);
    }

    public function setConfiguration(string $configuration): static
    {
        $this->configuration = $configuration;

        return $this;
    }

    public function getModel(): ?AIModel
    {
        return $this->model;
    }

    public function setModel(?AIModel $model): static
    {
        $this->model = $model;

        return $this;
    }

    public function isEnable(): ?bool
    {
        return $this->enable;
    }

    public function getTeams(): Collection
    {
        return $this->teams;
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

    public function setSystem(bool $isSystem): static
    {
        $this->isSystem = $isSystem;

        return $this;
    }
}
