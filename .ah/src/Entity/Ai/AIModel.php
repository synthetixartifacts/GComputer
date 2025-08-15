<?php

namespace App\Entity\Ai;

use App\Entity\Ai\AIProvider;
use App\Entity\Ai\AIAgent;
use Doctrine\DBAL\Types\Types;

use Doctrine\ORM\Mapping as ORM;
use Doctrine\Common\Collections\ArrayCollection;
use Doctrine\Common\Collections\Collection;
use Symfony\Component\Validator\Constraints as Assert;

#[ORM\Entity]
#[ORM\HasLifecycleCallbacks]
class AIModel
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column(type: 'integer')]
    private ?int $id = null;

    #[ORM\Column(type: 'string', length: 50)]
    private ?string $code = null;

    #[ORM\Column(type: 'string', length: 255)]
    private string $name;

    #[ORM\Column(type: 'string', length: 255)]
    private string $model;

    #[ORM\Column(type: Types::DECIMAL, precision: 10, scale: 7, nullable: true)]
    private ?string $inputPrice = null;

    #[ORM\Column(type: Types::DECIMAL, precision: 10, scale: 7, nullable: true)]
    private ?string $outputPrice = null;

    #[ORM\Column(type: 'string', length: 255)]
    private string $endpoint;

    #[ORM\Column(type: 'text')]
    #[Assert\Json]
    private string $params = '{}';

    #[ORM\Column(type: 'string', length: 255)]
    private ?string $messageLocation = null;

    #[ORM\Column(type: 'string', length: 255)]
    private ?string $streamMessageLocation = null;

    #[ORM\Column(type: 'string', length: 255)]
    private ?string $inputTokenCountLocation = null;

    #[ORM\Column(type: 'string', length: 255)]
    private ?string $outputTokenCountLocation = null;

    #[ORM\ManyToOne(targetEntity: AIProvider::class, inversedBy: 'models')]
    #[ORM\JoinColumn(nullable: false)]
    private AIProvider $provider;

    #[ORM\OneToMany(targetEntity: AIAgent::class, mappedBy: 'model')]
    private Collection $agents;

    #[ORM\Column(type: 'datetime')]
    private \DateTime $createdAt;

    #[ORM\Column(type: 'datetime')]
    private \DateTime $updatedAt;

    public function __construct()
    {
        $this->agents = new ArrayCollection();
    }

    public function __toString(): string
    {
        return $this->name ?? 'Unnamed Model';
    }

    public function toArray() {
        return [
            'id'                       => $this->getId(),
            'code'                     => $this->getCode(),
            'name'                     => $this->getName(),
            'model'                    => $this->getModel(),
            'inputPrice'               => $this->getInputPrice(),
            'outputPrice'              => $this->getOutputPrice(),
            'endpoint'                 => $this->getEndpoint(),
            'params'                   => $this->getParamsArray(),
            'messageLocation'          => $this->getMessageLocation(),
            'streamMessageLocation'    => $this->getStreamMessageLocation(),
            'inputTokenCountLocation'  => $this->getInputTokenCountLocation(),
            'outputTokenCountLocation' => $this->getOutputTokenCountLocation(),
            'provider'                 => $this->getProvider()->toArray(),
            'created_at'               => $this->getCreatedAt(),
            'updated_at'               => $this->getUpdatedAt(),
        ];
    }

    public function getId(): ?int
    {
        return $this->id;
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

    public function getInputPrice(): ?string
    {
        return $this->inputPrice;
    }

    public function setInputPrice(?string $inputPrice): static
    {
        $this->inputPrice = $inputPrice;

        return $this;
    }

    public function getOutputPrice(): ?string
    {
        return $this->outputPrice;
    }

    public function setOutputPrice(?string $outputPrice): static
    {
        $this->outputPrice = $outputPrice;

        return $this;
    }

    public function getEndpoint(): ?string
    {
        return $this->endpoint;
    }

    public function setEndpoint(string $endpoint): static
    {
        $this->endpoint = $endpoint;

        return $this;
    }

    public function getParams(): string
    {
        return $this->params;
    }

    public function getParamsArray(): array
    {
        return json_decode($this->getParams() ?: '{}', true) ?? [];
    }

    public function setParams(string $params): static
    {
        $this->params = $params;

        return $this;
    }

    public function getMessageLocation(): ?string
    {
        return $this->messageLocation;
    }

    public function setMessageLocation(string $messageLocation): static
    {
        $this->messageLocation = $messageLocation;

        return $this;
    }

    public function getStreamMessageLocation(): ?string
    {
        return $this->streamMessageLocation;
    }

    public function setStreamMessageLocation(string $streamMessageLocation): static
    {
        $this->streamMessageLocation = $streamMessageLocation;

        return $this;
    }

    public function getInputTokenCountLocation(): ?string
    {
        return $this->inputTokenCountLocation;
    }

    public function setInputTokenCountLocation(?string $inputTokenCountLocation): static
    {
        $this->inputTokenCountLocation = $inputTokenCountLocation;

        return $this;
    }

    public function getOutputTokenCountLocation(): ?string
    {
        return $this->outputTokenCountLocation;
    }

    public function setOutputTokenCountLocation(?string $outputTokenCountLocation): static
    {
        $this->outputTokenCountLocation = $outputTokenCountLocation;

        return $this;
    }

    public function getProvider(): AIProvider
    {
        return $this->provider;
    }

    public function setProvider(AIProvider $provider): static
    {
        $this->provider = $provider;

        return $this;
    }

    /**
     * @return Collection<int, AIAgent>
     */
    public function getAgents(): Collection
    {
        return $this->agents;
    }

    public function addAgent(AIAgent $agent): static
    {
        if (!$this->agents->contains($agent)) {
            $this->agents->add($agent);
            $agent->setModel($this);
        }

        return $this;
    }

    public function removeAgent(AIAgent $agent): static
    {
        if ($this->agents->removeElement($agent)) {
            // set the owning side to null (unless already changed)
            if ($agent->getModel() === $this) {
                $agent->setModel(null);
            }
        }

        return $this;
    }

    public function getModel(): ?string
    {
        return $this->model;
    }

    public function setModel(string $model): static
    {
        $this->model = $model;

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