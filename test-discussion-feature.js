// Test script to verify discussion feature is working
// Run this in the browser console or Node.js

async function testDiscussionFeature() {
  console.log('🧪 Testing Discussion Feature...\n');
  
  const isElectron = typeof window !== 'undefined' && window.gc?.db;
  console.log(`Environment: ${isElectron ? 'Electron' : 'Browser/Node'}`);
  
  try {
    // Test 1: List discussions
    console.log('\n1️⃣ Testing list discussions...');
    let discussions;
    if (isElectron) {
      discussions = await window.gc.db.discussions.list();
    } else {
      const res = await fetch('http://localhost:3001/api/discussions');
      discussions = await res.json();
    }
    console.log(`✅ Found ${discussions.length} discussions`);
    
    // Test 2: List agents
    console.log('\n2️⃣ Testing list agents...');
    let agents;
    if (isElectron) {
      agents = await window.gc.db.agents.list();
    } else {
      const res = await fetch('http://localhost:3001/api/admin/agents');
      agents = await res.json();
    }
    console.log(`✅ Found ${agents.length} agents`);
    
    if (agents.length === 0) {
      console.log('⚠️ No agents found. Please create an agent first.');
      return;
    }
    
    // Test 3: Create a discussion
    console.log('\n3️⃣ Testing create discussion...');
    const agentId = agents[0].id;
    let newDiscussion;
    if (isElectron) {
      newDiscussion = await window.gc.db.discussions.create({
        title: 'Test Discussion',
        agentId: agentId,
        isFavorite: false
      });
    } else {
      const res = await fetch('http://localhost:3001/api/discussions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: 'Test Discussion',
          agentId: agentId,
          isFavorite: false
        })
      });
      newDiscussion = await res.json();
    }
    console.log(`✅ Created discussion with ID: ${newDiscussion.id}`);
    
    // Test 4: Create a message
    console.log('\n4️⃣ Testing create message...');
    let newMessage;
    if (isElectron) {
      newMessage = await window.gc.db.messages.create({
        who: 'user',
        content: 'Hello, this is a test message!',
        discussionId: newDiscussion.id
      });
    } else {
      const res = await fetch('http://localhost:3001/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          who: 'user',
          content: 'Hello, this is a test message!',
          discussionId: newDiscussion.id
        })
      });
      newMessage = await res.json();
    }
    console.log(`✅ Created message with ID: ${newMessage.id}`);
    
    // Test 5: Get discussion with messages
    console.log('\n5️⃣ Testing get discussion with messages...');
    let discussionWithMessages;
    if (isElectron) {
      discussionWithMessages = await window.gc.db.discussions.getWithMessages(newDiscussion.id);
    } else {
      const res = await fetch(`http://localhost:3001/api/discussions/${newDiscussion.id}/with-messages`);
      discussionWithMessages = await res.json();
    }
    console.log(`✅ Retrieved discussion with ${discussionWithMessages.messages.length} messages`);
    
    // Test 6: Toggle favorite
    console.log('\n6️⃣ Testing toggle favorite...');
    let updatedDiscussion;
    if (isElectron) {
      updatedDiscussion = await window.gc.db.discussions.toggleFavorite(newDiscussion.id);
    } else {
      const res = await fetch(`http://localhost:3001/api/discussions/${newDiscussion.id}/favorite`, {
        method: 'POST'
      });
      updatedDiscussion = await res.json();
    }
    console.log(`✅ Toggled favorite: ${updatedDiscussion.isFavorite}`);
    
    // Test 7: Clean up - delete the test discussion
    console.log('\n7️⃣ Cleaning up test data...');
    if (isElectron) {
      await window.gc.db.discussions.delete(newDiscussion.id);
    } else {
      await fetch(`http://localhost:3001/api/discussions/${newDiscussion.id}`, {
        method: 'DELETE'
      });
    }
    console.log('✅ Test discussion deleted');
    
    console.log('\n🎉 All tests passed! Discussion feature is working correctly.');
    
  } catch (error) {
    console.error('\n❌ Test failed:', error);
    console.error('Error details:', error.message);
  }
}

// Run the test
if (typeof window !== 'undefined') {
  // Browser/Electron environment
  testDiscussionFeature();
} else {
  // Node.js environment
  testDiscussionFeature();
}