"""
highlights.py
Stores logic to provide key highlights from user search queries.
"""

from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.prompts import ChatPromptTemplate
from dotenv import load_dotenv

from src.ai.article_loader import ArticleLoader

load_dotenv()


class SearchHighlights:
    def __init__(self):
        self.model = ChatGoogleGenerativeAI(model='gemini-2.0-flash')
        self.prompt = ChatPromptTemplate([
            ('system', "You are AI assistant for an application NewsDigest. Your Main task is to provide"
             "key highlights from top 5 articles based on user query. Keep the content detailed yet concise."
             "Provide detailed key highlights based on news articles provided. Dont guess and hallucinate if"
             "something is not mentioned in the articles. Start with a heading as \"Key highlights from (user query)\". "
             "You can modify the user query in this heading if you want to keep it shorter. After the heading provide the highlights"),
            ('user', "User search query: {query}\n\n {articles}")
        ])

    def load_articles(self, articles_list):
        loader = ArticleLoader(articles_list)
        docs = loader.load()
        return docs

    def generate_highlights(self, query, articles):
        text = "\n\n".join(
            f"Title: {item.metadata['title']}\nPublished Date: {item.metadata['published_date']}\nSource: {item.metadata['source']}\nText: {item.page_content}" for item in articles)

        chain = self.prompt | self.model

        highlights = chain.invoke({'query': query, 'articles': text})
        return highlights.content

    def get_highlights(self, query, articles_list):
        articles = self.load_articles(articles_list)
        highlights = self.generate_highlights(query, articles)
        return highlights
