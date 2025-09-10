import { useState, useEffect, useRef } from "react";
import Featured from "../Featured/Featured";
import { useAxios } from "../../services/AxiosConfig";

const carouselConfig = {
  spread: 33, // Percentage for translateX (how far apart the items are)
  scale: 0.9, // Scale for adjacent items
  opacity: 0.8, // Opacity for adjacent items
  arrowOffset: 1, // Percentage from the edge for the navigation arrows
};

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
      const response = await axiosInstance.post(
        "/articles",
        {
          type: "topic",
          topic: "Top Stories",
        },
        {
          params: {
            page: currentPage,
          },
        }
      );

      const newData = response.data || [];
      const moreData = newData.length > 0;

      setFeaturedNews((prev) =>
        currentPage === 1 ? newData : [...prev, ...newData]
      );
      setHasMore(moreData);
      setPage(currentPage + 1);
    } catch (error) {
      console.error("Error loading featured news:", error);
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
    if (direction === "next") {
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

  const getItemClassName = (index) => {
    const baseClasses =
      "absolute left-0 right-0 mx-auto transition-all duration-500 ease-in-out origin-center w-[70%] max-md:w-[85%] max-sm:w-[90%]";
    let dynamicClasses = "";

    if (index === currentIndex) {
      dynamicClasses = "z-10 translate-x-0 scale-100 opacity-100";
    } else if (index === currentIndex + 1) {
      dynamicClasses =
        "z-[5] translate-x-[var(--carousel-spread)] scale-[var(--carousel-scale)] opacity-[var(--carousel-opacity)]";
    } else if (index === currentIndex - 1) {
      dynamicClasses =
        "z-[5] -translate-x-[var(--carousel-spread)] scale-[var(--carousel-scale)] opacity-[var(--carousel-opacity)]";
    } else {
      dynamicClasses = "z-0 translate-x-0 scale-[0.7] opacity-0";
    }

    return `${baseClasses} ${dynamicClasses}`;
  };

  if (loading && featuredNews.length === 0) {
    return (
      <div className="w-[70%] h-[300px] my-4 mx-auto rounded-2xl bg-gradient-to-r from-baseSecondary/50 via-baseSecondary to-baseSecondary/50 bg-[size:200%_100%] animate-loading"></div>
    );
  }

  if (featuredNews.length === 0) {
    return null;
  }

  return (
    <div
      className="w-full relative pb-2 overflow-hidden"
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
      ref={carouselRef}
      style={{
        "--carousel-spread": `${carouselConfig.spread}%`,
        "--carousel-scale": carouselConfig.scale,
        "--carousel-opacity": carouselConfig.opacity,
        "--arrow-offset": `${carouselConfig.arrowOffset}%`,
      }}
    >
      <div className="flex justify-center items-center min-h-[350px] w-full relative pb-5 max-xl:min-h-[300px] max-md:min-h-[250px] max-md:pb-8 max-sm:min-h-[450px]">
        {featuredNews.map((news, index) => (
          <div key={news.id} className={getItemClassName(index)}>
            <div className="h-[300px] max-xl:h-[250px] max-md:h-[220px]">
              <Featured {...news} />
            </div>
          </div>
        ))}

        {loading && currentIndex > 0 && (
          <div className="absolute right-[10%] top-1/2 -translate-y-1/2 bg-black/70 text-white px-4 py-2 rounded text-xs z-10">
            Loading more...
          </div>
        )}
      </div>

      <button
        className="absolute top-1/2 -translate-y-1/2 w-10 h-10 bg-black/60 rounded-full text-white text-3xl flex items-center justify-center cursor-pointer z-20 transition-all duration-200 ease-in-out opacity-70 hover:opacity-100 hover:bg-black/80 disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-black/60 left-[var(--arrow-offset)] max-xl:left-[5%] max-md:left-[2%] max-md:text-2xl max-sm:w-8 max-sm:h-8 max-sm:text-xl"
        onClick={() => handleNav("prev")}
        aria-label="Previous featured article"
        disabled={currentIndex === 0}
      >
        <span>&#8249;</span>
      </button>
      <button
        className="absolute top-1/2 -translate-y-1/2 w-10 h-10 bg-black/60 rounded-full text-white text-3xl flex items-center justify-center cursor-pointer z-20 transition-all duration-200 ease-in-out opacity-70 hover:opacity-100 hover:bg-black/80 disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-black/60 right-[var(--arrow-offset)] max-xl:right-[5%] max-md:right-[2%] max-md:text-2xl max-sm:w-8 max-sm:h-8 max-sm:text-xl"
        onClick={() => handleNav("next")}
        aria-label="Next featured article"
        disabled={currentIndex >= featuredNews.length - 1}
      >
        <span>&#8250;</span>
      </button>

      <div className="absolute bottom-3 left-0 right-0 flex justify-center items-center gap-2 z-20 max-md:bottom-6 max-md:gap-1.5 max-sm:bottom-4 max-sm:gap-1">
        {featuredNews.length > 0 && (
          <>
            {(() => {
              const totalIndicators = 3;
              const middlePosition = Math.floor(totalIndicators / 2);

              let positions = [];

              if (currentIndex <= middlePosition) {
                positions = [0, 1, 2];
              } else if (
                currentIndex >=
                featuredNews.length - (totalIndicators - middlePosition)
              ) {
                const startPos = Math.max(
                  0,
                  featuredNews.length - totalIndicators
                );
                positions = Array.from(
                  { length: totalIndicators },
                  (_, i) => startPos + i
                );
              } else {
                positions = Array.from(
                  { length: totalIndicators },
                  (_, i) => currentIndex - middlePosition + i
                );
              }

              positions = positions.filter(
                (pos) => pos >= 0 && pos < featuredNews.length
              );

              while (
                positions.length < totalIndicators &&
                featuredNews.length < totalIndicators
              ) {
                const nextPos = positions.length;
                if (nextPos < featuredNews.length) {
                  positions.push(nextPos);
                } else {
                  break;
                }
              }

              return positions.map((position) => {
                const isActive = position === currentIndex;
                const baseClasses =
                  "border-none cursor-pointer p-0 m-0 transition-all duration-300 ease-in-out shadow-md";

                const activeClasses =
                  "w-6 h-[6px] rounded bg-textPrimary scale-100 shadow-lg max-md:w-5 max-sm:w-4";
                const inactiveClasses =
                  "w-[6px] h-[6px] rounded-full bg-textSecondary/80 scale-90 hover:scale-110 hover:bg-textSecondary max-md:w-[5px] max-md:h-[5px] max-sm:w-1 max-sm:h-1";

                return (
                  <button
                    key={position}
                    className={`${baseClasses} ${
                      isActive ? activeClasses : inactiveClasses
                    }`}
                    onClick={() => setCurrentIndex(position)}
                    aria-label={`Go to slide ${position + 1}`}
                  />
                );
              });
            })()}
          </>
        )}
      </div>
    </div>
  );
}

export default FeaturedLoader;
