<?php

namespace App\Entity;

use App\Entity\User\User;
use App\Entity\Discussion\Discussion;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;

#[ORM\Entity]
#[ORM\HasLifecycleCallbacks]
class File
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column(type: 'integer')]
    private ?int $id = null;

    #[ORM\Column(length: 255)]
    private ?string $filename = null;

    #[ORM\Column(length: 255, nullable: true)]
    private ?string $fullPath = null;

    #[ORM\Column(length: 255)]
    private ?string $originalFilename = null;

    #[ORM\Column(length: 50, nullable: true)]
    private ?string $extension = null;

    #[ORM\Column(length: 255)]
    private ?string $mimeType = null;

    #[ORM\Column]
    private ?int $size = null;

    #[ORM\Column(length: 255)]
    private ?string $path = null;

    #[ORM\Column(type: Types::TEXT)]
    private string $content;

    #[ORM\Column(type: 'datetime')]
    private \DateTime $createdAt;

    public function toArray() {
        return [
            'id'               => $this->getId(),
            'filename'         => $this->getFilename(),
            // 'fullpath'         => $this->getFullPath(),
            'originalFilename' => $this->getOriginalFilename(),
            'extension'        => $this->getExtension(),
            'mimeType'         => $this->getMimeType(),
            'content'          => $this->getContent(),
        ];
    }

    public function getId(): ?int
    {
        return $this->id;
    }

    public function getFilename(): ?string
    {
        return $this->filename;
    }
    public function setFilename(string $filename): static
    {
        $this->filename = $filename;
        return $this;
    }
    public function getFullPath(): ?string
    {
        return $this->fullPath;
    }
    public function setFullPath(?string $fullPath): static
    {
        $this->fullPath = $fullPath;
        return $this;
    }
    public function getOriginalFilename(): ?string
    {
        return $this->originalFilename;
    }
    public function setOriginalFilename(string $originalFilename): static
    {
        $this->originalFilename = $originalFilename;
        return $this;
    }
    public function getExtension(): ?string
    {
        return $this->extension;
    }
    public function setExtension(?string $extension): static
    {
        $this->extension = $extension;
        return $this;
    }
    public function getMimeType(): ?string
    {
        return $this->mimeType;
    }
    public function setMimeType(string $mimeType): static
    {
        $this->mimeType = $mimeType;
        return $this;
    }
    public function getSize(): ?int
    {
        return $this->size;
    }
    public function setSize(int $size): static
    {
        $this->size = $size;
        return $this;
    }
    public function getPath(): ?string
    {
        return $this->path;
    }
    public function setPath(string $path): static
    {
        $this->path = $path;
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
