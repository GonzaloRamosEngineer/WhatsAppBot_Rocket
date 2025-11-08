import React, { useState } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';

const FlowPreview = ({ 
  flow, 
  isOpen, 
  onClose 
}) => {
  const [testInput, setTestInput] = useState('');
  const [conversation, setConversation] = useState([]);
  const [isTyping, setIsTyping] = useState(false);

  const handleTestMessage = () => {
    if (!testInput?.trim()) return;

    // Add user message
    const userMessage = {
      id: Date.now(),
      type: 'user',
      message: testInput,
      timestamp: new Date()
    };

    setConversation(prev => [...prev, userMessage]);
    setTestInput('');
    setIsTyping(true);

    // Check if message triggers the flow
    const isTriggered = flow?.triggerType === 'keyword' 
      ? flow?.keywords?.some(keyword => 
          testInput?.toLowerCase()?.includes(keyword?.toLowerCase())
        )
      : flow?.triggerType === 'welcome';

    if (isTriggered) {
      // Simulate bot responses with delays
      flow?.responses?.forEach((response, index) => {
        setTimeout(() => {
          const botMessage = {
            id: Date.now() + index,
            type: 'bot',
            message: response?.message,
            timestamp: new Date()
          };

          setConversation(prev => [...prev, botMessage]);
          
          if (index === flow?.responses?.length - 1) {
            setIsTyping(false);
          }
        }, (response?.delay + index) * 1000);
      });
    } else {
      // No match found
      setTimeout(() => {
        const botMessage = {
          id: Date.now(),
          type: 'bot',
          message: "I didn\'t understand that. Please try again.",
          timestamp: new Date()
        };

        setConversation(prev => [...prev, botMessage]);
        setIsTyping(false);
      }, 1000);
    }
  };

  const handleClearConversation = () => {
    setConversation([]);
    setIsTyping(false);
  };

  const formatTime = (date) => {
    return date?.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  if (!isOpen || !flow) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-300 p-4">
      <div className="bg-card rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div>
            <h2 className="text-xl font-semibold text-foreground">Flow Preview</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Test how "{flow?.name}" will respond to messages
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            iconName="X"
            onClick={onClose}
          />
        </div>

        {/* Flow Information */}
        <div className="p-4 bg-muted border-b border-border">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
              <Icon name="MessageSquare" size={16} className="text-primary" />
            </div>
            <div>
              <h3 className="font-medium text-foreground">{flow?.name}</h3>
              <p className="text-sm text-muted-foreground">
                {flow?.triggerType === 'keyword' && `Keywords: ${flow?.keywords?.join(', ')}`}
                {flow?.triggerType === 'welcome' && 'Triggers on conversation start'}
                {flow?.triggerType === 'fallback' && 'Default fallback response'}
              </p>
            </div>
          </div>
        </div>

        {/* Chat Interface */}
        <div className="flex flex-col h-96">
          {/* Messages Area */}
          <div className="flex-1 p-4 overflow-y-auto bg-gray-50">
            {conversation?.length === 0 ? (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                <div className="text-center">
                  <Icon name="MessageCircle" size={48} className="mx-auto mb-2 opacity-50" />
                  <p>Start typing to test the flow</p>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {conversation?.map((message) => (
                  <div
                    key={message?.id}
                    className={`flex ${message?.type === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`
                        max-w-xs px-4 py-2 rounded-lg
                        ${message?.type === 'user' ?'bg-primary text-primary-foreground' :'bg-white border border-border text-foreground'
                        }
                      `}
                    >
                      <p className="text-sm">{message?.message}</p>
                      <p className={`text-xs mt-1 opacity-70`}>
                        {formatTime(message?.timestamp)}
                      </p>
                    </div>
                  </div>
                ))}
                
                {isTyping && (
                  <div className="flex justify-start">
                    <div className="bg-white border border-border rounded-lg px-4 py-2">
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" />
                        <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                        <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Input Area */}
          <div className="p-4 border-t border-border bg-card">
            <div className="flex space-x-2">
              <input
                type="text"
                placeholder="Type a test message..."
                value={testInput}
                onChange={(e) => setTestInput(e?.target?.value)}
                onKeyPress={(e) => e?.key === 'Enter' && handleTestMessage()}
                className="flex-1 px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
              />
              <Button
                variant="default"
                iconName="Send"
                onClick={handleTestMessage}
                disabled={!testInput?.trim() || isTyping}
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-4 border-t border-border">
          <Button
            variant="outline"
            iconName="RotateCcw"
            iconPosition="left"
            onClick={handleClearConversation}
            disabled={conversation?.length === 0}
          >
            Clear Chat
          </Button>

          <div className="flex items-center space-x-3">
            <Button
              variant="outline"
              onClick={onClose}
            >
              Close
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FlowPreview;