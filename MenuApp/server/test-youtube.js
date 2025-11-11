const axios = require('axios');

// Test YouTube video search
async function testYouTube() {
  try {
    console.log('🧪 Testing YouTube video search...\n');
    
    // Test 1: Simple query
    console.log('Test 1: Simple query "chicken recipe"');
    const response1 = await axios.get('http://localhost:3001/api/test-youtube', {
      params: {
        query: 'chicken recipe',
        cookware: 'Oven'
      }
    });
    console.log('Response:', JSON.stringify(response1.data, null, 2));
    console.log('\n');
    
    // Test 2: Check if API key is configured
    console.log('Test 2: Health check');
    const health = await axios.get('http://localhost:3001/health');
    console.log('Health:', JSON.stringify(health.data, null, 2));
    
  } catch (error) {
    console.error('Error:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
    }
  }
}

testYouTube();
