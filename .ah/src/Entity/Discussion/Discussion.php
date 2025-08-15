<?php

namespace App\Entity\Discussion;

use App\Entity\Ai\AIAgent;
use App\Entity\User\User;
use App\Entity\Discussion\Message;
use Doctrine\DBAL\Types\Types;
use Doctrine\Common\Collections\ArrayCollection;
use Doctrine\Common\Collections\Collection;
use Doctrine\ORM\Mapping as ORM;

#[ORM\Entity]
#[ORM\HasLifecycleCallbacks]
class Discussion
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column(type: 'integer')]
    private ?int $id = null;

    #[ORM\Column(type: 'string', length: 255, unique: true)]
    private string $uniqueKey;

    #[ORM\Column(type: 'string', length: 255)]
    private string $title;

    #[ORM\Column(type: 'boolean')]
    private bool $isFavorite = false;

    #[ORM\Column(type: 'boolean')]
    private bool $enable = true;

    #[ORM\Column(type: 'text', nullable: true)]
    private ?string $state = null;

    #[ORM\Column(type: 'text', nullable: true)]
    private ?string $stateParams = null;

    #[ORM\Column(type: 'datetime')]
    private \DateTime $createdAt;

    #[ORM\Column(type: 'datetime')]
    private \DateTime $updatedAt;

    #[ORM\ManyToOne(targetEntity: User::class, inversedBy: 'discussions')]
    #[ORM\JoinColumn(nullable: true)]
    private ?User $user = null;

    #[ORM\ManyToOne(targetEntity: AIAgent::class, inversedBy: 'discussions')]
    private AIAgent $aiAgent;

    #[ORM\OneToMany(mappedBy: 'discussion', targetEntity: Message::class, orphanRemoval: true)]
    private Collection $messages;

    public function __construct()
    {
        $this->messages = new ArrayCollection();
    }

    public function toArray($withContent = false) {
        $discussion = [
            // 'id'            => $this->getId(),
            'key'           => $this->getUniqueKey(),
            'title'         => $this->getTitle(),
            // 'content'       => $this->getContent(),
            // 'messageNumber' => $this->getMessageNumber(),
            'favorite'      => $this->isFavorite(),
            // 'enable'        => $this->isEnable(),
            // 'created_at'    => $this->getCreatedAt(),
            'updated_at'    => $this->getUpdatedAt(),
            'agent_code'    => $this->getAiAgent()->getCode()
        ];

        if ($withContent) {
            $discussion['content'] = $this->getContent();
        }

        return $discussion;
    }

    public function getId(): ?int
    {
        return $this->id;
    }

    public function getUniqueKey(): ?string
    {
        return $this->uniqueKey;
    }

    public function setUniqueKey(string $uniqueKey): static
    {
        $this->uniqueKey = $uniqueKey;

        return $this;
    }

    public function getTitle(): ?string
    {
        return $this->title;
    }

    public function setTitle(string $title): static
    {
        $this->title = $title;

        return $this;
    }

    public function getMessages(): Collection
    {
        return $this->messages;
    }

    public function addMessage(Message $message): static
    {
        if (!$this->messages->contains($message)) {
            $this->messages[] = $message;
            $message->setDiscussion($this);
        }
        return $this;
    }

    public function addNewMessage(string $role, string $content): static
    {
        $message = new Message();
        $message->setRole($role);
        $message->setContent($content);
        $this->addMessage($message);
        return $this;
    }

    public function getFirstMessage(): ?Message
    {
        return $this->messages->first() ?: null;
    }

    public function getContent(): ?string
    {
        $messages = $this->messages->map(function (Message $message) {
            return [
                'role'  => $message->getRole(),
                'msg'   => $message->getContent(),
                'files' => $message->getFilesArray()
            ];
        })->toArray();

        return json_encode($messages);
    }

    public function getMessageNumber(): int {
        return $this->messages->count();
    }

    public function isFavorite(): ?bool
    {
        return $this->isFavorite;
    }

    public function setFavorite(bool $isFavorite): static
    {
        $this->isFavorite = $isFavorite;

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

    public function getState(): ?string
    {
        return $this->state;
    }

    public function setState(string $state): static
    {
        $this->state = $state;
        return $this;
    }

    // Getter for the new stateParams field
    public function getStateParams(): ?string
    {
        return $this->stateParams;
    }

    // Setter for the new stateParams field
    public function setStateParams(?string $stateParams): static
    {
        $this->stateParams = $stateParams;
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

    public function getAiAgent(): ?AIAgent
    {
        return $this->aiAgent;
    }

    public function setAiAgent(?AIAgent $aiAgent): static
    {
        $this->aiAgent = $aiAgent;

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
}
