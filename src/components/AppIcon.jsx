// C:\Projects\WhatsAppBot_Rocket\src\components\AppIcon.jsx

import React from "react";
import * as LucideIcons from "lucide-react";

/**
 * Icon wrapper for lucide-react.
 *
 * Uso:
 *   <Icon name="Check" size={16} />
 *   <Icon name="MessageCircle" className="text-primary" />
 */
export default function Icon({ name, size = 16, className = "", ...props }) {
  // Intentamos resolver el icono por nombre
  const LucideIcon = LucideIcons[name];

  // Si no existe, usamos HelpCircle como fallback
  const FallbackIcon = LucideIcons.HelpCircle || (() => null);

  if (!LucideIcon) {
    console.warn(`[AppIcon] Icon "${name}" not found in lucide-react, using HelpCircle`);
    return <FallbackIcon size={size} className={className} {...props} />;
  }

  return <LucideIcon size={size} className={className} {...props} />;
}
