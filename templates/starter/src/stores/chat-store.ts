import { create } from 'zustand';
import { unjuClient, type ChatMessage } from '../api/unju-client';

interface ChatState {
  messages: ChatMessage[];
  isStreaming: boolean;
  currentResponse: string;
  isSpeaking: boolean;
  error: string | null;

  // Actions
  sendMessage: (content: string) => Promise<void>;
  clearMessages: () => void;
  clearError: () => void;
  setSpeaking: (speaking: boolean) => void;
}

export const useChatStore = create<ChatState>((set, get) => ({
  messages: [],
  isStreaming: false,
  currentResponse: '',
  isSpeaking: false,
  error: null,

  sendMessage: async (content: string) => {
    const { messages } = get();

    // Add user message
    const userMessage: ChatMessage = { role: 'user', content };
    const updatedMessages = [...messages, userMessage];

    set({
      messages: updatedMessages,
      isStreaming: true,
      currentResponse: '',
      error: null,
    });

    try {
      let fullResponse = '';

      // Stream the response
      for await (const chunk of unjuClient.chat(updatedMessages)) {
        if (chunk.type === 'text' && chunk.content) {
          fullResponse += chunk.content;
          set({ currentResponse: fullResponse });
        } else if (chunk.type === 'error') {
          set({ error: chunk.error || 'Unknown error', isStreaming: false });
          return;
        } else if (chunk.type === 'done') {
          break;
        }
      }

      // Add assistant message
      const assistantMessage: ChatMessage = { role: 'assistant', content: fullResponse };
      set({
        messages: [...updatedMessages, assistantMessage],
        isStreaming: false,
        currentResponse: '',
        isSpeaking: true, // Trigger avatar speaking
      });

      // Stop speaking after estimated time based on response length
      const speakDuration = Math.min(fullResponse.length * 50, 10000);
      setTimeout(() => {
        set({ isSpeaking: false });
      }, speakDuration);

    } catch (err) {
      set({
        error: err instanceof Error ? err.message : 'Failed to send message',
        isStreaming: false,
      });
    }
  },

  clearMessages: () => set({ messages: [], currentResponse: '', error: null }),
  clearError: () => set({ error: null }),
  setSpeaking: (speaking: boolean) => set({ isSpeaking: speaking }),
}));
