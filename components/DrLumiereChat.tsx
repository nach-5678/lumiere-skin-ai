import React, { useState, useEffect, useRef } from 'react';
import { Send, User, Sparkles, Bot, Loader2, X, ShoppingBag, ArrowUpRight } from 'lucide-react';
import { SkinAnalysisResult, ChatMessage } from '../types';
import { createDrLumiereChat } from '../services/geminiService';
import { Chat } from "@google/genai";

interface DrLumiereChatProps {
  result: SkinAnalysisResult;
  onClose?: () => void;
}

// Helper to render formatted text with links
const FormattedText: React.FC<{ text: string }> = ({ text }) => {
  // Split by double newlines for paragraphs
  const paragraphs = text.split(/\n\n+/);

  return (
    <div className="space-y-3">
      {paragraphs.map((paragraph, pIdx) => {
        // Check for bullet points
        if (paragraph.trim().startsWith('* ') || paragraph.trim().startsWith('- ')) {
            const items = paragraph.split(/\n/).filter(line => line.trim().match(/^[*|-]\s/));
            return (
                <ul key={pIdx} className="list-none space-y-2 ml-1">
                    {items.map((item, i) => {
                         const content = item.replace(/^[*|-]\s/, '');
                         return (
                            <li key={i} className="flex items-start gap-2 text-sm">
                                <span className="mt-1.5 w-1 h-1 rounded-full bg-sage-500 flex-shrink-0" />
                                <span><InlineFormat text={content} /></span>
                            </li>
                         );
                    })}
                </ul>
            );
        }
        return <p key={pIdx} className="min-h-[1em]"><InlineFormat text={paragraph} /></p>;
      })}
    </div>
  );
};

// Helper for inline formatting: **bold** and [Product Links]
const InlineFormat: React.FC<{ text: string }> = ({ text }) => {
    // Regex matches **bold** OR [Product Link]
    const parts = text.split(/(\*\*.*?\*\*|\[.*?\])/g);
    
    return (
        <>
            {parts.map((part, i) => {
                if (part.startsWith('**') && part.endsWith('**')) {
                    return <strong key={i} className="font-bold text-stone-900">{part.slice(2, -2)}</strong>;
                }
                if (part.startsWith('[') && part.endsWith(']')) {
                    const productName = part.slice(1, -1);
                    const query = encodeURIComponent(productName);
                    return (
                        <a 
                            key={i} 
                            href={`https://www.amazon.in/s?k=${query}`} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-0.5 text-sage-700 font-bold bg-sage-50 px-1.5 rounded hover:bg-sage-100 hover:underline decoration-sage-400 underline-offset-2 transition-colors"
                        >
                            <ShoppingBag size={10} />
                            {productName}
                        </a>
                    );
                }
                return <span key={i}>{part}</span>;
            })}
        </>
    );
}

const SUGGESTED_QUESTIONS = [
  "Explain my routine",
  "Why this cleanser?",
  "Diet tips for my skin?",
  "Cheaper alternatives?",
  "How to fix scars?",
  "Morning vs Evening?"
];

