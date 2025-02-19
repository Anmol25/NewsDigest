const url = "http://localhost:8000";

async function getFeed(topic){
    if(topic === 'For You'){
        return [];
    }
    const response = await fetch(`${url}/feed/${topic}`)
    const data = await response.json();
    return data;
}

export default getFeed;

// Test the function
getFeed("Top Stories")
    .then(feed => console.log("Feed Data:", feed))
    .catch(error => console.error("Error fetching feed:", error));