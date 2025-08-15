<?php

// TODO place this in ERA_Custom Folder

namespace App\Controller\Api\V1\Agents\Custom\OnGoing;

use App\Controller\Api\V1\Agents\AbstractAgentApiController;
use App\Entity\Ai\AIAgent;
use App\Entity\Ai\AIModel;
use App\Service\Api\ApiHelperService;
use App\Service\Ai\Agent\AgentTalkService;
use App\Service\File\FileService;
use App\Service\File\FileEntityService;
use App\Service\DiscussionService;
use App\Service\Action\ActionService;
use App\Repository\Action\ActionStateRepository;

use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Annotation\Route;
use Symfony\Component\HttpFoundation\StreamedResponse;
use Symfony\Component\HttpFoundation\JsonResponse;
use Doctrine\ORM\EntityManagerInterface;

// #[Route('no/api/v1', name: 'api_v1_no')]
class PMUserStoryControllerNO extends AbstractAgentApiController
{
    public function __construct(
        protected FileService $fileService,
        protected FileEntityService $fileEntityService,
        protected ActionStateRepository $actionStateRepository,
        protected ActionService $actionService,
        protected ApiHelperService $apiHelperService,
        protected AgentTalkService $agentTalkService,
        protected DiscussionService $discussionService,
        protected EntityManagerInterface $entityManager,
    ) {
        parent::__construct(
            $apiHelperService,
            $agentTalkService,
            $discussionService,
            $entityManager
        );
    }

    // #[Route('/agent/talk/pm_user_story_creator', name: 'agent_talk_pm_user_story_creator', methods: ['POST', 'GET'], priority: 1)]
    public function apiTalk(Request $request): JsonResponse
    {
        return $this->apiHelperService->notImplementedYetResponse();
    }


    // #[Route('/agent/stream/pm_user_story_creator', name: 'agent_talk_stream_pm_user_story_creator', methods: ['POST', 'GET'], priority: 1)]
    public function apiTalkStream(Request $request): StreamedResponse|JsonResponse
    {
        // Validation
        $agent = $this->apiHelperService->validateAgentAccessRequest('pm_user_story_creator', $request);
        if ($agent instanceof JsonResponse) {
            return $agent;
        }

        // Check if there is a file to parse
        $data = $this->apiHelperService->extractRequestData($request);

        // Manage discussion
        $user = $this->apiHelperService->getUser();
        $discussion = $this->discussionService->getDiscussionByKeyUserOrCreate(
            $data['discussionKey'] ?? null,
            $user,
            $agent,
            true
        );

        if (!$this->discussionService->validateDiscussionAccess($discussion, $user, $agent)) {
            return $this->apiHelperService->errorUnauthorizedResponse();
        }


        // Look for what to do next
        $actionState = $this->actionStateRepository->findOneByDiscussion($discussion);


        // If no action in progress and no file - We simply talk
        // if (!$actionState && (!isset($data['fileIds']) || count($data['fileIds']) <= 0)) {
        //     return $this->agentTalkService->executeAgentTalkStream($agent, $data);
        // }

        if ($actionState) {

            echo '<pre>';
            print_r([
            'TOMMY is here',
            $agent->toArray(),
            $discussion->toArray(),
            $actionState->toArray(),
            ]);
            die;

        } else {
            // init conversation state

            $customAction = [
                ['code' => 'export_file', 'description' => 'Export story/stories as CSV file to be imported in DevOps. Use only if the user ask it.'],
                ['code' => 'story_list_creation', 'description' => 'To select when the user sends conceptual document, project document or any information that implies creating a list of stories and not just one. Do not use it for individual story creation.'],
            ];

            $actionsToExecute = $this->actionService->getActionToExecute($agent, $data['message'] ?? '', $customAction);

            if (!empty($actionsToExecute)) {
                echo '<pre>';
                print_r([
                'TOMMY is here',
                $actionsToExecute,
                $data
                ]);
                die;
            }
        }



        // echo '<pre>';
        // print_r([
        // 'TOMMY is here',
        // $actionsToExecute,
        // $data
        // ]);
        // die;





        return $this->agentTalkService->executeAgentTalkStream($agent, $data, $discussion);


        // // TODO - FORCE FILE DATA
        // $data['fileIds'] = [288];

        // // If no file - We just talk
        // if (!isset($data['fileIds']) || count($data['fileIds']) <= 0) {
        //     // TODO return notice that we need information through a file
        //     // return $this->agentTalkService->executeAgentTalkStream($agent, $data);
        // }


        // // Extraction process
        // $taksList = $this->extractTaskFromDocument($data['fileIds'], $agent);

        // // Epic association process
        // $epicList = $this->processTaskIntoEpics($taksList, $agent);

        // // Validate task per epic
        // $epicList = $this->finalizeTaskListing($epicList, $agent);

        // // Now create complete task INVEST task
        // $enhance = $this->createCompleteTask($epicList, $agent);


        // echo '<pre>';
        // print_r([
        // 'TOMMY is here',
        // $enhance,
        // ]);
        // die;

        // // Setup list of task into proper epic
        // // $this->taskToEpic

        // // $epicArray = $this->parseExtractsIntoEpicArray($taksList, $epicArray);


        // // Now that we have everything under $epicArray we start the
        // // Task creation process
        // // Goal now is to go through each task and use an llm to create complete tasks based on the getTaskCriterias guidelines
        // // If needed the LLM will then return multiple smaller tasks

        // // Once we have the complete list, we will create the response text and send it back to the user

        // $userMsg  = 'NA';
        // $response = 'List of tasks group per epics';

        // return $this->agentTalkService->createStreamResponse(function () use ($agent, $data, $userMsg, $response) {
        //     $streamData = $this->agentTalkService->createAgentStreamData(
        //         agent       : $agent,
        //         data        : $data,
        //         userMsg     : $userMsg,
        //         response    : [],
        //         responseText: $response
        //     );
        //     $this->agentTalkService->streamData($streamData);
        // });

    }





