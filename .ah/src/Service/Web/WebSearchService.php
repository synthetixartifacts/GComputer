<?php

namespace App\Service\Web;

use Symfony\Contracts\HttpClient\HttpClientInterface;

class WebSearchService
{
    private const GOOGLE_URL     = 'https://www.google.com/search';
    private const DUCKDUCKGO_URL = 'https://html.duckduckgo.com/html/';
    private const BING_URL       = 'https://www.bing.com/search';
    private const YAHOO_URL      = 'https://search.yahoo.com/search';
    private const ECOSIA_URL     = 'https://www.ecosia.org/search';

    /**
     * Mapping of search engines to their URLs, parser methods, and query parameter names.
     */
    private static array $engines = [
        'google' => [
            'url'    => self::GOOGLE_URL,
            'parser' => 'parseGoogleResults',
            'param'  => 'q'
        ],
        'duckduckgo' => [
            'url'    => self::DUCKDUCKGO_URL,
            'parser' => 'parseDuckDuckGoResults',
            'param'  => 'q'
        ],
        'bing' => [
            'url'    => self::BING_URL,
            'parser' => 'parseBingResults',
            'param'  => 'q'
        ],
        'yahoo' => [
            'url'    => self::YAHOO_URL,
            'parser' => 'parseYahooResults',
            'param'  => 'p'
        ],
        'ecosia' => [
            'url'    => self::ECOSIA_URL,
            'parser' => 'parseEcosiaResults',
            'param'  => 'q'
        ]
    ];

    public function __construct(
        private HttpClientInterface $httpClient
    ) {}

    /**
     * Searches within a specific site using the provided query.
     *
     * @param string $query     The search query.
     * @param string $site      The site to restrict the search to.
     * @param string $engine    The search engine to use (default: duckduckgo).
     * @param int    $maxResult Maximum number of results to return.
     * @return array
     * @throws \Exception
     */
    public function searchWebsite(
        string $query,
        string $site,
        string $engine = 'duckduckgo',
        int $maxResult = 2
    ): array {
        $siteQuery = "site:$site $query";
        return $this->search($siteQuery, $engine, $maxResult);
    }

    /**
     * Performs a search using the specified search engine.
     *
     * @param string $query     The search query.
     * @param string $engine    The search engine to use (default: duckduckgo).
     * @param int    $maxResult Maximum number of results to return.
     * @return array
     * @throws \Exception
     */
    public function search(
        string $query,
        string $engine = 'duckduckgo',
        int $maxResult = 2
    ): array {
        $engine = strtolower($engine);
        $engineData = self::$engines[$engine] ?? self::$engines['google'];

        $url = $engineData['url'];
        $param = $engineData['param'];
        $parserMethod = $engineData['parser'];

        // Build the request URL with the proper query parameter
        $requestUrl = $url . '?' . $param . '=' . urlencode($query);

        // Set a common user agent for all requests
        $headers = [
            'User-Agent' => 'Mozilla/5.0 (compatible; WebSearchService/1.0; +http://example.com)'
        ];

        try {
            $response = $this->httpClient->request('GET', $requestUrl, [
                'headers' => $headers,
                'verify_peer' => false,
            ]);

            if ($response->getStatusCode() !== 200) {
                throw new \Exception("Failed to fetch data from {$engine}.");
            }

            $html = $response->getContent();

            $dom = new \DOMDocument();
            // Suppress warnings due to malformed HTML
            @$dom->loadHTML(mb_convert_encoding($html, 'HTML-ENTITIES', 'UTF-8'));
            $xpath = new \DOMXPath($dom);

            return $this->$parserMethod($xpath, $maxResult);
        } catch (\Exception $e) {
            throw new \Exception('An error occurred: ' . $e->getMessage());
        }
    }

    /**
     * Browses to a given URL and returns its HTML content.
     *
     * @param string $url The URL to fetch.
     * @return string
     * @throws \Exception
     */
    public function browse(string $url): string
    {
        $headers = [
            'User-Agent' => 'Mozilla/5.0 (compatible; WebSearchService/1.0; +http://example.com)'
        ];

        try {
            $response = $this->httpClient->request('GET', $url, [
                'headers' => $headers,
                'verify_peer' => false,
            ]);

            if ($response->getStatusCode() !== 200) {
                throw new \Exception("Failed to fetch content from {$url}.");
            }

            return $response->getContent();
        } catch (\Exception $e) {
            throw new \Exception('An error occurred while browsing: ' . $e->getMessage());
        }
    }

