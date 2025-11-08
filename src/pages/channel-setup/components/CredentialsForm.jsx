import React, { useState } from 'react';
import Input from '../../../components/ui/Input';
import Button from '../../../components/ui/Button';
import Icon from '../../../components/AppIcon';

const CredentialsForm = ({ onCredentialsChange, onSave, isLoading }) => {
  const [credentials, setCredentials] = useState({
    phoneNumberId: '',
    wabaId: '',
    accessToken: '',
    businessName: ''
  });

  const [errors, setErrors] = useState({});
  const [showToken, setShowToken] = useState(false);

  const handleInputChange = (field, value) => {
    const updatedCredentials = {
      ...credentials,
      [field]: value
    };
    
    setCredentials(updatedCredentials);
    
    // Clear error for this field
    if (errors?.[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
    
    // Notify parent component
    if (onCredentialsChange) {
      onCredentialsChange(updatedCredentials);
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!credentials?.phoneNumberId?.trim()) {
      newErrors.phoneNumberId = 'Phone Number ID is required';
    } else if (!/^\d{15}$/?.test(credentials?.phoneNumberId)) {
      newErrors.phoneNumberId = 'Phone Number ID must be 15 digits';
    }
    
    if (!credentials?.wabaId?.trim()) {
      newErrors.wabaId = 'WhatsApp Business Account ID is required';
    } else if (!/^waba_\d+$/?.test(credentials?.wabaId)) {
      newErrors.wabaId = 'WABA ID must start with "waba_" followed by numbers';
    }
    
    if (!credentials?.accessToken?.trim()) {
      newErrors.accessToken = 'Access Token is required';
    } else if (credentials?.accessToken?.length < 50) {
      newErrors.accessToken = 'Access Token appears to be invalid (too short)';
    }
    
    if (!credentials?.businessName?.trim()) {
      newErrors.businessName = 'Business Name is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors)?.length === 0;
  };

  const handleSave = () => {
    if (validateForm()) {
      if (onSave) {
        onSave(credentials);
      }
    }
  };

  const instructionSteps = [
    {
      title: 'Get Phone Number ID',
      description: 'In Meta Business Manager, go to WhatsApp Manager → Phone Numbers → Select your number → Copy the Phone Number ID'
    },
    {
      title: 'Get WABA ID',
      description: 'In WhatsApp Manager, find your WhatsApp Business Account ID (starts with "waba_")'
    },
    {
      title: 'Generate Access Token',
      description: 'Go to Meta for Developers → Your App → WhatsApp → Getting Started → Generate a permanent access token'
    }
  ];

  return (
    <div className="bg-card border border-border rounded-lg p-6">
      <div className="flex items-center space-x-3 mb-6">
        <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
          <Icon name="Key" size={20} className="text-primary" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-foreground">WhatsApp Business Credentials</h3>
          <p className="text-sm text-muted-foreground">Enter your Meta Graph API credentials</p>
        </div>
      </div>
      {/* Instructions */}
      <div className="mb-6 p-4 bg-muted rounded-md">
        <h4 className="font-medium text-foreground mb-3 flex items-center">
          <Icon name="Info" size={16} className="mr-2" />
          How to get your credentials
        </h4>
        <div className="space-y-2">
          {instructionSteps?.map((step, index) => (
            <div key={index} className="text-sm">
              <span className="font-medium text-foreground">{step?.title}:</span>
              <span className="text-muted-foreground ml-1">{step?.description}</span>
            </div>
          ))}
        </div>
        <a 
          href="https://developers.facebook.com/docs/whatsapp/business-management-api/get-started"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center space-x-1 text-sm text-primary hover:underline mt-2"
        >
          <span>View detailed setup guide</span>
          <Icon name="ExternalLink" size={14} />
        </a>
      </div>
      {/* Form Fields */}
      <div className="space-y-4">
        <Input
          label="Business Name"
          type="text"
          placeholder="Enter your business name"
          value={credentials?.businessName}
          onChange={(e) => handleInputChange('businessName', e?.target?.value)}
          error={errors?.businessName}
          required
          description="The name of your WhatsApp Business account"
        />

        <Input
          label="Phone Number ID"
          type="text"
          placeholder="123456789012345"
          value={credentials?.phoneNumberId}
          onChange={(e) => handleInputChange('phoneNumberId', e?.target?.value)}
          error={errors?.phoneNumberId}
          required
          description="15-digit Phone Number ID from Meta Business Manager"
        />

        <Input
          label="WhatsApp Business Account ID (WABA ID)"
          type="text"
          placeholder="waba_123456789"
          value={credentials?.wabaId}
          onChange={(e) => handleInputChange('wabaId', e?.target?.value)}
          error={errors?.wabaId}
          required
          description="Your WABA ID starting with 'waba_'"
        />

        <div className="relative">
          <Input
            label="Access Token"
            type={showToken ? "text" : "password"}
            placeholder="EAABwzLixnjY..."
            value={credentials?.accessToken}
            onChange={(e) => handleInputChange('accessToken', e?.target?.value)}
            error={errors?.accessToken}
            required
            description="Permanent access token from Meta for Developers"
          />
          <button
            type="button"
            onClick={() => setShowToken(!showToken)}
            className="absolute right-3 top-8 text-muted-foreground hover:text-foreground"
          >
            <Icon name={showToken ? "EyeOff" : "Eye"} size={16} />
          </button>
        </div>
      </div>
      {/* Security Notice */}
      <div className="mt-6 p-4 bg-success/10 border border-success/20 rounded-md">
        <div className="flex items-start space-x-3">
          <Icon name="Shield" size={20} className="text-success flex-shrink-0 mt-0.5" />
          <div>
            <h5 className="font-medium text-success mb-1">Secure Storage</h5>
            <p className="text-sm text-success/80">
              All credentials are encrypted and stored securely. Your access tokens are never logged or exposed.
            </p>
          </div>
        </div>
      </div>
      {/* Save Button */}
      <div className="mt-6 flex justify-end">
        <Button
          onClick={handleSave}
          loading={isLoading}
          iconName="Save"
          iconPosition="left"
          disabled={!credentials?.phoneNumberId || !credentials?.wabaId || !credentials?.accessToken || !credentials?.businessName}
        >
          {isLoading ? 'Saving Credentials...' : 'Save Credentials'}
        </Button>
      </div>
    </div>
  );
};

export default CredentialsForm;