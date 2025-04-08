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
    if (response.status === 200) {
      setSummary(response.data.data);
    } else {
      throw new Error('Failed to generate summary');
    }
  } catch (error) {
    console.error('Error fetching summary:', error);
    setDisplayText('Failed to generate summary. Please try again later.');
    const errorEvent = new CustomEvent('showNotification', {
      detail: {
        message: 'Failed to generate summary. Please try again later.',
        type: 'error'
      }
    });
    window.dispatchEvent(errorEvent);
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
    } else {
      throw new Error('Failed to update like status');
    }
  } catch (error) {
    console.error('Error liking article:', error);
    const errorEvent = new CustomEvent('showNotification', {
      detail: {
        message: 'Failed to update like status. Please try again later.',
        type: 'error'
      }
    });
    window.dispatchEvent(errorEvent);
  }
};

export const handleBookmark = async (axiosInstance, id, setIsBookmarked) => {
  try {
    const response = await axiosInstance.post('/bookmark', {
      article_id: id
    });

    if (response.status === 200) {
      setIsBookmarked(prev => !prev);
    } else {
      throw new Error('Failed to update bookmark status');
    }
  } catch (error) {
    console.error('Error bookmarking article:', error);
    const errorEvent = new CustomEvent('showNotification', {
      detail: {
        message: 'Failed to update bookmark status. Please try again later.',
        type: 'error'
      }
    });
    window.dispatchEvent(errorEvent);
  }
}; 