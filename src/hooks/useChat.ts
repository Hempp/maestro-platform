/**
 * CHAT HOOK
 * Client-side chat state management with AI integration
 */

'use client';

import { useState, useCallback, useRef } from 'react';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string[];
  suggestions?: string[];
  timestamp: Date;
}

interface UseChatOptions {
  tier?: string;
  sessionId?: string;
}

export function useChat(options: UseChatOptions = {}) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const sessionIdRef = useRef(options.sessionId || crypto.randomUUID());

  const sendMessage = useCallback(async (content: string) => {
    setIsLoading(true);
    setError(null);

    // Add user message
    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: [content],
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, userMessage]);

    try {
      // Build conversation history for API
      const conversationHistory = messages.map(msg => ({
        role: msg.role,
        content: msg.content.join('\n\n'),
      }));

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: content,
          conversationHistory,
          sessionId: sessionIdRef.current,
          tier: options.tier,
          currentStep,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      const data = await response.json();

      // Add assistant message
      const assistantMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: data.content,
        suggestions: data.suggestions,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, assistantMessage]);
      setCurrentStep(prev => prev + 1);
      setSuggestions(data.suggestions || []);

      return data;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to send message';
      setError(message);

      // Add error message from assistant
      const errorMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: ["I'm having trouble connecting right now. Please try again in a moment."],
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);

      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [messages, options.tier, currentStep]);

  const addSystemMessage = useCallback((content: string[], newSuggestions?: string[]) => {
    const message: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'assistant',
      content,
      suggestions: newSuggestions,
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, message]);
    if (newSuggestions) setSuggestions(newSuggestions);
  }, []);

  const addLocalMessage = useCallback((role: 'user' | 'assistant', content: string[], newSuggestions?: string[]) => {
    const message: ChatMessage = {
      id: crypto.randomUUID(),
      role,
      content,
      suggestions: role === 'assistant' ? newSuggestions : undefined,
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, message]);
    if (newSuggestions) setSuggestions(newSuggestions);
  }, []);

  const clearChat = useCallback(() => {
    setMessages([]);
    setCurrentStep(0);
    sessionIdRef.current = crypto.randomUUID();
  }, []);

  return {
    messages,
    isLoading,
    error,
    currentStep,
    suggestions,
    sessionId: sessionIdRef.current,
    sendMessage,
    addSystemMessage,
    addLocalMessage,
    clearChat,
  };
}
