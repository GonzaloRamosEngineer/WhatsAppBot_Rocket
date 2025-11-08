import React, { useState } from 'react';
import Button from '../../../components/ui/Button';
import Icon from '../../../components/AppIcon';

const ChannelStatusCard = ({ isConnected, channelData, onToggleChannel }) => {
  const [isLoading, setIsLoading] = useState(false);

  const handleToggleChannel = async () => {
    setIsLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      if (onToggleChannel) {
        onToggleChannel(!channelData?.isActive);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = () => {
    if (!isConnected) return 'text-muted-foreground';
    return channelData?.isActive ? 'text-success' : 'text-warning';
  };

  const getStatusText = () => {
    if (!isConnected) return 'Not Connected';
    return channelData?.isActive ? 'Active' : 'Inactive';
  };

  const getStatusIcon = () => {
    if (!isConnected) return 'AlertCircle';
    return channelData?.isActive ? 'CheckCircle' : 'Clock';
  };

  return (
    <div className="bg-card border border-border rounded-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-accent/10 rounded-lg flex items-center justify-center">
            <Icon name="MessageSquare" size={20} className="text-accent" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-foreground">Channel Status</h3>
            <p className="text-sm text-muted-foreground">Manage your WhatsApp channel</p>
          </div>
        </div>
        
        <div className={`flex items-center space-x-2 ${getStatusColor()}`}>
          <Icon name={getStatusIcon()} size={20} />
          <span className="font-medium">{getStatusText()}</span>
        </div>
      </div>
      {isConnected && channelData ? (
        <div className="space-y-4">
          {/* Channel Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-muted rounded-md">
            <div>
              <label className="text-sm font-medium text-foreground">Business Name</label>
              <p className="text-sm text-muted-foreground">{channelData?.businessName}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-foreground">Phone Number</label>
              <p className="text-sm text-muted-foreground">{channelData?.phoneNumber}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-foreground">Verification Status</label>
              <div className="flex items-center space-x-2">
                <Icon name="CheckCircle" size={16} className="text-success" />
                <span className="text-sm text-success">Verified</span>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-foreground">Last Sync</label>
              <p className="text-sm text-muted-foreground">
                {new Date(channelData.lastSync)?.toLocaleString()}
              </p>
            </div>
          </div>

          {/* Channel Controls */}
          <div className="flex items-center justify-between p-4 border border-border rounded-md">
            <div>
              <h4 className="font-medium text-foreground">Message Processing</h4>
              <p className="text-sm text-muted-foreground">
                {channelData?.isActive 
                  ? 'Your channel is actively processing incoming messages' :'Message processing is currently disabled'
                }
              </p>
            </div>
            <Button
              onClick={handleToggleChannel}
              loading={isLoading}
              variant={channelData?.isActive ? 'destructive' : 'default'}
              iconName={channelData?.isActive ? 'Pause' : 'Play'}
              iconPosition="left"
            >
              {isLoading 
                ? (channelData?.isActive ? 'Deactivating...' : 'Activating...') 
                : (channelData?.isActive ? 'Deactivate Channel' : 'Activate Channel')
              }
            </Button>
          </div>

          {/* Usage Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-primary/5 border border-primary/20 rounded-md">
              <div className="flex items-center space-x-2 mb-2">
                <Icon name="MessageCircle" size={16} className="text-primary" />
                <span className="text-sm font-medium text-primary">Messages Today</span>
              </div>
              <p className="text-2xl font-bold text-foreground">{channelData?.stats?.messagesToday || 0}</p>
            </div>
            
            <div className="p-4 bg-secondary/5 border border-secondary/20 rounded-md">
              <div className="flex items-center space-x-2 mb-2">
                <Icon name="Calendar" size={16} className="text-secondary" />
                <span className="text-sm font-medium text-secondary">This Month</span>
              </div>
              <p className="text-2xl font-bold text-foreground">{channelData?.stats?.messagesThisMonth || 0}</p>
            </div>
            
            <div className="p-4 bg-accent/5 border border-accent/20 rounded-md">
              <div className="flex items-center space-x-2 mb-2">
                <Icon name="Users" size={16} className="text-accent" />
                <span className="text-sm font-medium text-accent">Active Chats</span>
              </div>
              <p className="text-2xl font-bold text-foreground">{channelData?.stats?.activeChats || 0}</p>
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center py-8">
          <Icon name="AlertCircle" size={48} className="text-muted-foreground mx-auto mb-4" />
          <h4 className="text-lg font-medium text-foreground mb-2">No Channel Connected</h4>
          <p className="text-muted-foreground mb-4">
            Connect your WhatsApp Business account to start managing your channel.
          </p>
          <p className="text-sm text-muted-foreground">
            Fill in your credentials above and test the connection to get started.
          </p>
        </div>
      )}
    </div>
  );
};

export default ChannelStatusCard;