export interface CreateChatBody {
  documentId: string;
}

export interface SendMessageBody {
  content: string;
}

export interface ChatMessageResponse {
  id: string;
  chatId: string;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
  model?: string;
  promptTokens?: number;
  completionTokens?: number;
  totalTokens?: number;
  costCents?: number;
}

export interface ChatResponse {
  id: string;
  documentId: string;
  userId: string;
  title: string | null;
  createdAt: string;
  updatedAt: string;
}
