import React from 'react';
import Icon from '../../../components/AppIcon';

const MetricsCard = ({ 
  title, 
  value, 
  change, 
  changeType, 
  icon, 
  color = 'primary',
  isLoading = false 
}) => {
  const colorClasses = {
    primary: 'bg-primary/10 text-primary border-primary/20',
    success: 'bg-success/10 text-success border-success/20',
    warning: 'bg-warning/10 text-warning border-warning/20',
    secondary: 'bg-secondary/10 text-secondary border-secondary/20'
  };

  const changeColorClasses = {
    positive: 'text-success',
    negative: 'text-destructive',
    neutral: 'text-muted-foreground'
  };

  if (isLoading) {
    return (
      <div className="bg-card border border-border rounded-lg p-6 animate-pulse">
        <div className="flex items-center justify-between mb-4">
          <div className="h-4 bg-muted rounded w-24"></div>
          <div className="h-8 w-8 bg-muted rounded"></div>
        </div>
        <div className="h-8 bg-muted rounded w-16 mb-2"></div>
        <div className="h-3 bg-muted rounded w-20"></div>
      </div>
    );
  }

  return (
    <div className="bg-card border border-border rounded-lg p-6 hover:shadow-md micro-animation">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-muted-foreground">{title}</h3>
        <div className={`p-2 rounded-lg ${colorClasses?.[color]}`}>
          <Icon name={icon} size={20} />
        </div>
      </div>
      <div className="space-y-2">
        <p className="text-2xl font-bold text-foreground">{value}</p>
        {change && (
          <div className="flex items-center space-x-1">
            <Icon 
              name={changeType === 'positive' ? 'TrendingUp' : changeType === 'negative' ? 'TrendingDown' : 'Minus'} 
              size={14} 
              className={changeColorClasses?.[changeType]}
            />
            <span className={`text-sm font-medium ${changeColorClasses?.[changeType]}`}>
              {change}
            </span>
            <span className="text-sm text-muted-foreground">vs last month</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default MetricsCard;