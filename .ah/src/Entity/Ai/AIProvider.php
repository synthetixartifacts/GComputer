<?php

namespace App\Entity\Ai;

use App\Entity\Ai\AIModel;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;
use Doctrine\Common\Collections\ArrayCollection;
use Doctrine\Common\Collections\Collection;
use Symfony\Component\String\Exception\RuntimeException;
use Symfony\Component\Validator\Constraints as Assert;

#[ORM\Entity]
#[ORM\HasLifecycleCallbacks]
class AIProvider
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
    private string $url;

    #[ORM\Column(type: 'string', length: 255)]
    private string $authentication;

    #[ORM\Column(type: 'string', length: 512, nullable: true)]
    private ?string $encryptedApiSecret = null;

    #[ORM\Column(type: 'text')]
    #[Assert\Json]
    private string $configuration = '{}';

    #[ORM\OneToMany(targetEntity: AIModel::class, mappedBy: 'provider')]
    private Collection $models;

    #[ORM\Column(type: 'datetime')]
    private \DateTime $createdAt;

    #[ORM\Column(type: 'datetime')]
    private \DateTime $updatedAt;

    public function __construct()
    {
        $this->models = new ArrayCollection();
    }

    public function __toString(): string
    {
        return $this->name ?? 'Unnamed Provider';
    }

    public function toArray() {
        return [
            'id'            => $this->getId(),
            'code'          => $this->getCode(),
            'name'          => $this->getName(),
            'url'           => $this->getUrl(),
            'authentication' => $this->getAuthentication(),
            'configuration' => $this->getConfigurationArray(),
            'created_at'    => $this->getCreatedAt(),
            'updated_at'    => $this->getUpdatedAt(),
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

    public function getUrl(): ?string
    {
        return $this->url;
    }

    public function setUrl(string $url): static
    {
        $this->url = $url;

        return $this;
    }

    public function getAuthentication(): ?string
    {
        return $this->authentication;
    }

    public function setAuthentication(string $authentication): static
    {
        $this->authentication = $authentication;

        return $this;
    }

    public function setApiSecret(string $apiSecret, string $encryptionKey): static
    {
        $iv              = random_bytes(openssl_cipher_iv_length('aes-256-cbc'));
        $encryptedSecret = openssl_encrypt($apiSecret, 'aes-256-cbc', $encryptionKey, 0, $iv);

        if ($encryptedSecret === false) {
            throw new RuntimeException('Encryption failed.');
        }

        $this->encryptedApiSecret = base64_encode($iv . $encryptedSecret);

        return $this;
    }

    public function getApiSecret(string $encryptionKey): ?string
    {
        if (!$this->encryptedApiSecret) {
            return null;
        }

        $data            = base64_decode($this->encryptedApiSecret);
        $iv              = substr($data, 0, openssl_cipher_iv_length('aes-256-cbc'));
        $encryptedSecret = substr($data, openssl_cipher_iv_length('aes-256-cbc'));

        $apiSecret = openssl_decrypt($encryptedSecret, 'aes-256-cbc', $encryptionKey, 0, $iv);

        if ($apiSecret === false) {
            return null;
        }

        // Check if the last character is a semicolon and remove it if it is
        if (substr($apiSecret, -1) === ';') {
            $apiSecret = substr($apiSecret, 0, -1);
        }

        return $apiSecret;
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

    public function getModels(): Collection
    {
        return $this->models;
    }

    public function addModel(AIModel $model): static
    {
        if (!$this->models->contains($model)) {
            $this->models->add($model);
            $model->setProvider($this);
        }

        return $this;
    }

    public function removeModel(AIModel $model): static
    {
        if ($this->models->removeElement($model)) {
            if ($model->getProvider() === $this) {
                $model->setProvider(null);
            }
        }

        return $this;
    }

    public function getEncryptedApiSecret(): ?string
    {
        return $this->encryptedApiSecret;
    }

    public function setEncryptedApiSecret(?string $encryptedApiSecret): static
    {
        $this->encryptedApiSecret = $encryptedApiSecret;

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