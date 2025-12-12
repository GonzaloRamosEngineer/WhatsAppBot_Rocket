// C:\Projects\WhatsAppBot_Rocket\src\pages\channel-setup\components\ConnectionTestCard.jsx
import React, { useState } from "react";
import Button from "../../../components/ui/Button";
import Icon from "../../../components/AppIcon";

const ConnectionTestCard = ({ credentials, onTestConnection, isConnected }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [testResult, setTestResult] = useState(null);

  const handleTestConnection = async () => {
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
      // Simulation delay
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Mock Validation Logic (Keep existing logic)
      const mockSuccess =
        credentials?.phoneNumberId === "603634226162508" &&
        credentials?.wabaId === "1200748598356181" &&
        credentials?.accessToken?.startsWith("EAAB");

      const result = {
        success: mockSuccess,
        message: mockSuccess
          ? "Connection Successful! Your WhatsApp Business account is reachable."
          : "Connection Failed. Please check your credentials.",
        details: mockSuccess
          ? {
              phoneNumber: "+598 93 892 924",
              businessName: credentials.businessName || "My Business",
              verificationStatus: "Verified",
              lastSync: new Date().toISOString(),
            }
          : {
              error: "Invalid Access Token, Phone Number ID or WABA ID.",
              suggestion: "Verify credentials in Meta Business Manager.",
            },
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
        <div className={`p-4 rounded-lg border ${
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
                  {testResult.details.suggestion && (
                    <p><span className="font-bold">Tip:</span> {testResult.details.suggestion}</p>
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