import React, { useState } from 'react';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import Icon from '../../../components/AppIcon';

const WebhookConfigCard = () => {
  const [copied, setCopied] = useState(false);
  
  const webhookUrl = `${window.location?.origin}/api/webhooks/whatsapp`;
  const verifyToken = 'whatsapp_webhook_verify_token_2024';

  const handleCopyToClipboard = async (text, type) => {
    try {
      await navigator.clipboard?.writeText(text);
      setCopied(type);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
    }
  };

  const configSteps = [
    {
      step: 1,
      title: 'Access Meta Business Manager',
      description: 'Go to your Meta Business Manager dashboard and navigate to WhatsApp API settings.',
      link: 'https://business.facebook.com'
    },
    {
      step: 2,
      title: 'Configure Webhook URL',
      description: 'In the Webhooks section, add the webhook URL provided below.'
    },
    {
      step: 3,
      title: 'Set Verify Token',
      description: 'Enter the verify token exactly as shown below for webhook verification.'
    },
    {
      step: 4,
      title: 'Subscribe to Events',
      description: 'Enable message events, delivery status, and read status subscriptions.'
    }
  ];

  return (
    <div className="bg-card border border-border rounded-lg p-6">
      <div className="flex items-center space-x-3 mb-6">
        <div className="w-10 h-10 bg-secondary/10 rounded-lg flex items-center justify-center">
          <Icon name="Webhook" size={20} className="text-secondary" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-foreground">Webhook Configuration</h3>
          <p className="text-sm text-muted-foreground">Configure your Meta webhook to receive messages</p>
        </div>
      </div>
      {/* Configuration Steps */}
      <div className="space-y-4 mb-6">
        <h4 className="font-medium text-foreground">Setup Instructions</h4>
        <div className="space-y-3">
          {configSteps?.map((step) => (
            <div key={step?.step} className="flex space-x-3">
              <div className="w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs font-medium flex-shrink-0 mt-0.5">
                {step?.step}
              </div>
              <div className="flex-1">
                <h5 className="font-medium text-foreground">{step?.title}</h5>
                <p className="text-sm text-muted-foreground">{step?.description}</p>
                {step?.link && (
                  <a 
                    href={step?.link} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="inline-flex items-center space-x-1 text-sm text-primary hover:underline mt-1"
                  >
                    <span>Open Meta Business Manager</span>
                    <Icon name="ExternalLink" size={14} />
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
      {/* Webhook URL */}
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            Webhook URL
          </label>
          <div className="flex space-x-2">
            <Input
              type="text"
              value={webhookUrl}
              readOnly
              className="flex-1 font-mono text-sm"
            />
            <Button
              variant="outline"
              iconName={copied === 'url' ? 'Check' : 'Copy'}
              onClick={() => handleCopyToClipboard(webhookUrl, 'url')}
              className="flex-shrink-0"
            >
              {copied === 'url' ? 'Copied!' : 'Copy'}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Use this URL in your Meta Business Manager webhook configuration
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            Verify Token
          </label>
          <div className="flex space-x-2">
            <Input
              type="text"
              value={verifyToken}
              readOnly
              className="flex-1 font-mono text-sm"
            />
            <Button
              variant="outline"
              iconName={copied === 'token' ? 'Check' : 'Copy'}
              onClick={() => handleCopyToClipboard(verifyToken, 'token')}
              className="flex-shrink-0"
            >
              {copied === 'token' ? 'Copied!' : 'Copy'}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Enter this token exactly as shown for webhook verification
          </p>
        </div>
      </div>
      {/* Security Notice */}
      <div className="mt-6 p-4 bg-muted rounded-md">
        <div className="flex items-start space-x-3">
          <Icon name="Shield" size={20} className="text-primary flex-shrink-0 mt-0.5" />
          <div>
            <h5 className="font-medium text-foreground mb-1">Security Notice</h5>
            <p className="text-sm text-muted-foreground">
              Your webhook endpoint is secured with token verification and encrypted data transmission. 
              All incoming messages are validated before processing.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WebhookConfigCard;