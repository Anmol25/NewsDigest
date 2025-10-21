from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.prompts import PromptTemplate
from dotenv import load_dotenv
from src.ai.tools import DBContext
from langchain.agents import create_agent

from src.aggregator.model import SBERT
from src.ai.tools import search_db_tool, scrape_articles_tool
from src.database.session import context_db
from src.database.base import SessionLocal

load_dotenv()
