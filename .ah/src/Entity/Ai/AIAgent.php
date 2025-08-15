<?php

namespace App\Entity\Ai;

use App\Entity\Ai\AIModel;
use App\Entity\User\User;
use App\Entity\User\Team;
use App\Entity\Action\Action;
use App\Entity\Memory\CustomInstruction;
use App\Entity\Discussion\Discussion;
use App\Repository\Ai\AgentRepository;
use Doctrine\DBAL\Types\Types;
use Doctrine\Common\Collections\Collection;
use Symfony\Component\Validator\Constraints as Assert;
use Doctrine\Common\Collections\ArrayCollection;

use Doctrine\ORM\Mapping as ORM;

#[ORM\HasLifecycleCallbacks]
#[ORM\Entity(repositoryClass: AgentRepository::class)]
class AIAgent
{
    // Define configuration fields as a constant for global access
    public const CONFIGURATION_FIELDS = [
        'useMemory' => [
            'type'    => 'boolean',
            'default' => true,
            'label'   => 'Discussion Memory',
        ],
        'useRagSystemMemory' => [
            'type'    => 'boolean',
            'default' => false,
            'label'   => 'Access to RAG Memory',
        ],
        'canBrowseUrl' => [
            'type'    => 'boolean',
            'default' => true,
            'label'   => 'Can browse URL from user message',
        ],
        'addTime' => [
            'type'    => 'boolean',
            'default' => false,
            'label'   => 'Add Time',
        ],
        'fileMaxSize' => [
            'type'    => 'number',
            'default' => 5,
            'label'   => 'Max File Size (MB)',
        ],
        'fileAllowedExtensions' => [
            'type'    => 'json',
            'default' => ["png", "jpg", "jpeg", "pdf", "txt", "doc", "docx", "ppt", "pptx", "mp3", "wav", "mpeg", "webm"],
            'label'   => 'Allowed upload extensions',
        ],
        'customInstruction' => [
            'type'    => 'text',
            'default' => 'user',
            'label'   => 'customInstruction',
        ],
        'voiceEnable' => [
            'type'    => 'boolean',
            'default' => false,
        ],
        'autoVoiceEnable' => [
            'type'    => 'boolean',
            'default' => false,
        ],
    ];

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

    #[ORM\Column(type: 'string', length: 255, nullable: true)]
    private ?string $image = null;

    #[ORM\Column(type: 'boolean')]
    private bool $enable = true;

    #[ORM\Column(type: 'boolean')]
    private bool $isSystem = false;

    #[ORM\Column(type: 'boolean')]
    private bool $public = false;

    #[ORM\Column(type: 'text', nullable: true)]
    private ?string $systemPrompt = null;

    #[ORM\Column(type: 'text', nullable: true)]
    private ?string $memory = null;

    #[ORM\ManyToMany(targetEntity: Action::class)]
    #[ORM\JoinTable(name: 'aiagent_actions')]
    private Collection $actions;

    #[ORM\Column(type: 'text', nullable: true)]
    private ?string $defaultMessage = null;

    #[ORM\Column(type: 'text')]
    #[Assert\Json]
    private string $params = '{}';

    #[ORM\Column(type: 'text')]
    #[Assert\Json]
    private string $configuration = '{}';

    #[ORM\ManyToMany(targetEntity: Team::class, inversedBy: "agents")]
    private Collection $teams;

    #[ORM\ManyToMany(targetEntity: User::class)]
    #[ORM\JoinTable(name: 'aiagent_managers')]
    private Collection $managers;

    #[ORM\ManyToOne(targetEntity: AIModel::class, inversedBy: 'agents')]
    #[ORM\JoinColumn(nullable: false)]
    private AIModel $model;

    #[ORM\Column(type: 'datetime')]
    private ?\DateTimeInterface $createdAt = null;

    #[ORM\Column(type: 'datetime')]
    private \DateTime $updatedAt;

    #[ORM\OneToMany(targetEntity: CustomInstruction::class, mappedBy: 'agent', cascade: ['remove'])]
    private Collection $customInstructions;

    #[ORM\OneToMany(targetEntity: Discussion::class, mappedBy: 'aiAgent', cascade: ['remove'])]
    private Collection $discussions;

    public function __construct()
    {
        $this->teams    = new ArrayCollection();
        $this->managers = new ArrayCollection();
        $this->actions  = new ArrayCollection();
        $this->customInstructions = new ArrayCollection();
        $this->discussions = new ArrayCollection();
    }

