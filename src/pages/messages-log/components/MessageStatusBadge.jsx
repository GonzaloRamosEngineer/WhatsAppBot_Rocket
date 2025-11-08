import React from 'react';
import Icon from '../../../components/AppIcon';

const MessageStatusBadge = ({ status }) => {
  const statusConfig = {
    sent: {
      label: 'Sent',
      icon: 'Send',
      className: 'bg-blue-100 text-blue-800 border-blue-200'
    },
    delivered: {
      label: 'Delivered',
      icon: 'Check',
      className: 'bg-green-100 text-green-800 border-green-200'
    },
    read: {
      label: 'Read',
      icon: 'CheckCheck',
      className: 'bg-emerald-100 text-emerald-800 border-emerald-200'
    },
    failed: {
      label: 'Failed',
      icon: 'AlertCircle',
      className: 'bg-red-100 text-red-800 border-red-200'
    },
    pending: {
      label: 'Pending',
      icon: 'Clock',
      className: 'bg-yellow-100 text-yellow-800 border-yellow-200'
    }
  };

  const config = statusConfig?.[status] || statusConfig?.pending;

  return (
    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${config?.className}`}>
      <Icon name={config?.icon} size={12} className="mr-1" />
      {config?.label}
    </span>
  );
};

export default MessageStatusBadge;