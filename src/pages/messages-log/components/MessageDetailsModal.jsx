// C:\Projects\WhatsAppBot_Rocket\src\pages\messages-log\components\MessageDetailsModal.jsx
import React, { useState } from 'react';
import Button from '../../../components/ui/Button';
import Icon from '../../../components/AppIcon';
import MessageStatusBadge from './MessageStatusBadge';

const MessageDetailsModal = ({ message, onClose }) => {
  const [activeTab, setActiveTab] = useState('general'); // 'general' | 'json'

  if (!message) return null;

  const formatFullDate = (timestamp) => {
    return new Date(timestamp).toLocaleString('en-US', {
      weekday: 'short', year: 'numeric', month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit', second: '2-digit'
    });
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    // Podrías agregar un toast notification aquí
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 transition-opacity animate-in fade-in duration-200">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden border border-slate-200">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${message.direction === 'inbound' ? 'bg-indigo-100 text-indigo-600' : 'bg-emerald-100 text-emerald-600'}`}>
               <Icon name={message.direction === 'inbound' ? 'ArrowDownLeft' : 'ArrowUpRight'} size={20} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-800">Message Details</h2>
              <p className="text-xs text-slate-500 font-mono">{message.messageId}</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 p-2 rounded-full transition-all"
          >
            <Icon name="X" size={20} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-100 px-6">
          <button 
            onClick={() => setActiveTab('general')}
            className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'general' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
          >
            General Info
          </button>
          <button 
            onClick={() => setActiveTab('json')}
            className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'json' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
          >
            <Icon name="Code" size={14} /> Raw Payload
          </button>
        </div>

        {/* Content Scrollable */}
        <div className="flex-1 overflow-y-auto p-6 bg-white">
          
          {activeTab === 'general' ? (
            <div className="space-y-6">
              {/* Status Section */}
              <div className="flex items-center justify-between bg-slate-50 p-4 rounded-lg border border-slate-100">
                 <div>
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Current Status</span>
                    <div className="mt-1">
                      <MessageStatusBadge status={message.status} direction={message.direction} />
                    </div>
                 </div>
                 <div className="text-right">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Timestamp</span>
                    <p className="text-sm font-medium text-slate-700 mt-1">{formatFullDate(message.timestamp)}</p>
                 </div>
              </div>

              {/* Contact Info */}
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase">Contact Name</label>
                  <div className="flex items-center gap-2 text-slate-800 font-medium p-2 border border-slate-200 rounded-md">
                    <Icon name="User" size={16} className="text-slate-400" />
                    {message.contactName}
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase">Phone Number</label>
                  <div className="flex items-center gap-2 text-slate-800 font-medium p-2 border border-slate-200 rounded-md">
                    <Icon name="Phone" size={16} className="text-slate-400" />
                    {message.contact}
                  </div>
                </div>
              </div>

              {/* Message Body */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase">Message Content</label>
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 text-sm text-slate-700 leading-relaxed whitespace-pre-wrap font-sans">
                  {message.body}
                </div>
              </div>

              {/* Context / Metadata */}
              {(message.metadata?.whatsapp_template || message.metadata?.context) && (
                 <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase">Context & Variables</label>
                    <div className="bg-yellow-50 border border-yellow-100 rounded-lg p-3 text-xs text-yellow-800">
                        {message.metadata?.whatsapp_template && (
                           <div className="mb-2">
                              <strong>Template Used:</strong> {message.metadata.whatsapp_template.name} ({message.metadata.whatsapp_template.language})
                           </div>
                        )}
                        {message.metadata?.context && (
                           <div>
                              <strong>Reply To Message ID:</strong> {message.metadata.context.id}
                           </div>
                        )}
                    </div>
                 </div>
              )}
            </div>
          ) : (
            // JSON TAB
            <div className="h-full">
               <div className="flex justify-between items-center mb-2">
                  <span className="text-xs font-bold text-slate-500 uppercase">Full JSON Object</span>
                  <button onClick={() => copyToClipboard(JSON.stringify(message, null, 2))} className="text-xs text-indigo-600 hover:text-indigo-800 font-medium flex items-center gap-1">
                     <Icon name="Copy" size={12} /> Copy JSON
                  </button>
               </div>
               <pre className="bg-slate-900 text-emerald-400 p-4 rounded-lg text-xs font-mono overflow-auto max-h-[400px] border border-slate-800 shadow-inner">
                  {JSON.stringify(message, null, 2)}
               </pre>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
          <Button variant="outline" onClick={onClose}>Close</Button>
          <Button variant="default" iconName="Download" iconPosition="left">Export Log</Button>
        </div>
      </div>
    </div>
  );
};

export default MessageDetailsModal;