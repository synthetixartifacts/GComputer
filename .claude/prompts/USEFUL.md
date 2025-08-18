I want to review everythh


It's a big task and I want you to do it step by step with a clear plan from where we are to where we want to go and what we want to accomplish here.
Really take time to think about the best options available to us to do this, consider our project structure and what's already implemented within codebase and how it's implemented. Make sure to double check things, do not make any assumptions, yes the documentation is good but could be outdated. 

Once you know what you need to know to accomplish your task you will create your plan that will be really linked to our project.
Decide in the best way to do this task for our project, specifications and requirements. 
It's a big project so in everything we do/create/update, the main focus is that we want resusability, DRY and simple clean code.



------


Revalidation system:

 

 Ok, it is working, we properly are able to communicate with openAi but it use the model fallback which is gpt-3.5-turbo instead of the model that is linked to the agent.
 When I try to talk with an agent with the claude sonnet 4 model, the anthropic call failed and in the network I see that it try to use claude-3-sonnet-20240229 instead of the model associated to my agent.
 So we need to validate our logic to make sure we do things properly here. 

When we are on the test communication page. 
There is multiple issue.
First I don't want the 