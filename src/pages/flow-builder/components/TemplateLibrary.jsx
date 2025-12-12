// C:\Projects\WhatsAppBot_Rocket\src\pages\flow-builder\components\TemplateLibrary.jsx

import React, { useState, useMemo } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import { TEMPLATE_CATEGORIES, FLOW_TEMPLATES } from '../data/templates'; // Importamos los datos

const TemplateLibrary = ({ 
  isOpen, 
  onClose, 
  onSelectTemplate 
}) => {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Lógica de Filtrado Robusta (Categoría + Búsqueda)
  const filteredTemplates = useMemo(() => {
    return FLOW_TEMPLATES.filter(template => {
      const matchesCategory = selectedCategory === 'all' || template.category === selectedCategory;
      const matchesSearch = 
        template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        template.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        template.keywords.some(k => k.includes(searchQuery.toLowerCase()));
      
      return matchesCategory && matchesSearch;
    });
  }, [selectedCategory, searchQuery]);

  const handleSelectTemplate = (template) => {
    // Clona el template y asigna nuevos metadatos para que sea una instancia fresca
    const templateData = {
      ...template,
      id: Date.now(),
      triggerCount: 0,
      lastUpdated: new Date().toLocaleDateString(),
      isActive: true
    };
    onSelectTemplate(templateData);
    onClose();
  };

  // Helper para colores de complejidad
  const getComplexityColor = (level) => {
    switch (level) {
      case 'Basic': return 'text-green-600 bg-green-50 border-green-100';
      case 'Intermediate': return 'text-blue-600 bg-blue-50 border-blue-100';
      case 'Advanced': return 'text-purple-600 bg-purple-50 border-purple-100';
      default: return 'text-slate-600 bg-slate-50 border-slate-100';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 sm:p-6 animate-in fade-in duration-200">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-6xl max-h-[90vh] flex flex-col overflow-hidden border border-slate-200">
        
        {/* Header con Buscador Integrado */}
        <div className="px-6 py-5 border-b border-slate-100 bg-white shrink-0 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
             <div className="p-2.5 bg-indigo-600 text-white rounded-xl shadow-md shadow-indigo-200">
                <Icon name="BookOpen" size={20} />
             </div>
             <div>
                <h2 className="text-lg font-bold text-slate-800 tracking-tight">Template Marketplace</h2>
                <p className="text-xs text-slate-500 font-medium">Accelerate your workflow with verified blueprints.</p>
             </div>
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto">
             <div className="relative w-full md:w-64">
                <Icon name="Search" size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input 
                  type="text"
                  placeholder="Search templates..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                />
             </div>
             <button 
                onClick={onClose}
                className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 p-2 rounded-full transition-colors"
              >
                <Icon name="X" size={20} />
              </button>
          </div>
        </div>

        <div className="flex flex-col md:flex-row h-full overflow-hidden bg-slate-50/50">
          
          {/* Sidebar de Categorías (Responsivo) */}
          <div className="w-full md:w-64 border-b md:border-b-0 md:border-r border-slate-200 bg-white p-3 flex flex-row md:flex-col gap-1 overflow-x-auto md:overflow-visible shrink-0 custom-scrollbar">
            <div className="px-3 py-2 text-xs font-bold text-slate-400 uppercase tracking-wider hidden md:block">
               Browse by
            </div>
            {TEMPLATE_CATEGORIES.map((category) => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`
                  flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap relative group
                  ${selectedCategory === category.id
                    ? 'bg-indigo-50 text-indigo-700 shadow-sm'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }
                `}
              >
                <Icon 
                  name={category.icon} 
                  size={18} 
                  className={selectedCategory === category.id ? "text-indigo-600" : "text-slate-400 group-hover:text-slate-600"}
                />
                <span>{category.label}</span>
                
                {/* Contador simple */}
                {category.id === 'all' && (
                   <span className="ml-auto text-[10px] bg-white border border-slate-200 px-1.5 rounded text-slate-400">
                      {FLOW_TEMPLATES.length}
                   </span>
                )}
              </button>
            ))}
          </div>

          {/* Grid de Resultados */}
          <div className="flex-1 p-6 overflow-y-auto custom-scrollbar">
            
            {/* Header de Resultados */}
            <div className="mb-4 flex items-center justify-between">
               <h3 className="text-sm font-bold text-slate-700">
                  {searchQuery ? `Searching for "${searchQuery}"` : 
                   TEMPLATE_CATEGORIES.find(c => c.id === selectedCategory)?.label}
               </h3>
               <span className="text-xs text-slate-500">
                  {filteredTemplates.length} templates found
               </span>
            </div>

            {filteredTemplates.length > 0 ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-5">
                {filteredTemplates.map((template) => (
                  <div
                    key={template.id}
                    className="group bg-white border border-slate-200 rounded-xl p-5 hover:border-indigo-300 hover:shadow-md transition-all duration-200 flex flex-col h-full relative"
                  >
                    {/* Tags Flotantes (Nivel + Etiquetas extra) */}
                    <div className="flex flex-wrap gap-2 mb-3">
                       <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${getComplexityColor(template.complexity)}`}>
                          {template.complexity}
                       </span>
                       {template.tags?.map(tag => (
                          <span key={tag} className="text-[10px] font-bold px-2 py-0.5 rounded border bg-amber-50 text-amber-700 border-amber-100">
                             {tag}
                          </span>
                       ))}
                    </div>

                    {/* Contenido Principal */}
                    <div className="flex items-start gap-3 mb-2">
                       <div className="p-2 bg-slate-50 rounded-lg border border-slate-100 shrink-0 group-hover:bg-indigo-50 group-hover:border-indigo-100 transition-colors">
                          <Icon name={template.triggerType === 'keyword' ? 'MessageSquare' : 'Zap'} size={20} className="text-slate-500 group-hover:text-indigo-600" />
                       </div>
                       <div>
                          <h4 className="text-sm font-bold text-slate-800 leading-tight group-hover:text-indigo-700 transition-colors">
                             {template.name}
                          </h4>
                          <p className="text-[11px] text-slate-400 mt-0.5">
                             {template.steps} step{template.steps !== 1 ? 's' : ''} • {template.responses.length} message{template.responses.length !== 1 ? 's' : ''}
                          </p>
                       </div>
                    </div>

                    <p className="text-xs text-slate-500 leading-relaxed mb-4 line-clamp-3 flex-1">
                      {template.description}
                    </p>

                    {/* Preview Miniatura del Mensaje */}
                    <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100 mb-4 group-hover:bg-white group-hover:border-indigo-100 transition-colors">
                       <p className="text-[10px] text-slate-600 italic line-clamp-2 font-mono opacity-80">
                          "{template.responses[0].message}"
                       </p>
                    </div>

                    {/* Footer / Botón */}
                    <div className="mt-auto pt-3 border-t border-slate-50">
                      <Button
                        variant="default"
                        size="sm"
                        iconName="Plus"
                        onClick={() => handleSelectTemplate(template)}
                        className="w-full bg-indigo-600 hover:bg-indigo-700 shadow-sm"
                      >
                        Use Template
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-64 text-center">
                <div className="w-16 h-16 bg-slate-200 rounded-full flex items-center justify-center mb-4 opacity-50">
                   <Icon name="Search" size={32} className="text-slate-500" />
                </div>
                <h3 className="text-sm font-bold text-slate-600">No matching templates</h3>
                <p className="text-sm text-slate-500 mt-1">Try searching for something else or browse "All Templates".</p>
                <button 
                   onClick={() => { setSearchQuery(''); setSelectedCategory('all'); }}
                   className="mt-4 text-xs font-bold text-indigo-600 hover:underline"
                >
                   Clear filters
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TemplateLibrary;