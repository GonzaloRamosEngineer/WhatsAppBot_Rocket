import React from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import { useNavigate } from 'react-router-dom'; // Importamos para poder navegar

const ConversationSummary = ({ conversations, onSelectConversation }) => {
  const navigate = useNavigate();

  // Función para redirigir al área de envío de mensajes (Channels / Templates)
  const handleStartNew = () => {
    // Ajusta esta ruta a donde tengas tu "TemplatesListCard" o tu Chat principal
    navigate('/channel-setup'); 
  };

  return (
    <div className="h-full flex flex-col">
      {/* Botón de Acción Principal */}
      <div className="p-4 border-b border-slate-100 bg-slate-50/50">
        <Button 
          variant="default" 
          className="w-full bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-100"
          iconName="Plus"
          iconPosition="left"
          onClick={handleStartNew}
        >
          Start New Conversation
        </Button>
        <p className="text-[10px] text-slate-400 text-center mt-2">
          Sends a template message to a new number
        </p>
      </div>

      {/* Lista de Conversaciones */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {conversations.length === 0 ? (
          <div className="text-center py-8 px-4">
             <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-2">
                <Icon name="Users" size={18} className="text-slate-400" />
             </div>
             <p className="text-xs text-slate-500">No active conversations found in this log period.</p>
          </div>
        ) : (
          conversations.map((conv) => (
            <div
              key={conv.id}
              onClick={() => onSelectConversation(conv)}
              className="group flex items-start gap-3 p-3 rounded-lg hover:bg-white hover:shadow-md hover:border-slate-200 border border-transparent transition-all cursor-pointer"
            >
              {/* Avatar Placeholder */}
              <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center shrink-0 border border-slate-200 group-hover:border-indigo-200 group-hover:bg-indigo-50 transition-colors">
                <Icon name="User" size={18} className="text-slate-400 group-hover:text-indigo-500" />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-baseline mb-0.5">
                  <h4 className="text-sm font-bold text-slate-700 truncate group-hover:text-indigo-700 transition-colors">
                    {conv.contactName}
                  </h4>
                  <span className="text-[10px] text-slate-400 whitespace-nowrap ml-2">
                    {new Date(conv.lastMessageTime).toLocaleDateString(undefined, {month:'short', day:'numeric'})}
                  </span>
                </div>
                
                <p className="text-xs text-slate-500 truncate group-hover:text-slate-600">
                   {conv.lastMessage}
                </p>
                
                <div className="flex items-center gap-2 mt-1.5">
                   <span className="text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded border border-slate-200">
                     {conv.messageCount} msgs
                   </span>
                   <span className="text-[10px] text-slate-400 font-mono">
                     {conv.contact}
                   </span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default ConversationSummary;