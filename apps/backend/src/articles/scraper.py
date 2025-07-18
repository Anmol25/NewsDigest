import logging

from goose3 import Goose

logger = logging.getLogger(__name__)


def get_article(url: str):
    """
    Fetch and Parse Article
    Args:
        url: URL of article
    Returns:
        text: Text content of Article
    Raises:
        Exception: If article cannot be fetched or parsed
    """
    try:
        # Fetch Article
        g = Goose()
        article = g.extract(url=url)

        text = article.cleaned_text

        if not text:
            logger.warning("No text content found in article")
            return None

        return text
    except Exception as e:
        logger.error(f"Error in Parsing Article: {e}")
        raise Exception(f"Failed to fetch or parse article: {str(e)}")
