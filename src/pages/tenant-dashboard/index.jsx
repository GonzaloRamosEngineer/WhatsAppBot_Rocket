import React, { useState, useEffect } from 'react';
import NavigationSidebar from '../../components/ui/NavigationSidebar';
import UserProfileDropdown from '../../components/ui/UserProfileDropdown';
import MetricsCard from './components/MetricsCard';
import ActivityFeed from './components/ActivityFeed';
import QuickActions from './components/QuickActions';
import ActiveConversations from './components/ActiveConversations';
import OnboardingChecklist from './components/OnboardingChecklist';
import Icon from '../../components/AppIcon';

// ⬇️ NUEVO: hooks de sesión y datos mock
import { useAuth } from '@/lib/AuthProvider';
import { useMockApi } from '@/lib/useMockApi';

const TenantDashboard = () => {
  const { profile } = useAuth();
  const { tenant, messages, flows } = useMockApi();

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Usuario mostrado en el header (derivado de sesión/tenant)
  const currentUser = {
    name: profile?.role === 'tenant' ? tenant?.name : 'Admin',
    email: profile?.role === 'tenant' ? 'tenant@business.com' : 'admin@whatsappbot.com',
    avatar:
      'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face',
    role: profile?.role || 'tenant',
  };

  // Métricas calculadas desde mensajes/flows mock
  const totalMessages = messages.length;
  const inCount = messages.filter((m) => m.direction === 'in').length;
  const outCount = messages.filter((m) => m.direction === 'out').length;
  const activeFlows = flows.length;

  const metrics = [
    { title: 'Messages Sent', value: String(outCount), change: '+12.5%', changeType: 'positive', icon: 'Send', color: 'primary' },
    { title: 'Messages Received', value: String(inCount), change: '+8.2%', changeType: 'positive', icon: 'MessageCircle', color: 'success' },
    { title: 'Active Flows', value: String(activeFlows), change: '+5.4%', changeType: 'positive', icon: 'GitBranch', color: 'secondary' },
    { title: 'Total Messages', value: String(totalMessages), change: '—', changeType: 'neutral', icon: 'BarChart3', color: 'warning' },
  ];

  // Actividades/conversaciones de demo (podés luego mapear desde messages/flows si querés)
  const activities = [
    { id: 1, type: 'message_received', title: 'New inbound message', description: 'Cliente preguntó por horarios', timestamp: new Date(Date.now() - 300000), status: 'pending' },
    { id: 2, type: 'flow_triggered', title: 'Welcome flow activated', description: 'Nuevo lead entró al flujo de bienvenida', timestamp: new Date(Date.now() - 900000), status: 'success' },
    { id: 3, type: 'message_sent', title: 'Outbound reply', description: 'Respuesta automática enviada', timestamp: new Date(Date.now() - 1800000), status: 'success' },
  ];

  const conversations = messages.slice(0, 4).map((m, i) => ({
    id: i + 1,
    name: m.direction === 'in' ? m.from : m.to,
    phone: m.direction === 'in' ? m.from : m.to,
    avatar: 'https://images.unsplash.com/photo-1564581335312-88ba5f1ae29f',
    avatarAlt: 'contact avatar',
    lastMessage: m.body,
    lastSeen: new Date(m.created_at),
    status: m.direction === 'in' ? 'active' : 'resolved',
    unreadCount: m.direction === 'in' ? 1 : 0,
  }));

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 800);
    return () => clearTimeout(timer);
  }, []);

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
            <div className="flex items-center space-x-4">
              <div>
                <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
                <p className="text-sm text-muted-foreground">
                  Welcome back, {currentUser?.name}! Here&apos;s what&apos;s happening with your WhatsApp bot.
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              {/* Notifications */}
              <button className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-md micro-animation relative">
                <Icon name="Bell" size={20} />
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-destructive rounded-full"></span>
              </button>

              {/* User Profile Dropdown */}
              <UserProfileDropdown
                user={currentUser}
                onLogout={() => console.log('logout')}
                onProfileClick={() => console.log('profile')}
              />
            </div>
          </div>
        </header>

        {/* Dashboard Content */}
        <main className="p-6 space-y-6">
          {/* Metrics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {metrics.map((metric, index) => (
              <MetricsCard
                key={index}
                title={metric.title}
                value={metric.value}
                change={metric.change}
                changeType={metric.changeType}
                icon={metric.icon}
                color={metric.color}
                isLoading={isLoading}
              />
            ))}
          </div>

          {/* Main Dashboard Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column - Activity Feed & Quick Actions */}
            <div className="lg:col-span-2 space-y-6">
              <ActivityFeed activities={activities} isLoading={isLoading} />
              <QuickActions />
            </div>

            {/* Right Column - Conversations & Onboarding */}
            <div className="space-y-6">
              <OnboardingChecklist onComplete={() => console.log('Onboarding completed')} />
              <ActiveConversations conversations={conversations} isLoading={isLoading} />
            </div>
          </div>

          {/* Additional Stats Section (estático por ahora) */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-card border border-border rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-foreground">Response Time</h3>
                <Icon name="Clock" size={20} className="text-muted-foreground" />
              </div>
              <div className="space-y-2">
                <p className="text-2xl font-bold text-foreground">2.3 min</p>
                <p className="text-sm text-success">-15% faster than last week</p>
              </div>
            </div>

            <div className="bg-card border border-border rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-foreground">Customer Satisfaction</h3>
                <Icon name="Heart" size={20} className="text-muted-foreground" />
              </div>
              <div className="space-y-2">
                <p className="text-2xl font-bold text-foreground">4.8/5</p>
                <p className="text-sm text-success">+0.2 from last month</p>
              </div>
            </div>

            <div className="bg-card border border-border rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-foreground">Active Flows</h3>
                <Icon name="GitBranch" size={20} className="text-muted-foreground" />
              </div>
              <div className="space-y-2">
                <p className="text-2xl font-bold text-foreground">{activeFlows}</p>
                <p className="text-sm text-muted-foreground">Flows currently in your workspace</p>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default TenantDashboard;
