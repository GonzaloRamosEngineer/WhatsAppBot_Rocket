import React, { useState } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';

const TemplateLibrary = ({ 
  isOpen, 
  onClose, 
  onSelectTemplate 
}) => {
  const [selectedCategory, setSelectedCategory] = useState('all');

  const templateCategories = [
    { id: 'all', label: 'All Templates', icon: 'Grid3X3' },
    { id: 'welcome', label: 'Welcome Messages', icon: 'Hand' },
    { id: 'support', label: 'Customer Support', icon: 'Headphones' },
    { id: 'sales', label: 'Sales & Marketing', icon: 'TrendingUp' },
    { id: 'booking', label: 'Appointments', icon: 'Calendar' }
  ];

  const flowTemplates = [
    {
      id: 1,
      name: 'Welcome Message',
      description: 'Greet new customers and provide basic information',
      category: 'welcome',
      triggerType: 'welcome',
      keywords: [],
      responses: [
        {
          message: `Hello! 👋 Welcome to our WhatsApp support.\n\nI'm here to help you with:\n• Product information\n• Order status\n• General inquiries\n\nHow can I assist you today?`,
          delay: 0
        }
      ],
      isActive: true,
      popularity: 95
    },
    {
      id: 2,
      name: 'Business Hours',description: 'Inform customers about operating hours',category: 'support',triggerType: 'keyword',
      keywords: ['hours', 'open', 'timing', 'schedule'],
      responses: [
        {
          message: `🕒 Our business hours are:\n\nMonday - Friday: 9:00 AM - 6:00 PM\nSaturday: 10:00 AM - 4:00 PM\nSunday: Closed\n\nWe'll respond to your message during business hours. Thank you for your patience!`,
          delay: 0
        }
      ],
      isActive: true,
      popularity: 88
    },
    {
      id: 3,
      name: 'Order Status Inquiry',
      description: 'Handle order status and tracking requests',
      category: 'support',
      triggerType: 'keyword',
      keywords: ['order', 'tracking', 'status', 'delivery', 'shipped'],
      responses: [
        {
          message: `📦 I'd be happy to help you track your order!\n\nPlease provide your order number (starts with #) and I'll get the latest status for you.`,
          delay: 0
        },
        {
          message: `You can also track your order directly at: www.example.com/track\n\nIs there anything else I can help you with?`,
          delay: 3
        }
      ],
      isActive: true,
      popularity: 92
    },
    {
      id: 4,
      name: 'Product Catalog',
      description: 'Share product information and catalog',
      category: 'sales',
      triggerType: 'keyword',
      keywords: ['products', 'catalog', 'menu', 'services', 'price'],
      responses: [
        {
          message: `🛍️ Here's our latest product catalog:\n\n📱 Electronics\n👕 Fashion & Apparel\n🏠 Home & Garden\n🎮 Gaming\n\nWhich category interests you most?`,
          delay: 0
        }
      ],
      isActive: true,
      popularity: 85
    },
    {
      id: 5,
      name: 'Appointment Booking',description: 'Guide customers through appointment scheduling',category: 'booking',triggerType: 'keyword',
      keywords: ['appointment', 'booking', 'schedule', 'meeting', 'consultation'],
      responses: [
        {
          message: `📅 I'd be happy to help you schedule an appointment!\n\nPlease let me know:\n1. Preferred date\n2. Preferred time\n3. Type of service needed`,
          delay: 0
        },
        {
          message: `Our available slots are:\n• Monday-Friday: 9 AM - 5 PM\n• Saturday: 10 AM - 2 PM\n\nI'll check availability once you provide your preferences.`,
          delay: 2
        }
      ],
      isActive: true,
      popularity: 78
    },
    {
      id: 6,
      name: 'Contact Information',description: 'Provide business contact details',category: 'support',triggerType: 'keyword',
      keywords: ['contact', 'phone', 'email', 'address', 'location'],
      responses: [
        {
          message: `📞 Here's how to reach us:\n\n📧 Email: support@example.com\n📱 Phone: +1 (555) 123-4567\n📍 Address: 123 Business St, City, State 12345\n\n🌐 Website: www.example.com`,
          delay: 0
        }
      ],
      isActive: true,
      popularity: 90
    },
    {
      id: 7,
      name: 'Special Offers',
      description: 'Promote current deals and discounts',
      category: 'sales',
      triggerType: 'keyword',
      keywords: ['offer', 'discount', 'deal', 'promotion', 'sale'],
      responses: [
        {
          message: `🎉 Current Special Offers:\n\n✨ 20% off all electronics\n🚚 Free shipping on orders over $50\n💳 Buy 2 Get 1 Free on selected items\n\nUse code: SAVE20\nValid until: December 31, 2024`,
          delay: 0
        }
      ],
      isActive: true,
      popularity: 82
    },
    {
      id: 8,
      name: 'FAQ Response',
      description: 'Handle frequently asked questions',
      category: 'support',
      triggerType: 'keyword',
      keywords: ['faq', 'help', 'question', 'support', 'info'],
      responses: [
        {
          message: `❓ Frequently Asked Questions:\n\n1. How do I place an order?\n2. What's your return policy?\n3. Do you offer international shipping?\n4. How can I track my order?\n\nType the number of the question you'd like answered, or ask me directly!`,
          delay: 0
        }
      ],
      isActive: true,
      popularity: 87
    }
  ];

  const filteredTemplates = selectedCategory === 'all' 
    ? flowTemplates 
    : flowTemplates?.filter(template => template?.category === selectedCategory);

  const handleSelectTemplate = (template) => {
    const templateData = {
      ...template,
      id: Date.now(), // Generate new ID for the copy
      triggerCount: 0,
      lastUpdated: new Date()?.toLocaleDateString()
    };
    onSelectTemplate(templateData);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-300 p-4">
      <div className="bg-card rounded-lg shadow-xl w-full max-w-6xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div>
            <h2 className="text-xl font-semibold text-foreground">Template Library</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Choose from pre-built flow templates to get started quickly
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            iconName="X"
            onClick={onClose}
          />
        </div>

        <div className="flex h-[calc(90vh-140px)]">
          {/* Categories Sidebar */}
          <div className="w-64 border-r border-border p-4">
            <h3 className="text-sm font-medium text-foreground mb-3">Categories</h3>
            <div className="space-y-1">
              {templateCategories?.map((category) => (
                <button
                  key={category?.id}
                  onClick={() => setSelectedCategory(category?.id)}
                  className={`
                    w-full flex items-center space-x-3 px-3 py-2 rounded-md text-left micro-animation
                    ${selectedCategory === category?.id
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                    }
                  `}
                >
                  <Icon 
                    name={category?.icon} 
                    size={16} 
                    className="flex-shrink-0"
                  />
                  <span className="text-sm">{category?.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Templates Grid */}
          <div className="flex-1 p-6 overflow-y-auto">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {filteredTemplates?.map((template) => (
                <div
                  key={template?.id}
                  className="bg-card border border-border rounded-lg p-6 hover:shadow-md micro-animation"
                >
                  {/* Template Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-foreground mb-1">
                        {template?.name}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {template?.description}
                      </p>
                    </div>
                    <div className="flex items-center space-x-1 text-xs text-muted-foreground">
                      <Icon name="TrendingUp" size={12} />
                      <span>{template?.popularity}%</span>
                    </div>
                  </div>

                  {/* Trigger Info */}
                  <div className="mb-4">
                    <div className="flex items-center space-x-2 mb-2">
                      <Icon name="Zap" size={14} className="text-warning" />
                      <span className="text-xs font-medium text-foreground uppercase tracking-wide">
                        {template?.triggerType} Trigger
                      </span>
                    </div>
                    {template?.triggerType === 'keyword' && template?.keywords?.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {template?.keywords?.slice(0, 3)?.map((keyword, index) => (
                          <span
                            key={index}
                            className="px-2 py-1 bg-primary/10 text-primary text-xs rounded-md"
                          >
                            {keyword}
                          </span>
                        ))}
                        {template?.keywords?.length > 3 && (
                          <span className="px-2 py-1 bg-muted text-muted-foreground text-xs rounded-md">
                            +{template?.keywords?.length - 3} more
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Response Preview */}
                  <div className="mb-4">
                    <div className="bg-muted rounded-md p-3">
                      <p className="text-sm text-foreground line-clamp-3">
                        {template?.responses?.[0]?.message || 'No response configured'}
                      </p>
                      {template?.responses?.length > 1 && (
                        <span className="text-xs text-muted-foreground mt-2 block">
                          +{template?.responses?.length - 1} more responses
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">
                      {template?.responses?.length} response{template?.responses?.length !== 1 ? 's' : ''}
                    </span>
                    <Button
                      variant="default"
                      size="sm"
                      iconName="Plus"
                      iconPosition="left"
                      onClick={() => handleSelectTemplate(template)}
                    >
                      Use Template
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            {filteredTemplates?.length === 0 && (
              <div className="flex items-center justify-center h-64 text-muted-foreground">
                <div className="text-center">
                  <Icon name="Search" size={48} className="mx-auto mb-2 opacity-50" />
                  <p>No templates found in this category</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TemplateLibrary;