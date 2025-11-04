from langgraph.checkpoint.postgres.aio import AsyncPostgresSaver
from langgraph.checkpoint.memory import InMemorySaver
from src.database.base import SessionLocal
from src.ai.tools import search_db_tool, scrape_articles_tool, latest_by_topic_tool
from src.aggregator.model import SBERT
from langchain_google_genai import ChatGoogleGenerativeAI
from dotenv import load_dotenv
from src.ai.tools import DBContext
from langchain.agents import create_agent
from langchain.agents.middleware import SummarizationMiddleware
import os
import json
from src.ai.utils.title_generator import TitleGenerator
from src.ai.utils.db_queries import update_session_name, log_chat_message
import logging

load_dotenv()

logger = logging.getLogger(__name__)

MODEL_NAME = 'gemini-2.5-flash'


NEWSDIGEST_SYSTEM_PROMPT = """
You are **NewsDigest AI**, the intelligent assistant for **NewsDigest — an AI-powered news discovery and summarization platform**.  
Your task is to deliver factual, concise, and well-structured answers by combining insights from NewsDigest’s internal database and external article scraping.

---

## 🧭 Core Workflow

### 1. Search Phase
- Use the **Database Search Tool** as your **primary and compulsory** method for retrieving articles.  
- The **Database Search Tool** provides **query-specific**, **contextually accurate**, and **targeted** results.  
- Retrieve metadata for *at least 10 relevant articles* related to the user’s query.  
- Before searching, **augment the user’s query** by generating several *semantically or contextually similar* versions to improve recall.  
  - Example: For “AI in education,” also search “artificial intelligence in schools,” “machine learning in classrooms,” or “edtech innovation.”  
- Perform **multiple tool calls** — one for each augmented query (never combine queries with OR).  
- The search engine performs **hybrid search** (keyword + vector similarity).  
- Select the most relevant and credible results that best match the query’s intent.

---

### 2. Topic-Based Latest News Retrieval
If the query is broad or corresponds to a major news category, you may also use the **Latest By Topic Tool** to fetch recent and trending stories.

**However, it is mandatory to use the `Database Search Tool` whenever the `Latest By Topic Tool` is used.**  
You may use the **Database Search Tool alone**, but the **Latest By Topic Tool can never be used alone.**  
Always use both together when using the topic tool — this ensures specificity (from the database) and freshness (from the topic feed).

**Allowed Topics and Definitions:**
1. **Top Stories:** Breaking headlines and widely discussed national/international events.  
2. **Latest:** The newest updates across all domains — politics, economy, science, tech, and more.  
3. **India:** News focused on Indian governance, politics, policy, and national developments.  
4. **World:** Global events, diplomacy, and international political updates.  
5. **Economy:** Business, markets, trade, and financial developments in India and globally.  
6. **Science:** Discoveries, space exploration, research, and scientific advancements.  
7. **Tech:** AI breakthroughs, new products, innovation trends, and tech launches.  
8. **Sports:** Cricket, football, and other major sporting news from India and abroad.  
9. **Entertainment:** Film, TV, celebrities, and entertainment industry updates.

**ALLOWED_TOPICS = {
    "Top Stories",
    "Latest",
    "India",
    "World",
    "Economy",
    "Science",
    "Tech",
    "Sports",
    "Entertainment"
}**

> ⚖️ **Guideline:** Prefer the `Database Search Tool` for relevance, but use both tools **simultaneously** when beneficial — combining accuracy (database) with recency (topic).

---

### 3. Scraping Phase
- From all retrieved metadata (from both tools, if applicable), **select 4–6 of the most relevant articles**.  
- Use the **Scraping Tool** to extract their **full article content** before synthesis.  
- Prioritize reliable, recent, and topically relevant sources.

---

### 4. Synthesis & Response Generation
- Combine the scraped content into a **coherent, factual, and human-readable summary**.  
- Use **only the scraped information** — no speculation or assumptions.  
- If results come from both topic and database tools, merge them thoughtfully to balance **relevance** and **recency**.

---

## 🚫 Strict Execution Rule
- **Never produce or output any user-facing message** until you have completed **all necessary tool calls** (search, topic retrieval, and scraping).  
- Only generate the final Markdown response **after** all required data collection is complete.  
- If additional tools are still needed, **do not output anything yet.**

---

## 🧾 Output Requirements

- **Format:** Output must be in clean, well-formatted **Markdown**.  
- **Introduction:** Begin with one concise sentence acknowledging the user’s query or topic.  
  Example: “Here’s what’s happening in India’s renewable energy sector.”  
- **Core Answer (Bullet Points):**
  - Each bullet begins with a **bold heading** followed by a colon.  
    Example: `**Key Development:** India introduced new AI governance guidelines...`  
  - Summarize facts clearly and cite each source at the end using:  
    `[Source Name](link)` — e.g., *[Reuters](https://www.reuters.com)*  
- **Concluding Context:** End with a brief paragraph offering relevant background or emerging trends.  
- **Tone:** Maintain a **neutral, factual, and professional** journalistic tone — similar to Reuters or BBC. Avoid filler or opinions.

---

## ✅ Tool Summary

| Purpose | Tool | Description |
|----------|------|-------------|
| Query-Specific Search | `search_db_tool` | Retrieves precise and relevant article metadata using hybrid semantic + keyword search. |
| Category-Based Latest Feed | `latest_by_topic_tool` | Fetches the newest and trending articles for major news categories. Must always be used along with `search_db_tool`. |
| Full Article Extraction | `scrape_articles_tool` | Extracts complete article content for synthesis. |

"""

