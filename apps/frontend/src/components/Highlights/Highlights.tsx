import ReactMarkdown from "react-markdown";
import remarkGfm from 'remark-gfm';

function Highlights({HighlightsContent, query}) {
 const test = `Here are the key highlights from the provided news articles about India:

*   **India-US Trade Relations:**
    *   The United States is a leading destination for India's exports in electronics, marine goods, and readymade garments.
    *   The US accounted for 60.17% of India’s electronics exports, 37.63% of marine goods shipments, and 34.11% of readymade garment exports between April and June.
    *   India’s goods exports to the US surged by 23.5% year-on-year in June and grew by 22% over the April-June quarter.
    *   India and the US are negotiating a bilateral trade agreement, with the first part expected to be finalized by September.
    *   India seeks better market access for labor-intensive sectors like textiles and electronics, while the US is pushing for tariff cuts across multiple sectors.

*   **Team India Morale Boost:**
    *   Team India prepared for the fourth Test against England with a spirited training session, incorporating music like Hanuman Chalisa, English pop, and Punjabi songs to boost morale.
    *   Arshdeep Singh suffered a hand injury during practice, casting doubt on his availability for the fourth Test.

*   **Emerging Destinations in India:**
    *   India offers a variety of unique destinations, including Dawki in Meghalaya, known for its clear river, and Dudhsagar Falls on the Goa-Karnataka border.
    *   Other notable places include Spiti Valley in Himachal Pradesh, the Rann of Kutch in Gujarat, and Puga Valley in Ladakh, each offering distinct natural and cultural experiences.

*   **Badminton Asia Junior Mixed Team Championships:**
    *   India started their campaign with a 110-69 victory over Sri Lanka in the Badminton Asia Junior Mixed Team Championships in Indonesia.
    *   The mixed doubles team of Vishnu Kode and Reshika U secured the initial lead, with Tanvi Sharma contributing significantly to India’s score.

*   **Critical Mineral Security in Northeast India:**
    *   Northeast India is identified as a potential hub for critical minerals like lithium, cobalt, rare earths, graphite, and vanadium.
    *   The government has identified 38 blocks in the region, with seven cleared for auction.
    *   Improved connectivity through projects like the East-West Corridor and investments in local value addition and R&D are crucial for transforming the region's mineral wealth into economic growth.
    *   The development of the Northeast is essential for India's national growth, strategic readiness, and role in the global supply chain.`
  
 
 return (
    <div className="sticky top-[74px] w-[30%] h-[calc(100vh-80px)] rounded-3xl border border-gray-200 bg-white shadow-md">
      <div className="h-[46px] text-textBig text-textPrimary rounded-t-3xl p-2.5 font-semibold border-b-">

        AI Highlights
      </div>
      <div className="scrollbar-thin h-[calc(100vh-126px)] p-2.5 overflow-y-auto">
        <div className="">
        <ReactMarkdown components={{
    ul: ({ node, ...props }) => <ul className="list-disc ml-4" {...props} />,
    ol: ({ node, ...props }) => <ol className="list-decimal ml-4" {...props} />
  }} remarkPlugins={[remarkGfm]}>{HighlightsContent}</ReactMarkdown>
      </div>
      </div>
    </div>
  );
}

export default Highlights;
