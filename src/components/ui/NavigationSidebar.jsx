import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Icon from '../AppIcon';

const NavigationSidebar = ({ 
  isCollapsed = false, 
  onToggle, 
  userRole = 'tenant',
  className = '' 
}) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const navigationItems = [
    {
      label: 'Dashboard',
      path: '/tenant-dashboard',
      icon: 'LayoutDashboard',
      tooltip: 'Overview and analytics'
    },
    {
      label: 'Channels',
      path: '/channel-setup',
      icon: 'MessageSquare',
      tooltip: 'WhatsApp integration setup'
    },
    {
      label: 'Automation',
      path: '/flow-builder',
      icon: 'GitBranch',
      tooltip: 'Build chatbot flows'
    },
    {
      label: 'Messages',
      path: '/messages-log',
      icon: 'MessageCircle',
      tooltip: 'Conversation history'
    }
  ];

  const handleNavigation = (path) => {
    navigate(path);
    setIsMobileOpen(false);
  };

  const isActivePath = (path) => {
    return location?.pathname === path;
  };

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setIsMobileOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const sidebarContent = (
    <div className="flex flex-col h-full bg-card border-r border-border">
      {/* Logo Section */}
      <div className="flex items-center px-4 py-6 border-b border-border">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <Icon name="MessageSquare" size={20} color="white" />
          </div>
          {!isCollapsed && (
            <div className="flex flex-col">
              <span className="text-lg font-semibold text-foreground">WhatsApp</span>
              <span className="text-sm text-muted-foreground">Bot Manager</span>
            </div>
          )}
        </div>
      </div>

      {/* Navigation Items */}
      <nav className="flex-1 px-4 py-6 space-y-2">
        {navigationItems?.map((item) => {
          const isActive = isActivePath(item?.path);
          
          return (
            <button
              key={item?.path}
              onClick={() => handleNavigation(item?.path)}
              className={`
                w-full flex items-center px-3 py-3 rounded-md text-left
                micro-animation group relative
                ${isActive 
                  ? 'bg-primary text-primary-foreground shadow-sm' 
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                }
                ${isCollapsed ? 'justify-center' : 'justify-start space-x-3'}
              `}
              title={isCollapsed ? item?.tooltip : ''}
            >
              <Icon 
                name={item?.icon} 
                size={20} 
                className={`flex-shrink-0 ${isActive ? 'text-primary-foreground' : ''}`}
              />
              {!isCollapsed && (
                <span className="font-medium">{item?.label}</span>
              )}
              {/* Tooltip for collapsed state */}
              {isCollapsed && (
                <div className="absolute left-full ml-2 px-2 py-1 bg-popover text-popover-foreground text-sm rounded-md shadow-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-200">
                  {item?.label}
                </div>
              )}
            </button>
          );
        })}
      </nav>

      {/* Collapse Toggle (Desktop) */}
      {onToggle && (
        <div className="px-4 py-4 border-t border-border">
          <button
            onClick={onToggle}
            className="w-full flex items-center justify-center p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-md micro-animation"
            title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            <Icon 
              name={isCollapsed ? 'ChevronRight' : 'ChevronLeft'} 
              size={20} 
            />
          </button>
        </div>
      )}
    </div>
  );

  return (
    <>
      {/* Mobile Hamburger Button */}
      <button
        onClick={() => setIsMobileOpen(!isMobileOpen)}
        className="md:hidden fixed top-4 left-4 z-300 p-2 bg-card border border-border rounded-md shadow-md"
      >
        <Icon name="Menu" size={20} />
      </button>

      {/* Desktop Sidebar */}
      <aside 
        className={`
          hidden md:block fixed left-0 top-0 h-full z-100 sidebar-transition
          ${isCollapsed ? 'w-16' : 'w-60'}
          ${className}
        `}
      >
        {sidebarContent}
      </aside>

      {/* Mobile Sidebar Overlay */}
      {isMobileOpen && (
        <div className="md:hidden fixed inset-0 z-300">
          <div 
            className="absolute inset-0 bg-black bg-opacity-50"
            onClick={() => setIsMobileOpen(false)}
          />
          <aside className="absolute left-0 top-0 h-full w-60 sidebar-transition">
            {sidebarContent}
          </aside>
        </div>
      )}
    </>
  );
};

export default NavigationSidebar;