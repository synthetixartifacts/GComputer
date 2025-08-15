<?php

namespace App\Entity\Discussion;

use App\Entity\Discussion\Discussion;
use App\Entity\File;
use Doctrine\Common\Collections\ArrayCollection;
use Doctrine\Common\Collections\Collection;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;

#[ORM\Entity]
#[ORM\HasLifecycleCallbacks]
class Message
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column(type: 'integer')]
    private ?int $id = null;

    #[ORM\Column(type: 'string', length: 50)]
    private string $role;

    #[ORM\Column(type: Types::TEXT)]
    private string $content;

    #[ORM\Column(type: 'integer', nullable: false)]
    private int $tokenCount = 0;

    #[ORM\Column(type: 'datetime')]
    private \DateTime $createdAt;

    #[ORM\ManyToOne(targetEntity: Discussion::class, inversedBy: 'messages')]
    private Discussion $discussion;

    #[ORM\ManyToMany(targetEntity: File::class)]
    private Collection $files;

    public function __construct()
    {
        $this->files = new ArrayCollection();
    }

    public function toArray() {
        return [
            'id'            => $this->getId(),
            'role'          => $this->getRole(),
            'content'       => $this->getContent(),
            'tokenCount'    => $this->getTokenCount(),
            'created_at'    => $this->getCreatedAt(),
            'discussion_id' => $this->getDiscussion()->getId(),
            'files'         => $this->getFiles()->map(fn(File $file) => $file->getId())->toArray(),
        ];
    }

    public function getId(): ?int
    {
        return $this->id;
    }

    public function getRole(): ?string
    {
        return $this->role;
    }

    public function setRole(string $role): static
    {
        $this->role = $role;

        return $this;
    }

    public function getContent(): ?string
    {
        return $this->content;
    }

    public function setContent(string $content): static
    {
        $this->content = $content;

        return $this;
    }

    public function getTokenCount(): int
    {
        return $this->tokenCount ?? 0;
    }

    public function setTokenCount(int $tokenCount): static
    {
        $this->tokenCount = $tokenCount;
        return $this;
    }

    public function getDiscussion(): Discussion
    {
        return $this->discussion;
    }

    public function setDiscussion(Discussion $discussion): static
    {
        $this->discussion = $discussion;
        return $this;
    }

    public function getFilesArray() {
        return $this->getFiles()->map(fn(File $file) => $file->toArray())->toArray();
    }

    public function getFiles(): Collection
    {
        return $this->files;
    }

    public function addFile(File $file): static
    {
        if (!$this->files->contains($file)) {
            $this->files[] = $file;
        }
        return $this;
    }

    public function removeFile(File $file): static
    {
        $this->files->removeElement($file);
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

    #[ORM\PrePersist]
    public function setCreatedAtValue(): void
    {
        $this->createdAt = new \DateTime();
    }
}