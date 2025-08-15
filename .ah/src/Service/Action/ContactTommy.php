<?php

namespace App\Service\Action;

use App\Entity\Ai\AIAgent;
use Symfony\Component\DependencyInjection\Attribute\AutoconfigureTag;

#[AutoconfigureTag('app.action_file_handler')]
class ContactTommy extends AbstractAction
{
    public function execute(AIAgent $agent, string $userMsg, array $data = [], ?callable $callback = null): mixed
    {
        // $agent->getModel()->getStreamMessageLocation();

        $userMsg = ' THIS IS WHT YOU GET';

        echo '<pre>';
        print_r([
        'TOMMY is here',
        $data,
        ]);
        die;

        $response               = $this->agentService->createAgentResponse($agent, $userMsg);
        $response['statusCode'] = 200;


        // To send infos to the frontend we use this.
        $callback($response);






        // echo '<pre>';
        // print_r([
        // 'TOMMY is here',
        // $response,
        // // $callback
        // ]);
        // die;
        return true;
    }
}