import React from 'react';
import Icon from '../../../components/AppIcon';

const SecurityBadges = () => {
  const securityFeatures = [
    {
      icon: 'Shield',
      text: 'SSL Encrypted',
      description: 'Your data is protected with 256-bit SSL encryption'
    },
    {
      icon: 'Lock',
      text: 'Secure Authentication',
      description: 'Multi-layer security for WhatsApp API credentials'
    },
    {
      icon: 'CheckCircle',
      text: 'SOC 2 Compliant',
      description: 'Enterprise-grade security standards'
    }
  ];

  return (
    <div className="mt-8 pt-6 border-t border-border">
      <div className="text-center mb-4">
        <p className="text-xs text-muted-foreground font-medium">
          Trusted by 10,000+ businesses worldwide
        </p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {securityFeatures?.map((feature, index) => (
          <div 
            key={index}
            className="flex flex-col items-center text-center p-3 rounded-lg bg-muted/30 hover:bg-muted/50 micro-animation"
            title={feature?.description}
          >
            <div className="w-8 h-8 bg-success/10 rounded-full flex items-center justify-center mb-2">
              <Icon 
                name={feature?.icon} 
                size={16} 
                className="text-success"
              />
            </div>
            <span className="text-xs font-medium text-foreground">
              {feature?.text}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SecurityBadges;