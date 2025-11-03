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

load_dotenv()


MODEL_NAME = 'gemini-2.5-flash'

# NEWSDIGEST_SYSTEM_PROMPT = """
# You are an intelligent AI assistant for NewsDigest, an Intelligent News Platform. Your role is to answer user queries by combining information from the internal news database and external article scraping.

# **Instructions:**

# 1. **Search:**
#    Use the `Database Search Tool` to retrieve metadata for at least 10 relevant articles related to the user’s query.
#    - Before searching, **augment the user’s query** by generating a few semantically similar or related queries to improve recall (e.g., synonyms, paraphrases, and closely related topics).
#    - For multiple augmented queries, **do not combine them with OR operators** in a single search. Instead, **make multiple tool calls** — one per query.
#    - The search engine performs a **hybrid search** — combining both **keyword-based** and **vector similarity** (semantic) search — to ensure that **natural language queries** are effectively handled.
#    - Select results that best match the query’s intent and topic relevance.

# 2. **Select & Scrape:**
#    From these results, select the 4–6 most relevant articles (or more if helpful) based on the query’s context. Use the `Scraping Tool` to extract their full content.

# 3. **Synthesize:**
#    Synthesize a coherent, human-readable response based *only* on the scraped article contents. Do not add speculation.

# 4. **Format:**
#    Structure the response strictly according to the **Output Requirements** below.

# **Output Requirements:**

# * **Format:** Produce the final output in proper Markdown.
# * **Introduction:** Begin with a brief introductory sentence that directly acknowledges and addresses the user's query.
# * **Core Answer (Bullet Points):** Present the main findings and answers as a bulleted list.
#     * Each bullet point must start with a **bold heading** followed by a colon (e.g., `**Key Finding:** ...`).
#     * After the heading, provide a clear, concise summary of the key fact.
#     * Cite the source for each fact at the end of the bullet point's text using the format: `[Name of Source](link)` Name of Source Eg. Times Of India, Hindustan Times etc..
# * **Concluding Context:** After the bullet points, add a final, brief paragraph providing any relevant additional context, background, or closely related information from the articles that would be helpful to the user.
# * **Tone:** Maintain a neutral, factual, and professional news tone throughout. Avoid generic filler text.
# """

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
| Query-Specific Search | `Database Search Tool` | Retrieves precise and relevant article metadata using hybrid semantic + keyword search. |
| Category-Based Latest Feed | `Latest By Topic Tool` | Fetches the newest and trending articles for major news categories. Must always be used along with `Database Search Tool`. |
| Full Article Extraction | `Scraping Tool` | Extracts complete article content for synthesis. |

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

    def parse_response(self, stream_mode, chunk, final_message):
        if stream_mode == "custom":
            return chunk, final_message
        else:
            message, metadata = chunk
            if metadata["langgraph_node"] == "model":
                if not message.content:
                    return None, final_message
                elif type(message.content) == list:
                    final_message += message.content[0]["text"]
                    return {"type": "model", "message": message.content[0]["text"]}, final_message
                else:
                    final_message += message.content
                    return {"type": "model", "message": message.content}, final_message
            return None, final_message

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
                    max_tokens_before_summary=4000,
                    messages_to_keep=20,
                ),
            ],
        )

        return agent

    async def call_agent(self, msg):
        async with AsyncPostgresSaver.from_conn_string(self.dbi_url) as checkpointer:
            await checkpointer.setup()
            # if self.new_session:
            #     print({"session_id": self.session_id})
            #     yield json.dumps({"session_id": self.session_id}).encode("utf-8")
            agent = self.make_agent(checkpointer)

            final_message = ""
            input = {"messages": [{"role": "user", "content": msg}]}
            config = {"configurable": {"thread_id": self.session_id}}
            context = DBContext(
                model=self.sbert.model,
                device=self.sbert.device,
                db=self.db
            )

            async for stream_mode, chunk in agent.astream(input=input, config=config, context=context, stream_mode=["custom", "messages"]):
                response, final_message = self.parse_response(
                    stream_mode, chunk, final_message)
                if not response:
                    continue
                print(response)
                yield json.dumps(response).encode("utf-8") + "\n".encode("utf-8")

            # Generate title (if new session)
            if self.new_session:
                title_gen = TitleGenerator()
                title = title_gen.generate_title(msg, final_message)
                # Update title in DB
                await update_session_name(self.db, self.session_id, title["title"])
                title_response = {'type': "title", "message": title}
                print(title_response)
                yield json.dumps(title_response).encode("utf-8") + "\n".encode("utf-8")
            #  Insert messages into DB
            print(repr(final_message))
            await log_chat_message(self.db, self.session_id, 'ai', final_message, {})

    async def analyze_article(self, article_metadata):
        prompt = AI_ANALYZE.format(
            article=json.dumps(article_metadata, indent=2, default=str))
        return self.call_agent(prompt)
