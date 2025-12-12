// C:\Projects\WhatsAppBot_Rocket\src\pages\tenant-dashboard\components\OnboardingChecklist.jsx

import React from "react";
import { useNavigate } from "react-router-dom";
import Icon from "../../../components/AppIcon";
import Button from "../../../components/ui/Button";

const OnboardingChecklist = ({
  onComplete,
  isChannelConnected = false,
  hasFlows = false,
  hasMessages = false,
}) => {
  const navigate = useNavigate();

  const steps = [
    {
      id: "profile",
      title: "Complete Workspace Profile",
      description: "Set up your basic business details.",
      icon: "User",
      completed: true, // Asumimos creado
    },
    {
      id: "channel",
      title: "Connect WhatsApp Channel",
      description: "Link your phone number to start messaging.",
      icon: "MessageSquare",
      completed: isChannelConnected,
      action: "Setup Channel",
    },
    {
      id: "flow",
      title: "Create First Automation",
      description: "Design a welcome message flow.",
      icon: "GitBranch",
      completed: hasFlows,
      action: "Go to Builder",
    },
    {
      id: "test",
      title: "Send Test Message",
      description: "Verify everything works with a real message.",
      icon: "Send",
      completed: hasMessages,
      action: "Send Test",
    },
  ];

  const completedCount = steps.filter((s) => s.completed).length;
  const progressPercentage = (completedCount / steps.length) * 100;

  // Lógica para determinar cuál es el "Siguiente Paso" activo
  const activeStepIndex = steps.findIndex((s) => !s.completed);
  const isAllComplete = completedCount === steps.length;

  const handleStepAction = (stepId) => {
    switch (stepId) {
      case "channel": navigate("/channel-setup"); break;
      case "flow": navigate("/flow-builder"); break;
      case "test": navigate("/messages-log"); break; // O donde prefieras enviar la prueba
      default: break;
    }
    if (onComplete) onComplete(stepId);
  };

  if (isAllComplete) return null;

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
      
      {/* Header & Progress */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wide">
            Getting Started
          </h3>
          <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded-full">
            {Math.round(progressPercentage)}% Complete
          </span>
        </div>
        <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
          <div
            className="bg-gradient-to-r from-indigo-500 to-purple-500 h-2 rounded-full transition-all duration-500 ease-out"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
      </div>

      {/* Timeline Steps */}
      <div className="space-y-0 relative">
        {/* Línea vertical de fondo (conector) */}
        <div className="absolute left-[19px] top-4 bottom-4 w-0.5 bg-slate-100 -z-0" />

        {steps.map((step, index) => {
          const isActive = index === activeStepIndex;
          const isCompleted = step.completed;
          const isFuture = !isActive && !isCompleted;

          return (
            <div key={step.id} className="relative flex gap-4 pb-6 last:pb-0 z-10 group">
              
              {/* Icono del Paso */}
              <div 
                className={`
                  w-10 h-10 rounded-full flex items-center justify-center shrink-0 border-2 transition-all duration-300
                  ${isCompleted 
                    ? "bg-green-500 border-green-500 text-white" 
                    : isActive 
                      ? "bg-white border-indigo-600 text-indigo-600 shadow-md shadow-indigo-100 scale-110" 
                      : "bg-white border-slate-200 text-slate-300"
                  }
                `}
              >
                <Icon name={isCompleted ? "Check" : step.icon} size={isCompleted ? 16 : 18} />
              </div>

              {/* Contenido */}
              <div className={`flex-1 pt-1 ${isCompleted ? "opacity-50 grayscale transition-all duration-300 group-hover:opacity-80 group-hover:grayscale-0" : ""}`}>
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className={`text-sm font-bold ${isActive ? "text-slate-800" : "text-slate-600"}`}>
                      {step.title}
                    </h4>
                    <p className="text-xs text-slate-500 mt-0.5 max-w-[220px] leading-relaxed">
                      {step.description}
                    </p>
                  </div>

                  {/* Botón de Acción (Solo si es el paso activo o pendiente) */}
                  {!isCompleted && step.action && (
                    <Button
                      variant={isActive ? "default" : "outline"}
                      size="sm"
                      onClick={() => handleStepAction(step.id)}
                      className={`
                        text-xs px-3 h-8 shadow-sm
                        ${isActive ? "bg-indigo-600 hover:bg-indigo-700 text-white" : "text-slate-400 border-slate-200 hover:text-slate-600"}
                      `}
                    >
                      {step.action}
                    </Button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer Motivacional (Si hay progreso pero falta) */}
      {completedCount > 0 && !isAllComplete && (
        <div className="mt-6 pt-4 border-t border-slate-100 text-center">
          <p className="text-xs text-slate-400">
            👋 You're almost there! Complete these steps to launch your bot.
          </p>
        </div>
      )}
    </div>
  );
};

export default OnboardingChecklist;