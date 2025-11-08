import React from 'react';
import { Helmet } from 'react-helmet';
import LoginHeader from './components/LoginHeader';
import LoginForm from './components/LoginForm';
import SecurityBadges from './components/SecurityBadges';

const LoginPage = () => {
  return (
    <>
      <Helmet>
        <title>Sign In - WhatsApp Bot Manager</title>
        <meta name="description" content="Sign in to your WhatsApp Bot Manager account to access your chatbot dashboard and manage customer conversations." />
      </Helmet>
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="w-full max-w-lg">
          {/* Main Login Card */}
          <div className="bg-card border border-border rounded-xl shadow-lg p-8">
            <LoginHeader />
            <LoginForm />
            <SecurityBadges />
          </div>

          {/* Footer */}
          <div className="mt-6 text-center">
            <p className="text-xs text-muted-foreground">
              © {new Date()?.getFullYear()} WhatsApp Bot Manager. All rights reserved.
            </p>
            <div className="flex items-center justify-center space-x-4 mt-2">
              <a 
                href="#" 
                className="text-xs text-muted-foreground hover:text-foreground micro-animation"
              >
                Privacy Policy
              </a>
              <span className="text-xs text-muted-foreground">•</span>
              <a 
                href="#" 
                className="text-xs text-muted-foreground hover:text-foreground micro-animation"
              >
                Terms of Service
              </a>
              <span className="text-xs text-muted-foreground">•</span>
              <a 
                href="#" 
                className="text-xs text-muted-foreground hover:text-foreground micro-animation"
              >
                Support
              </a>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default LoginPage;