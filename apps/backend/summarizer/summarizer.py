import torch
import aiohttp
from transformers import BartTokenizer, BartForConditionalGeneration
from newspaper import Article
import asyncio


class Summarizer:

    def __init__(self):
        model_name = "sshleifer/distilbart-cnn-12-6"
        self.device = torch.device(
            "cuda" if torch.cuda.is_available() else "cpu")
        self.tokenizer = BartTokenizer.from_pretrained(model_name)
        # print(self.tokenizer)
        self.model = BartForConditionalGeneration.from_pretrained(
            model_name).to(self.device)
        if str(self.device) == "cuda":
            print("DistillBart Using GPU")
        else:
            print("DistillBart Using CPU")

    @staticmethod
    async def __fetch_article(url: str):
        """
        Fetch Article from URL
        Args:
            url: URL of article
        Return:
            str: HTML content of article
        """
        async with aiohttp.ClientSession(headers={"User-Agent": "Mozilla/5.0"}) as session:
            async with session.get(url) as response:
                return await response.text()

    @staticmethod
    def __get_article(url: str):
        """
        Fetch and Parse Article
        Args:
            url: URL of article
        Returns:
            text: Text content of Article
        """
        # Fetch Article Html content
        article_html = asyncio.run(Summarizer.__fetch_article(url))
        # Parse HTML content
        article = Article('')
        article.set_html(article_html)
        article.parse()
        text = article.text
        return text

    def summarize(self, article):
        """
        Tokenize and then summarize article
        Args:
            article: Text content of article
        Returns:
            summary: Summary of Article
        """
        # Tokenize Article
        inputs = self.tokenizer(article, return_tensors="pt",
                                max_length=1024, truncation=True, padding="longest")
        inputs = {key: value.to(self.device) for key, value in inputs.items()}
        # Generate Summary
        # Generate summary
        summary_ids = self.model.generate(
            inputs["input_ids"],
            min_length=100,       # Forces a longer summary
            max_length=200,      # Upper limit
            num_beams=4,         # Beam search for better quality
            length_penalty=1.2,  # Controls summary length (lower = longer)
            early_stopping=True
        )
        # Decode and print summary
        summary = self.tokenizer.decode(
            summary_ids[0], skip_special_tokens=True)
        # print(summary)
        return summary

    def infer(self, url: str) -> str:
        """
        Get summary of article from url
        Args:
            url: URL of article
        Return:
            summary: Summary of article
        """
        # Fetch Article
        article = Summarizer.__get_article(url)
        # Generate Summary
        summary = self.summarize(article)
        return summary
