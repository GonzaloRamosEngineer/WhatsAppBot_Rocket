import React, { useState } from 'react';
import Button from '../../../components/ui/Button';
import Icon from '../../../components/AppIcon';

const TroubleshootingCard = () => {
  const [expandedItem, setExpandedItem] = useState(null);

  const troubleshootingItems = [
    {
      id: 'invalid-credentials',
      title: 'Invalid Credentials Error',
      description: 'Connection test fails with authentication errors',
      solution: `Check that your Phone Number ID and WABA ID are correct.\nEnsure your access token is permanent and not expired.\nVerify that your app has the necessary WhatsApp permissions.\nMake sure the phone number is verified in Meta Business Manager.`,
      icon: 'Key'
    },
    {
      id: 'webhook-not-receiving',
      title: 'Webhook Not Receiving Messages',
      description: 'Messages are not appearing in your dashboard',
      solution: `Verify the webhook URL is correctly configured in Meta Business Manager.\nCheck that the verify token matches exactly.\nEnsure webhook subscriptions include message events.\nTest webhook endpoint accessibility from external networks.`,
      icon: 'Webhook'
    },
    {
      id: 'rate-limits',
      title: 'Rate Limit Issues',
      description: 'API calls are being throttled or rejected',
      solution: `Review your current API usage in Meta Business Manager.\nImplement proper message queuing for high-volume scenarios.\nConsider upgrading your WhatsApp Business API tier.\nMonitor rate limit headers in API responses.`,
      icon: 'Clock'
    },
    {
      id: 'message-delivery',
      title: 'Message Delivery Problems',
      description: 'Messages are not being delivered to recipients',
      solution: `Check recipient phone number format (include country code).\nVerify your business is approved for messaging.\nEnsure message templates are approved if using templates.\nCheck message content for policy violations.`,
      icon: 'MessageCircle'
    },
    {
      id: 'permissions',
      title: 'Permission Denied Errors',
      description: 'API returns permission or access denied errors',
      solution: `Verify your app has whatsapp_business_messaging permission.\nCheck that your access token has the required scopes.\nEnsure your Meta Business Manager account has proper roles.\nConfirm the phone number is added to your WABA.`,
      icon: 'Shield'
    }
  ];

  const toggleExpanded = (itemId) => {
    setExpandedItem(expandedItem === itemId ? null : itemId);
  };

  const contactSupport = () => {
    window.open('mailto:support@whatsappbotmanager.com?subject=Channel Setup Support', '_blank');
  };

  return (
    <div className="bg-card border border-border rounded-lg p-6">
      <div className="flex items-center space-x-3 mb-6">
        <div className="w-10 h-10 bg-warning/10 rounded-lg flex items-center justify-center">
          <Icon name="HelpCircle" size={20} className="text-warning" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-foreground">Troubleshooting Guide</h3>
          <p className="text-sm text-muted-foreground">Common issues and solutions</p>
        </div>
      </div>
      <div className="space-y-3">
        {troubleshootingItems?.map((item) => (
          <div key={item?.id} className="border border-border rounded-md">
            <button
              onClick={() => toggleExpanded(item?.id)}
              className="w-full flex items-center justify-between p-4 text-left hover:bg-muted micro-animation"
            >
              <div className="flex items-center space-x-3">
                <Icon name={item?.icon} size={20} className="text-muted-foreground" />
                <div>
                  <h4 className="font-medium text-foreground">{item?.title}</h4>
                  <p className="text-sm text-muted-foreground">{item?.description}</p>
                </div>
              </div>
              <Icon 
                name={expandedItem === item?.id ? 'ChevronUp' : 'ChevronDown'} 
                size={20} 
                className="text-muted-foreground flex-shrink-0"
              />
            </button>
            
            {expandedItem === item?.id && (
              <div className="px-4 pb-4">
                <div className="pl-8 border-l-2 border-primary/20">
                  <h5 className="font-medium text-foreground mb-2">Solution:</h5>
                  <div className="text-sm text-muted-foreground space-y-1">
                    {item?.solution?.split('\n')?.map((line, index) => (
                      <p key={index}>• {line}</p>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
      {/* Quick Links */}
      <div className="mt-6 p-4 bg-muted rounded-md">
        <h4 className="font-medium text-foreground mb-3">Quick Links</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          <a 
            href="https://developers.facebook.com/docs/whatsapp/business-management-api"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center space-x-2 text-sm text-primary hover:underline"
          >
            <Icon name="ExternalLink" size={14} />
            <span>WhatsApp Business API Docs</span>
          </a>
          <a 
            href="https://business.facebook.com"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center space-x-2 text-sm text-primary hover:underline"
          >
            <Icon name="ExternalLink" size={14} />
            <span>Meta Business Manager</span>
          </a>
          <a 
            href="https://developers.facebook.com/tools/debug/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center space-x-2 text-sm text-primary hover:underline"
          >
            <Icon name="ExternalLink" size={14} />
            <span>Access Token Debugger</span>
          </a>
          <button
            onClick={contactSupport}
            className="flex items-center space-x-2 text-sm text-primary hover:underline text-left"
          >
            <Icon name="Mail" size={14} />
            <span>Contact Support</span>
          </button>
        </div>
      </div>
      {/* Support Contact */}
      <div className="mt-6 p-4 bg-primary/5 border border-primary/20 rounded-md">
        <div className="flex items-start space-x-3">
          <Icon name="MessageSquare" size={20} className="text-primary flex-shrink-0 mt-0.5" />
          <div>
            <h5 className="font-medium text-primary mb-1">Need Additional Help?</h5>
            <p className="text-sm text-primary/80 mb-3">
              Our support team is available to help you with complex setup issues or custom configurations.
            </p>
            <Button
              variant="outline"
              size="sm"
              iconName="Mail"
              iconPosition="left"
              onClick={contactSupport}
            >
              Contact Support Team
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TroubleshootingCard;