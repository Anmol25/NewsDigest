import logging
from goose3 import Goose
from newspaper import Article

logger = logging.getLogger(__name__)


def get_article(url: str):
    """
    Fetch and Parse Article
    Tries Goose first, falls back to newspaper3k if Goose fails.
    Returns None if both fail.
    """

    try:
        # --- Try with Goose ---
        g = Goose()
        article = g.extract(url=url)

        text = article.cleaned_text
        if text:
            return text

        logger.warning("Goose returned no text — falling back to newspaper3k")

    except Exception as e:
        logger.warning(f"Goose failed: {e} — using newspaper3k instead")

    # --- Fallback: newspaper3k ---
    try:
        article = Article(url)
        article.download()
        article.parse()
        return article.text if article.text else None
    except Exception as e:
        logger.error(f"newspaper3k also failed: {e}")
        return None
