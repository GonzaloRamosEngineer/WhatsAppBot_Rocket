import React from 'react';
import Icon from '../../../components/AppIcon';

const RegistrationHeader = () => {
  return (
    <div className="text-center mb-12">
      {/* Logo */}
      <div className="flex items-center justify-center mb-8">
        <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center mr-3">
          <Icon name="MessageSquare" size={28} color="white" />
        </div>
        <div className="text-left">
          <h1 className="text-2xl font-bold text-foreground">WhatsApp Bot Manager</h1>
          <p className="text-sm text-muted-foreground">Business Registration</p>
        </div>
      </div>

      {/* Registration Steps */}
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-center space-x-4 mb-6">
          <div className="flex items-center">
            <div className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-medium">
              1
            </div>
            <span className="ml-2 text-sm font-medium text-foreground">Register</span>
          </div>
          
          <div className="w-12 h-px bg-border"></div>
          
          <div className="flex items-center">
            <div className="w-8 h-8 bg-muted text-muted-foreground rounded-full flex items-center justify-center text-sm font-medium">
              2
            </div>
            <span className="ml-2 text-sm text-muted-foreground">Verify Email</span>
          </div>
          
          <div className="w-12 h-px bg-border"></div>
          
          <div className="flex items-center">
            <div className="w-8 h-8 bg-muted text-muted-foreground rounded-full flex items-center justify-center text-sm font-medium">
              3
            </div>
            <span className="ml-2 text-sm text-muted-foreground">Setup WhatsApp</span>
          </div>
        </div>

        <p className="text-muted-foreground text-sm max-w-md mx-auto">
          Join thousands of businesses automating their WhatsApp customer interactions. 
          Get started in minutes with our guided setup process.
        </p>
      </div>
    </div>
  );
};

export default RegistrationHeader;