import React, { useState, useEffect } from 'react';
import NavigationSidebar from '../../components/ui/NavigationSidebar';
import UserProfileDropdown from '../../components/ui/UserProfileDropdown';
import Icon from '../../components/AppIcon';
import CredentialsForm from './components/CredentialsForm';
import ConnectionTestCard from './components/ConnectionTestCard';
import WebhookConfigCard from './components/WebhookConfigCard';
import ChannelStatusCard from './components/ChannelStatusCard';
import TroubleshootingCard from './components/TroubleshootingCard';

// ⬇️ NUEVO: sesión + API mock
import { useAuth } from '@/lib/AuthProvider';
import { useMockApi } from '@/lib/useMockApi';

const ChannelSetup = () => {
  const { profile } = useAuth();
  const { tenant, channel, testConnection } = useMockApi();

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

  // Prefill mock de canal si hay datos (desde nuestro useMockApi)
  useEffect(() => {
    const saved = localStorage.getItem('whatsapp_credentials');

    if (saved) {
      // Si ya guardaste antes, “levanta” los datos previos
      const parsed = JSON.parse(saved);
      setCredentials(parsed);
      setIsConnected(true);
      setChannelData({
        businessName: parsed.businessName || tenant?.name || 'Your Business',
        phoneNumber: channel?.display_phone_number,
        phoneNumberId: parsed.phoneNumberId,
        wabaId: parsed.wabaId,
        isActive: true,
        lastSync: new Date()?.toISOString(),
        stats: { messagesToday: 47, messagesThisMonth: 1284, activeChats: 23 }
      });
    } else if (channel) {
      // Si no hay saved, inicializa con el mock del canal
      setCredentials((prev) => ({
        ...prev,
        phoneNumberId: channel.phone_number_id || '',
        wabaId: channel.waba_id || '',
        businessName: tenant?.name || 'Your Business'
      }));
      setChannelData({
        businessName: tenant?.name || 'Your Business',
        phoneNumber: channel?.display_phone_number,
        phoneNumberId: channel?.phone_number_id,
        wabaId: channel?.waba_id,
        isActive: channel?.status === 'active',
        lastSync: new Date()?.toISOString(),
        stats: { messagesToday: 0, messagesThisMonth: 0, activeChats: 0 }
      });
      setIsConnected(channel?.status === 'active');
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [channel, tenant]);

  const handleCredentialsChange = (newCredentials) => {
    setCredentials(newCredentials);
  };

  const handleSaveCredentials = async (credentialsData) => {
    setIsSaving(true);
    try {
      // Simula persistencia local (en real: llamarías a tu backend / Supabase)
      await new Promise(resolve => setTimeout(resolve, 800));
      localStorage.setItem('whatsapp_credentials', JSON.stringify(credentialsData));
      console.log('Credentials saved successfully');
    } catch (error) {
      console.error('Failed to save credentials:', error);
    } finally {
      setIsSaving(false);
    }
  };

  // 🔌 Aquí adaptamos el resultado de nuestro mock testConnection()
  // a la forma que espera tu handler (success + details.phoneNumber)
  const handleConnectionTest = () => {
    const result = testConnection(); // { ok, timestamp }
    const mapped = {
      success: !!result?.ok,
      details: { phoneNumber: channel?.display_phone_number || '+0 000 000 000' }
    };

    if (mapped.success) {
      setIsConnected(true);
      setChannelData({
        businessName: credentials?.businessName || tenant?.name || 'Your Business',
        phoneNumber: mapped.details.phoneNumber,
        phoneNumberId: credentials?.phoneNumberId || channel?.phone_number_id,
        wabaId: credentials?.wabaId || channel?.waba_id,
        isActive: false, // queda inactivo hasta que el usuario active
        lastSync: new Date()?.toISOString(),
        stats: { messagesToday: 0, messagesThisMonth: 0, activeChats: 0 }
      });
    } else {
      setIsConnected(false);
      setChannelData(null);
    }
  };

  const handleToggleChannel = (isActive) => {
    setChannelData(prev => ({
      ...prev,
      isActive,
      lastSync: new Date()?.toISOString()
    }));
  };

  const handleLogout = () => {
    localStorage.removeItem('whatsapp_credentials');
    console.log('Logging out...');
  };

  const currentUser = {
    name: tenant?.name || 'Tenant',
    email: profile?.role === 'tenant' ? 'tenant@business.com' : 'admin@whatsappbot.com',
    avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face',
    role: profile?.role || 'tenant'
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
              
              {/* 🔌 ahora usamos nuestra función de test */}
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
