import React, { useState, useRef, useEffect } from 'react';
import { 
  Send, 
  Bot, 
  User, 
  Sparkles, 
  ExternalLink, 
  Paperclip, 
  X, 
  RefreshCw, 
  Volume2, 
  VolumeX, 
  HelpCircle,
  Globe,
  Brain,
  Zap,
  Info
} from 'lucide-react';
import { ChatMessage } from '../types';
import ReactMarkdown from 'react-markdown';

interface BotanistChatProps {
  messages: ChatMessage[];
  setMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>;
  initialQuery?: string;
}

export const BotanistChat: React.FC<BotanistChatProps> = ({
  messages,
  setMessages,
  initialQuery,
}) => {
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [attachedImage, setAttachedImage] = useState<string | null>(null);
  const [speakingId, setSpeakingId] = useState<string | null>(null);
  const [chatMode, setChatMode] = useState<'grounded' | 'thinking' | 'fast'>('grounded');
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Auto scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  // If initial query provided from diagnosis card
  useEffect(() => {
    if (initialQuery && initialQuery.trim() !== '') {
      handleSendMessage(initialQuery);
    }
  }, [initialQuery]);

  const handleSendMessage = async (textToSend?: string) => {
    const text = textToSend || inputValue;
    if ((!text || !text.trim()) && !attachedImage) return;

    const userMsg: ChatMessage = {
      id: 'msg-' + Date.now(),
      role: 'user',
      content: text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      image: attachedImage || undefined,
    };

    const newHistory = [...messages, userMsg];
    setMessages(newHistory);
    setInputValue('');
    const currentAttached = attachedImage;
    setAttachedImage(null);
    setIsLoading(true);

    try {
      const response = await fetch('/api/botanist-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: newHistory.map((m) => ({
            role: m.role === 'user' ? 'user' : 'model',
            content: m.content,
          })),
          language: 'en',
          imageBase64: currentAttached,
          chatMode,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to get botanist response');
      }

      const botMsg: ChatMessage = {
        id: 'msg-' + (Date.now() + 1),
        role: 'assistant',
        content: data.reply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        sources: data.sources || [],
      };

      setMessages([...newHistory, botMsg]);
    } catch (err: any) {
      console.error('Chat error:', err);
      const isTemporary =
        err?.message?.includes('high demand') ||
        err?.message?.includes('rate limits') ||
        err?.message?.includes('503') ||
        err?.message?.includes('429');

      const errorMsg: ChatMessage = {
        id: 'msg-' + (Date.now() + 1),
        role: 'assistant',
        content: isTemporary
          ? '⚠️ **Dr. Vriksha Notice**: The Agro-Botanical consultation engine is experiencing high temporary demand. Please click send again in a moment.'
          : `⚠️ ${err.message || 'I encountered a connection issue. Please try asking your question again.'}`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages([...newHistory, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle image attachment with client-side optimization
  const handleFileAttach = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const dataUrl = event.target?.result as string;
        const img = new Image();
        img.onload = () => {
          const MAX_DIM = 1400;
          let width = img.width;
          let height = img.height;

          if (width > MAX_DIM || height > MAX_DIM) {
            if (width > height) {
              height = Math.round((height * MAX_DIM) / width);
              width = MAX_DIM;
            } else {
              width = Math.round((width * MAX_DIM) / height);
              height = MAX_DIM;
            }
            const canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            if (ctx) {
              ctx.drawImage(img, 0, 0, width, height);
              setAttachedImage(canvas.toDataURL('image/jpeg', 0.85));
              return;
            }
          }
          setAttachedImage(dataUrl);
        };
        img.onerror = () => {
          setAttachedImage(dataUrl);
        };
        img.src = dataUrl;
      };
      reader.readAsDataURL(file);
    }
  };

  // Voice Readout
  const toggleSpeech = (id: string, text: string) => {
    if (speakingId === id) {
      window.speechSynthesis.cancel();
      setSpeakingId(null);
      return;
    }

    window.speechSynthesis.cancel();
    const cleanText = text.replace(/[*#_`]/g, '');
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.rate = 0.95;

    utterance.onend = () => setSpeakingId(null);
    utterance.onerror = () => setSpeakingId(null);

    setSpeakingId(id);
    window.speechSynthesis.speak(utterance);
  };

  const quickPrompts = [
    {
      label: '🌱 How to prepare Jeevamrut fertilizer?',
      prompt: 'Can you explain the exact recipe, ingredients, and application method for organic Jeevamrut liquid fertilizer for plants and trees?',
    },
    {
      label: '🍃 Organic Neem Oil Spray Recipe',
      prompt: 'What is the correct ratio and method to make a Neem oil foliar spray for aphid, whitefly, and mealybug pest control without burning leaves?',
    },
    {
      label: '🍂 Cure Yellowing Leaves (Chlorosis)',
      prompt: 'My tree leaves are turning yellow with green veins. What nutrient is lacking (Iron, Nitrogen, or Magnesium) and how can I treat it organically?',
    },
    {
      label: '🥭 Mango Flower & Fruit Drop Prevention',
      prompt: 'What organic fertilizers, micronutrient sprays, and watering schedules prevent premature mango flower drop and fruit drop?',
    },
    {
      label: '🪴 Overwatering vs Underwatering Test',
      prompt: 'How can I clearly test if my plant is suffering from root rot / overwatering versus drought stress?',
    },
  ];

  return (
    <div className="w-full max-w-5xl mx-auto flex flex-col font-sans text-stone-800 animate-fade-in space-y-3 sm:space-y-4">
      {/* Bento Header */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-3 border-b border-stone-200 pb-3 sm:pb-4">
        <div>
          <h1 className="text-2xl sm:text-4xl font-serif font-bold text-emerald-950 tracking-tight">
            VANANSH <span className="text-emerald-700 font-medium text-xl sm:text-3xl">- Dr. Vriksha AI Consultant</span>
          </h1>
          <p className="text-stone-500 font-medium text-xs sm:text-sm mt-0.5">
            AI Agro-Botanist Consultant • Google Search Grounded • High Thinking Deep Agronomy Reasoning
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {/* Intelligence Engine Mode Selector */}
          <div className="flex flex-wrap sm:inline-flex p-1 bg-stone-100 border border-stone-200 rounded-2xl text-[11px] sm:text-xs font-semibold gap-1 sm:gap-0 w-full sm:w-auto">
            <button
              type="button"
              id="mode-grounded"
              onClick={() => setChatMode('grounded')}
              className={`flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl transition-all min-h-[36px] ${
                chatMode === 'grounded'
                  ? 'bg-emerald-800 text-white shadow-xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
              title="Powered by gemini-3.5-flash with Google Search Grounding"
            >
              <Globe className="w-3.5 h-3.5 shrink-0" />
              <span>Grounded</span>
            </button>

            <button
              type="button"
              id="mode-thinking"
              onClick={() => setChatMode('thinking')}
              className={`flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl transition-all min-h-[36px] ${
                chatMode === 'thinking'
                  ? 'bg-purple-900 text-white shadow-xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
              title="High Thinking Reasoning with gemini-3.1-pro-preview"
            >
              <Brain className="w-3.5 h-3.5 shrink-0" />
              <span>Thinking</span>
            </button>

            <button
              type="button"
              id="mode-fast"
              onClick={() => setChatMode('fast')}
              className={`flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl transition-all min-h-[36px] ${
                chatMode === 'fast'
                  ? 'bg-amber-800 text-white shadow-xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
              title="Fast Assistant with gemini-3.1-flash-lite"
            >
              <Zap className="w-3.5 h-3.5 shrink-0" />
              <span>Fast</span>
            </button>
          </div>

          <button
            onClick={() => {
              setMessages([
                {
                  id: 'welcome',
                  role: 'assistant',
                  content:
                    'Hello! I am Dr. Vriksha, your VANANSH AI Agro-Botanist and Tree Doctor. How can I assist your garden, crops, or trees today? You can ask about plant diseases, organic remedies (Jeevamrut, Neem spray), watering cycles, or soil nutrition.',
                  timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                },
              ]);
            }}
            className="text-xs font-bold uppercase tracking-wider text-stone-600 hover:text-stone-900 px-3 py-1.5 rounded-2xl bg-white hover:bg-stone-100 border border-stone-200 transition-colors min-h-[36px] flex items-center"
          >
            Reset
          </button>
        </div>
      </header>

      {/* Mode Information Banner */}
      <div className="flex items-center justify-between px-3.5 py-2 bg-emerald-50/60 border border-emerald-200/60 rounded-2xl text-[11px] text-emerald-950">
        <div className="flex items-center gap-2">
          <Info className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
          <span className="leading-snug">
            {chatMode === 'grounded' && (
              <>
                <strong>Live Search Grounding:</strong> Using <code>gemini-3.5-flash</code> with real-time web retrieval for up-to-date pest outbreaks and agronomy tips.
              </>
            )}
            {chatMode === 'thinking' && (
              <>
                <strong>High Thinking Mode:</strong> Using <code>gemini-3.1-pro-preview</code> with maximum reasoning depth for complex crop genetics and soil chemistry.
              </>
            )}
            {chatMode === 'fast' && (
              <>
                <strong>Fast Mode:</strong> Using <code>gemini-3.1-flash-lite</code> for instant, ultra-responsive plant care guidance.
              </>
            )}
          </span>
        </div>
        <span className="hidden md:inline font-mono text-[10px] bg-emerald-100/70 text-emerald-900 px-2 py-0.5 rounded-md shrink-0">
          {chatMode === 'grounded' ? 'gemini-3.5-flash' : chatMode === 'thinking' ? 'gemini-3.1-pro-preview' : 'gemini-3.1-flash-lite'}
        </span>
      </div>

      {/* Main Bento Chat Container */}
      <div className="h-[calc(100dvh-16rem)] sm:h-[calc(100vh-15rem)] min-h-[460px] sm:min-h-[520px] flex flex-col bg-white rounded-3xl border border-stone-200 shadow-xs overflow-hidden">
        {/* Messages Thread */}
        <div className="flex-1 p-3 sm:p-6 overflow-y-auto space-y-3 sm:space-y-4 bg-[#fdfcf6]/50">
          {messages.map((msg) => {
            const isUser = msg.role === 'user';
            return (
              <div
                key={msg.id}
                className={`flex gap-2 sm:gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}
              >
                {!isUser && (
                  <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-emerald-900 text-emerald-100 flex items-center justify-center shrink-0 shadow-xs mt-1 border border-emerald-800">
                    <Bot className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  </div>
                )}

                <div
                  className={`max-w-[88%] sm:max-w-[75%] rounded-3xl p-3.5 sm:p-5 text-xs sm:text-sm shadow-xs ${
                    isUser
                      ? 'bg-stone-900 text-white rounded-br-xs'
                      : 'bg-white border border-stone-200 text-stone-800 rounded-bl-xs'
                  }`}
                >
                  {/* Attached Image Preview */}
                  {msg.image && (
                    <div className="mb-2.5 sm:mb-3 rounded-2xl overflow-hidden max-h-48 border border-stone-200 bg-stone-900">
                      <img src={msg.image} alt="User upload" className="w-full h-full object-cover" />
                    </div>
                  )}

                  {/* Message Body */}
                  <div className="prose prose-sm max-w-none text-current space-y-1.5">
                    <ReactMarkdown>{msg.content}</ReactMarkdown>
                  </div>

                  {/* Grounding Sources */}
                  {msg.sources && msg.sources.length > 0 && (
                    <div className="mt-3 pt-2.5 border-t border-stone-100 space-y-1.5">
                      <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest flex items-center gap-1">
                        <Sparkles className="w-3 h-3 text-emerald-600" />
                        <span>Google Search Grounding Citations:</span>
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {msg.sources.map((source, sIdx) => (
                          <a
                            key={sIdx}
                            href={source.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-[10px] sm:text-[11px] px-2.5 py-1 rounded-lg bg-stone-100 hover:bg-emerald-50 text-emerald-900 border border-stone-200 transition-colors font-medium"
                          >
                            <ExternalLink className="w-3 h-3 text-emerald-600 shrink-0" />
                            <span className="truncate max-w-[180px] sm:max-w-[200px]">{source.title || 'Botanical Web Citation'}</span>
                          </a>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Footer Timestamp & Speech */}
                  <div className={`flex items-center justify-between mt-2 pt-1 text-[10px] ${isUser ? 'text-stone-400' : 'text-stone-400'}`}>
                    <span>{msg.timestamp}</span>
                    {!isUser && (
                      <button
                        onClick={() => toggleSpeech(msg.id, msg.content)}
                        className="p-1.5 hover:text-emerald-700 transition-colors min-h-[30px] min-w-[30px] flex items-center justify-center"
                        title="Read out message"
                      >
                        {speakingId === msg.id ? (
                          <VolumeX className="w-3.5 h-3.5 text-rose-600 animate-pulse" />
                        ) : (
                          <Volume2 className="w-3.5 h-3.5" />
                        )}
                      </button>
                    )}
                  </div>
                </div>

                {isUser && (
                  <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-emerald-800 text-white flex items-center justify-center shrink-0 shadow-xs mt-1">
                    <User className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  </div>
                )}
              </div>
            );
          })}

          {isLoading && (
            <div className="flex gap-2 sm:gap-3 justify-start">
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-emerald-900 text-emerald-100 flex items-center justify-center shrink-0">
                <Bot className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </div>
              <div className="bg-white border border-stone-200 rounded-3xl rounded-bl-xs p-3.5 sm:p-4 shadow-xs flex items-center gap-2.5 text-xs text-stone-600">
                <RefreshCw className="w-4 h-4 animate-spin text-emerald-600 shrink-0" />
                <span>
                  {chatMode === 'thinking'
                    ? 'Dr. Vriksha is performing high-thinking deep agronomy reasoning...'
                    : chatMode === 'grounded'
                    ? 'Dr. Vriksha is retrieving live Google Search grounding data...'
                    : 'Dr. Vriksha is responding...'}
                </span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Suggested Quick Prompt Chips */}
        {messages.length <= 2 && (
          <div className="p-2.5 sm:p-3 bg-stone-50 border-t border-stone-200 overflow-x-auto flex items-center gap-2 shrink-0">
            <span className="text-[10px] font-black uppercase text-stone-400 tracking-wider shrink-0 flex items-center gap-1">
              <HelpCircle className="w-3.5 h-3.5 text-emerald-600" />
              Suggested:
            </span>
            {quickPrompts.map((qp, idx) => (
              <button
                key={idx}
                onClick={() => handleSendMessage(qp.prompt)}
                className="text-[11px] sm:text-xs px-2.5 sm:px-3 py-1.5 bg-white hover:bg-emerald-50 text-stone-700 hover:text-emerald-900 border border-stone-200 rounded-full shrink-0 transition-colors shadow-2xs font-medium min-h-[32px]"
              >
                {qp.label}
              </button>
            ))}
          </div>
        )}

        {/* Input Form Bar */}
        <div className="p-2.5 sm:p-4 bg-white border-t border-stone-200 space-y-2">
          {attachedImage && (
            <div className="flex items-center gap-2 p-1.5 bg-stone-100 rounded-2xl w-fit border border-stone-200">
              <img src={attachedImage} alt="Attachment" className="w-8 h-8 sm:w-9 sm:h-9 object-cover rounded-xl border" />
              <span className="text-xs text-stone-700 font-medium">Leaf Photo attached</span>
              <button
                onClick={() => setAttachedImage(null)}
                className="p-1 text-stone-400 hover:text-rose-600 min-h-[32px] min-w-[32px] flex items-center justify-center"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex items-center gap-1.5 sm:gap-2"
          >
            <button
              type="button"
              id="btn-chat-attach-file"
              onClick={() => fileInputRef.current?.click()}
              className="p-2.5 sm:p-3 text-stone-500 hover:text-stone-900 hover:bg-stone-100 rounded-2xl border border-stone-200 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center shrink-0"
              title="Attach leaf photo"
            >
              <Paperclip className="w-4 h-4" />
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileAttach}
            />

            <input
              type="text"
              id="input-chat-query"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Ask Dr. Vriksha (e.g. How to cure powdery mildew on mango tree?)..."
              className="flex-1 text-xs sm:text-sm px-3 sm:px-4 py-2.5 sm:py-3 rounded-2xl border border-stone-200 focus:outline-hidden focus:border-emerald-600 bg-stone-50/60 min-h-[44px]"
            />

            <button
              type="submit"
              id="btn-chat-send"
              disabled={isLoading || (!inputValue.trim() && !attachedImage)}
              className="p-2.5 sm:p-3 bg-stone-900 hover:bg-emerald-900 text-white rounded-2xl shadow-xs transition-transform active:scale-95 disabled:opacity-40 min-h-[44px] min-w-[44px] flex items-center justify-center shrink-0"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

