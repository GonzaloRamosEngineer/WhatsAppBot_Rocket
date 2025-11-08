import React from 'react';
import Icon from '../../../components/AppIcon';

const LoginHeader = () => {
  return (
    <div className="text-center mb-8">
      {/* Logo */}
      <div className="flex items-center justify-center mb-6">
        <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center shadow-lg">
          <Icon name="MessageSquare" size={24} color="white" />
        </div>
        <div className="ml-3">
          <h1 className="text-2xl font-bold text-foreground">WhatsApp Bot</h1>
          <p className="text-sm text-muted-foreground">Manager</p>
        </div>
      </div>

      {/* Welcome Message */}
      <div className="space-y-2">
        <h2 className="text-2xl font-semibold text-foreground">
          Welcome Back
        </h2>
        <p className="text-muted-foreground">
          Sign in to your account to manage your WhatsApp chatbots
        </p>
      </div>
    </div>
  );
};

export default LoginHeader;