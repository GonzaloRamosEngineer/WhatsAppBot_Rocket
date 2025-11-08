import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import { Checkbox } from '../../../components/ui/Checkbox';
import Icon from '../../../components/AppIcon';

const LoginForm = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: false
  });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  // Mock credentials for different user roles
  const mockCredentials = {
    admin: { email: 'admin@whatsappbot.com', password: 'admin123' },
    tenant: { email: 'tenant@business.com', password: 'tenant123' }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e?.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    
    // Clear error when user starts typing
    if (errors?.[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData?.email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/?.test(formData?.email)) {
      newErrors.email = 'Please enter a valid email address';
    }
    
    if (!formData?.password) {
      newErrors.password = 'Password is required';
    } else if (formData?.password?.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors)?.length === 0;
  };

  const handleSubmit = async (e) => {
    e?.preventDefault();
    
    if (!validateForm()) return;
    
    setIsLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      const { email, password } = formData;
      
      // Check credentials and determine role
      if (email === mockCredentials?.admin?.email && password === mockCredentials?.admin?.password) {
        // Admin login - redirect to admin dashboard (placeholder)
        localStorage.setItem('userRole', 'admin');
        localStorage.setItem('userEmail', email);
        navigate('/tenant-dashboard'); // Using available route
      } else if (email === mockCredentials?.tenant?.email && password === mockCredentials?.tenant?.password) {
        // Tenant login - redirect to tenant dashboard
        localStorage.setItem('userRole', 'tenant');
        localStorage.setItem('userEmail', email);
        navigate('/tenant-dashboard');
      } else {
        // Invalid credentials
        setErrors({
          general: `Invalid credentials. Use admin@whatsappbot.com/admin123 or tenant@business.com/tenant123`
        });
      }
      
      setIsLoading(false);
    }, 1500);
  };

  const handleForgotPassword = () => {
    // Placeholder for forgot password functionality
    alert('Password reset functionality will be implemented in the next phase.');
  };

  const handleCreateAccount = () => {
    navigate('/tenant-registration');
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* General Error Message */}
        {errors?.general && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-md">
            <div className="flex items-center space-x-2">
              <Icon name="AlertCircle" size={16} className="text-red-600" />
              <p className="text-sm text-red-700">{errors?.general}</p>
            </div>
          </div>
        )}

        {/* Email Input */}
        <Input
          label="Email Address"
          type="email"
          name="email"
          placeholder="Enter your email address"
          value={formData?.email}
          onChange={handleInputChange}
          error={errors?.email}
          required
          disabled={isLoading}
        />

        {/* Password Input */}
        <Input
          label="Password"
          type="password"
          name="password"
          placeholder="Enter your password"
          value={formData?.password}
          onChange={handleInputChange}
          error={errors?.password}
          required
          disabled={isLoading}
        />

        {/* Remember Me Checkbox */}
        <Checkbox
          label="Remember me for 30 days"
          name="rememberMe"
          checked={formData?.rememberMe}
          onChange={handleInputChange}
          disabled={isLoading}
        />

        {/* Sign In Button */}
        <Button
          type="submit"
          variant="default"
          size="lg"
          fullWidth
          loading={isLoading}
          iconName="LogIn"
          iconPosition="right"
        >
          Sign In
        </Button>

        {/* Additional Links */}
        <div className="space-y-3">
          <button
            type="button"
            onClick={handleForgotPassword}
            className="w-full text-center text-sm text-primary hover:text-primary/80 micro-animation"
            disabled={isLoading}
          >
            Forgot your password?
          </button>
          
          <div className="text-center">
            <span className="text-sm text-muted-foreground">Don't have an account? </span>
            <button
              type="button"
              onClick={handleCreateAccount}
              className="text-sm text-primary hover:text-primary/80 font-medium micro-animation"
              disabled={isLoading}
            >
              Create Account
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default LoginForm;