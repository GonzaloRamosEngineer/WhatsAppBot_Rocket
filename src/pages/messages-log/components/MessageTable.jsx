import React, { useState } from 'react';
import { Checkbox } from '../../../components/ui/Checkbox';
import Button from '../../../components/ui/Button';
import Icon from '../../../components/AppIcon';
import MessageStatusBadge from './MessageStatusBadge';
import MessageDetailsModal from './MessageDetailsModal';

const MessageTable = ({ messages, onBulkAction }) => {
  const [selectedMessages, setSelectedMessages] = useState([]);
  const [selectedMessage, setSelectedMessage] = useState(null);

  // --- Lógica de Selección (Mantenida igual) ---
  const handleSelectAll = (checked) => {
    if (checked) setSelectedMessages(messages?.map(msg => msg?.id));
    else setSelectedMessages([]);
  };

  const handleSelectMessage = (messageId, checked) => {
    if (checked) setSelectedMessages([...selectedMessages, messageId]);
    else setSelectedMessages(selectedMessages?.filter(id => id !== messageId));
  };

  // --- Formateadores Visuales ---
  const formatTimestamp = (timestamp) => {
    if (!timestamp) return "-";
    return new Date(timestamp).toLocaleString('en-US', {
      month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  };

  return (
    <>
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        
        {/* Header de la Tabla (Acciones Masivas) */}
        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Checkbox
                checked={selectedMessages.length === messages?.length && messages?.length > 0}
                indeterminate={selectedMessages.length > 0 && selectedMessages.length < messages?.length}
                onChange={(e) => handleSelectAll(e?.target?.checked)}
              />
              <span className="text-sm font-semibold text-slate-600">
                {selectedMessages.length > 0 ? `${selectedMessages.length} selected` : 'Message History'}
              </span>
            </div>
            
            {selectedMessages.length > 0 && (
              <div className="flex items-center space-x-2 animate-in fade-in slide-in-from-right-4 duration-300">
                <Button variant="outline" size="sm" onClick={() => onBulkAction('export', selectedMessages)} iconName="Download">
                  Export
                </Button>
                <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200" onClick={() => onBulkAction('delete', selectedMessages)} iconName="Trash2">
                  Delete
                </Button>
              </div>
            )}
        </div>

        {/* --- VISTA DE ESCRITORIO --- */}
        <div className="hidden lg:block overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase font-bold text-slate-500 border-b border-slate-200">
              <tr>
                <th className="px-6 py-3 w-12">Select</th>
                <th className="px-6 py-3">Time / ID</th>
                <th className="px-6 py-3">Direction</th>
                <th className="px-6 py-3 w-[40%]">Content</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3 text-right">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {messages?.map((msg) => {
                // DETECCIÓN INTELIGENTE
                // 1. ¿Es Template?
                const isTemplate = msg.body?.startsWith("[TEMPLATE]") || msg.meta?.whatsapp_template;
                // 2. ¿Es Entrante?
                const isInbound = msg.direction === 'in' || msg.direction === 'inbound';
                
                return (
                  <tr key={msg.id} className="hover:bg-slate-50/80 transition-colors group">
                    
                    {/* Checkbox */}
                    <td className="px-6 py-4">
                      <Checkbox
                        checked={selectedMessages.includes(msg.id)}
                        onChange={(e) => handleSelectMessage(msg.id, e.target.checked)}
                      />
                    </td>

                    {/* Fecha e ID */}
                    <td className="px-6 py-4">
                      <div className="font-medium text-slate-700">{formatTimestamp(msg.created_at || msg.timestamp)}</div>
                      <div className="text-[10px] text-slate-400 font-mono mt-0.5 group-hover:text-indigo-500 transition-colors">
                        {msg.id.slice(0, 8)}...
                      </div>
                    </td>

                    {/* Dirección */}
                    <td className="px-6 py-4">
                       <div className={`flex items-center gap-2 font-medium ${isInbound ? 'text-indigo-700' : 'text-slate-600'}`}>
                          <div className={`p-1.5 rounded-md ${isInbound ? 'bg-indigo-50' : 'bg-slate-100'}`}>
                            <Icon name={isInbound ? "ArrowDownLeft" : "ArrowUpRight"} size={16} />
                          </div>
                          <div className="flex flex-col">
                             <span className="text-xs font-bold">{isInbound ? "Inbound" : "Outbound"}</span>
                             <span className="text-[10px] text-slate-400 font-normal">
                               {isInbound ? msg.contactName || "User" : "System/Agent"}
                             </span>
                          </div>
                       </div>
                    </td>

                    {/* Contenido (LA JOYA DE LA CORONA) */}
                    <td className="px-6 py-4">
                      {isTemplate ? (
                        <div className="flex items-start gap-3 p-2 rounded-lg bg-slate-50 border border-slate-100">
                          <div className="bg-purple-100 p-1.5 rounded text-purple-600 mt-0.5">
                             <Icon name="LayoutTemplate" size={14} />
                          </div>
                          <div>
                            <span className="text-[10px] font-bold text-purple-700 bg-purple-50 px-1.5 py-0.5 rounded border border-purple-100 uppercase tracking-wide">
                              Template
                            </span>
                            <p className="text-slate-800 font-medium mt-1 text-sm">
                              {/* Intentamos mostrar el nombre limpio del template */}
                              {msg.meta?.whatsapp_template?.name || msg.body.replace("[TEMPLATE] ", "")}
                            </p>
                            {/* Si tenemos variables guardadas, las mostramos (Opcional) */}
                            {msg.meta?.whatsapp_template?.variables && (
                               <p className="text-xs text-slate-400 mt-0.5 italic">
                                 Vars: {JSON.stringify(msg.meta.whatsapp_template.variables)}
                               </p>
                            )}
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-start gap-2">
                           <Icon name={isInbound ? "MessageCircle" : "MessageSquare"} size={16} className="text-slate-300 mt-1 shrink-0" />
                           <p className="text-slate-600 text-sm leading-relaxed line-clamp-2">
                             {msg.body}
                           </p>
                        </div>
                      )}
                    </td>

                    {/* Status Badge */}
                    <td className="px-6 py-4">
                      <MessageStatusBadge status={msg.status} direction={msg.direction} />
                    </td>

                    {/* Actions */}
                    <td className="px-6 py-4 text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedMessage(msg)}
                        iconName="Code"
                        className="text-slate-400 hover:text-indigo-600 hover:bg-indigo-50"
                        title="View JSON Payload"
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* --- VISTA MÓVIL (Adaptada también) --- */}
        <div className="lg:hidden divide-y divide-slate-100">
          {messages?.map((msg) => {
             const isTemplate = msg.body?.startsWith("[TEMPLATE]") || msg.meta?.whatsapp_template;
             const isInbound = msg.direction === 'in' || msg.direction === 'inbound';
             
             return (
              <div key={msg.id} className="p-4 space-y-3 bg-white">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3 flex-1">
                    <Checkbox
                      checked={selectedMessages.includes(msg.id)}
                      onChange={(e) => handleSelectMessage(msg.id, e.target.checked)}
                    />
                    <div className="flex-1 min-w-0">
                      {/* Cabecera Móvil */}
                      <div className="flex items-center gap-2 mb-1">
                         <span className={`text-xs font-bold px-1.5 py-0.5 rounded ${isInbound ? 'bg-indigo-50 text-indigo-700' : 'bg-slate-100 text-slate-600'}`}>
                           {isInbound ? "IN" : "OUT"}
                         </span>
                         <span className="text-xs text-slate-400">
                           {formatTimestamp(msg.created_at || msg.timestamp)}
                         </span>
                      </div>
                      
                      {/* Contenido Móvil */}
                      {isTemplate ? (
                         <div className="text-sm font-medium text-purple-700 flex items-center gap-1.5 mt-1">
                            <Icon name="LayoutTemplate" size={12} />
                            {msg.meta?.whatsapp_template?.name || "Template Message"}
                         </div>
                      ) : (
                         <p className="text-sm text-slate-700 mt-1 line-clamp-2">{msg.body}</p>
                      )}
                    </div>
                  </div>
                  
                  <Button variant="ghost" size="sm" onClick={() => setSelectedMessage(msg)} iconName="Eye" />
                </div>
                
                <div className="flex items-center justify-between pl-8">
                  <MessageStatusBadge status={msg.status} direction={msg.direction} />
                </div>
              </div>
            );
          })}
        </div>

        {/* Empty State */}
        {messages?.length === 0 && (
          <div className="text-center py-16">
            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
               <Icon name="MessageSquareOff" size={24} className="text-slate-300" />
            </div>
            <h3 className="text-slate-900 font-medium">No messages yet</h3>
            <p className="text-slate-500 text-sm mt-1">Send a template to start the history log.</p>
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