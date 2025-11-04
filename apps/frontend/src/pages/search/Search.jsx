import { useLocation } from "react-router-dom";
import NewsLoader from "../../components/NewsLoader/NewsLoader";

function Search() {
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const query = searchParams.get("query") || "";

  return (
    <div className="p-2.5">
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
        />
      </div>
    </div>
  );
}
export default Search;
