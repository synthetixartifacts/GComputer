<?php

namespace App\Service\Api;

use Symfony\Contracts\HttpClient\HttpClientInterface;
use Symfony\Contracts\HttpClient\Exception\HttpExceptionInterface;
use Psr\Log\LoggerInterface;

class ApiClient
{
    public function __construct(
        private HttpClientInterface $httpClient,
        private LoggerInterface $apiRequestLogger,
        private LoggerInterface $streamingRequestLogger,
    ) {}

    private function mergeDefaultOptions(array $options): array
    {
        if (isset($options['json']['headers'])) {
            $options['headers'] = $options['json']['headers'];
            unset($options['json']['headers']);
        }
        if (isset($options['body']['headers'])) {
            $options['headers'] = $options['body']['headers'];
            unset($options['body']['headers']);
        }

        $defaultOptions = [
            'verify_peer' => false,
        ];

        return array_merge($defaultOptions, $options);
    }


    public function request(string $method, string $url, array $data = [], bool $isBinary = false): array|string
    {
        $options = $this->mergeDefaultOptions($data);

        try {
            $response     = $this->httpClient->request($method, $url, $options);
            $responseData = $response->getContent();

            // Log the initial request
            $this->apiRequestLogger->info('API TALK Request', [
                'method'   => $method,
                'url'      => $url,
                'options'  => $options,
                'response' => $responseData
            ]);

            $returnResponse = [];

            // Check for empty response
            if (empty($responseData)) {
                $this->apiRequestLogger->error('Empty response received', [
                    'method'   => $method,
                    'url'      => $url,
                    'options'  => $options,
                ]);
            }

            if ($response->getStatusCode() !== 200) {
                $this->apiRequestLogger->error('Non-200 status code received', [
                    'method'     => $method,
                    'url'        => $url,
                    'options'    => $options,
                    'statusCode' => $response->getStatusCode(),
                    'response'   => $responseData
                ]);
            }

            if ($isBinary) {
                $returnResponse['binary'] = $responseData;
                $returnResponse['statusCode'] = $response->getStatusCode();
            } else {
                $returnResponse = json_decode($responseData, true);
                $returnResponse['statusCode'] = $response->getStatusCode();
            }

            return $returnResponse;

        } catch (HttpExceptionInterface $e) {
            $this->apiRequestLogger->error('HTTP error during ApiClient request', [
                'method'  => $method,
                'url'     => $url,
                'options' => $options,
                'error'   => $e->getMessage()
            ]);

            $returnResponse = json_decode($response->getContent(false), true);
            $returnResponse['statusCode'] = $response->getStatusCode();
            return $returnResponse;

        } catch (\Exception $e) {
            $this->apiRequestLogger->error('Error during ApiClient request', [
                'method'  => $method,
                'url'     => $url,
                'options' => $options,
                'error'   => $e->getMessage()
            ]);

            $returnResponse = json_decode($response->getContent(false), true);
            $returnResponse['statusCode'] = $response->getStatusCode();
            return $returnResponse;
        }
    }

    public function streamingRequest(string $method, string $url, array $data = [], callable $callback)
    {
        $options = $this->mergeDefaultOptions($data);

        try {
            $response = $this->httpClient->request($method, $url, $options);

            $this->apiRequestLogger->info('API STREAM Request', [
                'method'   => $method,
                'url'      => $url,
                'options'  => $options,
            ]);

            foreach ($this->httpClient->stream($response) as $chunk) {
                $content = $chunk->getContent();
                $jsons   = $this->extractJsonStrings($content);

                foreach ($jsons as $json) {
                    $returnResponse               = json_decode($json, true);
                    $returnResponse['statusCode'] = $response->getStatusCode();

                    // Log the streaming response
                    // $this->streamingRequestLogger->info('STREAMING TALK Request', [
                    //     'method'   => $method,
                    //     'url'      => $url,
                    //     'options'  => $options,
                    //     'response' => $returnResponse
                    // ]);

                    if ($response->getStatusCode() !== 200) {
                        $this->streamingRequestLogger->error('Error during streaming request', [
                            'method'         => $method,
                            'url'            => $url,
                            'options'        => $options,
                            'returnResponse' => $returnResponse
                        ]);
                    }

                    $callback($returnResponse);
                }
            }
        } catch (\Exception $e) {
            $this->streamingRequestLogger->error('Error during streaming request', [
                'method'  => $method,
                'url'     => $url,
                'options' => $options,
                'error'   => $e->getMessage()
            ]);

            $returnResponse               = json_decode($response->getContent(false), true);
            $returnResponse['statusCode'] = $response->getStatusCode();
            $callback($returnResponse, true);
        }
    }

    function extractJsonStrings($inputString) {
        $jsonStrings = [];
        $length      = strlen($inputString);
        $inString    = false;
        $braceCount  = 0;
        $jsonStart   = -1;

        for ($i = 0; $i < $length; $i++) {
            $char = $inputString[$i];

            // Handle string state toggling, taking escaped quotes into account
            if ($char === '"') {
                // Count the number of backslashes before the quote
                $backslashCount = 0;
                while ($i > $backslashCount && $inputString[$i - $backslashCount - 1] === '\\') {
                    $backslashCount++;
                }

                // Toggle `inString` state if the quote is not escaped
                if ($backslashCount % 2 === 0) {
                    $inString = !$inString;
                }
            }

            if (!$inString) {
                // Check for the start of a JSON object
                if ($char === '{') {
                    if ($braceCount === 0) {
                        $jsonStart = $i;  // Mark the start of a JSON string
                    }
                    $braceCount++;
                } elseif ($char === '}') {
                    $braceCount--;
                    // Check for the end of a JSON object
                    if ($braceCount === 0 && $jsonStart !== -1) {
                        $jsonStrings[] = substr($inputString, $jsonStart, $i - $jsonStart + 1);
                        $jsonStart = -1;
                    }
                }
            }
        }

        // Return the array of JSON strings
        return $jsonStrings;
    }
}