import { useLocation } from "react-router-dom";
import NewsLoader from "../../components/NewsLoader/NewsLoader";
import { useEffect, useState } from "react";
import { useAuth } from "../../contexts/AuthContext";
import Highlights from "../../components/Highlights/Highlights";

function Search() {
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const query = searchParams.get("query") || "";
  const {accessToken} = useAuth();
  const [hasArticles, setHasArticles] = useState(false);
  const [highlights, setHighlights] = useState(false);
  const [HighlightsContent, setHighlightsContent] = useState("");
  const ai = searchParams.get("ai");
  const api_url = import.meta.env.VITE_API_URL;

  // Reset all state when query changes
  useEffect(() => {
    setHasArticles(false);
    setHighlights(false);
    setHighlightsContent(""); // if you uncomment this line
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

    const fetchHighlights = async () => {
      try {
        const response = await fetch(`${api_url}/highlights?query=${query}`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
          // Link the fetch to the AbortController
          signal: abortController.signal,
        });

        const reader = response.body.getReader();
        const decoder = new TextDecoder();

        while (true) {
          const { done, value } = await reader.read();
          if (done) {
            break;
          }
          const chunk = decoder.decode(value);
          setHighlightsContent((prevContent) => prevContent + chunk);
        }
      } catch (error) {
        // Don't log an error if it's from our own cancellation
        if (error.name === "AbortError") {
          console.log("Fetch aborted");
        } else {
          console.error("Error fetching stream:", error);
        }
      }
    };

    // Only run the fetch logic when `highlights` is true and empty
    if (highlights === true && HighlightsContent == '') {
      fetchHighlights();
    }
    // It runs when the component unmounts or when the effect re-runs.
    return () => {
      abortController.abort(); // Cancel the fetch request
    };
    // Add all dependencies used inside the effect
  }, [highlights, query, accessToken, api_url]);

  return (
    <div className="px-2.5 py-2.5">
      <div className={`${highlights ? "flex flex-row gap-5 " : ""}`}>
        <div className={`${highlights ? "w-[70%]" : "w-[100%]"}`}>
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
        {highlights ? (
          <Highlights
            key={`highlights-${query}`}
            HighlightsContent={HighlightsContent}
            query={query}
          />
        ) : (
          <></>
        )}
      </div>
    </div>
  );
}

export default Search;

// const fetchHighlights = async () => {
//       try {
//         const response = await fetch(`${api_url}/highlights?query=${query}`, {
//           method: "GET",
//           headers: {
//             Authorization: `Bearer ${accessToken}`,
//           },
//           // Link the fetch to the AbortController
//           signal: abortController.signal,
//         });

//         const reader = response.body.getReader();
//         const decoder = new TextDecoder();

//         while (true) {
//           const { done, value } = await reader.read();
//           if (done) {
//             break;
//           }
//           const chunk = decoder.decode(value);
//           setHighlightsContent((prevContent) => prevContent + chunk);
//         }
//       } catch (error) {
//         // Don't log an error if it's from our own cancellation
//         if (error.name === "AbortError") {
//           console.log("Fetch aborted");
//         } else {
//           console.error("Error fetching stream:", error);
//         }
//       }
//     };




// const fetchHighlights = async () => {
//       try {
//         await fetchEventSource(`${api_url}/highlights?query=${query}`, {
//           method: "GET",
//           headers: {
//             Authorization: `Bearer ${accessToken}`,
//           },
//           signal: abortController.signal,
//           onmessage(event) {
//             setHighlightsContent((prevContent) => prevContent + event.data);
//           },
//           onerror(err) {
//             abortController.abort();
//             throw err;
//           },
//         });
//       } catch (error) {
//         if (error.name !== "AbortError") {
//           console.error("Fetch event source failed:", error);
//         }
//       }
//     };