import React, { useState, useEffect } from 'react';
import NavigationSidebar from '../../components/ui/NavigationSidebar';
import UserProfileDropdown from '../../components/ui/UserProfileDropdown';
import MessageFilters from './components/MessageFilters';
import MessageTable from './components/MessageTable';
import ConversationSummary from './components/ConversationSummary';
import MessageStats from './components/MessageStats';

import Button from '../../components/ui/Button';

const MessagesLog = () => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [filteredMessages, setFilteredMessages] = useState([]);
  const [activeFilters, setActiveFilters] = useState({});
  const [selectedConversation, setSelectedConversation] = useState(null);

  // Mock data for messages
  const mockMessages = [
    {
      id: 1,
      messageId: "wamid.HBgNMTU1NjI4NzQ5NjUVAgASGBQzQTAyQjY4RkY4RkY4RkY4RkY4AA==",
      contact: "+1 (555) 123-4567",
      contactName: "Sarah Johnson",
      body: "Hi! I\'m interested in your premium subscription plan. Can you provide more details about the features included?",
      direction: "inbound",
      status: "read",
      timestamp: new Date(Date.now() - 300000),
      metadata: {
        threadId: "thread_abc123",
        apiResponse: "200 OK",
        webhookData: {
          from: "15551234567",
          to: "business_number",
          type: "text"
        }
      },
      conversationContext: [
        {
          body: "Welcome to our service! How can I help you today?",
          direction: "outbound",
          timestamp: new Date(Date.now() - 600000)
        }
      ]
    },
    {
      id: 2,
      messageId: "wamid.HBgNMTU1NjI4NzQ5NjUVAgASGBQzQTAyQjY4RkY4RkY4RkY4RkY4BB==",
      contact: "+1 (555) 987-6543",
      contactName: "Michael Chen",
      body: "Thank you for the quick response! The information was very helpful.",
      direction: "inbound",
      status: "delivered",
      timestamp: new Date(Date.now() - 900000),
      metadata: {
        threadId: "thread_def456",
        apiResponse: "200 OK"
      }
    },
    {
      id: 3,
      messageId: "wamid.HBgNMTU1NjI4NzQ5NjUVAgASGBQzQTAyQjY4RkY4RkY4RkY4RkY4CC==",
      contact: "+1 (555) 456-7890",
      contactName: "Emma Rodriguez",
      body: "Your order #12345 has been processed and will be shipped within 2-3 business days. You\'ll receive a tracking number via email once it\'s dispatched.",
      direction: "outbound",
      status: "sent",
      timestamp: new Date(Date.now() - 1800000),
      metadata: {
        threadId: "thread_ghi789",
        apiResponse: "200 OK"
      }
    },
    {
      id: 4,
      messageId: "wamid.HBgNMTU1NjI4NzQ5NjUVAgASGBQzQTAyQjY4RkY4RkY4RkY4RkY4DD==",
      contact: "+1 (555) 321-0987",
      contactName: "David Wilson",
      body: "I\'m having trouble accessing my account. Can you help me reset my password?",
      direction: "inbound",
      status: "failed",
      timestamp: new Date(Date.now() - 3600000),
      metadata: {
        threadId: "thread_jkl012",
        apiResponse: "500 Internal Server Error"
      }
    },
    {
      id: 5,
      messageId: "wamid.HBgNMTU1NjI4NzQ5NjUVAgASGBQzQTAyQjY4RkY4RkY4RkY4RkY4EE==",
      contact: "+1 (555) 654-3210",
      contactName: "Lisa Thompson",
      body: "Great! I\'ll proceed with the payment. Please send me the invoice.",
      direction: "inbound",
      status: "read",
      timestamp: new Date(Date.now() - 7200000),
      metadata: {
        threadId: "thread_mno345",
        apiResponse: "200 OK"
      }
    }
  ];

  // Mock data for conversations
  const mockConversations = [
    {
      id: 1,
      contact: "+1 (555) 123-4567",
      contactName: "Sarah Johnson",
      lastMessage: "Hi! I\'m interested in your premium subscription plan...",
      lastMessageTime: new Date(Date.now() - 300000),
      messageCount: 5,
      unreadCount: 2,
      status: "active"
    },
    {
      id: 2,
      contact: "+1 (555) 987-6543",
      contactName: "Michael Chen",
      lastMessage: "Thank you for the quick response!",
      lastMessageTime: new Date(Date.now() - 900000),
      messageCount: 3,
      unreadCount: 0,
      status: "resolved"
    },
    {
      id: 3,
      contact: "+1 (555) 456-7890",
      contactName: "Emma Rodriguez",
      lastMessage: "Your order #12345 has been processed...",
      lastMessageTime: new Date(Date.now() - 1800000),
      messageCount: 8,
      unreadCount: 1,
      status: "pending"
    }
  ];

  // Mock stats data
  const mockStats = {
    totalMessages: 1247,
    sentToday: 89,
    receivedToday: 156,
    failedMessages: 12
  };

  const currentUser = {
    name: "Alex Thompson",
    email: "alex@company.com",
    avatar: null,
    role: "Tenant Admin"
  };

  useEffect(() => {
    // Apply filters to messages
    let filtered = mockMessages;

    if (activeFilters?.dateFrom) {
      filtered = filtered?.filter(msg => 
        new Date(msg.timestamp) >= new Date(activeFilters.dateFrom)
      );
    }

    if (activeFilters?.dateTo) {
      filtered = filtered?.filter(msg => 
        new Date(msg.timestamp) <= new Date(activeFilters.dateTo)
      );
    }

    if (activeFilters?.contact) {
      filtered = filtered?.filter(msg => 
        msg?.contact?.toLowerCase()?.includes(activeFilters?.contact?.toLowerCase()) ||
        msg?.contactName?.toLowerCase()?.includes(activeFilters?.contact?.toLowerCase())
      );
    }

    if (activeFilters?.status) {
      filtered = filtered?.filter(msg => msg?.status === activeFilters?.status);
    }

    if (activeFilters?.keyword) {
      filtered = filtered?.filter(msg => 
        msg?.body?.toLowerCase()?.includes(activeFilters?.keyword?.toLowerCase())
      );
    }

    setFilteredMessages(filtered);
  }, [activeFilters]);

  useEffect(() => {
    setFilteredMessages(mockMessages);
  }, []);

  const handleFilterChange = (filters) => {
    setActiveFilters(filters);
  };

  const handleBulkAction = (action, messageIds) => {
    console.log(`Performing ${action} on messages:`, messageIds);
    // Implement bulk actions here
  };

  const handleExport = () => {
    console.log('Exporting messages...');
    // Implement export functionality
  };

  const handleSelectConversation = (conversation) => {
    setSelectedConversation(conversation);
    // Filter messages by conversation
    const conversationMessages = mockMessages?.filter(
      msg => msg?.contact === conversation?.contact
    );
    setFilteredMessages(conversationMessages);
  };

  const handleLogout = () => {
    console.log('Logging out...');
    // Implement logout functionality
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
        {/* Top Header */}
        <header className="bg-card border-b border-border px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-foreground">Messages Log</h1>
              <p className="text-muted-foreground">Monitor and manage WhatsApp conversations</p>
            </div>
            
            <div className="flex items-center space-x-4">
              <Button
                variant="outline"
                iconName="RefreshCw"
                iconPosition="left"
                onClick={() => window.location?.reload()}
              >
                Refresh
              </Button>
              
              <UserProfileDropdown
                user={currentUser}
                onLogout={handleLogout}
                onProfileClick={() => console.log('Profile clicked')}
              />
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="p-6">
          {/* Stats Cards */}
          <MessageStats stats={mockStats} />

          <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
            {/* Messages Section */}
            <div className="xl:col-span-3 space-y-6">
              {/* Filters */}
              <MessageFilters
                onFilterChange={handleFilterChange}
                onExport={handleExport}
              />

              {/* Messages Table */}
              <MessageTable
                messages={filteredMessages}
                onBulkAction={handleBulkAction}
              />
            </div>

            {/* Conversations Sidebar */}
            <div className="xl:col-span-1">
              <ConversationSummary
                conversations={mockConversations}
                onSelectConversation={handleSelectConversation}
              />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default MessagesLog;