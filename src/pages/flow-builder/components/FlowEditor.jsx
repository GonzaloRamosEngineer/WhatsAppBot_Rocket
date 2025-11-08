import React, { useState, useEffect } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import Select from '../../../components/ui/Select';

const FlowEditor = ({ 
  flow = null, 
  isOpen, 
  onClose, 
  onSave 
}) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    triggerType: 'keyword',
    keywords: [],
    responses: [{ message: '', delay: 0 }],
    isActive: true
  });
  const [keywordInput, setKeywordInput] = useState('');
  const [errors, setErrors] = useState({});

  const triggerTypeOptions = [
    { value: 'keyword', label: 'Keyword Trigger', description: 'Respond to specific words or phrases' },
    { value: 'welcome', label: 'Welcome Message', description: 'First message when conversation starts' },
    { value: 'fallback', label: 'Fallback Response', description: 'Default response when no other flow matches' }
  ];

  useEffect(() => {
    if (flow) {
      setFormData({
        name: flow?.name || '',
        description: flow?.description || '',
        triggerType: flow?.triggerType || 'keyword',
        keywords: flow?.keywords || [],
        responses: flow?.responses || [{ message: '', delay: 0 }],
        isActive: flow?.isActive !== undefined ? flow?.isActive : true
      });
    } else {
      setFormData({
        name: '',
        description: '',
        triggerType: 'keyword',
        keywords: [],
        responses: [{ message: '', delay: 0 }],
        isActive: true
      });
    }
    setErrors({});
  }, [flow, isOpen]);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    if (errors?.[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  const handleAddKeyword = () => {
    if (keywordInput?.trim() && !formData?.keywords?.includes(keywordInput?.trim()?.toLowerCase())) {
      setFormData(prev => ({
        ...prev,
        keywords: [...prev?.keywords, keywordInput?.trim()?.toLowerCase()]
      }));
      setKeywordInput('');
    }
  };

  const handleRemoveKeyword = (index) => {
    setFormData(prev => ({
      ...prev,
      keywords: prev?.keywords?.filter((_, i) => i !== index)
    }));
  };

  const handleResponseChange = (index, field, value) => {
    setFormData(prev => ({
      ...prev,
      responses: prev?.responses?.map((response, i) => 
        i === index ? { ...response, [field]: value } : response
      )
    }));
  };

  const handleAddResponse = () => {
    setFormData(prev => ({
      ...prev,
      responses: [...prev?.responses, { message: '', delay: 0 }]
    }));
  };

  const handleRemoveResponse = (index) => {
    if (formData?.responses?.length > 1) {
      setFormData(prev => ({
        ...prev,
        responses: prev?.responses?.filter((_, i) => i !== index)
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData?.name?.trim()) {
      newErrors.name = 'Flow name is required';
    }

    if (formData?.triggerType === 'keyword' && formData?.keywords?.length === 0) {
      newErrors.keywords = 'At least one keyword is required for keyword triggers';
    }

    if (formData?.responses?.some(response => !response?.message?.trim())) {
      newErrors.responses = 'All response messages must be filled';
    }

    setErrors(newErrors);
    return Object.keys(newErrors)?.length === 0;
  };

  const handleSave = () => {
    if (validateForm()) {
      const flowData = {
        ...formData,
        id: flow?.id || Date.now(),
        triggerCount: flow?.triggerCount || 0,
        lastUpdated: new Date()?.toLocaleDateString()
      };
      onSave(flowData);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-300 p-4">
      <div className="bg-card rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div>
            <h2 className="text-xl font-semibold text-foreground">
              {flow ? 'Edit Flow' : 'Create New Flow'}
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              Configure automated responses for your WhatsApp bot
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            iconName="X"
            onClick={onClose}
          />
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          <div className="space-y-6">
            {/* Basic Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-foreground">Basic Information</h3>
              
              <Input
                label="Flow Name"
                placeholder="Enter flow name"
                value={formData?.name}
                onChange={(e) => handleInputChange('name', e?.target?.value)}
                error={errors?.name}
                required
              />

              <Input
                label="Description"
                placeholder="Describe what this flow does"
                value={formData?.description}
                onChange={(e) => handleInputChange('description', e?.target?.value)}
              />

              <Select
                label="Trigger Type"
                description="Choose how this flow will be activated"
                options={triggerTypeOptions}
                value={formData?.triggerType}
                onChange={(value) => handleInputChange('triggerType', value)}
              />
            </div>

            {/* Trigger Configuration */}
            {formData?.triggerType === 'keyword' && (
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-foreground">Keywords</h3>
                
                <div className="flex space-x-2">
                  <Input
                    placeholder="Enter keyword"
                    value={keywordInput}
                    onChange={(e) => setKeywordInput(e?.target?.value)}
                    onKeyPress={(e) => e?.key === 'Enter' && handleAddKeyword()}
                    className="flex-1"
                  />
                  <Button
                    variant="outline"
                    iconName="Plus"
                    onClick={handleAddKeyword}
                  >
                    Add
                  </Button>
                </div>

                {formData?.keywords?.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {formData?.keywords?.map((keyword, index) => (
                      <div
                        key={index}
                        className="flex items-center space-x-2 bg-primary/10 text-primary px-3 py-1 rounded-md"
                      >
                        <span className="text-sm">{keyword}</span>
                        <button
                          onClick={() => handleRemoveKeyword(index)}
                          className="text-primary hover:text-primary/70"
                        >
                          <Icon name="X" size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {errors?.keywords && (
                  <p className="text-sm text-destructive">{errors?.keywords}</p>
                )}
              </div>
            )}

            {/* Responses */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-foreground">Responses</h3>
                <Button
                  variant="outline"
                  size="sm"
                  iconName="Plus"
                  iconPosition="left"
                  onClick={handleAddResponse}
                >
                  Add Response
                </Button>
              </div>

              <div className="space-y-4">
                {formData?.responses?.map((response, index) => (
                  <div key={index} className="border border-border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-medium text-foreground">
                        Response {index + 1}
                      </span>
                      {formData?.responses?.length > 1 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          iconName="Trash2"
                          onClick={() => handleRemoveResponse(index)}
                        />
                      )}
                    </div>

                    <div className="space-y-3">
                      <textarea
                        placeholder="Enter response message"
                        value={response?.message}
                        onChange={(e) => handleResponseChange(index, 'message', e?.target?.value)}
                        className="w-full px-3 py-2 border border-border rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-ring"
                        rows={3}
                      />

                      <Input
                        label="Delay (seconds)"
                        type="number"
                        placeholder="0"
                        value={response?.delay}
                        onChange={(e) => handleResponseChange(index, 'delay', parseInt(e?.target?.value) || 0)}
                        min={0}
                        max={60}
                      />
                    </div>
                  </div>
                ))}
              </div>

              {errors?.responses && (
                <p className="text-sm text-destructive">{errors?.responses}</p>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-border">
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="isActive"
              checked={formData?.isActive}
              onChange={(e) => handleInputChange('isActive', e?.target?.checked)}
              className="w-4 h-4 text-primary border-border rounded focus:ring-ring"
            />
            <label htmlFor="isActive" className="text-sm text-foreground">
              Activate flow immediately
            </label>
          </div>

          <div className="flex items-center space-x-3">
            <Button
              variant="outline"
              onClick={onClose}
            >
              Cancel
            </Button>
            <Button
              variant="default"
              iconName="Save"
              iconPosition="left"
              onClick={handleSave}
            >
              Save Flow
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FlowEditor;