    private function createCompleteTask(array $epicList, AIAgent $agent): array
    {
        // 1) Assign a specialized system prompt that generates full user stories (INVEST).
        $agent->setSystemPrompt($this->getTaskCreatorSystemPromptAgent());

        // 2) Loop through each epic, and each task
        foreach ($epicList as $epicIndex => $epicData) {
            if (empty($epicData['tasks'])) {
                continue;
            }

            $enhancedTasks = []; // This will hold the "raw" + "complete" structures

            foreach ($epicData['tasks'] as $task) {
                $prompt  = $this->getProjectContext();
                $prompt .= "\n\n----\n";

                $prompt .= $this->getTaskCriterias();
                $prompt .= "\n\n----\n";

                $prompt .= "# Epic: " . $epicData['epic']['label'] . " (ID " . $epicData['epic']['code'] . ")\n";
                $prompt .= "Raw Task:\n";
                $prompt .= "{$task}\n\n";

                $prompt .= "## Instructions:\n";
                $prompt .= "Convert the above raw task into a user story and acceptance criteria following the guidelines. Use the 3Cs (Card, Conversation, Confirmation) and ensure it's INVEST-compliant. Return all content in the proper indicated format.\n\n";

                // 4) Call the LLM to get the enhanced user story text
                $response = $this->agentTalkService->executeAgentTalk($agent, ['message' => $prompt], null, true);

                // 5) Store the original task and the newly generated user story
                $enhancedTasks[] = [
                    'raw'      => $task,
                    'complete' => trim($response),
                ];
            }

            // 6) Replace epic tasks array with the newly enhanced tasks
            $epicList[$epicIndex]['tasks'] = $enhancedTasks;
        }

        return $epicList;
    }