AI_ANALYZE = """
### Prompt
You are given an article with metadata: **title**, **link**, **datetime**, and **source**.

**Your task:**
1. Use the given metadata to **search the web** for **2–3 related or similar articles** (same topic, event, or theme).  
2. **Scrape and extract** the main content from those articles (focus on headline, summary, and main body).  
3. Summarize the **main highlights** of the given article in concise bullet points under a section titled **"Main Highlights"**.  
4. Then, summarize the key points of the related articles under a section titled **"Related Coverage"**.  
   - Focus on differences, updates, or unique perspectives compared to the original article.

## Metadata
{article}
"""

SEARCH_HIGHLIGHTS_PROMPT = """
### Task: Generate Article Search Highlights

**Input:**  
Metadata of the Top 20 articles for a user’s search query.

**Steps:**  
1. Select **5–6 most relevant and diverse** articles based on the query.  
2. **Scrape** the selected articles. (Use scrape_articles_tool) 
3. **Generate concise bullet-point highlights** that cover **different aspects, perspectives, or viewpoints** related to the user query.  
  

**Output:**  
1. Provide **bullet-point highlights** covering key insights and varied perspectives.  
   - At the end of each bullet point, include the **source(s)** in the format:  
     `[Name of Source](link)`  
     *Example:*  
     - The Indian stock market hit a new all-time high on Monday. [Hindustan Times](www.hindustantimes.com/article_link)  

2. At the end, include a section listing all the sources in the following format:  
   ```markdown
   ## Sources
   - Title 1 — [Name of Source 1](link_of_source_1)
   - Title 2 — [Name of Source 2](link_of_source_2)
   - Title 3 — [Name of Source 3](link_of_source_3)

**Article Metadata:**
{article_metadata}

**User Query:**
{user_query}
"""


class NewsDigestAgent:
    def __init__(self, sbert, db, user_id, session_id, new_session: bool):
        self.model = ChatGoogleGenerativeAI(model=MODEL_NAME, temperature=0.5)
        self.tools = [search_db_tool,
                      scrape_articles_tool, latest_by_topic_tool]
        self.dbi_url = os.getenv("DATABASE_URL")
        self.sbert = sbert
        self.db = db
        self.session_id = session_id
        self.new_session = new_session
        self.user_id = user_id
        self.context = DBContext(
            model=self.sbert.model,
            device=self.sbert.device,
            db=self.db
        )

    def parse_response(self, stream_mode, chunk, final_message, message_metadata={}):
        if stream_mode == "custom":
            return chunk, final_message, message_metadata
        else:
            message, metadata = chunk
            if metadata["langgraph_node"] == "model":
                # Check Stop condition
                if "finish_reason" in message.response_metadata:
                    if message.response_metadata["finish_reason"] != "STOP":
                        final_message = f"Error in Gemini response. Please try again. Error Code: {message.response_metadata['finish_reason']}"
                        message_metadata = {
                            "type": "error", "code": message.response_metadata['finish_reason']}
                        return {"type": "error", "message": final_message}, final_message, message_metadata
                if not message.content:
                    return None, final_message, message_metadata
                elif type(message.content) == list:
                    final_message += message.content[0]["text"]
                    return {"type": "model", "message": message.content[0]["text"]}, final_message, message_metadata
                else:
                    final_message += message.content
                    return {"type": "model", "message": message.content}, final_message, message_metadata
            return None, final_message, message_metadata

    def make_agent(self, checkpointer):
        agent = create_agent(
            self.model,
            tools=self.tools,
            context_schema=DBContext,
            system_prompt=NEWSDIGEST_SYSTEM_PROMPT,
            checkpointer=checkpointer,
            middleware=[
                SummarizationMiddleware(
                    model=self.model,
                    max_tokens_before_summary=10000,
                    messages_to_keep=20,
                ),
            ],
        )

        return agent

    async def call_agent(self, msg):
        async with AsyncPostgresSaver.from_conn_string(self.dbi_url) as checkpointer:
            logger.debug("Checkpoint loaded for agent.")
            agent = self.make_agent(checkpointer)

            final_message = ""
            message_metadata = {}
            input = {"messages": [{"role": "user", "content": msg}]}
            config = {"configurable": {"thread_id": self.session_id}}
            logger.debug("Starting agent streaming call.")
            async for stream_mode, chunk in agent.astream(input=input, config=config, context=self.context, stream_mode=["custom", "messages"]):
                logger.debug(f"Agent streaming chunk received: {chunk}")
                response, final_message, message_metadata = self.parse_response(
                    stream_mode, chunk, final_message, message_metadata)
                if not response:
                    continue
                print(f"Agent streaming response: {response}")
                yield json.dumps(response).encode("utf-8") + "\n".encode("utf-8")

            # Generate title (if new session)
            if self.new_session:
                title_gen = TitleGenerator()
                title = title_gen.generate_title(msg, final_message)
                # Update title in DB
                await update_session_name(self.db, self.session_id, title["title"])
                title_response = {'type': "title", "message": title}
                logger.debug(f"Generated title response: {title_response}")
                yield json.dumps(title_response).encode("utf-8") + "\n".encode("utf-8")
            #  Insert messages into DB
            logger.debug(f"Final message to log: {final_message}")
            await log_chat_message(self.db, self.session_id, 'ai', final_message, message_metadata)

    async def analyze_article(self, article_metadata):
        prompt = AI_ANALYZE.format(
            article=json.dumps(article_metadata, indent=2, default=str))
        return self.call_agent(prompt)

    async def gen_highlights(self, user_query, article_lists):
        article_metadata = json.dumps(
            article_lists, indent=2, default=str)
        prompt = SEARCH_HIGHLIGHTS_PROMPT.format(
            article_metadata=article_metadata,
            user_query=user_query
        )
        return self.call_agent(prompt)
