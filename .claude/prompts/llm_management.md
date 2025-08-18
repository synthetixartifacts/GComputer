




------------------

I'm now looking to add a new section in my app.

I want to add the Addmin section under the menu item Development.
Same as Development we dont enable the menu item at all. We add this menu tree:
Admin
  - Entity
    - LLM
      - Provider
      - Model
      - Agent


I want to create new tables in my database, but these tables will be like saved withing my app like when I compile my app it is part of it.
It's saved and available by default in the app, like the data is available by default in the app. 

I want to be able to manage these table through my interface in dev mode.
We already have a nice css/component structure now I want to make an admin section of reusable components, we could use specific libraries if needed and useful but we already have a lot setup so not sure if really needed, I would prefer to enhance our own components and enhance our own codebase to be able to reuse them everywhere if needed.

I want to have a page where we see the listing of these new entity, like Provider is the listing filterable/sortable for our provider with edit/duplicate/delete buttons. We also have a create button on top.

For your information I already did this type of management in another project but it was a symfony project and we use easyAdmin. I want you to replicate the entity fields logic for these entity right now based on what we did as well as the admin ux logic.

You will be able to find the entity in .ah\src\Entity\Ai
You will be able to find the admin file for ux here:
.ah\src\Controller\Admin\AIProviderCrudController.php
.ah\src\Controller\Admin\AIModelCrudController.php
.ah\src\Controller\Admin\AIAgentCrudController.php

We are starting this project and in my old project we have a lot more entities with more relation to the one we want to manage now. Do not create the fields for these entity for now like do not create the memory logic field. Just focus on plain config files.

For the provider we will do the same exact fields. 
For the model we will do the same exact fields.
For the agent lets do id, code, name, description, version, enable, isSystem, systemPrompt, configuration, createdAt, updatedAt and needed relation with model and provider.


It's a big task and I want to do it step by step. Really take time to think about the best options available to us to do this, consider our project structure and overall already implemented codebase. Then decide in the best one adapted to our project, specifications and requirements. We want resusability, DRY and simple clean code.






















I'm looking to manage entity from my app but also I want to be able to manipulate certain of this entity through my interface.

Is it possile in my app right now, in dev mode to be able to update a folder within my app that contains json. 
For this I dont want to use a db I want to use a phyisical file. So that when I compile my app it is part of it unlike a db.
So I want my data to live under data_json folder in the root of our app/code.
We will create a folder for the management of llm so data_json/llm 

So for that I'm looking at a way if its possible to do the physical saving task but also I'm looking to have a nice ux/ui admin section.
We already have a nice css/component structure now I want to make an admin section.

My admin section will be another menu item under Development. Same as Development we dont enable the menu item at all (right now there is a glitch we still see Development in production mode, start by fixing that). We add this menu tree under:
Admin
  - Entity
    - LLM
      - Provider
      - Model
      - Agent
    

For providers, we will use provider.json in which we will manage llm provider configuration like openAi, Anthropic etc.
For models, we will use model.json in which we will manage llm model configuration like gpt-5, claude-sonnet-4 etc.
For agent, we will use agent.json in which we will manage specific configuration for agent.

For the configuration of these and the relation and all I want you 

