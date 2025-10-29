export const tempChatList: Array<{ message: string; sender: "user" | "ai" }> = [
  {
    message:
    "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Fusce nec pharetra mauris. Phasellus tincidunt varius tellus, quis fermentum lectus tempor non. Etiam sed cursus risus. Aliquam erat volutpat. Aliquam ut tortor ut velit interdum tincidunt. Praesent tincidunt porta dui et ornare. Ut vel malesuada nulla. Curabitur elementum venenatis lorem ac ultrices. Nulla imperdiet laoreet ornare. Phasellus leo enim, scelerisque sed sem ac, porta rutrum elit. Duis eu orci cursus, viverra sapien vitae, efficitur erat. Vivamus ac elit id ligula feugiat malesuada ut a massa. Aenean et ex neque. Vestibulum semper euismod eros, vitae sagittis ante fermentum sit amet.",  
    sender: "user",
  },
  {
    message:
   `Here are the latest updates on the stock markets:\n\n*   **Asian Markets Rally on AI and Rate Cut Hopes:** Asian stocks saw gains, with Japan's Nikkei jumping over 1,000 points and South Korea's Kospi adding 1% on Wednesday. This surge was driven by enthusiasm for artificial intelligence shares and expectations of a quarter-percentage-point reduction in US lending rates by the Federal Reserve. Markets also rallied earlier in the week due to progress in US-China trade talks. [Times of India](https://timesofindia.indiatimes.com/business/international-business/asian-stocks-today-markets-rise-on-ai-deals-and-fed-rate-cut-hopes-nikkei-jumps-over-1000-points-kospi-adds-1/articleshow/124888550.cms), [Times of India](https://timesofindia.indiatimes.com/business/international-business/asian-stocks-today-markets-rally-on-us-china-trade-progress-nikkei-jumps-2-hang-seng-up-1/articleshow/124839269.cms)\n*   **Indian Equities Close Higher Amid Positive Global Cues:** On Wednesday, India's Nifty50 rose by 0.45% to close at 26,053.90, while the BSE Sensex gained 0.44% to end at 84,997.13. This positive movement was supported by optimistic global sentiment, sustained foreign institutional investor (FII) inflows, and anticipation of a US Federal Reserve rate cut. [Times of India](https://timesofindia.indiatimes.com/business/india-business/stock-market-today-nifty50-bse-sensex-october-29-2025-dalal-street-indian-equities-global-markets-donald-trump-us-china-trade-us-federal-reserve/articleshow/124887508.cms)\n*   **Previous Day's Performance (Tuesday):** Indian equity benchmarks, Nifty50 and BSE Sensex, closed in the red on Tuesday due to profit booking. The Nifty fell 0.11% to 25,936.20, and the Sensex dropped 0.18% to 84,628.16. Asian markets also closed lower on Tuesday, reflecting cautious sentiment ahead of the US Federal Reserve's policy outcome. [Times of India](https://timesofindia.indiatatimes.com/business/india-business/stock-market-today-nifty50-bse-sensex-october-28-2025-dalal-street-indian-equities-global-markets-donald-trump-us-china-trade-deal/articleshow/124862485.cms)\n*   **Factors Driving Recent Rallies:** Earlier in the week, Indian equities rebounded due to softer-than-expected U.S. inflation data, which fueled expectations of additional rate cuts in 2025. Optimism surrounding global trade also improved as US and China officials reportedly agreed on a preliminary framework for a trade deal. [News18](https://www.news18.com/business/markets/why-is-stock-market-rising-today-know-key-factors-behind-sensex-nifty-rally-on-october-27-9660820.html)\n\nGlobal markets have been significantly influenced by expectations of US Federal Reserve interest rate cuts and progress in trade discussions between the United States and China. These factors have contributed to a generally bullish sentiment, despite some periods of profit booking and cautious trading ahead of major economic announcements. Investors are also closely watching upcoming earnings results from major US tech companies for further market direction.`,
    sender: "ai",
  },
  {
    message:
      "Yeah, I’ve noticed that. I’ve been experimenting with some of these models myself — particularly for text summarization and semantic similarity. It’s fascinating how much meaning embeddings can capture. I just wonder how much preprocessing actually affects the output of these systems.",
    sender: "user",
  },
  {
    message:
      "Preprocessing plays a surprisingly important role. Even with large models, noisy or inconsistent data can lead to weak summaries or irrelevant results. Removing special characters, normalizing text, and filtering out duplicate content can make a huge difference. In production systems, small details like this are what separate average results from high-quality AI outputs.",
    sender: "ai",
  },
  {
    message:
      "Makes sense. By the way, I’m planning to add an AI summarizer to my news aggregation app. I want it to automatically condense articles into two or three lines. Do you think that’s feasible with open-source models, or would I need access to something more advanced?",
    sender: "user",
  },
  {
    message:
      "Definitely feasible with open-source tools. Models like DistilBART or Pegasus can handle that quite well, especially if your summaries don’t need to be extremely domain-specific. You can fine-tune them later if needed. Start simple, maybe summarize the first few sentences of the cleaned article text, and then expand from there once you test performance on real data.",
    sender: "ai",
  },
  {
    message:
      "Got it. I’ll start experimenting this week. Hopefully I can get some decent summaries running soon. Thanks for the advice!",
    sender: "user",
  },
  {
    message:
      "No problem! Lorem ipsum dolor sit amet, consectetur adipiscing elit. Integer ut lacinia lacus. Vivamus et tincidunt nisl. Nullam quis nunc et ipsum tincidunt interdum. Duis faucibus turpis ac odio luctus, a laoreet est malesuada. Keep me posted on your progress — I’d love to see how your summarization feature turns out!",
    sender: "ai",
  },
];