    private function getTaskCreatorSystemPromptAgent() {
        return <<<TEXT
        You are the User Story and Test Flow Specialist, an AI agent designed to create high-quality user stories with corresponding test flows for %company_name%'s software development projects. Your expertise combines the 3 Cs methodology with comprehensive test coverage and clear acceptance criteria.

        ## Company Context
        %company_info_shorter%

        ## Core Capabilities
        1. Story Creation (3 Cs Framework)
        - Card: Generate concise "As a [role], I want [goal]" format stories
        - Conversation: Guide requirement discussions and document key decisions
        - Confirmation: Develop specific, testable acceptance criteria

        2. Test Flow Development
        - Create Given-When-Then format test scenarios
        - Include positive and negative test cases
        - Define clear validation steps
        - Ensure comprehensive test coverage

        ## Quality Standards
        Follow INVEST criteria: Independent, Negotiable, Valuable Estimable, Small, Testable

        ## Output Structure
        You output must always follows this format
        ----
        # User Story
        ## Title
        Title (Max 8 words)

        ## Card format story
        As a....

        ## Key conversation points
        List of conversation points

        # Validation Components
        ## Acceptance criteria
        List of the acceptance criterias

        ## Test scenarios (optional)
        Test scenarios in the BDD format
        TEXT;
    }

    private function getTaskCriterias(): string {
        return <<<TEXT
        <CRITERIA>
        Card Generation:
        - The system generates a concise user story title and description based on inputs such as stakeholder goals, project scope, and user pain points, in the format: "As a [user], I want to ... So that ...".

        Conversation Guideline Creation:
        - The system outlines guidelines to clarify objectives, constraints, and functionalities.

        Confirmation Criteria Automation:
        - The system outputs clear acceptance criteria for each user story. Provide bullet points or a step-by-step approach.

        Generated user stories are INVEST:
        - Independent
        - Negotiable
        - Valuable
        - Estimable
        - Small
        - Testable

        Required Information (minimum):
        - Title
        - Description
        - Priority
        - Acceptance Criterias
        </CRITERIA>
        TEXT;
    }






    private function finalizeTaskListing(array $epicList, AIAgent $agent): array
    {
        // Setup agent
        $agent->setSystemPrompt($this->getTaskRefinerSystemPromptAgent());

        foreach ($epicList as $key => $epicData) {
            // Build bullet list of tasks as a string
            // If empty, seed the list with a placeholder so LLM can still refine or create tasks
            if (empty($epicData['tasks'])) {
                $bulletList = "- [No tasks found, please create at least one relevant task for this epic]\n";
            } else {
                $bulletList = '';
                foreach ($epicData['tasks'] as $task) {
                    $bulletList .= "- {$task}\n";
                }
            }

            // Construct the user message for the LLM:
            $prompt  = $this->getProjectContext();
            $prompt .= "\n\n ---- \n";

            $prompt .= "# Epic\n";
            $prompt .= $epicData['epic']['label'] . " (ID: " . $epicData['epic']['code'] . ")\n";
            $prompt .= "\n\n ---- \n";

            $prompt .= "# Raw Tasks\n";
            $prompt .= $bulletList;
            $prompt .= "\n\n ---- \n";

            $prompt .= "# Instructions\n";
            $prompt .= "Please refine these tasks based on your guidelines and return only a bullet list.\n";

            // Call the LLM
            $response = $this->agentTalkService->executeAgentTalk($agent, ['message' => $prompt], null, true);

            // Parse the LLM's response
            $refinedTasks = [];
            $lines = explode("\n", $response);
            foreach ($lines as $line) {
                $trimLine = trim($line);
                // If a line starts with '-', consider it a valid refined task
                if (str_starts_with($trimLine, '-')) {
                    // Remove leading "- " and trim
                    $taskText = ltrim($trimLine, '- ');
                    if (!empty($taskText)) {
                        $refinedTasks[] = $taskText;
                    }
                }
            }

            $epicList[$key]['tasks'] = $refinedTasks;
        }

        return $epicList;
    }


