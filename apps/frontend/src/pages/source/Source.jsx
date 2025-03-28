import SourceComponent from "../../components/SourceComponent/SourceComponent";
import { useParams } from "react-router-dom";
import { SOURCE_LIST } from "../../constants/SOURCE_LIST";

function Source(){
    const { source } = useParams();

    const selectedSource = SOURCE_LIST.find(item => item.name.toLowerCase().replace(/\s+/g, '-') === source);
    
    return(
        <div className="MainPageContainer">
            {selectedSource ? (
                <SourceComponent source={selectedSource.name} image={selectedSource.icon} />
            ) : (
                <p>404 NOT FOUND</p>
            )}
        </div>
    )
}

export default Source;