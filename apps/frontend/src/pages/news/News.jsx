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
        return "/articles";
    };

    const requestbody = () => {
        if (topic === "for-you") return null;
        return {
            "type": "topic",
            "topic": title,
        };
    };

    return (
        <>
            {/* Fixed Topic Buttons Header */}
            <div className="fixed top-16 left-22 right-0 z-10 bg-white">
                <div className="flex gap-3.5 px-4 py-2.5 overflow-x-auto">
                    {TOPICS_LIST.map((item, index) => 
                        <TopicButton
                            key={index}
                            name={item.name}
                            to={item.to}
                        />
                    )}
                </div>
            </div>

            {/* News Content */}
            <div className="pt-20 px-4 pb-4">
                <NewsLoader 
                    key={topic} 
                    url={url()} 
                    requestBody={requestbody()}
                />
            </div>
        </>
    );
}

export default News;