    /**
     * Parses Google search results from the DOMXPath.
     *
     * @param \DOMXPath $xpath
     * @param int $maxResult
     * @return array
     */
    private function parseGoogleResults(\DOMXPath $xpath, int $maxResult): array
    {
        $results = [];
        $nodes = $xpath->query("//*[contains(concat(' ', normalize-space(@class), ' '), ' EtOod ')]");
        foreach ($nodes as $node) {
            if (count($results) >= $maxResult) {
                break;
            }
            $linkNode = $xpath->query(".//a", $node)->item(0);
            $titleNode = $xpath->query(".//div[contains(@class, 'vvjwJb')]", $node)->item(0);
            $dateNode = $xpath->query(".//span[contains(@class, 'rQMQod')]", $node)->item(0);
            $descNode = $xpath->query(".//div[contains(@class, 's3v9rd AP7Wnd')]", $node)->item(1);
            if ($linkNode && $titleNode && $dateNode && $descNode) {
                $link  = $this->cleanLink($linkNode->getAttribute('href'));
                $title = trim($titleNode->nodeValue);
                $date  = trim($dateNode->nodeValue);
                $desc  = trim(str_replace($date, '', $descNode->nodeValue));
                $results[] = [
                    'title'       => $title,
                    'link'        => $link,
                    'date'        => $date,
                    'description' => $desc,
                ];
            }
        }
        return $results;
    }

    /**
     * Parses DuckDuckGo search results from the DOMXPath.
     *
     * @param \DOMXPath $xpath
     * @param int $maxResult
     * @return array
     */
    private function parseDuckDuckGoResults(\DOMXPath $xpath, int $maxResult): array
    {
        $results = [];
        $nodes = $xpath->query("//div[contains(@class, 'result__body')]");
        foreach ($nodes as $node) {
            if (count($results) >= $maxResult) {
                break;
            }
            $linkNode = $xpath->query(".//a[contains(@class, 'result__a')]", $node)->item(0);
            $descNode = $xpath->query(".//a[contains(@class, 'result__snippet')]", $node)->item(0);
            if ($linkNode && $descNode) {
                $link = $this->cleanLink($linkNode->getAttribute('href'), 'duckduckgo');
                $results[] = [
                    'title'       => trim($linkNode->nodeValue),
                    'link'        => $link,
                    'description' => trim($descNode->nodeValue),
                ];
            }
        }
        return $results;
    }

    /**
     * Parses Bing search results from the DOMXPath.
     *
     * @param \DOMXPath $xpath
     * @param int $maxResult
     * @return array
     */
    private function parseBingResults(\DOMXPath $xpath, int $maxResult): array
    {
        $results = [];
        $nodes = $xpath->query("//li[@class='b_algo']");
        foreach ($nodes as $node) {
            if (count($results) >= $maxResult) {
                break;
            }
            $linkNode = $xpath->query(".//h2/a", $node)->item(0);
            $descNode = $xpath->query(".//div[@class='b_caption']/p", $node)->item(0);
            if ($linkNode && $descNode) {
                $results[] = [
                    'title'       => trim($linkNode->nodeValue),
                    'link'        => $linkNode->getAttribute('href'),
                    'description' => trim($descNode->nodeValue),
                ];
            }
        }
        return $results;
    }

    /**
     * Parses Yahoo search results from the DOMXPath.
     *
     * @param \DOMXPath $xpath
     * @param int $maxResult
     * @return array
     */
    private function parseYahooResults(\DOMXPath $xpath, int $maxResult): array
    {
        $results = [];
        // Yahoo search results are often contained within div elements with a class that includes "algo"
        $nodes = $xpath->query("//div[contains(@class, 'algo')]");
        foreach ($nodes as $node) {
            if (count($results) >= $maxResult) {
                break;
            }
            $linkNode = $xpath->query(".//a", $node)->item(0);
            $descNode = $xpath->query(".//div[contains(@class, 'compText')]")->item(0);
            if ($linkNode && $descNode) {
                $results[] = [
                    'title'       => trim($linkNode->nodeValue),
                    'link'        => $linkNode->getAttribute('href'),
                    'description' => trim($descNode->nodeValue),
                ];
            }
        }
        return $results;
    }

    /**
     * Parses Ecosia search results from the DOMXPath.
     *
     * @param \DOMXPath $xpath
     * @param int $maxResult
     * @return array
     */
    private function parseEcosiaResults(\DOMXPath $xpath, int $maxResult): array
    {
        $results = [];
        // Ecosia results are typically within div elements with a class that includes "result"
        $nodes = $xpath->query("//div[contains(@class, 'result')]");
        foreach ($nodes as $node) {
            if (count($results) >= $maxResult) {
                break;
            }
            $linkNode = $xpath->query(".//a")->item(0);
            $descNode = $xpath->query(".//p")->item(0);
            if ($linkNode && $descNode) {
                $results[] = [
                    'title'       => trim($linkNode->nodeValue),
                    'link'        => $linkNode->getAttribute('href'),
                    'description' => trim($descNode->nodeValue),
                ];
            }
        }
        return $results;
    }

    /**
     * Cleans and decodes a URL from search results.
     *
     * @param string $link
     * @param string $engine
     * @return string
     */
    private function cleanLink(string $link, string $engine = 'google'): string
    {
        if ($engine === 'duckduckgo') {
            // DuckDuckGo links contain the actual URL in the "uddg" parameter
            parse_str(parse_url($link, PHP_URL_QUERY), $params);
            if (isset($params['uddg'])) {
                return urldecode($params['uddg']);
            }
        } else {
            // Default handling for other engines (e.g., Google)
            $link = str_replace('/url?q=', '', $link);
            $parts = explode('&', $link, 2);
            $link = $parts[0];
            return urldecode($link);
        }
        return $link;
    }
}
