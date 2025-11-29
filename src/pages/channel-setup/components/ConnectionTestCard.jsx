import React, { useState } from "react";
import Button from "../../../components/ui/Button";
import Icon from "../../../components/AppIcon";

const ConnectionTestCard = ({ credentials, onTestConnection, isConnected }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [testResult, setTestResult] = useState(null);

  const handleTestConnection = async () => {
    if (
      !credentials?.phoneNumberId ||
      !credentials?.wabaId ||
      !credentials?.accessToken
    ) {
      setTestResult({
        success: false,
        message:
          "Completá todos los campos obligatorios antes de probar la conexión.",
      });
      return;
    }

    setIsLoading(true);
    setTestResult(null);

    try {
      // Simulación de llamada de prueba
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Mock de validación
      const mockSuccess =
        credentials?.phoneNumberId === "603634226162508" &&
        credentials?.wabaId === "1200748598356181" &&
        credentials?.accessToken?.startsWith("EAAB");

      const result = {
        success: mockSuccess,
        message: mockSuccess
          ? "¡Conexión exitosa! Tu cuenta de WhatsApp Business está correctamente configurada."
          : "La conexión falló. Revisá tus credenciales e intentá nuevamente.",
        details: mockSuccess
          ? {
              phoneNumber: "+598 93 892 924",
              businessName: credentials.businessName || "Cuenta de negocio",
              verificationStatus: "Verificada",
              lastSync: new Date().toISOString(),
            }
          : {
              error:
                "Access token, Phone Number ID o WABA ID inválidos o sin permisos.",
              suggestion:
                "Verificá en Meta Business Manager que las credenciales sean las correctas.",
            },
      };

      setTestResult(result);
      if (onTestConnection) {
        onTestConnection(result);
      }
    } catch (error) {
      setTestResult({
        success: false,
        message:
          "Ocurrió un error de red al intentar probar la conexión.",
        details: { error: error?.message },
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-card border border-border rounded-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-foreground">
          Prueba de conexión
        </h3>
        {isConnected && (
          <div className="flex items-center space-x-2 text-success">
            <Icon name="CheckCircle" size={20} />
            <span className="text-sm font-medium">Conectado</span>
          </div>
        )}
      </div>
      <p className="text-muted-foreground mb-6">
        Ejecutá una prueba rápida para verificar que la API de WhatsApp Business
        está respondiendo correctamente con las credenciales ingresadas.
      </p>
      <Button
        onClick={handleTestConnection}
        loading={isLoading}
        iconName="Zap"
        iconPosition="left"
        variant="outline"
        className="mb-4"
        disabled={
          !credentials?.phoneNumberId ||
          !credentials?.wabaId ||
          !credentials?.accessToken
        }
      >
        {isLoading ? "Probando conexión..." : "Probar conexión"}
      </Button>
      {testResult && (
        <div
          className={`p-4 rounded-md border ${
            testResult?.success
              ? "bg-success/10 border-success text-success"
              : "bg-destructive/10 border-destructive text-destructive"
          }`}
        >
          <div className="flex items-start space-x-3">
            <Icon
              name={testResult?.success ? "CheckCircle" : "AlertCircle"}
              size={20}
              className="flex-shrink-0 mt-0.5"
            />
            <div className="flex-1">
              <p className="font-medium mb-2">{testResult?.message}</p>

              {testResult?.success && testResult?.details && (
                <div className="space-y-2 text-sm">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    <div>
                      <span className="font-medium">Número:</span>
                      <span className="ml-2">
                        {testResult.details.phoneNumber}
                      </span>
                    </div>
                    <div>
                      <span className="font-medium">Negocio:</span>
                      <span className="ml-2">
                        {testResult.details.businessName}
                      </span>
                    </div>
                    <div>
                      <span className="font-medium">Estado:</span>
                      <span className="ml-2">
                        {testResult.details.verificationStatus}
                      </span>
                    </div>
                    <div>
                      <span className="font-medium">Última sincronización:</span>
                      <span className="ml-2">
                        {new Date(
                          testResult.details.lastSync
                        ).toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {!testResult?.success && testResult?.details && (
                <div className="space-y-2 text-sm">
                  <p>
                    <span className="font-medium">Error:</span>{" "}
                    {testResult.details.error}
                  </p>
                  {testResult.details.suggestion && (
                    <p>
                      <span className="font-medium">Sugerencia:</span>{" "}
                      {testResult.details.suggestion}
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ConnectionTestCard;
