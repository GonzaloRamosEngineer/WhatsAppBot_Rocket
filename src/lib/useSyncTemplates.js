import { useState } from "react";

export function useSyncTemplates() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  async function sync(channelId) {
    setLoading(true);
    try {
      const res = await fetch(
        "/functions/v1/whatsapp-sync-templates",
        {
          method: "POST",
          body: JSON.stringify({ channelId, dryRun: false }),
        }
      );
      const data = await res.json();
      setResult(data);
      return data;
    } finally {
      setLoading(false);
    }
  }

  return { loading, result, sync };
}
