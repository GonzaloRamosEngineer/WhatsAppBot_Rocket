import React from 'react';

const NotificationIndicator = ({ 
  count = 0, 
  type = 'default',
  showPulse = false,
  size = 'default',
  className = '' 
}) => {
  if (count === 0 && !showPulse) return null;

  const sizeClasses = {
    sm: 'w-2 h-2 text-xs',
    default: 'w-5 h-5 text-xs',
    lg: 'w-6 h-6 text-sm'
  };

  const typeClasses = {
    default: 'bg-primary text-primary-foreground',
    success: 'bg-success text-success-foreground',
    warning: 'bg-warning text-warning-foreground',
    error: 'bg-error text-error-foreground',
    info: 'bg-secondary text-secondary-foreground'
  };

  const displayCount = count > 99 ? '99+' : count?.toString();
  const shouldShowCount = count > 0 && size !== 'sm';

  return (
    <span 
      className={`
        inline-flex items-center justify-center rounded-full font-medium
        ${sizeClasses?.[size]}
        ${typeClasses?.[type]}
        ${showPulse ? 'notification-pulse' : ''}
        ${className}
      `}
    >
      {shouldShowCount ? displayCount : ''}
    </span>
  );
};

export default NotificationIndicator;