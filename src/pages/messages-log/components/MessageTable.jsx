// C:\Projects\WhatsAppBot_Rocket\src\pages\messages-log\components\MessageTable.jsx

import React, { useState } from 'react';
import { Checkbox } from '../../../components/ui/Checkbox';
import Button from '../../../components/ui/Button';
import Icon from '../../../components/AppIcon';
import MessageStatusBadge from './MessageStatusBadge';
import MessageDetailsModal from './MessageDetailsModal';

const MessageTable = ({ messages, onBulkAction }) => {
  const [selectedMessages, setSelectedMessages] = useState([]);
  const [selectedMessage, setSelectedMessage] = useState(null);

  // --- Lógica de Selección ---
  const handleSelectAll = (checked) => {
    if (checked) setSelectedMessages(messages?.map(msg => msg?.id));
    else setSelectedMessages([]);
  };

  const handleSelectMessage = (messageId, checked) => {
    if (checked) setSelectedMessages([...selectedMessages, messageId]);
    else setSelectedMessages(selectedMessages?.filter(id => id !== messageId));
  };

  // --- Formateadores ---
  const formatTimestamp = (timestamp) => {
    if (!timestamp) return "-";
    return new Date(timestamp).toLocaleString('en-US', {
      month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  };

  const shortId = (id) => id ? id.substring(0, 8) : "";

  return (
    <>
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden flex flex-col">
        
        {/* Header de la Tabla */}
        <div className="px-6 py-4 border-b border-slate-100 bg-white flex items-center justify-between shrink-0">
            <div className="flex items-center space-x-4">
              <Checkbox
                checked={selectedMessages.length === messages?.length && messages?.length > 0}
                indeterminate={selectedMessages.length > 0 && selectedMessages.length < messages?.length}
                onChange={(e) => handleSelectAll(e?.target?.checked)}
              />
              <span className="text-sm font-bold text-slate-700">
                {selectedMessages.length > 0 ? (
                   <span className="text-indigo-600">{selectedMessages.length} selected</span>
                ) : 'All Messages'}
              </span>
            </div>
            
            {selectedMessages.length > 0 && (
              <div className="flex items-center space-x-2 animate-in fade-in slide-in-from-right-2 duration-200">
                <Button variant="outline" size="sm" onClick={() => onBulkAction('export', selectedMessages)} iconName="Download" className="h-8">
                  Export
                </Button>
                <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200 h-8" onClick={() => onBulkAction('delete', selectedMessages)} iconName="Trash2">
                  Delete
                </Button>
              </div>
            )}
        </div>

        {/* --- VISTA DE ESCRITORIO --- */}
        <div className="hidden lg:block w-full">
          {/* CAMBIO CLAVE: table-fixed obliga a respetar los anchos definidos abajo */}
          <table className="w-full table-fixed text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase font-bold text-slate-400 border-b border-slate-200 tracking-wider">
              <tr>
                {/* Definimos anchos porcentuales fijos para sumar 100% */}
                <th className="px-4 py-3 w-[5%] text-center">
                   <div className="sr-only">Sel</div>
                </th>
                <th className="px-4 py-3 w-[15%] font-semibold">Time / ID</th>
                <th className="px-4 py-3 w-[12%] font-semibold">Direction</th>
                <th className="px-4 py-3 w-[45%] font-semibold">Message Content</th>
                <th className="px-4 py-3 w-[15%] font-semibold">Status</th>
                <th className="px-4 py-3 w-[8%] text-right font-semibold">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {messages?.map((msg) => {
                const isTemplate = msg.body?.startsWith("[TEMPLATE]") || msg.meta?.whatsapp_template;
                const isInbound = msg.direction === 'in' || msg.direction === 'inbound';
                
                return (
                  <tr key={msg.id} className="hover:bg-slate-50/50 transition-colors group">
                    
                    {/* Checkbox */}
                    <td className="px-4 py-4 text-center">
                      <Checkbox
                        checked={selectedMessages.includes(msg.id)}
                        onChange={(e) => handleSelectMessage(msg.id, e.target.checked)}
                      />
                    </td>

                    {/* Fecha e ID */}
                    <td className="px-4 py-4 truncate">
                      <div className="font-medium text-slate-700 truncate" title={formatTimestamp(msg.created_at || msg.timestamp)}>
                        {formatTimestamp(msg.created_at || msg.timestamp)}
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono mt-1 bg-slate-100 inline-block px-1.5 py-0.5 rounded border border-slate-200 truncate max-w-full">
                        #{shortId(msg.id)}
                      </div>
                    </td>

                    {/* Dirección */}
                    <td className="px-4 py-4">
                        <div className="flex items-center gap-2">
                           <div className={`p-1.5 rounded-full shrink-0 ${isInbound ? 'bg-indigo-50 text-indigo-600' : 'bg-orange-50 text-orange-600'}`}>
                              <Icon name={isInbound ? "ArrowDownLeft" : "ArrowUpRight"} size={14} />
                           </div>
                           <div className="flex flex-col min-w-0">
                              <span className={`text-xs font-bold uppercase tracking-wide truncate ${isInbound ? 'text-indigo-700' : 'text-orange-700'}`}>
                                 {isInbound ? "Inbound" : "Outbound"}
                              </span>
                           </div>
                        </div>
                    </td>

                    {/* Contenido (Highlight) */}
                    <td className="px-4 py-4">
                      {isTemplate ? (
                        <div className="flex items-center gap-2 p-2 rounded-lg bg-slate-50 border border-slate-100 group-hover:bg-white group-hover:border-slate-200 transition-colors shadow-sm max-w-full overflow-hidden">
                          <div className="bg-purple-100 text-purple-600 p-1 rounded-md shrink-0">
                             <Icon name="LayoutTemplate" size={14} />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                               <span className="text-[10px] font-bold text-purple-700 uppercase">Template</span>
                               {msg.meta?.whatsapp_template?.name && (
                                  <span className="text-[10px] text-slate-400 truncate">
                                     • {msg.meta.whatsapp_template.name}
                                  </span>
                               )}
                            </div>
                            <p className="text-slate-700 text-sm font-medium leading-snug truncate">
                              {msg.body.replace("[TEMPLATE] ", "")}
                            </p>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 py-1 max-w-full overflow-hidden">
                           <Icon name={isInbound ? "MessageCircle" : "MessageSquare"} size={16} className="text-slate-300 shrink-0" />
                           <p className="text-slate-600 text-sm leading-relaxed truncate" title={msg.body}>
                             {msg.body || <span className="italic text-slate-300">No content</span>}
                           </p>
                        </div>
                      )}
                    </td>

                    {/* Status Badge */}
                    <td className="px-4 py-4">
                      <div className="truncate">
                        <MessageStatusBadge status={msg.status} direction={msg.direction} />
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-4 text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedMessage(msg)}
                        iconName="Code"
                        className="text-slate-300 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                        title="View JSON Payload"
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* --- VISTA MÓVIL (Intacta) --- */}
        <div className="lg:hidden divide-y divide-slate-100">
          {messages?.map((msg) => {
             const isTemplate = msg.body?.startsWith("[TEMPLATE]") || msg.meta?.whatsapp_template;
             const isInbound = msg.direction === 'in' || msg.direction === 'inbound';
             
             return (
              <div key={msg.id} className="p-4 space-y-3 bg-white">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3 flex-1 overflow-hidden">
                    <Checkbox
                      checked={selectedMessages.includes(msg.id)}
                      onChange={(e) => handleSelectMessage(msg.id, e.target.checked)}
                      className="mt-1"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded uppercase ${isInbound ? 'bg-indigo-50 text-indigo-700' : 'bg-orange-50 text-orange-700'}`}>
                            {isInbound ? "IN" : "OUT"}
                          </span>
                          <span className="text-xs text-slate-400">
                            {formatTimestamp(msg.created_at || msg.timestamp)}
                          </span>
                      </div>
                      
                      {isTemplate ? (
                          <div className="flex items-center gap-1.5 mt-1 text-slate-800 font-medium text-sm">
                             <Icon name="LayoutTemplate" size={14} className="text-purple-500" />
                             <span className="truncate">{msg.body.replace("[TEMPLATE] ", "")}</span>
                          </div>
                      ) : (
                          <p className="text-sm text-slate-600 mt-1 line-clamp-2 leading-relaxed">{msg.body}</p>
                      )}
                    </div>
                  </div>
                  
                  <Button variant="ghost" size="icon" onClick={() => setSelectedMessage(msg)} iconName="Eye" className="text-slate-400 -mr-2" />
                </div>
                
                <div className="pl-8 flex items-center justify-between">
                  <span className="text-[10px] font-mono text-slate-300">#{shortId(msg.id)}</span>
                  <MessageStatusBadge status={msg.status} direction={msg.direction} />
                </div>
              </div>
            );
          })}
        </div>

        {/* Empty State */}
        {messages?.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4 border border-slate-100">
               <Icon name="MessageSquareOff" size={24} className="text-slate-300" />
            </div>
            <h3 className="text-slate-900 font-bold">No messages log yet</h3>
            <p className="text-slate-500 text-sm mt-1 max-w-xs">Messages sent or received will appear here automatically.</p>
          </div>
        )}
      </div>

      {/* MODAL DETALLES */}
      {selectedMessage && (
        <MessageDetailsModal
          message={selectedMessage}
          onClose={() => setSelectedMessage(null)}
        />
      )}
    </>
  );
};

export default MessageTable;