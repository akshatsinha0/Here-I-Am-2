import { createContext, useState } from 'react';
import type { ReactNode } from 'react';

interface Message {
  id: number;
  text: string;
  sender: 'user' | 'other';
  timestamp: string;
  status: 'sent' | 'delivered' | 'read';
}

interface Chat {
  id: number;
  name: string;
  messages: Message[];
  unread: number;
  lastMessage?: string;
  lastTimestamp?: string;
  isGroup: boolean;
  participants: number[];
}

interface ChatContextType {
  chats: Chat[];
  activeChat: number | null;
  setActiveChat: (id: number | null) => void;
  sendMessage: (chatId: number, text: string) => void;
  createChat: (name: string, participants: number[], isGroup: boolean) => number;
}

export const ChatContext = createContext<ChatContextType>({
  chats: [],
  activeChat: null,
  setActiveChat: () => {},
  sendMessage: () => {},
  createChat: () => 0,
});

interface ChatProviderProps {
  children: ReactNode;
}

export const ChatProvider = ({ children }: ChatProviderProps) => {
  const [chats, setChats] = useState<Chat[]>([]);
  const [activeChat, setActiveChat] = useState<number | null>(null);

  const sendMessage = (chatId: number, text: string) => {
    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    const newMessage: Message = {
      id: Date.now(),
      text,
      sender: 'user',
      timestamp,
      status: 'sent'
    };
    
    setChats(prevChats => 
      prevChats.map(chat => 
        chat.id === chatId 
          ? {
              ...chat,
              messages: [...chat.messages, newMessage],
              lastMessage: text,
              lastTimestamp: timestamp
            }
          : chat
      )
    );
  };

  const createChat = (name: string, participants: number[], isGroup: boolean): number => {
    const newChatId = Date.now();
    
    const newChat: Chat = {
      id: newChatId,
      name,
      messages: [],
      unread: 0,
      isGroup,
      participants
    };
    
    setChats(prevChats => [...prevChats, newChat]);
    return newChatId;
  };

  return (
    <ChatContext.Provider value={{ chats, activeChat, setActiveChat, sendMessage, createChat }}>
      {children}
    </ChatContext.Provider>
  );
};
