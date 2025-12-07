// C:\Projects\WhatsAppBot_Rocket\src\pages\flow-builder\components\MetaTemplateBlueprints.jsx

import React, { useEffect, useState } from "react";
import Icon from "../../../components/AppIcon";
import Button from "../../../components/ui/Button";
import { useAuth } from "../../../lib/AuthProvider";
import { useActivateTemplateBlueprint } from "../../../lib/useActivateTemplateBlueprint";

const sectors = [
  { id: "all", label: "Todos los sectores", icon: "Grid3X3" },
  { id: "telecom", label: "Telecom", icon: "Globe2" },
  { id: "club", label: "Clubes", icon: "Users" },
  { id: "fundacion", label: "Fundaciones", icon: "HeartHandshake" },
  { id: "negocio", label: "Negocios", icon: "Store" }
];

export default function MetaTemplateBlueprints({
  isOpen,
  onClose
}) {
  const { supabase } = useAuth();
  const [selectedSector, setSelectedSector] = useState("all");
  const [blueprints, setBlueprints] = useState([]);
  const [loadingList, setLoadingList] = useState(true);

  const {
    activate,
    loading: activating,
    result,
    error
  } = useActivateTemplateBlueprint();

  const activeChannel = localStorage.getItem("activeChannel");

  // 🔽 cargar blueprints
  const loadBlueprints = async () => {
    setLoadingList(true);

    const query = supabase
      .from("template_blueprints")
      .select("*")
      .order("created_at", { ascending: false });

    if (selectedSector !== "all") {
      query.eq("sector", selectedSector);
    }

    const { data, error } = await query;

    if (error) {
      console.error("[Blueprints] error cargando", error);
      setBlueprints([]);
    } else {
      setBlueprints(data || []);
    }

    setLoadingList(false);
  };

  useEffect(() => {
    if (isOpen) loadBlueprints();
  }, [selectedSector, isOpen]);

  const handleActivate = async (bp) => {
    if (!activeChannel) {
      alert("No hay un canal activo seleccionado.");
      return;
    }

    const res = await activate(bp.id, activeChannel);

    if (res?.id || res?.success) {
      alert("📨 Plantilla enviada a Meta correctamente.");
      onClose();
    } else {
      alert("⚠ Hubo un problema al activar la plantilla.");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-300">
      <div className="bg-card rounded-lg shadow-xl w-full max-w-5xl max-h-[90vh] overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div>
            <h2 className="text-xl font-semibold">Plantillas Meta</h2>
            <p className="text-sm text-muted-foreground">
              Seleccioná un blueprint para crear una plantilla oficial en Meta.
            </p>
          </div>

          <Button variant="ghost" size="icon" iconName="X" onClick={onClose} />
        </div>

        <div className="flex h-[calc(90vh-140px)]">

          {/* Sidebar de sectores */}
          <div className="w-60 border-r border-border p-4">
            <h3 className="text-sm font-medium mb-3">Sectores</h3>

            <div className="space-y-1">
              {sectors.map((sec) => (
                <button
                  key={sec.id}
                  onClick={() => setSelectedSector(sec.id)}
                  className={`
                    w-full flex items-center space-x-3 px-3 py-2 rounded-md text-left micro-animation
                    ${
                      selectedSector === sec.id
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted"
                    }
                  `}
                >
                  <Icon name={sec.icon} size={16} />
                  <span>{sec.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Contenido */}
          <div className="flex-1 overflow-y-auto p-6">
            {loadingList ? (
              <p className="text-center text-muted-foreground">Cargando...</p>
            ) : blueprints.length === 0 ? (
              <p className="text-center text-muted-foreground">
                No hay blueprints en este sector.
              </p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {blueprints.map((bp) => (
                  <div key={bp.id} className="border border-border rounded-lg p-6 bg-card">

                    <h3 className="text-lg font-semibold mb-1">{bp.name}</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      {bp.use_case} — {bp.sector}
                    </p>

                    <div className="bg-muted rounded p-3 mb-4">
                      <p className="text-sm whitespace-pre-line">{bp.body}</p>
                    </div>

                    <Button
                      variant="default"
                      iconName="Send"
                      onClick={() => handleActivate(bp)}
                      disabled={activating}
                    >
                      {activating ? "Creando..." : "Crear en Meta"}
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
