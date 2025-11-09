import { useState } from "react";

// Dataset simulado
const mockTenants = [
  { id: "t-digitalmatch", name: "DigitalMatch", slug: "digitalmatch" },
];
const mockChannel = {
  id: "ch-1",
  tenant_id: "t-digitalmatch",
  waba_id: "waba_123456789",
  phone_number_id: "123456789012345",
  display_phone_number: "+1 555 555 5555",
  status: "active",
};
const mockFlows = [
  {
    id: "flow-1",
    tenant_id: "t-digitalmatch",
    name: "Welcome Flow",
    active: true,
    draft: {
      nodes: [
        { id: "n1", type: "start", data: { label: "Inicio" } },
        { id: "n2", type: "keyword", data: { label: "Hola" } },
        { id: "n3", type: "reply", data: { label: "¡Bienvenido a DigitalMatch!" } },
      ],
      edges: [
        { id: "e1", source: "n1", target: "n2" },
        { id: "e2", source: "n2", target: "n3" },
      ],
    },
  },
];
const mockMessages = Array.from({ length: 15 }).map((_, i) => ({
  id: i + 1,
  tenant_id: "t-digitalmatch",
  direction: i % 2 === 0 ? "in" : "out",
  from: i % 2 === 0 ? "+59891234567" : "DigitalMatch",
  to: i % 2 === 0 ? "DigitalMatch" : "+59891234567",
  body: i % 2 === 0 ? "Hola, ¿están atendiendo?" : "¡Hola! Sí, estamos online 😄",
  status: ["sent", "delivered", "read"][i % 3],
  created_at: new Date(Date.now() - i * 60000).toISOString(),
}));

export function useMockApi() {
  const [messages, setMessages] = useState(mockMessages);
  const [flows, setFlows] = useState(mockFlows);

  const getMessages = (filter = {}) => {
    let result = [...messages];
    if (filter.direction) result = result.filter((m) => m.direction === filter.direction);
    return result;
  };

  const sendMessage = (to, body) => {
    const newMsg = {
      id: messages.length + 1,
      tenant_id: "t-digitalmatch",
      direction: "out",
      from: "DigitalMatch",
      to,
      body,
      status: "sent",
      created_at: new Date().toISOString(),
    };
    setMessages([newMsg, ...messages]);
    return newMsg;
  };

  const createFlow = (name, draft) => {
    const newFlow = {
      id: `flow-${Date.now()}`,
      tenant_id: "t-digitalmatch",
      name,
      active: true,
      draft,
    };
    setFlows([...flows, newFlow]);
    return newFlow;
  };

  const testConnection = () => {
    return { ok: true, timestamp: new Date().toISOString() };
  };

  return {
    tenant: mockTenants[0],
    channel: mockChannel,
    messages,
    flows,
    getMessages,
    sendMessage,
    createFlow,
    testConnection,
  };
}
