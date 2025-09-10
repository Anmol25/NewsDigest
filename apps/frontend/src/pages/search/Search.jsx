import { useLocation } from "react-router-dom";
import NewsLoader from "../../components/NewsLoader/NewsLoader";
import { useEffect, useState } from "react";
import { useAuth } from "../../contexts/AuthContext";
import Highlights from "../../components/Highlights/Highlights";

function Search() {
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const query = searchParams.get("query") || "";
  const { accessToken } = useAuth();
  const [hasArticles, setHasArticles] = useState(false);

  // highlight-related states
  const [highlights, setHighlights] = useState(false);
  const [HighlightsContent, setHighlightsContent] = useState("");
  const [isLoadingHighlights, setIsLoadingHighlights] = useState(false);
  const [isHighlightsStreaming, setIsHighlightsStreaming] = useState(false);
  const [isHighlightsComplete, setIsHighlightsComplete] = useState(false);

  const ai = searchParams.get("ai");
  const api_url = import.meta.env.VITE_API_URL;

  // Reset all state when query changes
  useEffect(() => {
    setHasArticles(false);
    setHighlights(false);
    setHighlightsContent("");
    setIsLoadingHighlights(false);
    setIsHighlightsStreaming(false);
    setIsHighlightsComplete(false);
  }, [query]);

  useEffect(() => {
    if (hasArticles && ai === "true") {
      setHighlights(true);
    } else {
      setHighlights(false);
    }
  }, [hasArticles, ai, query]);

  useEffect(() => {
    // Use an AbortController to cancel the fetch if the component unmounts
    const abortController = new AbortController();
    let receivedFirstChunk = false;

    const fetchHighlights = async () => {
      try {
        setIsLoadingHighlights(true);
        setIsHighlightsComplete(false);
        setIsHighlightsStreaming(false);

        const response = await fetch(`${api_url}/highlights?query=${encodeURIComponent(query)}`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
          signal: abortController.signal,
        });

        if (!response.ok) {
          // handle non-OK responses
          console.error("Highlights fetch failed:", response.statusText);
          setIsLoadingHighlights(false);
          return;
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();

        while (true) {
          const { done, value } = await reader.read();
          if (done) {
            break;
          }
          const chunk = decoder.decode(value);
          if (!receivedFirstChunk) {
            receivedFirstChunk = true;
            setIsHighlightsStreaming(true);
            setIsLoadingHighlights(false); // stop initial spinner when first chunk arrives
          }
          // append incoming data
          setHighlightsContent((prevContent) => prevContent + chunk);
        }

        // stream finished
        setIsHighlightsStreaming(false);
        setIsHighlightsComplete(true);
        setIsLoadingHighlights(false);
      } catch (error) {
        if (error.name === "AbortError") {
          console.log("Fetch aborted");
        } else {
          console.error("Error fetching stream:", error);
        }
        setIsLoadingHighlights(false);
        setIsHighlightsStreaming(false);
      }
    };

    // Only run the fetch logic when `highlights` is true and we don't yet have content
    if (highlights === true && HighlightsContent === "") {
      fetchHighlights();
    }

    return () => {
      abortController.abort(); // Cancel the fetch request on cleanup
    };
  }, [highlights, query, accessToken, api_url]);

  return (
    <div className="h-full w-full px-2.5 py-2.5">
      <div
        className={`grid h-full gap-3.5 ${
          highlights ? "grid-cols-[3fr_1fr]" : "grid-cols-1"
        }`}
      >
        {/*Search Results */}
        <div className="rounded-2xl overflow-hidden shadow-md">
          <div className="w-full h-full border rounded-2xl border-gray-200  overflow-y-auto p-2.5 scrollbar-thin shadow-md">
            <div className="text-2xl max-w-full truncate font-semibold text-textPrimary pt-1 pb-2.5 ">
              Search Results for &quot;{query}&quot;
            </div>
            <div className="bg-basePrimary">
              <NewsLoader
                key={`search-${query}`}
                url="/search"
                parameters={{
                  query: query,
                }}
                setHasArticles={setHasArticles}
              />
            </div>
          </div>
        </div>

        {/*AI Highlights*/}
        {highlights ? (
          <Highlights
            key={`highlights-${query}`}
            HighlightsContent={HighlightsContent}
            query={query}
            isLoading={isLoadingHighlights}
            isStreaming={isHighlightsStreaming}
            isComplete={isHighlightsComplete}
          />
        ) : (
          <></>
        )}
      </div>
    </div>
  );
}

export default Search;
