import { memo, useMemo } from "react";
import { getUserQueryRecommendations } from "./userQueries";

function QuerySuggest({ isMini = false, onSelect }: { isMini?: boolean; onSelect?: (query: string) => void }) {
  // Memoize to avoid changing suggestions on parent re-renders
  const recommendations = useMemo(() => getUserQueryRecommendations(5), []);

  return (
    <div className={`flex flex-wrap justify-center items-center ${isMini ? "gap-1" : "gap-1.5"}`}>
      {recommendations.map((query, index) => (
        <div
          key={index}
          className={`${isMini ? "px-3 py-1.5 text-sm" : "px-4 py-2"} bg-basePrimary shadow-md hover:scale-103 hover:shadow-lg transition duration-300 ease-in-out rounded-lg hover:bg-baseSecondaryHover cursor-pointer`}
          onClick={() => onSelect?.(query)}
        >
          {query}
        </div>
      ))}
    </div>
  );
}

export default memo(QuerySuggest);