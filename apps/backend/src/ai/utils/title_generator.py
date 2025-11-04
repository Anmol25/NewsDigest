from pydantic import BaseModel, Field
from langchain_google_genai import ChatGoogleGenerativeAI
from dotenv import load_dotenv

load_dotenv()


class TitleOutput(BaseModel):
    """Single title for Conversation."""
    title: str = Field(..., description="The title of the conversation")


class TitleGenerator:
    def __init__(self):
        self.model = ChatGoogleGenerativeAI(
            model='gemini-2.5-flash-lite', temperature=0.5)

    def generate_title(self, user_msg, ai_msg):
        model_with_structured_output = self.model.with_structured_output(
            TitleOutput)
        prompt = f"Based on this conversation message generate a small title for this conversations.\n user: {user_msg}\n ai: {ai_msg}"
        response = model_with_structured_output.invoke(prompt)
        return response.model_dump()
