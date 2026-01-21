"""Chat API endpoints."""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from backend.models.database import get_db, Conversation, Message
from backend.models.schemas import ChatRequest, ChatResponse, SourceDocument
from backend.services.chat_service import get_chat_service

router = APIRouter()


@router.post("/chat", response_model=ChatResponse)
async def chat(
    request: ChatRequest,
    db: AsyncSession = Depends(get_db),
):
    """Send a message and get a response."""
    chat_service = get_chat_service()

    # Get or create conversation
    if request.conversation_id:
        result = await db.execute(
            select(Conversation).where(Conversation.id == request.conversation_id)
        )
        conversation = result.scalar_one_or_none()
        if not conversation:
            raise HTTPException(status_code=404, detail="Conversation not found")
    else:
        conversation = Conversation()
        db.add(conversation)
        await db.flush()

    # Get conversation history
    history = []
    if request.conversation_id:
        result = await db.execute(
            select(Message)
            .where(Message.conversation_id == conversation.id)
            .order_by(Message.created_at)
        )
        for msg in result.scalars():
            history.append({"role": msg.role, "content": msg.content})

    # Get response from chat service
    response = await chat_service.chat(
        message=request.message,
        use_knowledge_base=request.use_knowledge_base,
        history=history,
    )

    # Save messages to database
    user_msg = Message(
        conversation_id=conversation.id,
        role="user",
        content=request.message,
    )
    assistant_msg = Message(
        conversation_id=conversation.id,
        role="assistant",
        content=response["message"],
    )
    db.add(user_msg)
    db.add(assistant_msg)
    await db.commit()

    return ChatResponse(
        message=response["message"],
        conversation_id=conversation.id,
        sources=[SourceDocument(**s) for s in response["sources"]],
    )
