// C:\Projects\WhatsAppBot_Rocket\src\pages\flow-builder\components\FlowEditor.jsx

import React, { useState, useEffect } from "react";
import Icon from "../../../components/AppIcon";
import Button from "../../../components/ui/Button";
import Input from "../../../components/ui/Input";
import Select from "../../../components/ui/Select";

const FlowEditor = ({ flow = null, isOpen, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    triggerType: "keyword",
    keywords: [],
    responses: [{ message: "", delay: 0 }],
    isActive: true,
  });
  const [keywordInput, setKeywordInput] = useState("");
  const [errors, setErrors] = useState({});

  const triggerTypeOptions = [
    {
      value: "keyword",
      label: "Palabras clave",
      description: "Responde cuando el mensaje contiene ciertas palabras",
    },
    {
      value: "welcome",
      label: "Mensaje de bienvenida",
      description:
        "Primer mensaje cuando el usuario inicia la conversación con tu bot",
    },
    {
      value: "fallback",
      label: "Respuesta por defecto",
      description:
        "Se usa cuando ninguna otra regla coincide con el mensaje recibido",
    },
  ];

  useEffect(() => {
    if (flow) {
      setFormData({
        name: flow?.name || "",
        description: flow?.description || "",
        triggerType: flow?.triggerType || "keyword",
        keywords: flow?.keywords || [],
        responses: flow?.responses || [{ message: "", delay: 0 }],
        isActive: flow?.isActive !== undefined ? flow?.isActive : true,
      });
    } else {
      setFormData({
        name: "",
        description: "",
        triggerType: "keyword",
        keywords: [],
        responses: [{ message: "", delay: 0 }],
        isActive: true,
      });
    }
    setErrors({});
  }, [flow, isOpen]);

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
    if (errors?.[field]) {
      setErrors((prev) => ({
        ...prev,
        [field]: "",
      }));
    }
  };

  const handleAddKeyword = () => {
    if (
      keywordInput?.trim() &&
      !formData?.keywords
        ?.map((k) => k.toLowerCase())
        .includes(keywordInput.trim().toLowerCase())
    ) {
      setFormData((prev) => ({
        ...prev,
        keywords: [...prev?.keywords, keywordInput.trim().toLowerCase()],
      }));
      setKeywordInput("");
    }
  };

  const handleRemoveKeyword = (index) => {
    setFormData((prev) => ({
      ...prev,
      keywords: prev?.keywords?.filter((_, i) => i !== index),
    }));
  };

  const handleResponseChange = (index, field, value) => {
    setFormData((prev) => ({
      ...prev,
      responses: prev?.responses?.map((response, i) =>
        i === index ? { ...response, [field]: value } : response
      ),
    }));
  };

  const handleAddResponse = () => {
    setFormData((prev) => ({
      ...prev,
      responses: [...prev?.responses, { message: "", delay: 0 }],
    }));
  };

  const handleRemoveResponse = (index) => {
    if (formData?.responses?.length > 1) {
      setFormData((prev) => ({
        ...prev,
        responses: prev?.responses?.filter((_, i) => i !== index),
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData?.name?.trim()) {
      newErrors.name = "El nombre del flujo es obligatorio.";
    }

    if (
      formData?.triggerType === "keyword" &&
      formData?.keywords?.length === 0
    ) {
      newErrors.keywords =
        "Para flujos por palabras clave, agregá al menos una palabra.";
    }

    if (formData?.responses?.some((response) => !response?.message?.trim())) {
      newErrors.responses =
        "Todos los mensajes de respuesta deben estar cargados.";
    }

    setErrors(newErrors);
    return Object.keys(newErrors)?.length === 0;
  };

  const handleSave = () => {
    if (validateForm()) {
      const flowData = {
        ...formData,
        id: flow?.id || Date.now(), // ID local para el JSON de reglas
        triggerCount: flow?.triggerCount || 0,
        lastUpdated: new Date().toLocaleDateString(),
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
              {flow ? "Editar flujo" : "Crear nuevo flujo"}
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              Configurá las respuestas automáticas de tu bot de WhatsApp
              (motor rules_v1).
            </p>
          </div>
          <Button variant="ghost" size="icon" iconName="X" onClick={onClose} />
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          <div className="space-y-6">
            {/* Información básica */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-foreground">
                Información básica
              </h3>

              <Input
                label="Nombre del flujo"
                placeholder="Ej: Saludo inicial"
                value={formData?.name}
                onChange={(e) => handleInputChange("name", e.target.value)}
                error={errors?.name}
                required
              />

              <Input
                label="Descripción (opcional)"
                placeholder="Describe brevemente qué hace este flujo"
                value={formData?.description}
                onChange={(e) =>
                  handleInputChange("description", e.target.value)
                }
              />

              <Select
                label="Tipo de disparador"
                description="Elegí cómo se va a activar este flujo"
                options={triggerTypeOptions}
                value={formData?.triggerType}
                onChange={(value) => handleInputChange("triggerType", value)}
              />

              {formData.triggerType !== "keyword" && (
                <p className="text-xs text-muted-foreground">
                  Para flujos de tipo <b>Bienvenida</b> o <b>Fallback</b> se
                  ignoran las palabras clave. El motor los usa según contexto y
                  orden de evaluación.
                </p>
              )}
            </div>

            {/* Palabras clave */}
            {formData?.triggerType === "keyword" && (
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-foreground">
                  Palabras clave
                </h3>

                <p className="text-xs text-muted-foreground">
                  El motor intentará matchear estas palabras dentro del mensaje
                  del usuario (búsqueda por <b>contiene</b>, sin distinción de
                  mayúsculas/minúsculas).
                </p>

                <div className="flex space-x-2">
                  <Input
                    placeholder="Ej: precio, soporte, demo"
                    value={keywordInput}
                    onChange={(e) => setKeywordInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleAddKeyword()}
                    className="flex-1"
                  />
                  <Button
                    variant="outline"
                    iconName="Plus"
                    onClick={handleAddKeyword}
                  >
                    Agregar
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
                  <p className="text-sm text-destructive">
                    {errors?.keywords}
                  </p>
                )}
              </div>
            )}

            {/* Respuestas */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-foreground">
                  Respuestas automáticas
                </h3>
                <Button
                  variant="outline"
                  size="sm"
                  iconName="Plus"
                  iconPosition="left"
                  onClick={handleAddResponse}
                >
                  Agregar respuesta
                </Button>
              </div>

              <div className="space-y-4">
                {formData?.responses?.map((response, index) => (
                  <div
                    key={index}
                    className="border border-border rounded-lg p-4"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-medium text-foreground">
                        Respuesta {index + 1}
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
                        placeholder="Escribí el mensaje que querés enviar"
                        value={response?.message}
                        onChange={(e) =>
                          handleResponseChange(
                            index,
                            "message",
                            e.target.value
                          )
                        }
                        className="w-full px-3 py-2 border border-border rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-ring"
                        rows={3}
                      />

                      <Input
                        label="Delay (segundos)"
                        type="number"
                        placeholder="0"
                        value={response?.delay}
                        onChange={(e) =>
                          handleResponseChange(
                            index,
                            "delay",
                            parseInt(e.target.value, 10) || 0
                          )
                        }
                        min={0}
                        max={60}
                      />
                    </div>
                  </div>
                ))}
              </div>

              {errors?.responses && (
                <p className="text-sm text-destructive">
                  {errors?.responses}
                </p>
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
              onChange={(e) =>
                handleInputChange("isActive", e.target.checked)
              }
              className="w-4 h-4 text-primary border-border rounded focus:ring-ring"
            />
            <label htmlFor="isActive" className="text-sm text-foreground">
              Activar flujo inmediatamente
            </label>
          </div>

          <div className="flex items-center space-x-3">
            <Button variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button
              variant="default"
              iconName="Save"
              iconPosition="left"
              onClick={handleSave}
            >
              Guardar flujo
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FlowEditor;
