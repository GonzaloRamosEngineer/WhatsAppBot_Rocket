// C:\Projects\WhatsAppBot_Rocket\src\pages\messages-log\components\MessageFilters.jsx
import React, { useState } from 'react';
import Input from '../../../components/ui/Input';
import Select from '../../../components/ui/Select';
import Button from '../../../components/ui/Button';
import Icon from '../../../components/AppIcon';

const MessageFilters = ({ onFilterChange, onExport }) => {
  const [filters, setFilters] = useState({
    dateFrom: '',
    dateTo: '',
    contact: '',
    status: '',
    keyword: ''
  });

  const statusOptions = [
    { value: '', label: 'All Statuses' },
    { value: 'sent', label: 'Sent' },
    { value: 'delivered', label: 'Delivered' },
    { value: 'read', label: 'Read' },
    { value: 'failed', label: 'Failed' },
    { value: 'received', label: 'Received (Inbound)' }
  ];

  const handleFilterChange = (field, value) => {
    const newFilters = { ...filters, [field]: value };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  const handleClearFilters = () => {
    const cleared = { dateFrom: '', dateTo: '', contact: '', status: '', keyword: '' };
    setFilters(cleared);
    onFilterChange(cleared);
  };

  // Contamos filtros activos para UI visual
  const activeCount = Object.values(filters).filter(Boolean).length;

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm mb-6">
      
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-4 gap-4">
        <div className="flex items-center gap-2">
           <div className="bg-indigo-50 p-2 rounded-lg text-indigo-600">
              <Icon name="Filter" size={18} />
           </div>
           <div>
              <h3 className="text-sm font-bold text-slate-800">Filter Messages</h3>
              <p className="text-xs text-slate-500">Refine your search history</p>
           </div>
        </div>

        <div className="flex items-center gap-2">
          {activeCount > 0 && (
             <Button variant="ghost" size="sm" onClick={handleClearFilters} className="text-slate-500 hover:text-red-600">
               <Icon name="X" size={14} className="mr-1"/> Clear ({activeCount})
             </Button>
          )}
          <Button variant="outline" size="sm" onClick={onExport} iconName="Download">
            Export CSV
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Input
          type="date"
          label="From"
          value={filters.dateFrom}
          onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
          className="w-full text-xs"
        />
        <Input
          type="date"
          label="To"
          value={filters.dateTo}
          onChange={(e) => handleFilterChange('dateTo', e.target.value)}
          className="w-full text-xs"
        />
        <Input
          type="text"
          label="Phone / Name"
          placeholder="e.g. 54911..."
          value={filters.contact}
          onChange={(e) => handleFilterChange('contact', e.target.value)}
          iconName="Search"
        />
        <Select
          label="Status"
          options={statusOptions}
          value={filters.status}
          onChange={(val) => handleFilterChange('status', val)}
        />
        <Input
          type="text"
          label="Content Keyword"
          placeholder="Search text..."
          value={filters.keyword}
          onChange={(e) => handleFilterChange('keyword', e.target.value)}
        />
      </div>
    </div>
  );
};

export default MessageFilters;