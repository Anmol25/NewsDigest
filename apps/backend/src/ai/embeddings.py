from langchain_core.embeddings import Embeddings

class MiniLMEmbeddings(Embeddings):
    def __init__(self, model, device: str):
        self.model = model
        self.device = device

    def embed_documents(self, texts: list[str]) -> list[list[float]]:
        return self.model.encode(texts, device=self.device)
    
    def embed_query(self, text: str) -> list[float]:
        return self.model.encode([text], device=self.device)[0]