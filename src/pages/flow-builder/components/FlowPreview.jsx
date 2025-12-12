// C:\Projects\WhatsAppBot_Rocket\src\pages\flow-builder\components\FlowPreview.jsx

import React, { useState, useRef, useEffect } from "react";
import Icon from "../../../components/AppIcon";
import Button from "../../../components/ui/Button";

const FlowPreview = ({ flow, isOpen, onClose }) => {
  // --- LÓGICA DE ESTADO (INTACTA) ---
  const [testInput, setTestInput] = useState("");
  const [conversation, setConversation] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null); // Ref para auto-scroll

  // Auto-scroll al fondo
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [conversation, isTyping]);

  const handleTestMessage = () => {
    if (!testInput?.trim()) return;

    // Mensaje del usuario
    const userMessage = {
      id: Date.now(),
      type: "user",
      message: testInput,
      timestamp: new Date(),
    };

    setConversation((prev) => [...prev, userMessage]);
    const text = testInput.toLowerCase();
    setTestInput("");
    setIsTyping(true);

    let isTriggered = false;

    if (flow?.triggerType === "keyword") {
      isTriggered = flow?.keywords?.some((keyword) =>
        text.includes(keyword.toLowerCase())
      );
    } else if (flow?.triggerType === "welcome") {
      isTriggered = true;
    } else if (flow?.triggerType === "fallback") {
      isTriggered = true;
    }

    if (isTriggered) {
      // Simular respuestas del bot con delays
      flow?.responses?.forEach((response, index) => {
        setTimeout(() => {
          const botMessage = {
            id: Date.now() + index,
            type: "bot",
            message: response?.message,
            timestamp: new Date(),
          };

          setConversation((prev) => [...prev, botMessage]);

          if (index === flow?.responses?.length - 1) {
            setIsTyping(false);
          }
        }, (response?.delay + index + 1) * 1000); // Ajusté un poco el delay base para realismo
      });
    } else {
      setTimeout(() => {
        const botMessage = {
          id: Date.now(),
          type: "bot",
          message: "Este flujo no se activó con ese mensaje. Probá con otra palabra clave.",
          timestamp: new Date(),
        };

        setConversation((prev) => [...prev, botMessage]);
        setIsTyping(false);
      }, 800);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleTestMessage();
    }
  };

  const handleClearConversation = () => {
    setConversation([]);
    setIsTyping(false);
  };

  const formatTime = (date) => {
    return date?.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (!isOpen || !flow) return null;

  // --- RENDERIZADO VISUAL PRO ---
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
      {/* Backdrop con Blur */}
      <div 
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" 
        onClick={onClose}
      />

      {/* Modal Container */}
      <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-md max-h-[85vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200 border border-slate-200">
        
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-3">
             <div className="p-2 bg-emerald-100 text-emerald-600 rounded-full">
                <Icon name="MessageCircle" size={18} />
             </div>
             <div>
                <h2 className="text-sm font-bold text-slate-800">
                  Preview: {flow?.name}
                </h2>
                <p className="text-[10px] text-slate-500">Bot Simulator</p>
             </div>
          </div>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 p-1.5 rounded-full transition-colors"
          >
            <Icon name="X" size={20} />
          </button>
        </div>

        {/* Info Banner (Opcional, sutil) */}
        <div className="px-4 py-2 bg-slate-50 border-b border-slate-100 text-[10px] text-slate-500 flex items-center gap-2">
           <Icon name="Info" size={12} />
           <span>
              {flow?.triggerType === "keyword" && `Keywords: ${flow?.keywords?.join(", ")}`}
              {flow?.triggerType === "welcome" && "Triggers on Start"}
              {flow?.triggerType === "fallback" && "Default Fallback"}
           </span>
        </div>

        {/* Chat Area (Estilo WhatsApp) */}
        <div className="flex-1 overflow-y-auto bg-[#e5ddd5] relative">
           {/* Background Pattern */}
           <div 
             className="absolute inset-0 opacity-10 pointer-events-none"
             style={{ 
               backgroundImage: "url('https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png')",
               backgroundRepeat: "repeat" 
             }}
           />

           <div className="p-4 space-y-3 relative z-10 min-h-full flex flex-col justify-end">
              {conversation.length === 0 && (
                 <div className="flex justify-center my-4">
                    <span className="bg-[#fffae6] text-slate-600 text-[10px] px-3 py-1 rounded-lg shadow-sm border border-[#fff5c4]">
                       Messages are end-to-end encrypted. No one outside of this chat, not even WhatsApp, can read or listen to them.
                    </span>
                 </div>
              )}

              {conversation.map((msg) => {
                 const isUser = msg.type === 'user';
                 return (
                    <div key={msg.id} className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
                       <div 
                         className={`
                           max-w-[85%] px-3 py-1.5 rounded-lg shadow-sm text-sm relative
                           ${isUser 
                             ? 'bg-[#dcf8c6] text-slate-800 rounded-tr-none' 
                             : 'bg-white text-slate-800 rounded-tl-none'
                           }
                         `}
                       >
                          <p className="whitespace-pre-wrap leading-relaxed">{msg.message}</p>
                          <span className="text-[9px] text-slate-400 block text-right mt-0.5 select-none">
                             {formatTime(msg.timestamp)}
                             {isUser && <span className="ml-1 text-blue-400">✓✓</span>}
                          </span>
                          
                          {/* Triangulito decorativo (opcional) */}
                          <div className={`absolute top-0 w-0 h-0 border-[6px] border-transparent ${isUser ? '-right-[6px] border-t-[#dcf8c6] border-l-[#dcf8c6]' : '-left-[6px] border-t-white border-r-white'}`} />
                       </div>
                    </div>
                 );
              })}

              {/* Typing Indicator */}
              {isTyping && (
                 <div className="flex justify-start animate-in fade-in slide-in-from-left-2 duration-300">
                    <div className="bg-white px-4 py-3 rounded-lg rounded-tl-none shadow-sm flex items-center gap-1 w-16">
                       <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                       <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                       <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce"></div>
                    </div>
                 </div>
              )}
              
              <div ref={messagesEndRef} />
           </div>
        </div>

        {/* Footer Input */}
        <div className="p-3 bg-[#f0f0f0] flex items-end gap-2 border-t border-slate-200">
           <button 
             onClick={handleClearConversation}
             className="p-2 text-slate-500 hover:bg-slate-200 rounded-full transition-colors"
             title="Clear Chat"
           >
              <Icon name="Trash2" size={18} />
           </button>

           <div className="flex-1 bg-white rounded-2xl border border-transparent focus-within:border-emerald-500 focus-within:ring-1 focus-within:ring-emerald-500 transition-all flex items-center px-4 py-2">
              <input
                type="text"
                placeholder="Type a message..."
                value={testInput}
                onChange={(e) => setTestInput(e.target.value)}
                onKeyDown={handleKeyDown}
                className="w-full text-sm bg-transparent outline-none placeholder:text-slate-400"
                autoFocus
              />
           </div>

           <button 
             onClick={handleTestMessage}
             disabled={!testInput.trim() || isTyping}
             className="p-2.5 bg-emerald-600 text-white rounded-full hover:bg-emerald-700 disabled:opacity-50 disabled:scale-95 transition-all shadow-sm flex items-center justify-center"
           >
              {isTyping ? <Icon name="Loader2" size={18} className="animate-spin" /> : <Icon name="Send" size={18} className="ml-0.5" />}
           </button>
        </div>

      </div>
    </div>
  );
};

export default FlowPreview;