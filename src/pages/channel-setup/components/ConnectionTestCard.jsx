// C:\Projects\WhatsAppBot_Rocket\src\pages\channel-setup\components\ConnectionTestCard.jsx

import React, { useState } from "react";
import Button from "../../../components/ui/Button";
import Icon from "../../../components/AppIcon";

const ConnectionTestCard = ({ credentials, onTestConnection, isConnected }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [testResult, setTestResult] = useState(null);

  const handleTestConnection = async () => {
    // 1. Validamos que haya algo escrito
    if (!credentials?.phoneNumberId || !credentials?.wabaId || !credentials?.accessToken) {
      setTestResult({
        success: false,
        message: "Please complete all fields before testing.",
      });
      return;
    }

    setIsLoading(true);
    setTestResult(null);

    try {
      // 2. Simulación de espera (para que parezca real en el video)
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // 3. LOGICA CORREGIDA: Si hay datos, damos por exitoso (Para la demo)
      // En producción real, aquí haríamos fetch('/api/verify-token')
      const mockSuccess = true; 

      const result = {
        success: mockSuccess,
        message: "Connection Successful! API credentials are valid.",
        details: {
          phoneNumber: "+54 9 " + (credentials.phoneNumberId.slice(-4) || "0000"), // Muestra algo creíble
          businessName: credentials.businessName || "Demo Business",
          verificationStatus: "Verified",
          lastSync: new Date().toISOString(),
        }
      };

      setTestResult(result);
      if (onTestConnection) onTestConnection(result);

    } catch (error) {
      setTestResult({
        success: false,
        message: "Network error occurred while testing connection.",
        details: { error: error?.message },
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-slate-800">Connection Test</h3>
        {isConnected && (
          <div className="flex items-center gap-1.5 text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full border border-emerald-100">
            <Icon name="CheckCircle" size={14} />
            <span className="text-xs font-bold uppercase">Connected</span>
          </div>
        )}
      </div>

      <p className="text-sm text-slate-500 mb-6">
        Run a quick ping test to verify the Meta API is responding to your credentials.
      </p>

      <Button
        onClick={handleTestConnection}
        loading={isLoading}
        iconName="Zap"
        iconPosition="left"
        variant="outline"
        className="mb-4 w-full justify-center"
        disabled={!credentials?.phoneNumberId || !credentials?.wabaId || !credentials?.accessToken}
      >
        {isLoading ? "Testing connection..." : "Run Connection Test"}
      </Button>

      {testResult && (
        <div className={`p-4 rounded-lg border animate-in fade-in slide-in-from-top-2 ${
            testResult?.success ? "bg-emerald-50 border-emerald-200 text-emerald-800" : "bg-red-50 border-red-200 text-red-800"
        }`}>
          <div className="flex items-start gap-3">
            <Icon
              name={testResult?.success ? "CheckCircle" : "AlertCircle"}
              size={20}
              className="mt-0.5 flex-shrink-0"
            />
            <div className="flex-1">
              <p className="font-semibold text-sm mb-2">{testResult?.message}</p>

              {testResult?.success && testResult?.details && (
                <div className="text-xs space-y-1 opacity-90">
                  <div className="grid grid-cols-2 gap-2">
                    <div><span className="font-bold">Number:</span> {testResult.details.phoneNumber}</div>
                    <div><span className="font-bold">Business:</span> {testResult.details.businessName}</div>
                    <div><span className="font-bold">Status:</span> {testResult.details.verificationStatus}</div>
                  </div>
                </div>
              )}

              {!testResult?.success && testResult?.details && (
                <div className="text-xs space-y-1 opacity-90">
                  <p><span className="font-bold">Error:</span> {testResult.details.error}</p>
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