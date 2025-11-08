import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Input from '../../../components/ui/Input';
import Button from '../../../components/ui/Button';
import { Checkbox } from '../../../components/ui/Checkbox';
import Select from '../../../components/ui/Select';
import Icon from '../../../components/AppIcon';

const RegistrationForm = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    businessName: '',
    contactPerson: '',
    email: '',
    password: '',
    confirmPassword: '',
    businessType: '',
    monthlyVolume: '',
    agreeToTerms: false,
    agreeToPrivacy: false
  });

  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const businessTypeOptions = [
    { value: 'ecommerce', label: 'E-commerce' },
    { value: 'retail', label: 'Retail' },
    { value: 'healthcare', label: 'Healthcare' },
    { value: 'education', label: 'Education' },
    { value: 'finance', label: 'Finance & Banking' },
    { value: 'realestate', label: 'Real Estate' },
    { value: 'hospitality', label: 'Hospitality' },
    { value: 'technology', label: 'Technology' },
    { value: 'consulting', label: 'Consulting' },
    { value: 'other', label: 'Other' }
  ];

  const monthlyVolumeOptions = [
    { value: '0-1000', label: '0 - 1,000 messages' },
    { value: '1000-5000', label: '1,000 - 5,000 messages' },
    { value: '5000-10000', label: '5,000 - 10,000 messages' },
    { value: '10000-25000', label: '10,000 - 25,000 messages' },
    { value: '25000-50000', label: '25,000 - 50,000 messages' },
    { value: '50000+', label: '50,000+ messages' }
  ];

  const validateForm = () => {
    const newErrors = {};

    if (!formData?.businessName?.trim()) {
      newErrors.businessName = 'Business name is required';
    }

    if (!formData?.contactPerson?.trim()) {
      newErrors.contactPerson = 'Contact person name is required';
    }

    if (!formData?.email?.trim()) {
      newErrors.email = 'Email address is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/?.test(formData?.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!formData?.password) {
      newErrors.password = 'Password is required';
    } else if (formData?.password?.length < 8) {
      newErrors.password = 'Password must be at least 8 characters long';
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/?.test(formData?.password)) {
      newErrors.password = 'Password must contain uppercase, lowercase, and number';
    }

    if (!formData?.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (formData?.password !== formData?.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    if (!formData?.businessType) {
      newErrors.businessType = 'Please select your business type';
    }

    if (!formData?.monthlyVolume) {
      newErrors.monthlyVolume = 'Please select estimated monthly volume';
    }

    if (!formData?.agreeToTerms) {
      newErrors.agreeToTerms = 'You must agree to the Terms of Service';
    }

    if (!formData?.agreeToPrivacy) {
      newErrors.agreeToPrivacy = 'You must agree to the Privacy Policy';
    }

    setErrors(newErrors);
    return Object.keys(newErrors)?.length === 0;
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));

    // Clear error when user starts typing
    if (errors?.[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  const handleSubmit = async (e) => {
    e?.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    // Simulate API call
    try {
      await new Promise(resolve => setTimeout(resolve, 2000));
      setShowSuccess(true);
    } catch (error) {
      setErrors({ submit: 'Registration failed. Please try again.' });
    } finally {
      setIsLoading(false);
    }
  };

  const getPasswordStrength = () => {
    const password = formData?.password;
    if (!password) return { strength: 0, label: '' };

    let score = 0;
    if (password?.length >= 8) score++;
    if (/[a-z]/?.test(password)) score++;
    if (/[A-Z]/?.test(password)) score++;
    if (/\d/?.test(password)) score++;
    if (/[^a-zA-Z\d]/?.test(password)) score++;

    const levels = [
      { strength: 0, label: '', color: '' },
      { strength: 1, label: 'Very Weak', color: 'bg-red-500' },
      { strength: 2, label: 'Weak', color: 'bg-orange-500' },
      { strength: 3, label: 'Fair', color: 'bg-yellow-500' },
      { strength: 4, label: 'Good', color: 'bg-blue-500' },
      { strength: 5, label: 'Strong', color: 'bg-green-500' }
    ];

    return levels?.[score];
  };

  if (showSuccess) {
    return (
      <div className="max-w-md mx-auto bg-card border border-border rounded-lg p-8 text-center">
        <div className="w-16 h-16 bg-success rounded-full flex items-center justify-center mx-auto mb-6">
          <Icon name="Check" size={32} color="white" />
        </div>
        <h2 className="text-2xl font-semibold text-foreground mb-4">
          Registration Successful!
        </h2>
        <p className="text-muted-foreground mb-6">
          We've sent a verification email to <strong>{formData?.email}</strong>. 
          Please check your inbox and click the verification link to activate your account.
        </p>
        <div className="space-y-3">
          <Button 
            variant="default" 
            fullWidth
            onClick={() => navigate('/login')}
          >
            Go to Login
          </Button>
          <Button 
            variant="outline" 
            fullWidth
            onClick={() => setShowSuccess(false)}
          >
            Register Another Account
          </Button>
        </div>
      </div>
    );
  }

  const passwordStrength = getPasswordStrength();

  return (
    <div className="max-w-lg mx-auto bg-card border border-border rounded-lg p-8">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">
          Create Your Account
        </h1>
        <p className="text-muted-foreground">
          Start automating your WhatsApp customer interactions
        </p>
      </div>
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Business Information */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-foreground border-b border-border pb-2">
            Business Information
          </h3>
          
          <Input
            label="Business Name"
            type="text"
            placeholder="Enter your business name"
            value={formData?.businessName}
            onChange={(e) => handleInputChange('businessName', e?.target?.value)}
            error={errors?.businessName}
            required
          />

          <Input
            label="Contact Person"
            type="text"
            placeholder="Enter contact person name"
            value={formData?.contactPerson}
            onChange={(e) => handleInputChange('contactPerson', e?.target?.value)}
            error={errors?.contactPerson}
            required
          />

          <Select
            label="Business Type"
            placeholder="Select your business type"
            options={businessTypeOptions}
            value={formData?.businessType}
            onChange={(value) => handleInputChange('businessType', value)}
            error={errors?.businessType}
            required
            searchable
          />

          <Select
            label="Estimated Monthly Message Volume"
            placeholder="Select expected message volume"
            options={monthlyVolumeOptions}
            value={formData?.monthlyVolume}
            onChange={(value) => handleInputChange('monthlyVolume', value)}
            error={errors?.monthlyVolume}
            description="This helps us recommend the right plan for you"
            required
          />
        </div>

        {/* Account Credentials */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-foreground border-b border-border pb-2">
            Account Credentials
          </h3>

          <Input
            label="Email Address"
            type="email"
            placeholder="Enter your email address"
            value={formData?.email}
            onChange={(e) => handleInputChange('email', e?.target?.value)}
            error={errors?.email}
            description="This will be your login email"
            required
          />

          <div>
            <Input
              label="Password"
              type="password"
              placeholder="Create a strong password"
              value={formData?.password}
              onChange={(e) => handleInputChange('password', e?.target?.value)}
              error={errors?.password}
              required
            />
            {formData?.password && (
              <div className="mt-2">
                <div className="flex items-center space-x-2 mb-1">
                  <div className="flex-1 bg-muted rounded-full h-2">
                    <div 
                      className={`h-full rounded-full transition-all duration-300 ${passwordStrength?.color}`}
                      style={{ width: `${(passwordStrength?.strength / 5) * 100}%` }}
                    />
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {passwordStrength?.label}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Use 8+ characters with uppercase, lowercase, and numbers
                </p>
              </div>
            )}
          </div>

          <Input
            label="Confirm Password"
            type="password"
            placeholder="Confirm your password"
            value={formData?.confirmPassword}
            onChange={(e) => handleInputChange('confirmPassword', e?.target?.value)}
            error={errors?.confirmPassword}
            required
          />
        </div>

        {/* Legal Agreements */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-foreground border-b border-border pb-2">
            Legal Agreements
          </h3>

          <Checkbox
            label="I agree to the Terms of Service"
            checked={formData?.agreeToTerms}
            onChange={(e) => handleInputChange('agreeToTerms', e?.target?.checked)}
            error={errors?.agreeToTerms}
            required
          />

          <Checkbox
            label="I agree to the Privacy Policy"
            checked={formData?.agreeToPrivacy}
            onChange={(e) => handleInputChange('agreeToPrivacy', e?.target?.checked)}
            error={errors?.agreeToPrivacy}
            required
          />
        </div>

        {/* Submit Error */}
        {errors?.submit && (
          <div className="bg-destructive/10 border border-destructive/20 rounded-md p-4">
            <div className="flex items-center space-x-2">
              <Icon name="AlertCircle" size={16} className="text-destructive" />
              <span className="text-sm text-destructive">{errors?.submit}</span>
            </div>
          </div>
        )}

        {/* Submit Button */}
        <Button
          type="submit"
          variant="default"
          fullWidth
          loading={isLoading}
          disabled={isLoading}
          iconName="UserPlus"
          iconPosition="left"
        >
          {isLoading ? 'Creating Account...' : 'Create Account'}
        </Button>

        {/* Back to Login */}
        <div className="text-center pt-4 border-t border-border">
          <p className="text-sm text-muted-foreground">
            Already have an account?{' '}
            <button
              type="button"
              onClick={() => navigate('/login')}
              className="text-primary hover:underline font-medium"
            >
              Sign in here
            </button>
          </p>
        </div>
      </form>
    </div>
  );
};

export default RegistrationForm;