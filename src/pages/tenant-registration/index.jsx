import React from 'react';
import RegistrationHeader from './components/RegistrationHeader';
import RegistrationForm from './components/RegistrationForm';
import FeatureHighlights from './components/FeatureHighlights';

const TenantRegistration = () => {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <RegistrationHeader />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
            {/* Registration Form */}
            <div className="order-2 lg:order-1">
              <RegistrationForm />
            </div>

            {/* Feature Highlights */}
            <div className="order-1 lg:order-2">
              <FeatureHighlights />
            </div>
          </div>

          {/* Footer */}
          <div className="mt-16 pt-8 border-t border-border text-center">
            <p className="text-sm text-muted-foreground">
              © {new Date()?.getFullYear()} WhatsApp Bot Manager. All rights reserved.
            </p>
            <div className="flex items-center justify-center space-x-6 mt-4">
              <a href="#" className="text-sm text-muted-foreground hover:text-foreground">
                Terms of Service
              </a>
              <a href="#" className="text-sm text-muted-foreground hover:text-foreground">
                Privacy Policy
              </a>
              <a href="#" className="text-sm text-muted-foreground hover:text-foreground">
                Support
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TenantRegistration;