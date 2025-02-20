import axios from 'axios';

const url = "http://localhost:8000";

async function getFeed(topic, page = 1) {
    if(topic === 'For You'){
        return {
            data: [],
            hasMore: false  // Explicitly indicate no more data for "For You"
        };
    }
    try {
        const response = await axios.get(`${url}/feed/${topic}`, {
            params: { page }
        });
        return {
            data: Array.isArray(response.data) ? response.data : [],
            hasMore: Array.isArray(response.data) && response.data.length > 0
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
