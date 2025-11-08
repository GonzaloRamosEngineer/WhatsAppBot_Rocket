import React from 'react';
import Icon from '../../../components/AppIcon';

const MessageStats = ({ stats }) => {
  const statItems = [
    {
      label: 'Total Messages',
      value: stats?.totalMessages,
      icon: 'MessageSquare',
      color: 'text-blue-600',
      bgColor: 'bg-blue-100'
    },
    {
      label: 'Sent Today',
      value: stats?.sentToday,
      icon: 'Send',
      color: 'text-green-600',
      bgColor: 'bg-green-100'
    },
    {
      label: 'Received Today',
      value: stats?.receivedToday,
      icon: 'MessageCircle',
      color: 'text-purple-600',
      bgColor: 'bg-purple-100'
    },
    {
      label: 'Failed Messages',
      value: stats?.failedMessages,
      icon: 'AlertCircle',
      color: 'text-red-600',
      bgColor: 'bg-red-100'
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {statItems?.map((item, index) => (
        <div key={index} className="bg-card border border-border rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">{item?.label}</p>
              <p className="text-2xl font-bold text-foreground mt-1">
                {item?.value?.toLocaleString()}
              </p>
            </div>
            <div className={`w-12 h-12 ${item?.bgColor} rounded-lg flex items-center justify-center`}>
              <Icon name={item?.icon} size={24} className={item?.color} />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default MessageStats;