<?php

namespace App\Service;

use App\Repository\SettingsRepository;

class SettingsService
{
    private $settingsRepository;

    /**
     * Constructor for SettingsService
     *
     * @param SettingsRepository $settingsRepository The repository for managing settings
     */
    public function __construct(SettingsRepository $settingsRepository)
    {
        $this->settingsRepository = $settingsRepository;
    }

    /**
     * Get a setting value by key
     *
     * @param string $key The key of the setting
     * @return string|null The value of the setting, or null if not found
     */
    public function get(string $key): ?string
    {
        return $this->settingsRepository->getSetting($key);
    }

    /**
     * Set a setting value
     *
     * @param string $key The key of the setting
     * @param string $value The value to set
     */
    public function set(string $key, string $value): void
    {
        $this->settingsRepository->setSetting($key, $value);
    }

    /**
     * Get the company profile information
     *
     * @return array An array containing the company name and profile
     */
    public function getCompanyProfile(): array
    {
        return [
            'name'    => $this->get('company_name'),
            'profile' => $this->get('company_profile'),
        ];
    }
}