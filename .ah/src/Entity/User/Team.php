<?php

namespace App\Entity\User;

use App\Entity\Ai\AIAgent;
use App\Entity\User\User;
use Doctrine\Common\Collections\ArrayCollection;
use Doctrine\Common\Collections\Collection;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;

#[ORM\Entity]
class Team
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    #[ORM\Column(length: 255, unique: true)]
    private ?string $name = null;

    #[ORM\Column(type: 'string', length: 50)]
    private ?string $code = null;

    #[ORM\Column(type: 'text', nullable: true)]
    private ?string $memory = null;

    #[ORM\ManyToMany(targetEntity: AIAgent::class, mappedBy: "teams")]
    private Collection $agents;

    #[ORM\ManyToMany(targetEntity: User::class, mappedBy: "teams")]
    private Collection $users;

    // Getters and setters

    public function __construct()
    {
        $this->agents = new ArrayCollection();
        $this->users  = new ArrayCollection();
    }

    public function __toString(): string
    {
        return $this->name;
    }

    public function toArray() {
        return [
            'id'     => $this->getId(),
            'code'   => $this->getCode(),
            'name'   => $this->getName(),
            'memory' => $this->getMemory(),
        ];
    }

    public function getId(): ?int
    {
        return $this->id;
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

    public function getCode(): ?string
    {
        return $this->code;
    }

    public function setCode(string $code): static
    {
        $this->code = $code;

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

    public function getAgents(): Collection
    {
        return $this->agents;
    }

    public function addAgent(AIAgent $agent): static
    {
        if (!$this->agents->contains($agent)) {
            $this->agents->add($agent);
            $agent->addTeam($this);
        }
        return $this;
    }

    public function removeAgent(AIAgent $agent): static
    {
        if ($this->agents->removeElement($agent)) {
            $agent->removeTeam($this);
        }
        return $this;
    }

    public function getUsers(): Collection
    {
        return $this->users;
    }

    public function addUser(User $user): static
    {
        if (!$this->users->contains($user)) {
            $this->users->add($user);
            $user->addTeam($this);
        }
        return $this;
    }

    public function removeUser(User $user): static
    {
        if ($this->users->removeElement($user)) {
            $user->removeTeam($this);
        }
        return $this;
    }
}
