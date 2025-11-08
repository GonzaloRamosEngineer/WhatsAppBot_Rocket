import React, { useState } from 'react';
import Input from '../../../components/ui/Input';
import Select from '../../../components/ui/Select';
import Button from '../../../components/ui/Button';


const MessageFilters = ({ onFilterChange, onExport }) => {
  const [filters, setFilters] = useState({
    dateFrom: '',
    dateTo: '',
    contact: '',
    status: '',
    keyword: ''
  });

  const statusOptions = [
    { value: '', label: 'All Status' },
    { value: 'sent', label: 'Sent' },
    { value: 'delivered', label: 'Delivered' },
    { value: 'read', label: 'Read' },
    { value: 'failed', label: 'Failed' }
  ];

  const handleFilterChange = (field, value) => {
    const newFilters = { ...filters, [field]: value };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  const handleClearFilters = () => {
    const clearedFilters = {
      dateFrom: '',
      dateTo: '',
      contact: '',
      status: '',
      keyword: ''
    };
    setFilters(clearedFilters);
    onFilterChange(clearedFilters);
  };

  return (
    <div className="bg-card border border-border rounded-lg p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-foreground">Filter Messages</h3>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleClearFilters}
            iconName="X"
            iconPosition="left"
          >
            Clear Filters
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={onExport}
            iconName="Download"
            iconPosition="left"
          >
            Export
          </Button>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Input
          type="date"
          label="From Date"
          value={filters?.dateFrom}
          onChange={(e) => handleFilterChange('dateFrom', e?.target?.value)}
          className="w-full"
        />

        <Input
          type="date"
          label="To Date"
          value={filters?.dateTo}
          onChange={(e) => handleFilterChange('dateTo', e?.target?.value)}
          className="w-full"
        />

        <Input
          type="text"
          label="Contact Number"
          placeholder="Search by phone..."
          value={filters?.contact}
          onChange={(e) => handleFilterChange('contact', e?.target?.value)}
          className="w-full"
        />

        <Select
          label="Message Status"
          options={statusOptions}
          value={filters?.status}
          onChange={(value) => handleFilterChange('status', value)}
          className="w-full"
        />

        <Input
          type="text"
          label="Keyword Search"
          placeholder="Search message content..."
          value={filters?.keyword}
          onChange={(e) => handleFilterChange('keyword', e?.target?.value)}
          className="w-full"
        />
      </div>
    </div>
  );
};

export default MessageFilters;