// C:\Projects\WhatsAppBot_Rocket\src\pages\messages-log\components\MessageStats.jsx
import React from 'react';
import Icon from '../../../components/AppIcon';

const MessageStats = ({ stats }) => {
  const statItems = [
    {
      label: 'Total Messages',
      value: stats?.totalMessages || 0,
      icon: 'MessageSquare',
      color: 'text-indigo-600',
      bg: 'bg-indigo-50',
      border: 'border-l-indigo-500'
    },
    {
      label: 'Sent Today',
      value: stats?.sentToday || 0,
      icon: 'Send',
      color: 'text-blue-600',
      bg: 'bg-blue-50',
      border: 'border-l-blue-500'
    },
    {
      label: 'Received Today',
      value: stats?.receivedToday || 0,
      icon: 'ArrowDownLeft',
      color: 'text-emerald-600',
      bg: 'bg-emerald-50',
      border: 'border-l-emerald-500'
    },
    {
      label: 'Failed Delivery',
      value: stats?.failedMessages || 0,
      icon: 'AlertTriangle',
      color: 'text-red-600',
      bg: 'bg-red-50',
      border: 'border-l-red-500'
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {statItems.map((item, index) => (
        <div key={index} className={`bg-white border border-slate-200 rounded-lg p-4 shadow-sm border-l-4 ${item.border} hover:shadow-md transition-shadow`}>
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{item.label}</p>
              <h4 className="text-2xl font-bold text-slate-800 mt-1">{item.value.toLocaleString()}</h4>
            </div>
            <div className={`p-2 rounded-lg ${item.bg}`}>
              <Icon name={item.icon} size={20} className={item.color} />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default MessageStats;