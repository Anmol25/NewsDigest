import axiosInstance from './AxiosConfig';

async function getFeed(topic, page = 1, axiosInstance) {
    try {
        const response = topic === 'For You' 
            ? await axiosInstance.get('/foryou', { params: { page } })
            : await axiosInstance.get(`/feed/${topic}`, { params: { page } });

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
