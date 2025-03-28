import { useState, useEffect, useRef } from "react";
import Featured from "../Featured/Featured";
import { useAxios } from "../../services/AxiosConfig";
import "./FeaturedLoader.css";

function FeaturedLoader() {
  const [featuredNews, setFeaturedNews] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isHovering, setIsHovering] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const carouselRef = useRef(null);
  const autoScrollTimerRef = useRef(null);
  const axiosInstance = useAxios();

  const loadFeaturedNews = async (currentPage) => {
    if (loading && currentPage !== 1) return;
    
    if (currentPage === 1) {
      setLoading(true);
    }
    
    try {
      const response = await axiosInstance.get('/feed/Top Stories', {
        params: {
          page: currentPage,
        }
      });
      
      const newData = response.data || [];
      const moreData = newData.length > 0;
      
      setFeaturedNews(prev => 
        currentPage === 1 ? newData : [...prev, ...newData]
      );
      setHasMore(moreData);
      setPage(currentPage + 1);
    } catch (error) {
      console.error('Error loading featured news:', error);
      setHasMore(false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFeaturedNews(1);
  }, []);

  useEffect(() => {
    const startAutoScroll = () => {
      autoScrollTimerRef.current = setInterval(() => {
        if (!isHovering && featuredNews.length > 1) {
          const nextIndex = currentIndex + 1;
          
          if (nextIndex >= featuredNews.length - 2 && hasMore) {
            loadFeaturedNews(page);
          }
          
          if (nextIndex < featuredNews.length) {
            setCurrentIndex(nextIndex);
          }
        }
      }, 6500);
    };

    if (featuredNews.length > 1 && !isHovering) {
      startAutoScroll();
    }

    return () => {
      if (autoScrollTimerRef.current) {
        clearInterval(autoScrollTimerRef.current);
      }
    };
  }, [featuredNews, isHovering, currentIndex, hasMore, page]);

  const handleNav = (direction) => {
    if (direction === 'next') {
      const nextIndex = currentIndex + 1;
      
      if (nextIndex >= featuredNews.length - 2 && hasMore) {
        loadFeaturedNews(page);
      }
      
      if (nextIndex < featuredNews.length) {
        setCurrentIndex(nextIndex);
      }
    } else {
      setCurrentIndex((prevIndex) => Math.max(0, prevIndex - 1));
    }
  };

  const getItemStyle = (index) => {
    if (index === currentIndex) {
      return { zIndex: 10, transform: 'translateX(0) scale(1)', opacity: 1 };
    }
    
    if (index > currentIndex) {
      const distance = index - currentIndex;
      
      if (distance === 1) {
        return { zIndex: 5, transform: 'translateX(50%) scale(0.9)', opacity: 0.7 };
      } else if (distance === 2) {
        return { zIndex: 1, transform: 'translateX(90%) scale(0.8)', opacity: 0.5 };
      }
    }
    
    if (index < currentIndex) {
      const distance = currentIndex - index;
      
      if (distance === 1) {
        return { zIndex: 5, transform: 'translateX(-50%) scale(0.9)', opacity: 0.7 };
      } else if (distance === 2) {
        return { zIndex: 1, transform: 'translateX(-90%) scale(0.8)', opacity: 0.5 };
      }
    }
    
    return { zIndex: 0, transform: 'translateX(0) scale(0.7)', opacity: 0 };
  };

  if (loading) {
    return <div className="featured-loader-skeleton"></div>;
  }

  if (featuredNews.length === 0) {
    return null;
  }

  return (
    <div 
      className="featured-loader-container"
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
      ref={carouselRef}
    >
      <div className="featured-carousel">
        {featuredNews.map((news, index) => (
          <div 
            key={news.id} 
            className="featured-carousel-item"
            style={getItemStyle(index)}
          >
            <Featured {...news} />
          </div>
        ))}
        
        {loading && currentIndex > 0 && (
          <div className="featured-loader-additional-indicator">Loading more...</div>
        )}
      </div>
      
      <button 
        className="featured-nav-button featured-nav-left"
        onClick={() => handleNav('prev')}
        aria-label="Previous featured article"
        disabled={currentIndex === 0}
      >
        <span>&#8249;</span>
      </button>
      <button 
        className="featured-nav-button featured-nav-right"
        onClick={() => handleNav('next')}
        aria-label="Next featured article"
        disabled={currentIndex >= featuredNews.length - 1}
      >
        <span>&#8250;</span>
      </button>
      
      <div className="featured-indicators">
        {featuredNews.length > 0 && (
          <>
            {(() => {
              const totalIndicators = 5;
              const middlePosition = Math.floor(totalIndicators / 2);
              
              let positions = [];
              
              if (currentIndex <= middlePosition) {
                positions = [0, 1, 2, 3, 4];
              } 
              else if (currentIndex >= featuredNews.length - (totalIndicators - middlePosition)) {
                const startPos = Math.max(0, featuredNews.length - totalIndicators);
                positions = Array.from(
                  { length: totalIndicators }, 
                  (_, i) => startPos + i
                );
              }
              else {
                positions = Array.from(
                  { length: totalIndicators }, 
                  (_, i) => currentIndex - middlePosition + i
                );
              }
              
              positions = positions.filter(pos => pos >= 0 && pos < featuredNews.length);
              
              while (positions.length < totalIndicators && featuredNews.length < totalIndicators) {
                const nextPos = positions.length;
                if (nextPos < featuredNews.length) {
                  positions.push(nextPos);
                } else {
                  break;
                }
              }
              
              return positions.map((position) => (
                <button
                  key={position}
                  className={`featured-indicator-dot ${position === currentIndex ? 'active' : ''}`}
                  onClick={() => setCurrentIndex(position)}
                  aria-label={`Go to slide ${position + 1}`}
                />
              ));
            })()}
          </>
        )}
      </div>
    </div>
  );
}

export default FeaturedLoader;