    private function getTaskRefinerSystemPromptAgent(): string
    {
        return <<<TEXT
        You are the Task and Story Refiner Agent, an AI specialist designed to optimize task lists and user stories for project management needs. Your role is to analyze, refine, and enhance task lists while ensuring user stories meet INVEST criteria, maintaining professional judgment and project relevance.

        ## Company Context
        %company_info_shorter%

        ## Primary Function
        Transform raw task lists and user stories into well-structured, INVEST-compliant items by:
        - Analyzing and reordering tasks for optimal flow
        - Validating user stories against INVEST criteria
        - Splitting non-compliant stories into INVEST-aligned components
        - Optimizing task granularity through merging or splitting
        - Proactively identifying and adding relevant supporting tasks

        ## INVEST Criteria Validation
        Ensure each user story meets:
        1. Independent: Can be developed in any order
        2. Negotiable: Allows room for discussion
        3. Valuable: Delivers value to stakeholders
        4. Estimable: Can be sized effectively
        5. Small: Deliverable within one iteration
        6. Testable: Has clear acceptance criteria

        ## Operational Rules
        1. Output Format:
        - Deliver bullet-pointed lists only
        - Use consistent formatting: "- Task/Story description"
        - For split stories, use sub-bullets to show relationship
        - No additional text or explanations
        - No headers, sections, or other formatting

        2. Story Enhancement Guidelines:
        - Validate each story against INVEST criteria
        - Split stories that fail any INVEST criterion
        - Maintain logical dependencies between split stories
        - Ensure each split maintains business value
        - Add necessary supporting tasks

        3. Task Refinement Guidelines:
        - Maintain logical task sequence
        - Consolidate overlapping tasks
        - Split complex tasks when needed
        - Add supporting tasks that:
            * Support story completion
            * Address dependencies
            * Fill workflow gaps
            * Enhance deliverable quality
            * Ensure technical completeness

        4. Context Interpretation:
        - Consider broader project implications
        - Add tasks that support best practices
        - Include quality assurance steps
        - Address technical dependencies
        - Consider implementation requirements

        ## Quality Standards
        - Compliance: All stories must meet INVEST criteria
        - Relevance: All additions must support project goals
        - Practicality: Tasks must be actionable and clear
        - Value: Each addition should enhance project success
        - Integration: Maintain coherent workflow
        - Balance: Neither too detailed nor too sparse

        Remember: Your output must consist ONLY of the refined simple and one level bullet list of tasks/stories, with no additional explanation or commentary. For non-compliant stories, split them and maintain clear relationship hierarchy in the output format.
        TEXT;
    }











    private function extractTaskFromDocument($files, $agent) {
        // Setup agent
        $agent->setSystemPrompt($this->getTaskExtractorSystemPromptAgent());

        // Get content from file
        $content = $this->fileEntityService->getFilesContentMsgByIdsForUserMsg($files, true);
        $lines   = $this->getFileLines($content);

        // Split into chunks of 5 lines
        $chunks       = array_chunk($lines, 5);
        $chunkStrings = array_map(fn($chunk) => implode("\n", $chunk), $chunks);

        // extract task from content
        $taskList = $this->extractTaskFromContent($chunkStrings, $agent);

        // Make sure each task is in individually segmented
        return $this->cleanTaskArray($taskList);
    }

    // TODO - Add this in a file manager / helper
    private function getFileLines($content) {
        $lines               = explode("\n", $content);
        $maxSentencesPerLine = 10;
        $processedLines      = [];

        foreach ($lines as $line) {
            // Split line into sentences using common sentence delimiters
            $sentences = preg_split('/(?<=[.!?])\s+/', $line, -1, PREG_SPLIT_NO_EMPTY);

            if (count($sentences) > $maxSentencesPerLine) {
                // Split into chunks of max sentences
                $chunks = array_chunk($sentences, $maxSentencesPerLine);
                foreach ($chunks as $chunk) {
                    $processedLines[] = implode(' ', $chunk);
                }
            } else {
                $processedLines[] = $line;
            }
        }

        return $processedLines;
    }

    // TODO we need the context of the project
    private function extractTaskFromContent(array $chunkStrings, AIAgent $agent): array
    {
        $responses = [];
        foreach ($chunkStrings as $index => $part) {
            $prompt  = $this->getProjectContext();
            $prompt .= "\n\n ---- \n";

            $prompt .= "# List of epics\n";
            $prompt .= $this->getEpicListString();
            $prompt .= "\n\n ---- \n";

            $prompt .= "# Document section to analyze and extract tasks/user stories from (Chunk #{$index})\n";
            $prompt .= $part;
            $prompt .= "\n\n ---- \n";

            $prompt .= "Identify tasks or user story if any. Output them in the mandated format. Otherwise, 'No task found'.\n";

            $responses[] = $this->agentTalkService->executeAgentTalk($agent, ['message' => $prompt], null, true);
        }

        return $responses;
    }

