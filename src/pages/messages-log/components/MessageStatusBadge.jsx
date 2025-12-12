import React from 'react';
import Icon from '../../../components/AppIcon';

const MessageStatusBadge = ({ status, direction }) => {
  // Configuración de colores y estilos refinados
  const statusConfig = {
    // Estados de Salida (Outbound)
    accepted: { label: 'Accepted', icon: 'Check', className: 'bg-slate-100 text-slate-600 border-slate-200' },
    sent: { label: 'Sent', icon: 'Check', className: 'bg-blue-50 text-blue-600 border-blue-200' },
    delivered: { label: 'Delivered', icon: 'CheckCircle', className: 'bg-blue-100 text-blue-700 border-blue-200' },
    read: { label: 'Read', icon: 'CheckCircle2', className: 'bg-green-100 text-green-700 border-green-200' },
    failed: { label: 'Failed', icon: 'AlertCircle', className: 'bg-red-50 text-red-600 border-red-200' },
    
    // Estado de Entrada (Inbound)
    received: { label: 'Received', icon: 'ArrowDownLeft', className: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
    
    // Fallback
    pending: { label: 'Pending', icon: 'Clock', className: 'bg-yellow-50 text-yellow-700 border-yellow-200' }
  };

  // Normalizamos
  let safeStatus = (status || 'pending').toLowerCase();
  
  // SI es entrante, ignoramos el status técnico y mostramos "Received" (salvo error)
  if (direction === 'in' || direction === 'inbound') {
      safeStatus = 'received';
  }

  const config = statusConfig[safeStatus] || statusConfig.pending;

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider border ${config.className} shadow-sm`}>
      <Icon name={config.icon} size={10} className="mr-1.5" />
      {config.label}
    </span>
  );
};

export default MessageStatusBadge;