import React from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';

const ConversationSummary = ({ conversations, onSelectConversation }) => {
  const formatLastMessage = (timestamp) => {
    const now = new Date();
    const messageTime = new Date(timestamp);
    const diffInHours = (now - messageTime) / (1000 * 60 * 60);
    
    if (diffInHours < 1) {
      return 'Just now';
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}h ago`;
    } else {
      return messageTime?.toLocaleDateString();
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'text-green-600';
      case 'pending': return 'text-yellow-600';
      case 'resolved': return 'text-gray-600';
      default: return 'text-gray-600';
    }
  };

  return (
    <div className="bg-card border border-border rounded-lg">
      <div className="p-4 border-b border-border">
        <h3 className="text-lg font-semibold text-foreground">Active Conversations</h3>
        <p className="text-sm text-muted-foreground">Recent customer interactions</p>
      </div>
      <div className="divide-y divide-border max-h-96 overflow-y-auto">
        {conversations?.map((conversation) => (
          <div
            key={conversation?.id}
            className="p-4 hover:bg-muted/50 transition-colors cursor-pointer"
            onClick={() => onSelectConversation(conversation)}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2 mb-1">
                  <h4 className="text-sm font-medium text-foreground truncate">
                    {conversation?.contactName}
                  </h4>
                  <div className={`w-2 h-2 rounded-full ${getStatusColor(conversation?.status)}`} />
                </div>
                
                <p className="text-xs text-muted-foreground mb-1">
                  {conversation?.contact}
                </p>
                
                <p className="text-sm text-muted-foreground truncate">
                  {conversation?.lastMessage}
                </p>
                
                <div className="flex items-center justify-between mt-2">
                  <span className="text-xs text-muted-foreground">
                    {conversation?.messageCount} messages
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {formatLastMessage(conversation?.lastMessageTime)}
                  </span>
                </div>
              </div>
              
              <div className="flex flex-col items-end space-y-1 ml-3">
                {conversation?.unreadCount > 0 && (
                  <span className="bg-primary text-primary-foreground text-xs px-2 py-1 rounded-full">
                    {conversation?.unreadCount}
                  </span>
                )}
                <Icon name="ChevronRight" size={16} className="text-muted-foreground" />
              </div>
            </div>
          </div>
        ))}
      </div>
      {conversations?.length === 0 && (
        <div className="text-center py-8">
          <Icon name="MessageCircle" size={32} className="mx-auto text-muted-foreground mb-3" />
          <p className="text-sm text-muted-foreground">No active conversations</p>
        </div>
      )}
      <div className="p-4 border-t border-border">
        <Button
          variant="outline"
          size="sm"
          fullWidth
          iconName="Plus"
          iconPosition="left"
        >
          Start New Conversation
        </Button>
      </div>
    </div>
  );
};

export default ConversationSummary;