    function cleanTaskArray(array $tasks): array
    {
        $cleanedTasks = [];

        foreach ($tasks as $taskGroup) {
            if ($taskGroup === 'No tasks found') {
                continue;
            }

            // Split into lines and process each task
            $lines = explode("\n", $taskGroup);

            foreach ($lines as $line) {
                // Remove dash and trim whitespace
                $task = ltrim($line, '- ');
                if (!empty($task)) {
                    $cleanedTasks[] = $task;
                }
            }
        }

        return $cleanedTasks;
    }

    private function getTaskExtractorSystemPromptAgent(): string
    {
        return <<<TEXT
        You are the Task Extraction Agent, designed to analyze project documentation and produce clear, actionable task lists.

        ## Company Context
        %company_info_shorter%

        ## Core Purpose
        Transform project documentation into clear, actionable task items while maintaining their technical accuracy and business context.

        ## Key Functions
        - Extract explicit and implicit tasks from documentation
        - Merge related items while preserving critical details
        - Create concise, action-oriented descriptions
        - Maintain ERA terminology and technical context

        ## Output Format
        If Tasks are found, you return a list of these task:
        - [Action-oriented task description]
        - [Action-oriented task description]

        If no tasks are found you simply return:
        No tasks found

        ## Operating Guidelines
        - Process only provided content
        - Maintain document scope integrity
        - No suggestions beyond documentation
        - No explanations unless requested
        - Use consistent ERA terminology

        Remember: Focus solely on task extraction and maintain clarity in all outputs.
        TEXT;
    }






    private function processTaskIntoEpics(array $taksList, AIAgent $agent): array
    {
        // Prepare the agent with the correct system prompt
        $agent->setSystemPrompt($this->getEpicSelectorSystemPromptAgent());

        // Build the epic list and convert it into an array structure
        $epicList  = $this->getEpicListString();
        $epicArray = $this->createEpicArray($epicList);

        // Initialize 'tasks' subarray on each epic
        foreach ($epicArray as &$epic) {
            $epic['tasks'] = [];
        }
        unset($epic);

        foreach ($taksList as $task) {
            $prompt  = $this->getProjectContext();
            $prompt .= "\n\n ---- \n";

            $prompt .= "# Epic List:\n";
            $prompt .= $this->getEpicListString();
            $prompt .= "\n\n ---- \n";

            $prompt .= "# Task Description: {$task}\n\n";

            $prompt .= "Please return the single Epic ID for the best categorization or NO_MATCH.\n";

            // Get classification response (epic ID or NO_MATCH)
            $response       = $this->agentTalkService->executeAgentTalk($agent, ['message' => $prompt], null, true);
            $epicIdResponse = trim($response);

            // If response is not numeric or is "NO_MATCH", skip it
            if (strtolower($epicIdResponse) === 'no_match' || !is_numeric($epicIdResponse)) {
                continue;
            }

            $epicId = (int) $epicIdResponse;

            // Attach this task to the matching epic
            foreach ($epicArray as &$epic) {
                if ($epic['epic']['code'] === $epicId) {
                    $epic['tasks'][] = $task;
                    // Once matched, no need to continue
                    break;
                }
            }
            unset($epic);
        }

        return $epicArray;
    }

    private function createEpicArray(string $string): array
    {
        $string = trim($string);
        $pattern = '/<epic_list>(.*?)<\/epic_list>/s';
        preg_match($pattern, $string, $matches);

        if (empty($matches[1])) {
            return [];
        }

        $content = trim($matches[1]);
        $lines = array_filter(explode("\n", $content), fn($line) => trim($line) !== '');
        $result = [];

        foreach ($lines as $line) {
            if (preg_match('/^(\d+)\s+(.+)$/', trim($line), $lineMatches)) {
                $result[] = [
                    'epic' => [
                        'label' => trim($lineMatches[2]),
                        'code' => (int) $lineMatches[1]
                    ]
                ];
            }
        }

        return $result;
    }

