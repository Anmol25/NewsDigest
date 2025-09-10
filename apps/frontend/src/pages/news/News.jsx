import { useParams } from "react-router-dom";
import NewsLoader from "../../components/NewsLoader/NewsLoader";
import { TOPICS_LIST } from "../../constants/NEWS_TOPICS";
import TopicButton from "./TopicButton";

const formatTitle = (str) => str.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

function News() {
    const { topic } = useParams();
    const title = formatTitle(topic);

    const url = () => {
        if (topic === "for-you") return "/foryou";
        else {
            return `/articles`
        };
    };

    const requestbody = () => {
        if (topic === "for-you") return null;
        else {
            return {
                "type": "topic",
                "topic": title,
            }
        }
    }

    return (
        <div className="flex flex-col h-full"> 
            <div className="sticky top-16 z-10 bg-white flex flex-row justify-between gap-3.5 px-4 py-2.5 overflow-x-auto">
                {TOPICS_LIST.map((item, index)=> 
                    <TopicButton
                        key={index}
                        name={item.name}
                        to={item.to}
                    />
                )}
            </div>
            <div className="flex-1 overflow-y-auto px-4 py-2.5">
                <NewsLoader 
                key={topic} 
                url={url()} 
                requestBody={requestbody()}
            />
            </div>
        </div>
    );
}

export default News;