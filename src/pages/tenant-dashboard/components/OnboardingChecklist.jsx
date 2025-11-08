import React, { useState } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';

const OnboardingChecklist = ({ onComplete }) => {
  const [completedSteps, setCompletedSteps] = useState([]);

  const steps = [
    {
      id: 'profile',
      title: 'Complete Profile Setup',
      description: 'Add your business information and contact details',
      icon: 'User',
      completed: true
    },
    {
      id: 'channel',
      title: 'Connect WhatsApp Channel',
      description: 'Link your WhatsApp Business number to start messaging',
      icon: 'MessageSquare',
      completed: false,
      action: 'Setup Now'
    },
    {
      id: 'flow',
      title: 'Create First Chatbot Flow',
      description: 'Build an automated welcome message for new customers',
      icon: 'GitBranch',
      completed: false,
      action: 'Create Flow'
    },
    {
      id: 'test',
      title: 'Send Test Message',
      description: 'Verify your setup by sending a test WhatsApp message',
      icon: 'Send',
      completed: false,
      action: 'Test Now'
    }
  ];

  const completedCount = steps?.filter(step => step?.completed)?.length;
  const progressPercentage = (completedCount / steps?.length) * 100;

  const handleStepAction = (stepId) => {
    // Handle step-specific actions
    switch (stepId) {
      case 'channel':
        // Navigate to channel setup
        break;
      case 'flow':
        // Navigate to flow builder
        break;
      case 'test':
        // Open test message dialog
        break;
      default:
        break;
    }
  };

  if (completedCount === steps?.length) {
    return null; // Hide checklist when all steps are completed
  }

  return (
    <div className="bg-card border border-border rounded-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-foreground">Getting Started</h3>
        <span className="text-sm text-muted-foreground">{completedCount}/{steps?.length} completed</span>
      </div>
      {/* Progress Bar */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-foreground">Setup Progress</span>
          <span className="text-sm text-muted-foreground">{Math.round(progressPercentage)}%</span>
        </div>
        <div className="w-full bg-muted rounded-full h-2">
          <div 
            className="bg-primary h-2 rounded-full transition-all duration-300"
            style={{ width: `${progressPercentage}%` }}
          ></div>
        </div>
      </div>
      {/* Steps List */}
      <div className="space-y-4">
        {steps?.map((step) => (
          <div key={step?.id} className={`flex items-start space-x-3 p-3 rounded-md ${
            step?.completed ? 'bg-success/5 border border-success/20' : 'bg-muted/30'
          }`}>
            <div className={`p-2 rounded-full ${
              step?.completed 
                ? 'bg-success text-success-foreground' 
                : 'bg-muted text-muted-foreground'
            }`}>
              <Icon 
                name={step?.completed ? 'Check' : step?.icon} 
                size={16} 
              />
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <h4 className={`text-sm font-medium ${
                  step?.completed ? 'text-success' : 'text-foreground'
                }`}>
                  {step?.title}
                </h4>
                {step?.completed && (
                  <Icon name="CheckCircle" size={16} className="text-success" />
                )}
              </div>
              
              <p className="text-sm text-muted-foreground mt-1">{step?.description}</p>
              
              {!step?.completed && step?.action && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleStepAction(step?.id)}
                  className="mt-2"
                >
                  {step?.action}
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>
      {completedCount > 0 && completedCount < steps?.length && (
        <div className="mt-6 pt-4 border-t border-border">
          <p className="text-sm text-muted-foreground text-center">
            Great progress! Complete the remaining steps to unlock all features.
          </p>
        </div>
      )}
    </div>
  );
};

export default OnboardingChecklist;