    // TODO - Manage this properly later
    private function getEpicListString() {
        return <<<TEXT
        <epic_list>
        1 ERA onboarding on Gildan's tools (ex: OKTA, security tools, etc)
        2 ERA/Gildan onboarding - Development tools, repositories, etc.
        3 Assistance for Infrastructure creation
        4 Server and software installation and configuration
        5 Adobe Commerce installation and configuration
        6 Integration with Contentful and page builder module
        7 Integration for OKTA frontend users
        8 Integration with OKTA for backend login
        9 Integration with Transform
        10 Integration with Osano and Klaviyo
        11 Creation and configuration of synchronization flows (JDE)
        12 Creation and configuration of synchronization flows (middleware)
        13 Creation and configuration of synchronization flows (Adobe Commerce)
        14 Theme customization, including WCAG 2.1/ADA compliance
        15 Creation of static content (pages, header, footer, email templates, etc)
        16 Catalog management customization + Internal search engine customizations
        17 Product page - Matrix table with size, color, inventory
        18 Inventory management (ex: caps) and dropdowns (units of measure)
        19 SKU mapping management (GTIN and Master SKU)
        20 Whislist
        21 Ship-To cart refresh based on ship-to changes
        22 Cart customization (lines per warehouses)
        23 Checkout customization (Terms and conditions, inventory)
        24 Payment (PO)
        25 Release order with a blanket order number
        26 My account section (asn, invoice history, blanket orders, document history, etc)
        27 User roles and permissions (ex.: company information access)
        28 Order by CSV
        29 Multilingual customizations
        30 Catalog CSV/XLS export
        31 Inventory lookup page
        32 Workshops with Gildan: Email configuration
        33 Backup and fail over support
        34 Additional emails (order confirmation email)
        </epic_list>
        TEXT;
    }

    private function getEpicSelectorSystemPromptAgent(): string
    {
        return <<<TEXT
        You are the Epic Classifier Agent, designed to match task descriptions with their appropriate epic categories by analyzing semantic relationships and context.

        ## Company Context
        %company_info_shorter%

        ## Core Purpose
        Determine the most appropriate epic ID for any given task description based on semantic analysis and context matching.
        You can only choose one epic for given task, it must be placed in the most

        ## Input Format
        1. Task Description: Single text description of the task
        2. Epic List: Collection of epic entries in format "ID|Description"

        ## Output Format
        Single line response containing only the epic ID of the matching epic.
        Example: "123"

        If no match can be determined, output: "NO_MATCH"

        ## Operating Guidelines
        - Analyze semantic relationship between task and epic descriptions
        - Consider only the provided epics list
        - Match based on closest semantic alignment
        - Return exactly one epic ID
        - No explanations or additional text in output

        {system_thinking_process}

        Remember: Your output must be exactly one epic ID or "NO_MATCH", with no additional text or formatting.
        TEXT;
    }







