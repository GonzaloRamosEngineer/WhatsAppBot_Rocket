import React from 'react';
import Icon from '../../../components/AppIcon';

const FeatureHighlights = () => {
  const features = [
    {
      icon: 'MessageCircle',
      title: 'Automated Responses',
      description: 'Set up intelligent chatbot flows to handle customer inquiries 24/7'
    },
    {
      icon: 'BarChart3',
      title: 'Analytics & Insights',
      description: 'Track message volume, response times, and customer satisfaction'
    },
    {
      icon: 'Users',
      title: 'Multi-Agent Support',
      description: 'Manage team access and assign conversations to specific agents'
    },
    {
      icon: 'Zap',
      title: 'Quick Integration',
      description: 'Connect your WhatsApp Business account in just a few clicks'
    },
    {
      icon: 'Shield',
      title: 'Secure & Compliant',
      description: 'Enterprise-grade security with full data privacy protection'
    },
    {
      icon: 'Clock',
      title: 'Real-time Sync',
      description: 'Instant message delivery and real-time conversation updates'
    }
  ];

  return (
    <div className="bg-muted/30 rounded-xl p-8">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-foreground mb-2">
          Why Choose Our Platform?
        </h2>
        <p className="text-muted-foreground">
          Everything you need to automate and scale your WhatsApp customer service
        </p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {features?.map((feature, index) => (
          <div key={index} className="flex items-start space-x-4">
            <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
              <Icon name={feature?.icon} size={20} className="text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground mb-1">
                {feature?.title}
              </h3>
              <p className="text-sm text-muted-foreground">
                {feature?.description}
              </p>
            </div>
          </div>
        ))}
      </div>
      {/* Trust Indicators */}
      <div className="mt-8 pt-6 border-t border-border">
        <div className="flex items-center justify-center space-x-8 text-sm text-muted-foreground">
          <div className="flex items-center space-x-2">
            <Icon name="Shield" size={16} />
            <span>SSL Secured</span>
          </div>
          <div className="flex items-center space-x-2">
            <Icon name="Lock" size={16} />
            <span>GDPR Compliant</span>
          </div>
          <div className="flex items-center space-x-2">
            <Icon name="CheckCircle" size={16} />
            <span>99.9% Uptime</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FeatureHighlights;