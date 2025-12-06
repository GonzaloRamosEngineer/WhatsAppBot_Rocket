import React, { useState, useRef, useEffect } from 'react';
import Icon from '../AppIcon';

const UserProfileDropdown = ({ 
  user = { 
    name: 'John Doe', 
    email: 'john@example.com', 
    avatar: null,
    role: 'Admin'
  }, 
  onLogout,
  onProfileClick,
  className = '' 
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  const menuItems = [
    // {
    //   label: 'Profile Settings',
    //   icon: 'User',
    //   onClick: () => {
    //     onProfileClick?.();
    //     setIsOpen(false);
    //   }
    // },
    // {
    //   label: 'Account Settings',
    //   icon: 'Settings',
    //   onClick: () => {
    //     // Handle account settings
    //     setIsOpen(false);
    //   }
    // },
    // {
    //   label: 'Help & Support',
    //   icon: 'HelpCircle',
    //   onClick: () => {
    //     // Handle help
    //     setIsOpen(false);
    //   }
    // },
    {
      type: 'divider'
    },
    {
      label: 'Sign Out',
      icon: 'LogOut',
      onClick: () => {
        onLogout?.();
        setIsOpen(false);
      },
      variant: 'destructive'
    }
  ];

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef?.current && !dropdownRef?.current?.contains(event?.target)) {
        setIsOpen(false);
      }
    };

    const handleEscape = (event) => {
      if (event?.key === 'Escape') {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen]);

  const getInitials = (name) => {
    return name
      ?.split(' ')
      ?.map(word => word?.charAt(0))
      ?.join('')
      ?.toUpperCase()
      ?.slice(0, 2);
  };

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {/* Profile Trigger */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center space-x-3 px-3 py-2 text-left hover:bg-muted rounded-md micro-animation"
      >
        {/* Avatar */}
        <div className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-medium">
          {user?.avatar ? (
            <img 
              src={user?.avatar} 
              alt={user?.name}
              className="w-full h-full rounded-full object-cover"
            />
          ) : (
            getInitials(user?.name)
          )}
        </div>
        
        {/* User Info */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-foreground truncate">
            {user?.name}
          </p>
          <p className="text-xs text-muted-foreground truncate">
            {user?.email}
          </p>
        </div>
        
        {/* Chevron */}
        <Icon 
          name={isOpen ? 'ChevronUp' : 'ChevronDown'} 
          size={16} 
          className="text-muted-foreground flex-shrink-0"
        />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div
          className="
            absolute top-full right-0 mt-2
            bg-popover border border-border rounded-md shadow-lg
            py-1
            z-[9999]
            min-w-[220px]
          "
        >
          {menuItems?.map((item, index) => {
            if (item?.type === 'divider') {
              return (
                <div 
                  key={index} 
                  className="h-px bg-border my-1" 
                />
              );
            }

            return (
              <button
                key={index}
                onClick={item?.onClick}
                className={`
                  w-full flex items-center space-x-3 px-3 py-2 text-left text-sm
                  micro-animation
                  ${
                    item?.variant === 'destructive'
                      ? 'text-destructive hover:bg-destructive hover:text-destructive-foreground'
                      : 'text-popover-foreground hover:bg-muted'
                  }
                `}
              >
                <Icon 
                  name={item?.icon} 
                  size={16} 
                  className="flex-shrink-0"
                />
                <span>{item?.label}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default UserProfileDropdown;
