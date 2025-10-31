import { memo, useMemo } from "react";
import { getUserQueryRecommendations } from "./userQueries";

function QuerySuggest() {
  // Memoize to avoid changing suggestions on parent re-renders
  const recommendations = useMemo(() => getUserQueryRecommendations(5), []);

  return (
    <div className="flex flex-wrap justify-center gap-1.5 items-center">
      {recommendations.map((query, index) => (
        <div
          key={index}
          className="px-4 py-2 bg-basePrimary shadow-md hover:scale-103 hover:shadow-lg transition duration-300 ease-in-out rounded-lg hover:bg-baseSecondaryHover cursor-pointer"
        >
          {query}
        </div>
      ))}
    </div>
  );
}

export default memo(QuerySuggest);