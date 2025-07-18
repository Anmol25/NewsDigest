
export const getRelativeTime = (datetime: string): string => {
  const now = new Date();
  const past = new Date(datetime);
  const diffInSeconds = Math.floor((now.getTime() - past.getTime()) / 1000);

  // Handle future dates
  if (diffInSeconds < 0) {
    return 'just now';
  }

  // Less than a minute
  if (diffInSeconds < 60) {
    return 'just now';
  }

  // Minutes
  const minutes = Math.floor(diffInSeconds / 60);
  if (minutes < 60) {
    return `${minutes} min ago`;
  }

  // Hours
  const hours = Math.floor(minutes / 60);
  if (hours < 24) {
    return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  }

  // Days
  const days = Math.floor(hours / 24);
  if (days < 30) {
    return `${days} day${days > 1 ? 's' : ''} ago`;
  }

  // Months
  const months = Math.floor(days / 30);
  if (months < 12) {
    return `${months} month${months > 1 ? 's' : ''} ago`;
  }

  // Years
  const years = Math.floor(months / 12);
  return `${years} year${years > 1 ? 's' : ''} ago`;
};

export const handleSummarize = async (axiosInstance, id, updateHistory = true, setSummary, setIsSummarizing) => {
  setIsSummarizing(true);
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
  } finally {
    setIsSummarizing(false);
  }
};

export const handleTypingEffect = (summary:string, setDisplayText) => {
  if (!summary) return;

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
    }
  };

  const animationFrame = requestAnimationFrame(animate);

  return () => {
    cancelAnimationFrame(animationFrame);
  };
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