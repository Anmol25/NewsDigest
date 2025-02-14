import logging
import torch
from sentence_transformers import SentenceTransformer

logger = logging.getLogger(__name__)


class SBERT:

    def __init__(self):
        self.model_name = "sentence-transformers/all-MiniLM-L6-v2"
        self.device = torch.device(
            "cuda" if torch.cuda.is_available() else "cpu")
        self.model = SentenceTransformer(self.model_name).to(self.device)
        if str(self.device) == "cuda":
            logger.info("SentenceTransformer is Using GPU")
        else:
            logger.info("SentenceTransformer is Using CPU")

    def get_device(self):
        return self.device

    def get_model_name(self):
        return self.model_name