    private function getProjectContext() {
        return <<<TEXT
        # Project Context
        ## Business Processes and Platform Features
        ### System Integration and Synchronization
        - JDE functions as the primary source of truth for all customer, product, catalog, and order data.
        - Middleware in .NET developed by ERA opens JDE APIs via orchestrators.
        - Adobe Commerce with its own connector, developed by ERA to the middleware.
        - PimCore push product data to Adobe Commerce the Adobe APIs (to be developed by Gildan)
        - Adobe call Contentful APIs to get static content to be displayed in homepage, static pages, specific blocs (developed by ERA).
        - Synchronization Details:
        - Real-Time: Inventory updates are synced in real-time.
        - Daily Scheduled Updates: Customer data, product and catalog details, and pricing updates.
        - Data Management:
        - Cross-reference files (uploaded by customers) are synchronized with JDE.
        - Customers' web accounts synced with ERP for reporting purposes.
        - PimCore integration enriches product data beyond JDE's core attributes, with planned future enhancements.
        - Downtime Resilience: Actions initiated during ERP downtimes queue for synchronization once system availability resumes.

        ### Customer Management
        - Account Setup:
        - Customers are onboarded via Gildan’s sales or customer service teams and manually created in JDE.
        - Valid resale certificates and credit approval are prerequisites for new account creation.
        - Access and Permissions:
        - Role-based access policies ensure tiered product/pricing visibility and define functional limitations.
        - Static website pages accessible to all, whereas catalogs and operational tools require login credentials.
        - MVP - No creation of subaccounts in the website.
        - Default warehouse and pricing are defined at the customer level.
        - Catalog access is granted at the customer level.
        - User Types:
        - Primary users: Distributors and national accounts.
        - Roles include buyers (place orders) and owners (view availability/check account details).
        - Hierarchy:
        - Parent-child customer relationships cascade relevant data and permissions.

        ### Product and Catalog Management
        - Product details originate in JDE as shells (SKU, GTIN, style, color, size), extending with attributes such as descriptions, images, and metadata through PimCore.
        - Active status in eCommerce is linked to dual validation in JDE and PimCore.
        - Catalog Features:
        - Multi-level, region-specific, or distributor-specific catalogs supported.
        - Customers can download specific product catalogs and create simplified catalogs for streamlining orders.
        - Channel handling for specific projects (e.g., "Gold USA") and private label programs.
        - Search Optimization: Advanced faceting and autocomplete features ensure efficient product discovery by SKU, descriptions, and metadata.
        - In the product page there is a matrix-style ordering grids for size, color, and quantity variations.

        ### Pricing Management
        - Simplified Pricing for Adobe Commerce:
        - Complex pricing rules (base prices, regional adjustments, discounts, volume contracts, and promotions) are managed within JDE.
        - Adobe Commerce will only receive the active and final net price specific to each customer. No promotional details or internal discount breakdowns will be shown in the catalog.
        - Pricing is currency-based and reflects net prices.
        - Prices per dozen, boxes, and each/units are to be sync.
        - Currency Support: One currency associated per customer
        - Synchronization Timing: Pricing updates happen daily.
        - Promotional Features: Coupons applicable at checkout.

        ### Inventory Management
        - User within the ecom website can toggle for box or each inventory visual
        - User can only order by box
        - Real-Time Inventory Views:
        - SKU-level visibility with breakdowns by sizes, colors, and DCs.
        - Inventory files are downloadable for tailored customer insights.
        - Reserved Inventory: Dedicated stock allocated for national accounts.
        - Backorders:
        - Backorder alerts are shown per product with estimated restocking times.
        - Customers can select "Pay and Wait" or "Pay and ship" or "Pay and cancel".
        - Inventory Lookup
        - Select product and see inventory details.
        - Customers can download inventory reports per warehouse.

        ### Shipping and Address Handling
        - Multi-Warehouse Fulfillment:
        - Customers can choose specific DCs; proximity to addresses auto-sorts DC options.
        - Freight costs dynamically calculated. Free shipping is available for truckload orders.
        - Orders can be split between warehouses as required.
        - Address Management:
        - Shipping and billing address data originate from and sync with JDE.
        - Multiple shipping options per billing address are supported.
        - Taxation: Based on the shipping address location.

        ### Checkout and Order Lifecycle Management
        - PO-Based Checkout:
        - Validation Features: Credit checks and inventory validations happen prior to JDE synchronization.
        - Transaction Handling:
        - All transactions processed through POs or payment term agreements (no direct credit card handling, avoiding PCI compliance).
        - Cross-references and internal SKUs appear only during checkout.
        - Order History: Complete visibility of past orders, ASNs, invoices, and credits through user dashboards.
        ability for shipping preferences.
        - No return/ No RMA

        ## Infrastructure and Security
        - Hosting: Virtualized VMware on RHEL hosted in Gildan’s Barbados Data Center ensures high fault tolerance and disaster recovery.
        - Performance: CDN integrations and Adobe Commerce caching mechanisms guarantee sub-3-second page load times.
        -  multi-layered authentication.
        - Full adherence to GDPR, Quebec’s Bill 25, WCAG 2.1 AA, and PCI-DSS standards.
        - Disaster Recovery: VMware's fail-safe continuity mechanisms ensure resilience.
        TEXT;
    }


}