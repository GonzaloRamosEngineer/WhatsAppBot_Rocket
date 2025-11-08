import React, { useState } from 'react';
import Button from '../../../components/ui/Button';
import Icon from '../../../components/AppIcon';

const ConnectionTestCard = ({ credentials, onTestConnection, isConnected }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [testResult, setTestResult] = useState(null);

  const handleTestConnection = async () => {
    if (!credentials?.phoneNumberId || !credentials?.wabaId || !credentials?.accessToken) {
      setTestResult({
        success: false,
        message: 'Please fill in all required fields before testing the connection.'
      });
      return;
    }

    setIsLoading(true);
    setTestResult(null);

    try {
      // Simulate API test call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Mock test result based on credentials
      const mockSuccess = credentials?.phoneNumberId === '123456789012345' && 
                          credentials?.wabaId === 'waba_123456789'&& credentials?.accessToken?.startsWith('EAABwzLixnjY');

      const result = {
        success: mockSuccess,
        message: mockSuccess 
          ? 'Connection successful! Your WhatsApp Business account is properly configured.' :'Connection failed. Please verify your credentials and try again.',
        details: mockSuccess ? {
          phoneNumber: '+1 (555) 123-4567',
          businessName: 'Demo Business Account',
          verificationStatus: 'Verified',
          lastSync: new Date()?.toISOString()
        } : {
          error: 'Invalid access token or phone number ID',
          suggestion: 'Check your Meta Business Manager for correct credentials'
        }
      };

      setTestResult(result);
      if (onTestConnection) {
        onTestConnection(result);
      }
    } catch (error) {
      setTestResult({
        success: false,
        message: 'Network error occurred while testing connection.',
        details: { error: error?.message }
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-card border border-border rounded-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-foreground">Connection Test</h3>
        {isConnected && (
          <div className="flex items-center space-x-2 text-success">
            <Icon name="CheckCircle" size={20} />
            <span className="text-sm font-medium">Connected</span>
          </div>
        )}
      </div>
      <p className="text-muted-foreground mb-6">
        Test your WhatsApp Business API connection to ensure all credentials are working properly.
      </p>
      <Button
        onClick={handleTestConnection}
        loading={isLoading}
        iconName="Zap"
        iconPosition="left"
        variant="outline"
        className="mb-4"
        disabled={!credentials?.phoneNumberId || !credentials?.wabaId || !credentials?.accessToken}
      >
        {isLoading ? 'Testing Connection...' : 'Test Connection'}
      </Button>
      {testResult && (
        <div className={`p-4 rounded-md border ${
          testResult?.success 
            ? 'bg-success/10 border-success text-success' :'bg-destructive/10 border-destructive text-destructive'
        }`}>
          <div className="flex items-start space-x-3">
            <Icon 
              name={testResult?.success ? 'CheckCircle' : 'AlertCircle'} 
              size={20} 
              className="flex-shrink-0 mt-0.5"
            />
            <div className="flex-1">
              <p className="font-medium mb-2">{testResult?.message}</p>
              
              {testResult?.success && testResult?.details && (
                <div className="space-y-2 text-sm">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    <div>
                      <span className="font-medium">Phone Number:</span>
                      <span className="ml-2">{testResult?.details?.phoneNumber}</span>
                    </div>
                    <div>
                      <span className="font-medium">Business Name:</span>
                      <span className="ml-2">{testResult?.details?.businessName}</span>
                    </div>
                    <div>
                      <span className="font-medium">Status:</span>
                      <span className="ml-2">{testResult?.details?.verificationStatus}</span>
                    </div>
                    <div>
                      <span className="font-medium">Last Sync:</span>
                      <span className="ml-2">{new Date(testResult.details.lastSync)?.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              )}

              {!testResult?.success && testResult?.details && (
                <div className="space-y-2 text-sm">
                  <p><span className="font-medium">Error:</span> {testResult?.details?.error}</p>
                  {testResult?.details?.suggestion && (
                    <p><span className="font-medium">Suggestion:</span> {testResult?.details?.suggestion}</p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ConnectionTestCard;