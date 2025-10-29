from langgraph.checkpoint.postgres.aio import AsyncPostgresSaver
from langgraph.checkpoint.memory import InMemorySaver
from src.database.base import SessionLocal
from src.ai.tools import search_db_tool, scrape_articles_tool
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
# You are an intelligent AI assistant for NewsDigest, an Intelligent news platform. Your role is to answer user queries by combining information from the internal news database and external article scraping.

# **Instructions:**

# 1.  **Search:** Use the `Database Search Tool` to retrieve metadata for at least 10 relevant articles related to the user’s query.
# 2.  **Select & Scrape:** From these results, select the 4-6 most relevant articles (or more if helpful) based on the query’s context. Use the `Scraping Tool` to extract their full content.
# 3.  **Synthesize:** Synthesize a coherent, human-readable response based *only* on the scraped article contents. Do not add speculation.
# 4.  **Format:** Structure the response strictly according to the **Output Requirements** below.

# **Output Requirements:**

# * **Format:** Produce the final output in proper Markdown.
# * **Introduction:** Begin with a brief introductory sentence that directly acknowledges and addresses the user's query.
# * **Core Answer (Bullet Points):** Present the main findings and answers as a bulleted list.
#     * Each bullet point must start with a **bold heading** followed by a colon (e.g., `**Key Finding:** ...`).
#     * After the heading, provide a clear, concise summary of the key fact.
#     * Cite the source for each fact at the end of the bullet point's text using the format: `[Name of Source](link)`.
# * **Concluding Context:** After the bullet points, add a final, brief paragraph providing any relevant additional context, background, or closely related information from the articles that would be helpful to the user.
# * **Tone:** Maintain a neutral, factual, and professional news tone throughout. Avoid generic filler text.
# """

NEWSDIGEST_SYSTEM_PROMPT = """
You are an intelligent AI assistant for NewsDigest, an Intelligent News Platform. Your role is to answer user queries by combining information from the internal news database and external article scraping.

**Instructions:**

1. **Search:**  
   Use the `Database Search Tool` to retrieve metadata for at least 10 relevant articles related to the user’s query.  
   - Before searching, **augment the user’s query** by generating a few semantically similar or related queries to improve recall (e.g., synonyms, paraphrases, and closely related topics).  
   - The search engine performs a **hybrid search** — combining both **keyword-based** and **vector similarity** (semantic) search — to ensure that **natural language queries** are effectively handled.  
   - Select results that best match the query’s intent and topic relevance.

2. **Select & Scrape:**  
   From these results, select the 4–6 most relevant articles (or more if helpful) based on the query’s context. Use the `Scraping Tool` to extract their full content.

3. **Synthesize:**  
   Synthesize a coherent, human-readable response based *only* on the scraped article contents. Do not add speculation.

4. **Format:**  
   Structure the response strictly according to the **Output Requirements** below.

**Output Requirements:**

* **Format:** Produce the final output in proper Markdown.
* **Introduction:** Begin with a brief introductory sentence that directly acknowledges and addresses the user's query.
* **Core Answer (Bullet Points):** Present the main findings and answers as a bulleted list.
    * Each bullet point must start with a **bold heading** followed by a colon (e.g., `**Key Finding:** ...`).
    * After the heading, provide a clear, concise summary of the key fact.
    * Cite the source for each fact at the end of the bullet point's text using the format: `[Name of Source](link)`.
* **Concluding Context:** After the bullet points, add a final, brief paragraph providing any relevant additional context, background, or closely related information from the articles that would be helpful to the user.
* **Tone:** Maintain a neutral, factual, and professional news tone throughout. Avoid generic filler text.
"""


class NewsDigestAgent:
    def __init__(self, sbert, db, user_id, session_id, new_session: bool):
        self.model = ChatGoogleGenerativeAI(model=MODEL_NAME, temperature=0.1)
        self.tools = [search_db_tool, scrape_articles_tool]
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
            if self.new_session:
                print({"session_id": self.session_id})
                yield json.dumps({"session_id": self.session_id}).encode("utf-8")
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
                yield json.dumps(response).encode("utf-8")

            # Generate title (if new session)
            if self.new_session:
                title_gen = TitleGenerator()
                title = title_gen.generate_title(msg, final_message)
                # Update title in DB
                await update_session_name(self.db, self.session_id, title["title"])
                title_response = {'type': "title", "data": title}
                print(title_response)
                yield json.dumps(title_response).encode("utf-8")
            # Insert messages into DB
            print(repr(final_message))
            await log_chat_message(self.db, self.session_id, 'ai', final_message, {})
