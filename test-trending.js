// Simple test script to check the trending topics API
async function testTrendingAPI() {
  try {
    console.log('🚀 Testing Trending Topics API...')
    
    const response = await fetch('http://localhost:3000/api/admin/trending')
    console.log('Response status:', response.status)
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    
    const data = await response.json()
    console.log('✅ API Response received:', {
      success: data.success,
      topicsCount: data.topics?.length || 0,
      message: data.message,
      source: data.source
    })
    
    if (data.topics && data.topics.length > 0) {
      console.log('📊 Sample topics:')
      data.topics.slice(0, 5).forEach((topic, index) => {
        console.log(`${index + 1}. ${topic.topic} (${topic.source}) - Score: ${topic.blogScore}`)
      })
    }
    
    return data
  } catch (error) {
    console.error('❌ API Test Failed:', error)
    throw error
  }
}

// Run the test
testTrendingAPI()
  .then(() => console.log('🎉 Test completed successfully!'))
  .catch(() => console.log('💥 Test failed!'))