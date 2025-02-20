const url = "http://localhost:8000";

async function getFeed(topic, page = 1) {
    if(topic === 'For You'){
        return {
            data: [],
            hasMore: false  // Explicitly indicate no more data for "For You"
        };
    }
    try {
        const response = await fetch(`${url}/feed/${topic}?page=${page}`);
        if (!response.ok) {
            return {
                data: [],
                hasMore: false
            };
        }
        const data = await response.json();
        return {
            data: Array.isArray(data) ? data : [],
            hasMore: Array.isArray(data) && data.length > 0
        };
    } catch (error) {
        console.error('Error fetching feed:', error);
        return {
            data: [],
            hasMore: false
        };
    }
}

export default getFeed;
