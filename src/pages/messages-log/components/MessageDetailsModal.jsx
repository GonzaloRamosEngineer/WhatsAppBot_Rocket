import React from 'react';
import Button from '../../../components/ui/Button';
import Icon from '../../../components/AppIcon';
import MessageStatusBadge from './MessageStatusBadge';

const MessageDetailsModal = ({ message, onClose }) => {
  if (!message) return null;

  const formatTimestamp = (timestamp) => {
    return new Date(timestamp)?.toLocaleString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-300 p-4">
      <div className="bg-card border border-border rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <h2 className="text-xl font-semibold text-foreground">Message Details</h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            iconName="X"
          />
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Message Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground">Message ID</label>
              <p className="text-sm text-foreground font-mono bg-muted p-2 rounded mt-1">
                {message?.messageId}
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Status</label>
              <div className="mt-1">
                <MessageStatusBadge status={message?.status} />
              </div>
            </div>
          </div>

          {/* Contact Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground">Contact Name</label>
              <p className="text-sm text-foreground mt-1">{message?.contactName}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Phone Number</label>
              <p className="text-sm text-foreground mt-1">{message?.contact}</p>
            </div>
          </div>

          {/* Direction & Timestamp */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground">Direction</label>
              <div className="flex items-center space-x-2 mt-1">
                <Icon 
                  name={message?.direction === 'inbound' ? 'ArrowDownLeft' : 'ArrowUpRight'} 
                  size={16}
                  className={message?.direction === 'inbound' ? 'text-blue-600' : 'text-green-600'}
                />
                <span className="text-sm text-foreground capitalize">{message?.direction}</span>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Timestamp</label>
              <p className="text-sm text-foreground mt-1">{formatTimestamp(message?.timestamp)}</p>
            </div>
          </div>

          {/* Message Content */}
          <div>
            <label className="text-sm font-medium text-muted-foreground">Message Content</label>
            <div className="mt-1 bg-background border border-border rounded-lg p-4">
              <p className="text-sm text-foreground whitespace-pre-wrap">{message?.body}</p>
            </div>
          </div>

          {/* Metadata */}
          {message?.metadata && (
            <div>
              <label className="text-sm font-medium text-muted-foreground">Technical Details</label>
              <div className="mt-1 bg-muted rounded-lg p-4 space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <span className="text-xs font-medium text-muted-foreground">Thread ID</span>
                    <p className="text-xs text-foreground font-mono">{message?.metadata?.threadId}</p>
                  </div>
                  <div>
                    <span className="text-xs font-medium text-muted-foreground">API Response</span>
                    <p className="text-xs text-foreground">{message?.metadata?.apiResponse}</p>
                  </div>
                </div>
                
                {message?.metadata?.webhookData && (
                  <div>
                    <span className="text-xs font-medium text-muted-foreground">Webhook Data</span>
                    <pre className="text-xs text-foreground bg-background p-2 rounded border mt-1 overflow-x-auto">
                      {JSON.stringify(message?.metadata?.webhookData, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Conversation Context */}
          {message?.conversationContext && message?.conversationContext?.length > 0 && (
            <div>
              <label className="text-sm font-medium text-muted-foreground">Recent Conversation</label>
              <div className="mt-1 space-y-2 max-h-40 overflow-y-auto">
                {message?.conversationContext?.map((msg, index) => (
                  <div key={index} className="flex items-start space-x-3 p-3 bg-muted rounded">
                    <Icon 
                      name={msg?.direction === 'inbound' ? 'ArrowDownLeft' : 'ArrowUpRight'} 
                      size={14}
                      className={msg?.direction === 'inbound' ? 'text-blue-600' : 'text-green-600'}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-foreground">{msg?.body}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(msg.timestamp)?.toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end space-x-3 p-6 border-t border-border">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
          <Button 
            variant="default"
            iconName="Download"
            iconPosition="left"
          >
            Export Message
          </Button>
        </div>
      </div>
    </div>
  );
};

export default MessageDetailsModal;