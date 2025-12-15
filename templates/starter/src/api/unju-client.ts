// Unju API Client for api.unju.ai

const API_BASE = 'https://api.unju.ai';

// Master key for API access - in production use env var
const MASTER_KEY = 'sk-unju-9f8e7d6c5b4a3210';

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface StreamChunk {
  type: 'text' | 'done' | 'error';
  content?: string;
  error?: string;
}

export interface User {
  id: string;
  email: string;
  name?: string;
  image?: string;
}

export interface Session {
  user: User;
  token: string;
}

class UnjuClient {
  private baseUrl: string;
  private apiKey: string;
  private sessionToken: string | null = null;

  constructor(baseUrl: string = API_BASE, apiKey: string = MASTER_KEY) {
    this.baseUrl = baseUrl;
    this.apiKey = apiKey;
  }

  setSessionToken(token: string | null) {
    this.sessionToken = token;
  }

  private getHeaders(): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      'x-api-key': this.apiKey,
    };
    if (this.sessionToken) {
      headers['Authorization'] = `Bearer ${this.sessionToken}`;
    }
    return headers;
  }

  // Auth endpoints using Better Auth
  async signIn(email: string, password: string): Promise<Session> {
    const response = await fetch(`${this.baseUrl}/api/auth/sign-in/email`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ email, password }),
      credentials: 'include',
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Sign in failed' }));
      throw new Error(error.message || 'Sign in failed');
    }

    const data = await response.json();
    this.sessionToken = data.token;
    return data;
  }

  async signUp(email: string, password: string, name?: string): Promise<Session> {
    const response = await fetch(`${this.baseUrl}/api/auth/sign-up/email`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ email, password, name }),
      credentials: 'include',
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Sign up failed' }));
      throw new Error(error.message || 'Sign up failed');
    }

    const data = await response.json();
    this.sessionToken = data.token;
    return data;
  }

  async signOut(): Promise<void> {
    await fetch(`${this.baseUrl}/api/auth/sign-out`, {
      method: 'POST',
      headers: this.getHeaders(),
      credentials: 'include',
    });
    this.sessionToken = null;
  }

  async getSession(): Promise<Session | null> {
    try {
      const response = await fetch(`${this.baseUrl}/api/auth/get-session`, {
        method: 'GET',
        headers: this.getHeaders(),
        credentials: 'include',
      });

      if (!response.ok) {
        return null;
      }

      const data = await response.json();
      if (data.token) {
        this.sessionToken = data.token;
      }
      return data;
    } catch {
      return null;
    }
  }

  // Chat endpoint with streaming
  async *chat(messages: ChatMessage[], model: string = 'gpt-4o-mini'): AsyncGenerator<StreamChunk> {
    const response = await fetch(`${this.baseUrl}/api/chat`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({
        messages,
        model,
        stream: true,
      }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Chat request failed' }));
      yield { type: 'error', error: error.message || 'Chat request failed' };
      return;
    }

    if (!response.body) {
      yield { type: 'error', error: 'No response body' };
      return;
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') {
              yield { type: 'done' };
              return;
            }
            try {
              const parsed = JSON.parse(data);
              const content = parsed.choices?.[0]?.delta?.content;
              if (content) {
                yield { type: 'text', content };
              }
            } catch {
              // Skip invalid JSON
            }
          }
        }
      }
      yield { type: 'done' };
    } finally {
      reader.releaseLock();
    }
  }

  // Non-streaming chat for simple requests
  async chatComplete(messages: ChatMessage[], model: string = 'gpt-4o-mini'): Promise<string> {
    const response = await fetch(`${this.baseUrl}/api/chat`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({
        messages,
        model,
        stream: false,
      }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Chat request failed' }));
      throw new Error(error.message || 'Chat request failed');
    }

    const data = await response.json();
    return data.choices?.[0]?.message?.content || '';
  }
}

export const unjuClient = new UnjuClient();
export default unjuClient;
