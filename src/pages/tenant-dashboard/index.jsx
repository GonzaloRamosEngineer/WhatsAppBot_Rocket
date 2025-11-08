import React, { useState, useEffect } from 'react';
import NavigationSidebar from '../../components/ui/NavigationSidebar';
import UserProfileDropdown from '../../components/ui/UserProfileDropdown';
import MetricsCard from './components/MetricsCard';
import ActivityFeed from './components/ActivityFeed';
import QuickActions from './components/QuickActions';
import ActiveConversations from './components/ActiveConversations';
import OnboardingChecklist from './components/OnboardingChecklist';
import Icon from '../../components/AppIcon';

const TenantDashboard = () => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [currentUser] = useState({
    name: "Sarah Johnson",
    email: "sarah@businesscorp.com",
    avatar: "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face",
    role: "Business Owner"
  });

  // Mock data for dashboard metrics
  const [metrics] = useState([
  {
    title: "Messages Sent",
    value: "2,847",
    change: "+12.5%",
    changeType: "positive",
    icon: "Send",
    color: "primary"
  },
  {
    title: "Messages Received",
    value: "1,923",
    change: "+8.2%",
    changeType: "positive",
    icon: "MessageCircle",
    color: "success"
  },
  {
    title: "Active Conversations",
    value: "156",
    change: "+23.1%",
    changeType: "positive",
    icon: "Users",
    color: "secondary"
  },
  {
    title: "Monthly Usage",
    value: "4,770",
    change: "78% of limit",
    changeType: "neutral",
    icon: "BarChart3",
    color: "warning"
  }]
  );

  // Mock data for recent activities
  const [activities] = useState([
  {
    id: 1,
    type: "message_received",
    title: "New message from John Smith",
    description: "Hello, I need help with my order #12345",
    timestamp: new Date(Date.now() - 300000),
    status: "pending"
  },
  {
    id: 2,
    type: "flow_triggered",
    title: "Welcome flow activated",
    description: "New customer Maria Garcia started onboarding",
    timestamp: new Date(Date.now() - 900000),
    status: "success"
  },
  {
    id: 3,
    type: "message_sent",
    title: "Automated response sent",
    description: "Order confirmation sent to customer #4567",
    timestamp: new Date(Date.now() - 1800000),
    status: "success"
  },
  {
    id: 4,
    type: "channel_connected",
    title: "WhatsApp channel verified",
    description: "Business number +1 (555) 123-4567 is now active",
    timestamp: new Date(Date.now() - 3600000),
    status: "success"
  },
  {
    id: 5,
    type: "user_joined",
    title: "New team member added",
    description: "Mike Wilson joined as Customer Support Agent",
    timestamp: new Date(Date.now() - 7200000),
    status: "success"
  }]
  );

  // Mock data for active conversations
  const [conversations] = useState([
  {
    id: 1,
    name: "John Smith",
    phone: "+1 (555) 123-4567",
    avatar: "https://img.rocket.new/generatedImages/rocket_gen_img_12cacdd88-1762248875137.png",
    avatarAlt: "Professional headshot of middle-aged man with brown hair in business suit",
    lastMessage: "Thank you for the quick response! When can I expect delivery?",
    lastSeen: new Date(Date.now() - 180000),
    status: "active",
    unreadCount: 2
  },
  {
    id: 2,
    name: "Maria Garcia",
    phone: "+1 (555) 987-6543",
    avatar: "https://images.unsplash.com/photo-1564581335312-88ba5f1ae29f",
    avatarAlt: "Young Hispanic woman with long dark hair smiling at camera",
    lastMessage: "I'm interested in your premium package. Can you send more details?",
    lastSeen: new Date(Date.now() - 600000),
    status: "pending",
    unreadCount: 1
  },
  {
    id: 3,
    name: "David Chen",
    phone: "+1 (555) 456-7890",
    avatar: "https://images.unsplash.com/photo-1698072556534-40ec6e337311",
    avatarAlt: "Asian man with glasses and friendly smile in casual shirt",
    lastMessage: "Perfect! I'll proceed with the order. Thanks for your help.",
    lastSeen: new Date(Date.now() - 1800000),
    status: "resolved",
    unreadCount: 0
  },
  {
    id: 4,
    name: "Lisa Anderson",
    phone: "+1 (555) 321-0987",
    avatar: "https://images.unsplash.com/photo-1684262855358-88f296a2cfc2",
    avatarAlt: "Professional blonde woman in blue blazer with confident expression",
    lastMessage: "Could you clarify the return policy for this item?",
    lastSeen: new Date(Date.now() - 3600000),
    status: "active",
    unreadCount: 3
  }]
  );

  useEffect(() => {
    // Simulate loading
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1500);

    return () => clearTimeout(timer);
  }, []);

  const handleLogout = () => {
    // Handle logout logic
    console.log('Logging out...');
  };

  const handleProfileClick = () => {
    // Handle profile navigation
    console.log('Opening profile...');
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation Sidebar */}
      <NavigationSidebar
        isCollapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
        userRole="tenant" />

      {/* Main Content */}
      <div className={`transition-all duration-200 ${sidebarCollapsed ? 'md:ml-16' : 'md:ml-60'}`}>
        {/* Header */}
        <header className="bg-card border-b border-border px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div>
                <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
                <p className="text-sm text-muted-foreground">
                  Welcome back, {currentUser?.name}! Here's what's happening with your WhatsApp bot.
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
                onLogout={handleLogout}
                onProfileClick={handleProfileClick} />

            </div>
          </div>
        </header>

        {/* Dashboard Content */}
        <main className="p-6 space-y-6">
          {/* Metrics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {metrics?.map((metric, index) =>
            <MetricsCard
              key={index}
              title={metric?.title}
              value={metric?.value}
              change={metric?.change}
              changeType={metric?.changeType}
              icon={metric?.icon}
              color={metric?.color}
              isLoading={isLoading} />

            )}
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

          {/* Additional Stats Section */}
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
                <p className="text-2xl font-bold text-foreground">12</p>
                <p className="text-sm text-muted-foreground">3 flows created this week</p>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>);

};

export default TenantDashboard;