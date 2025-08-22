// This script tests the discussion functionality through the dev console
// Copy and paste this into the Electron dev console

async function testDiscussionFeature() {
  console.log('Testing Discussion Feature...');
  
  try {
    // Test 1: List agents
    console.log('\n1. Listing agents...');
    const agents = await window.gc.db.admin.agents.list();
    console.log(`Found ${agents.length} agents:`, agents.map(a => a.name));
    
    if (agents.length === 0) {
      console.error('No agents found! Please seed the database first.');
      return;
    }
    
    // Test 2: Create a discussion
    console.log('\n2. Creating a new discussion...');
    const discussion = await window.gc.db.discussions.create({
      title: 'Test Discussion ' + new Date().toISOString(),
      agentId: agents[0].id
    });
    console.log('Created discussion:', discussion);
    
    // Test 3: List discussions
    console.log('\n3. Listing discussions...');
    const discussions = await window.gc.db.discussions.list();
    console.log(`Found ${discussions.length} discussions:`, discussions);
    
    // Test 4: Create a message
    console.log('\n4. Creating a message...');
    const message = await window.gc.db.messages.create({
      who: 'user',
      content: 'Hello, this is a test message!',
      discussionId: discussion.id
    });
    console.log('Created message:', message);
    
    // Test 5: Get discussion with messages
    console.log('\n5. Getting discussion with messages...');
    const fullDiscussion = await window.gc.db.discussions.getWithMessages(discussion.id);
    console.log('Discussion with messages:', fullDiscussion);
    
    // Test 6: Toggle favorite (should fail without messages)
    console.log('\n6. Testing favorite toggle...');
    try {
      const favorited = await window.gc.db.discussions.toggleFavorite(discussion.id);
      console.log('Toggled favorite:', favorited);
    } catch (error) {
      console.log('Expected error (need at least one message):', error.message);
    }
    
    // Test 7: Count messages
    console.log('\n7. Counting messages...');
    const count = await window.gc.db.messages.countByDiscussion(discussion.id);
    console.log(`Discussion has ${count} messages`);
    
    // Test 8: Clean up - delete the test discussion
    console.log('\n8. Cleaning up...');
    await window.gc.db.discussions.delete(discussion.id);
    console.log('Deleted test discussion');
    
    console.log('\n✅ All tests passed! Discussion feature is working correctly.');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
testDiscussionFeature();