    public function toArray($complete = false) {
        $agent = [
            'code'        => $this->getCode(),
            'name'        => $this->getName(),
            'description' => $this->getDescription(),
            'image'       => $this->getImageUrl(),
            'isPublic'    => $this->isPublic(),
        ];

        if ($complete) {
            $agent['defaultMessage'] = $this->getDefaultMessage();
            $agent['configuration']  = $this->getConfigurationWithDefaults();
        }

        return $agent;

        // return [
        //     'id'            => $this->getId(),
        //     'code'          => $this->getCode(),
        //     'name'          => $this->getName(),
        //     'description'   => $this->getDescription(),
        //     'image'         => $this->getImageUrl(),
        //     'version'       => $this->getVersion(),
        //     'enable'        => $this->getEnable(),
        //     'isSystem'      => $this->isSystem(),
        //     'isPublic'      => $this->isPublic(),
        //     'systemPrompt'  => $this->getSystemPrompt(),
        //     'memory'        => $this->getMemory(),
        //     'params'        => $this->getParamsArray(),
        //     'configuration' => $this->getConfigurationArray(),
        //     'teams'         => $this->getTeams()->toArray(),
        //     'managers'      => $this->getManagers()->toArray(),
        //     'model'         => $this->getModel()->toArray(),
        //     'created_at'    => $this->getCreatedAt(),
        //     'updated_at'    => $this->getUpdatedAt(),
        // ];
    }

    public function __toString(): string
    {
        return $this->code . ' - ' . $this->name . ' - ' . $this->version;
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

    public function isEnable(): ?bool
    {
        return $this->enable;
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

    public function isPublic(): ?bool
    {
        return $this->public;
    }

    public function setPublic(bool $public): static
    {
        $this->public = $public;
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

    public function getActions(): Collection
    {
        return $this->actions;
    }

    public function addAction(Action $action): static
    {
        if (!$this->actions->contains($action)) {
            $this->actions->add($action);
        }
        return $this;
    }

    public function removeAction(Action $action): static
    {
        $this->actions->removeElement($action);
        return $this;
    }

    public function hasAction(Action $action): bool
    {
        return $this->actions->contains($action);
    }

    public function getDefaultMessage(): ?string
    {
        return $this->defaultMessage;
    }

    public function setDefaultMessage(?string $defaultMessage): static
    {
        $this->defaultMessage = $defaultMessage;

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

    public function getConfigurationArray(): array
    {
        return json_decode($this->getConfiguration(), true);
    }

    public function getConfigurationByKey(string $key): mixed
    {
        $config = $this->getConfigurationWithDefaults();
        return $config[$key] ?? (self::CONFIGURATION_FIELDS[$key]['default'] ?? null);
    }

    public function getConfigurationWithDefaults(): array
    {
        $savedConfig = $this->getConfigurationArray();
        $defaults = [];

        foreach (self::CONFIGURATION_FIELDS as $key => $field) {
            $defaults[$key] = $field['default'];
        }

        return array_merge($defaults, $savedConfig);
    }

    public function getConfiguration(): string
    {
        return $this->configuration;
    }

    public function setConfiguration(string $configuration): static
    {
        $this->configuration = $configuration;

        return $this;
    }

    public function getModel(): AIModel
    {
        return $this->model;
    }

    public function setModel(AIModel $model): static
    {
        $this->model = $model;
        return $this;
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

    public function isUserManager(User $user): bool
    {
        return $this->managers->contains($user);
    }

    public function getManagers(): Collection
    {
        return $this->managers;
    }

    public function addManager(User $user): static
    {
        if (!$this->isUserManager($user)) {
            $this->managers->add($user);
        }
        return $this;
    }

    public function removeManager(User $user): static
    {
        $this->managers->removeElement($user);
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

    public function getImage(): ?string
    {
        return $this->image;
    }

    public function getImageUrl() {
        return $this->image ? '/uploads/agents/' . $this->image : '';
    }

    public function setImage(?string $image): static
    {
        $this->image = $image;
        return $this;
    }

    public function setSystem(bool $isSystem): static
    {
        $this->isSystem = $isSystem;

        return $this;
    }

    public function getCustomInstructions(): Collection
    {
        return $this->customInstructions;
    }

    public function addCustomInstruction(CustomInstruction $customInstruction): static
    {
        if (!$this->customInstructions->contains($customInstruction)) {
            $this->customInstructions->add($customInstruction);
            $customInstruction->setAgent($this);
        }

        return $this;
    }

    public function removeCustomInstruction(CustomInstruction $customInstruction): static
    {
        if ($this->customInstructions->removeElement($customInstruction)) {
            if ($customInstruction->getAgent() === $this) {
                $customInstruction->setAgent(null);
            }
        }

        return $this;
    }

    public function getDiscussions(): Collection
    {
        return $this->discussions;
    }

    public function addDiscussion(Discussion $discussion): static
    {
        if (!$this->discussions->contains($discussion)) {
            $this->discussions->add($discussion);
            $discussion->setAiAgent($this);
        }

        return $this;
    }

    public function removeDiscussion(Discussion $discussion): static
    {
        if ($this->discussions->removeElement($discussion)) {
            if ($discussion->getAiAgent() === $this) {
                $discussion->setAiAgent(null);
            }
        }

        return $this;
    }
}