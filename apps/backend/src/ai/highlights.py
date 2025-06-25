"""
highlights.py
Stores logic to provide key highlights from user search queries.
"""

from langchain_google_genai import ChatGoogleGenerativeAI
from dotenv import load_dotenv

load_dotenv()


class SearchHighlights:
    def __init__(self):
        self.model = ChatGoogleGenerativeAI(model='gemini-2.0-flash')
