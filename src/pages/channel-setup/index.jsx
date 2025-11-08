import React, { useState, useEffect } from 'react';
import NavigationSidebar from '../../components/ui/NavigationSidebar';
import UserProfileDropdown from '../../components/ui/UserProfileDropdown';
import Icon from '../../components/AppIcon';
import CredentialsForm from './components/CredentialsForm';
import ConnectionTestCard from './components/ConnectionTestCard';
import WebhookConfigCard from './components/WebhookConfigCard';
import ChannelStatusCard from './components/ChannelStatusCard';
import TroubleshootingCard from './components/TroubleshootingCard';

const ChannelSetup = () => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [credentials, setCredentials] = useState({
    phoneNumberId: '',
    wabaId: '',
    accessToken: '',
    businessName: ''
  });
  const [isConnected, setIsConnected] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [channelData, setChannelData] = useState(null);

  // Mock user data
  const currentUser = {
    name: 'Sarah Johnson',
    email: 'sarah@techstartup.com',
    avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face',
    role: 'Tenant'
  };

  // Mock existing channel data for demonstration
  useEffect(() => {
    // Simulate loading existing channel data
    const mockChannelData = {
      businessName: 'Tech Startup Solutions',
      phoneNumber: '+1 (555) 123-4567',
      phoneNumberId: '123456789012345',
      wabaId: 'waba_123456789',
      isActive: true,
      lastSync: new Date()?.toISOString(),
      stats: {
        messagesToday: 47,
        messagesThisMonth: 1284,
        activeChats: 23
      }
    };

    // Check if we have saved credentials (mock check)
    const hasCredentials = localStorage.getItem('whatsapp_credentials');
    if (hasCredentials) {
      setIsConnected(true);
      setChannelData(mockChannelData);
      setCredentials({
        phoneNumberId: '123456789012345',
        wabaId: 'waba_123456789',
        accessToken: 'EAABwzLixnjY...',
        businessName: 'Tech Startup Solutions'
      });
    }
  }, []);

  const handleCredentialsChange = (newCredentials) => {
    setCredentials(newCredentials);
  };

  const handleSaveCredentials = async (credentialsData) => {
    setIsSaving(true);
    try {
      // Simulate API call to save credentials
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Mock save success
      localStorage.setItem('whatsapp_credentials', JSON.stringify(credentialsData));
      
      // Show success message (in real app, you'd use a toast/notification)
      console.log('Credentials saved successfully');
      
    } catch (error) {
      console.error('Failed to save credentials:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleConnectionTest = (testResult) => {
    if (testResult?.success) {
      setIsConnected(true);
      setChannelData({
        businessName: credentials?.businessName,
        phoneNumber: testResult?.details?.phoneNumber,
        phoneNumberId: credentials?.phoneNumberId,
        wabaId: credentials?.wabaId,
        isActive: false, // Initially inactive until user activates
        lastSync: new Date()?.toISOString(),
        stats: {
          messagesToday: 0,
          messagesThisMonth: 0,
          activeChats: 0
        }
      });
    } else {
      setIsConnected(false);
      setChannelData(null);
    }
  };

  const handleToggleChannel = (isActive) => {
    setChannelData(prev => ({
      ...prev,
      isActive: isActive,
      lastSync: new Date()?.toISOString()
    }));
  };

  const handleLogout = () => {
    localStorage.removeItem('whatsapp_credentials');
    // In real app, redirect to login
    console.log('Logging out...');
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation Sidebar */}
      <NavigationSidebar 
        isCollapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
        userRole="tenant"
      />
      {/* Main Content */}
      <div className={`transition-all duration-200 ${sidebarCollapsed ? 'md:ml-16' : 'md:ml-60'}`}>
        {/* Header */}
        <header className="bg-card border-b border-border px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-foreground">Channel Setup</h1>
              <p className="text-muted-foreground">Connect your WhatsApp Business account</p>
            </div>
            
            <div className="flex items-center space-x-4">
              {/* Connection Status Indicator */}
              <div className="flex items-center space-x-2">
                <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-success' : 'bg-muted-foreground'}`} />
                <span className="text-sm text-muted-foreground">
                  {isConnected ? 'Connected' : 'Not Connected'}
                </span>
              </div>
              
              <UserProfileDropdown 
                user={currentUser}
                onLogout={handleLogout}
              />
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-6">
          {/* Setup Progress Indicator */}
          <div className="mb-8">
            <div className="flex items-center space-x-4 mb-4">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                credentials?.phoneNumberId && credentials?.wabaId && credentials?.accessToken 
                  ? 'bg-success text-success-foreground' 
                  : 'bg-primary text-primary-foreground'
              }`}>
                {credentials?.phoneNumberId && credentials?.wabaId && credentials?.accessToken ? (
                  <Icon name="Check" size={16} />
                ) : (
                  '1'
                )}
              </div>
              <div className="flex-1 h-px bg-border" />
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                isConnected 
                  ? 'bg-success text-success-foreground' 
                  : 'bg-muted text-muted-foreground'
              }`}>
                {isConnected ? <Icon name="Check" size={16} /> : '2'}
              </div>
              <div className="flex-1 h-px bg-border" />
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                channelData?.isActive 
                  ? 'bg-success text-success-foreground' 
                  : 'bg-muted text-muted-foreground'
              }`}>
                {channelData?.isActive ? <Icon name="Check" size={16} /> : '3'}
              </div>
            </div>
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Enter Credentials</span>
              <span>Test Connection</span>
              <span>Activate Channel</span>
            </div>
          </div>

          {/* Setup Cards Grid */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            {/* Left Column */}
            <div className="space-y-6">
              <CredentialsForm
                onCredentialsChange={handleCredentialsChange}
                onSave={handleSaveCredentials}
                isLoading={isSaving}
              />
              
              <ConnectionTestCard
                credentials={credentials}
                onTestConnection={handleConnectionTest}
                isConnected={isConnected}
              />
            </div>

            {/* Right Column */}
            <div className="space-y-6">
              <ChannelStatusCard
                isConnected={isConnected}
                channelData={channelData}
                onToggleChannel={handleToggleChannel}
              />
              
              <WebhookConfigCard />
            </div>
          </div>

          {/* Troubleshooting Section */}
          <div className="mt-8">
            <TroubleshootingCard />
          </div>

          {/* Next Steps */}
          {isConnected && channelData?.isActive && (
            <div className="mt-8 p-6 bg-success/5 border border-success/20 rounded-lg">
              <div className="flex items-start space-x-3">
                <Icon name="CheckCircle" size={24} className="text-success flex-shrink-0 mt-1" />
                <div>
                  <h3 className="text-lg font-semibold text-success mb-2">Channel Setup Complete!</h3>
                  <p className="text-success/80 mb-4">
                    Your WhatsApp Business account is now connected and active. You can start building chatbot flows and managing conversations.
                  </p>
                  <div className="flex flex-wrap gap-3">
                    <a 
                      href="/flow-builder"
                      className="inline-flex items-center space-x-2 px-4 py-2 bg-success text-success-foreground rounded-md hover:bg-success/90 micro-animation"
                    >
                      <Icon name="GitBranch" size={16} />
                      <span>Build Your First Flow</span>
                    </a>
                    <a 
                      href="/messages-log"
                      className="inline-flex items-center space-x-2 px-4 py-2 border border-success text-success rounded-md hover:bg-success/10 micro-animation"
                    >
                      <Icon name="MessageCircle" size={16} />
                      <span>View Messages</span>
                    </a>
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default ChannelSetup;