import React from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';

const FlowCard = ({ 
  flow, 
  onEdit, 
  onToggle, 
  onDelete, 
  onPreview 
}) => {
  const getStatusColor = (isActive) => {
    return isActive ? 'text-success' : 'text-muted-foreground';
  };

  const getTriggerTypeIcon = (type) => {
    switch (type) {
      case 'keyword':
        return 'MessageSquare';
      case 'welcome':
        return 'Hand';
      case 'fallback':
        return 'HelpCircle';
      default:
        return 'MessageCircle';
    }
  };

  return (
    <div className="bg-card border border-border rounded-lg p-6 hover:shadow-md micro-animation">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-start space-x-3">
          <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
            <Icon 
              name={getTriggerTypeIcon(flow?.triggerType)} 
              size={20} 
              className="text-primary"
            />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-foreground">{flow?.name}</h3>
            <p className="text-sm text-muted-foreground">{flow?.description}</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <span className={`text-sm font-medium ${getStatusColor(flow?.isActive)}`}>
            {flow?.isActive ? 'Active' : 'Inactive'}
          </span>
          <button
            onClick={() => onToggle(flow?.id)}
            className={`
              w-12 h-6 rounded-full relative micro-animation
              ${flow?.isActive ? 'bg-success' : 'bg-muted'}
            `}
          >
            <div className={`
              w-5 h-5 bg-white rounded-full absolute top-0.5 micro-animation
              ${flow?.isActive ? 'left-6' : 'left-0.5'}
            `} />
          </button>
        </div>
      </div>
      {/* Trigger Information */}
      <div className="mb-4">
        <div className="flex items-center space-x-2 mb-2">
          <Icon name="Zap" size={16} className="text-warning" />
          <span className="text-sm font-medium text-foreground">Trigger</span>
        </div>
        <div className="bg-muted rounded-md p-3">
          {flow?.triggerType === 'keyword' && (
            <div>
              <span className="text-sm text-muted-foreground">Keywords: </span>
              <div className="flex flex-wrap gap-1 mt-1">
                {flow?.keywords?.map((keyword, index) => (
                  <span 
                    key={index}
                    className="px-2 py-1 bg-primary/10 text-primary text-xs rounded-md"
                  >
                    {keyword}
                  </span>
                ))}
              </div>
            </div>
          )}
          {flow?.triggerType === 'welcome' && (
            <span className="text-sm text-foreground">Triggered when user starts conversation</span>
          )}
          {flow?.triggerType === 'fallback' && (
            <span className="text-sm text-foreground">Triggered when no other flow matches</span>
          )}
        </div>
      </div>
      {/* Response Preview */}
      <div className="mb-4">
        <div className="flex items-center space-x-2 mb-2">
          <Icon name="MessageCircle" size={16} className="text-secondary" />
          <span className="text-sm font-medium text-foreground">Response</span>
        </div>
        <div className="bg-muted rounded-md p-3">
          <p className="text-sm text-foreground line-clamp-2">
            {flow?.responses?.[0]?.message || 'No response configured'}
          </p>
          {flow?.responses?.length > 1 && (
            <span className="text-xs text-muted-foreground mt-1 block">
              +{flow?.responses?.length - 1} more responses
            </span>
          )}
        </div>
      </div>
      {/* Statistics */}
      <div className="flex items-center justify-between mb-4 text-sm text-muted-foreground">
        <span>Triggered: {flow?.triggerCount} times</span>
        <span>Last updated: {flow?.lastUpdated}</span>
      </div>
      {/* Actions */}
      <div className="flex items-center space-x-2">
        <Button
          variant="outline"
          size="sm"
          iconName="Eye"
          iconPosition="left"
          onClick={() => onPreview(flow)}
        >
          Preview
        </Button>
        <Button
          variant="outline"
          size="sm"
          iconName="Edit"
          iconPosition="left"
          onClick={() => onEdit(flow)}
        >
          Edit
        </Button>
        <Button
          variant="outline"
          size="sm"
          iconName="Trash2"
          iconPosition="left"
          onClick={() => onDelete(flow?.id)}
        >
          Delete
        </Button>
      </div>
    </div>
  );
};

export default FlowCard;