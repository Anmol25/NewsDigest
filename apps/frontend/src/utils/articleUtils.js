export const formatDate = (time) => {
  const date = new Date(time);

  const formattedDate = date.toLocaleString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  const formattedTime = date.toLocaleString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
    timeZone: "Asia/Kolkata"
  }).replace(",", "");

  return [formattedDate, `${formattedTime} IST`];
};

export const handleTypingEffect = (summary, setDisplayText, setIsTyping) => {
  if (!summary) return;

  setIsTyping(true);
  setDisplayText('');
  const totalDuration = 2000;
  const totalChars = summary.length;
  let startTime = null;
  
  const animate = (currentTime) => {
    if (!startTime) startTime = currentTime;
    
    const elapsedTime = currentTime - startTime;
    const progress = Math.min(elapsedTime / totalDuration, 1);
    
    const charsToShow = Math.floor(progress * totalChars);
    setDisplayText(summary.slice(0, charsToShow));
    
    if (progress < 1) {
      requestAnimationFrame(animate);
    } else {
      setIsTyping(false);
    }
  };

  const animationFrame = requestAnimationFrame(animate);

  return () => {
    cancelAnimationFrame(animationFrame);
    setIsTyping(false);
  };
};

export const handleSummarize = async (axiosInstance, id, updateHistory = true, setIsLoading, setDisplayText, setSummary) => {
  setIsLoading(true);
  setDisplayText('');
  
  try {
    const response = await axiosInstance.get('/summarize', {
      params: { id, update_history: updateHistory }
    });
    setSummary(response.data.data);
  } catch (error) {
    console.error('Error fetching summary:', error);
  } finally {
    setIsLoading(false);
  }
};

export const handleLike = async (axiosInstance, id, setIsLiked) => {
  try {
    const response = await axiosInstance.post('/like', {
      article_id: id
    });

    if (response.status === 200) {
      setIsLiked(prev => !prev);
    }
  } catch (error) {
    console.error('Error liking article:', error);
  }
};


export const handleBookmark = async (axiosInstance, id, setIsBookmarked) => {
  try {
    const response = await axiosInstance.post('/bookmark', {
      article_id: id
    });

    if (response.status === 200) {
      setIsBookmarked(prev => !prev);
    }
  } catch (error) {
    console.error('Error bookmarking article:', error);
  }
}; 