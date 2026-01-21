"""LLM service using LangChain with Claude."""

from typing import Optional
from langchain_anthropic import ChatAnthropic
from langchain_core.messages import HumanMessage, AIMessage, SystemMessage

from backend.config import get_settings


class LLMService:
    """Service for LLM interactions using Claude via LangChain."""

    def __init__(self):
        self.settings = get_settings()
        self._llm: Optional[ChatAnthropic] = None

    @property
    def llm(self) -> ChatAnthropic:
        """Get or create the LLM instance."""
        if self._llm is None:
            self._llm = ChatAnthropic(
                model=self.settings.claude_model,
                anthropic_api_key=self.settings.anthropic_api_key,
                max_tokens=4096,
            )
        return self._llm

    async def chat(
        self,
        message: str,
        context: str = None,
        history: list[dict] = None,
    ) -> str:
        """Send a message and get a response."""
        messages = []

        # System message with RAG context
        system_content = "You are a helpful knowledge management assistant."
        if context:
            system_content += f"\n\nUse the following context to answer questions:\n\n{context}"

        messages.append(SystemMessage(content=system_content))

        # Add conversation history
        if history:
            for msg in history:
                if msg["role"] == "user":
                    messages.append(HumanMessage(content=msg["content"]))
                else:
                    messages.append(AIMessage(content=msg["content"]))

        # Add current message
        messages.append(HumanMessage(content=message))

        # Get response
        response = await self.llm.ainvoke(messages)
        return response.content


# Singleton
_llm_service: Optional[LLMService] = None


def get_llm_service() -> LLMService:
    """Get the LLM service singleton."""
    global _llm_service
    if _llm_service is None:
        _llm_service = LLMService()
    return _llm_service
