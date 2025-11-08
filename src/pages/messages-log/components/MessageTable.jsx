import React, { useState } from 'react';
import { Checkbox } from '../../../components/ui/Checkbox';
import Button from '../../../components/ui/Button';
import Icon from '../../../components/AppIcon';
import MessageStatusBadge from './MessageStatusBadge';
import MessageDetailsModal from './MessageDetailsModal';

const MessageTable = ({ messages, onBulkAction }) => {
  const [selectedMessages, setSelectedMessages] = useState([]);
  const [expandedRows, setExpandedRows] = useState([]);
  const [selectedMessage, setSelectedMessage] = useState(null);

  const handleSelectAll = (checked) => {
    if (checked) {
      setSelectedMessages(messages?.map(msg => msg?.id));
    } else {
      setSelectedMessages([]);
    }
  };

  const handleSelectMessage = (messageId, checked) => {
    if (checked) {
      setSelectedMessages([...selectedMessages, messageId]);
    } else {
      setSelectedMessages(selectedMessages?.filter(id => id !== messageId));
    }
  };

  const toggleRowExpansion = (messageId) => {
    if (expandedRows?.includes(messageId)) {
      setExpandedRows(expandedRows?.filter(id => id !== messageId));
    } else {
      setExpandedRows([...expandedRows, messageId]);
    }
  };

  const formatTimestamp = (timestamp) => {
    return new Date(timestamp)?.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const truncateMessage = (message, maxLength = 50) => {
    return message?.length > maxLength ? `${message?.substring(0, maxLength)}...` : message;
  };

  return (
    <>
      <div className="bg-card border border-border rounded-lg overflow-hidden">
        {/* Table Header */}
        <div className="px-6 py-4 border-b border-border bg-muted/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Checkbox
                checked={selectedMessages?.length === messages?.length && messages?.length > 0}
                indeterminate={selectedMessages?.length > 0 && selectedMessages?.length < messages?.length}
                onChange={(e) => handleSelectAll(e?.target?.checked)}
              />
              <span className="text-sm font-medium text-foreground">
                {selectedMessages?.length > 0 ? `${selectedMessages?.length} selected` : 'Select all'}
              </span>
            </div>
            
            {selectedMessages?.length > 0 && (
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onBulkAction('export', selectedMessages)}
                  iconName="Download"
                  iconPosition="left"
                >
                  Export Selected
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onBulkAction('delete', selectedMessages)}
                  iconName="Trash2"
                  iconPosition="left"
                >
                  Delete Selected
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Desktop Table View */}
        <div className="hidden lg:block overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted/30">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Message
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Contact
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Direction
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Timestamp
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-card divide-y divide-border">
              {messages?.map((message) => (
                <React.Fragment key={message?.id}>
                  <tr className="hover:bg-muted/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-3">
                        <Checkbox
                          checked={selectedMessages?.includes(message?.id)}
                          onChange={(e) => handleSelectMessage(message?.id, e?.target?.checked)}
                        />
                        <div className="flex-1">
                          <p className="text-sm text-foreground font-medium">
                            {truncateMessage(message?.body)}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            ID: {message?.messageId}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-foreground">{message?.contact}</div>
                      <div className="text-xs text-muted-foreground">{message?.contactName}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2">
                        <Icon 
                          name={message?.direction === 'inbound' ? 'ArrowDownLeft' : 'ArrowUpRight'} 
                          size={16}
                          className={message?.direction === 'inbound' ? 'text-blue-600' : 'text-green-600'}
                        />
                        <span className="text-sm text-foreground capitalize">{message?.direction}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <MessageStatusBadge status={message?.status} />
                    </td>
                    <td className="px-6 py-4 text-sm text-muted-foreground">
                      {formatTimestamp(message?.timestamp)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleRowExpansion(message?.id)}
                          iconName={expandedRows?.includes(message?.id) ? 'ChevronUp' : 'ChevronDown'}
                        />
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedMessage(message)}
                          iconName="Eye"
                        />
                      </div>
                    </td>
                  </tr>
                  
                  {expandedRows?.includes(message?.id) && (
                    <tr>
                      <td colSpan="6" className="px-6 py-4 bg-muted/20">
                        <div className="space-y-3">
                          <div>
                            <h4 className="text-sm font-medium text-foreground mb-2">Full Message Content</h4>
                            <p className="text-sm text-muted-foreground bg-background p-3 rounded border">
                              {message?.body}
                            </p>
                          </div>
                          {message?.metadata && (
                            <div>
                              <h4 className="text-sm font-medium text-foreground mb-2">Metadata</h4>
                              <div className="grid grid-cols-2 gap-4 text-xs">
                                <div>
                                  <span className="font-medium">Thread ID:</span> {message?.metadata?.threadId}
                                </div>
                                <div>
                                  <span className="font-medium">API Response:</span> {message?.metadata?.apiResponse}
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile Card View */}
        <div className="lg:hidden divide-y divide-border">
          {messages?.map((message) => (
            <div key={message?.id} className="p-4 space-y-3">
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-3 flex-1">
                  <Checkbox
                    checked={selectedMessages?.includes(message?.id)}
                    onChange={(e) => handleSelectMessage(message?.id, e?.target?.checked)}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-1">
                      <Icon 
                        name={message?.direction === 'inbound' ? 'ArrowDownLeft' : 'ArrowUpRight'} 
                        size={14}
                        className={message?.direction === 'inbound' ? 'text-blue-600' : 'text-green-600'}
                      />
                      <span className="text-sm font-medium text-foreground">{message?.contactName}</span>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">{message?.contact}</p>
                    <p className="text-sm text-foreground">{truncateMessage(message?.body, 80)}</p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedMessage(message)}
                  iconName="Eye"
                />
              </div>
              
              <div className="flex items-center justify-between">
                <MessageStatusBadge status={message?.status} />
                <span className="text-xs text-muted-foreground">
                  {formatTimestamp(message?.timestamp)}
                </span>
              </div>
            </div>
          ))}
        </div>

        {messages?.length === 0 && (
          <div className="text-center py-12">
            <Icon name="MessageSquare" size={48} className="mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">No messages found</h3>
            <p className="text-muted-foreground">Try adjusting your filters or check back later for new messages.</p>
          </div>
        )}
      </div>
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