const DrLumiereChat: React.FC<DrLumiereChatProps> = ({ result, onClose }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'model',
      text: `Hello! I'm Dr. Lumière. I've analyzed your skin and prepared your report. I noticed your main concern is **${result.concerns?.[0]?.name?.toLowerCase() || 'your skin health'}**. \n\nHow can I help you with your routine or results today?`
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const chatSession = useRef<Chat | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Initialize chat session
    if (!chatSession.current) {
      chatSession.current = createDrLumiereChat(result);
    }
  }, [result]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleSend = async (textOverride?: string) => {
    const textToSend = textOverride || input;
    if (!textToSend.trim() || !chatSession.current || isLoading) return;

    const userMsg: ChatMessage = { id: Date.now().toString(), role: 'user', text: textToSend };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await chatSession.current.sendMessage({ message: userMsg.text });
      const text = response.text || "I apologize, I couldn't generate a response.";
      
      const modelMsg: ChatMessage = { id: (Date.now() + 1).toString(), role: 'model', text };
      setMessages(prev => [...prev, modelMsg]);
    } catch (error) {
      console.error("Chat error", error);
      setMessages(prev => [...prev, { id: Date.now().toString(), role: 'model', text: "I'm having trouble connecting right now. Please try again." }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-stone-50 overflow-hidden md:rounded-3xl shadow-2xl relative transition-colors duration-300">
        {/* Header */}
        <div className="bg-white/90 backdrop-blur-md border-b border-stone-200 p-4 flex items-center justify-between sticky top-0 z-20 transition-colors duration-300">
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-stone-900 flex items-center justify-center shadow-md">
                    <Sparkles size={18} className="text-sage-300" />
                </div>
                <div>
                    <h3 className="font-serif text-lg font-bold text-stone-900 leading-tight">Dr. Lumière</h3>
                    <div className="flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
                        <p className="text-[10px] uppercase tracking-widest text-stone-500 font-bold">AI Dermatologist</p>
                    </div>
                </div>
            </div>
            {onClose && (
                <button onClick={onClose} className="p-2 text-stone-400 hover:text-stone-800 hover:bg-stone-100 rounded-full transition-colors">
                    <X size={20} />
                </button>
            )}
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6 scroll-smooth">
            {messages.map((msg) => (
                <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`flex gap-3 max-w-[90%] md:max-w-[80%] ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                        {/* Avatar */}
                        <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center shadow-sm mt-1 ${
                            msg.role === 'user' ? 'bg-stone-200 text-stone-600' : 'bg-stone-900 text-sage-300'
                        }`}>
                            {msg.role === 'user' ? <User size={14} /> : <Bot size={14} />}
                        </div>
                        
                        {/* Bubble */}
                        <div className={`p-4 rounded-2xl text-[15px] leading-relaxed shadow-sm ${
                            msg.role === 'user' 
                            ? 'bg-stone-800 text-stone-50 rounded-tr-sm' 
                            : 'bg-white border border-stone-100 text-stone-700 rounded-tl-sm'
                        }`}>
                            {msg.role === 'model' ? (
                                <FormattedText text={msg.text} />
                            ) : (
                                msg.text
                            )}
                        </div>
                    </div>
                </div>
            ))}
            
            {isLoading && (
                 <div className="flex justify-start animate-fade-in">
                    <div className="flex gap-3 max-w-[85%]">
                        <div className="w-8 h-8 rounded-full bg-stone-900 text-sage-300 flex items-center justify-center mt-1">
                             <Bot size={14} />
                        </div>
                        <div className="bg-white border border-stone-100 p-4 rounded-2xl rounded-tl-sm shadow-sm flex items-center gap-3">
                            <Loader2 size={18} className="animate-spin text-sage-500" />
                            <span className="text-sm text-stone-500 font-medium">Analyzing query...</span>
                        </div>
                    </div>
                </div>
            )}
            <div ref={messagesEndRef} className="h-2" />
        </div>

        {/* Input Area */}
        <div className="p-4 bg-white border-t border-stone-100 pb-safe z-10 transition-colors duration-300">
            {/* Suggested Questions */}
            <div className="flex gap-2 overflow-x-auto no-scrollbar mb-3 pb-1">
                {SUGGESTED_QUESTIONS.map((q, i) => (
                    <button
                        key={i}
                        onClick={() => handleSend(q)}
                        disabled={isLoading}
                        className="whitespace-nowrap px-3 py-1.5 bg-stone-50 border border-stone-200 rounded-full text-xs font-medium text-stone-600 hover:bg-sage-50 hover:text-sage-700 hover:border-sage-200 transition-colors flex-shrink-0"
                    >
                        {q}
                    </button>
                ))}
            </div>

            <div className="flex gap-2 relative bg-stone-100 p-1.5 rounded-full border border-stone-200 focus-within:ring-2 focus-within:ring-sage-200 focus-within:bg-white focus-within:border-sage-300 transition-all shadow-inner">
                <input 
                    type="text" 
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                    placeholder="Ask a follow-up question..." 
                    className="flex-1 bg-transparent border-none px-4 py-3 text-sm focus:outline-none text-stone-800 placeholder:text-stone-400"
                    autoComplete="off"
                />
                <button 
                    onClick={() => handleSend()}
                    disabled={!input.trim() || isLoading}
                    className="p-3 bg-stone-900 text-white rounded-full hover:bg-black disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:scale-105 shadow-md"
                >
                    {isLoading ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
                </button>
            </div>
            <div className="text-center mt-2">
                 <p className="text-[10px] text-stone-400">AI responses are for informational purposes only.</p>
            </div>
        </div>
    </div>
  );
};

export default DrLumiereChat;