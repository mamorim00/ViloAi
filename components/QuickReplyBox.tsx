'use client';

import { useState } from 'react';
import { Send, X } from 'lucide-react';

interface QuickReplyBoxProps {
  onSend: (text: string) => Promise<void>;
  onCancel: () => void;
  placeholder?: string;
  initialValue?: string; // Pre-fill with AI suggestion
}

export default function QuickReplyBox({ onSend, onCancel, placeholder = 'Type your reply...', initialValue = '' }: QuickReplyBoxProps) {
  const [replyText, setReplyText] = useState(initialValue);
  const [sending, setSending] = useState(false);

  const handleSend = async () => {
    if (!replyText.trim() || sending) return;

    setSending(true);
    try {
      await onSend(replyText.trim());
      setReplyText('');
    } catch (error) {
      console.error('Error sending reply:', error);
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      handleSend();
    }
    if (e.key === 'Escape') {
      onCancel();
    }
  };

  return (
    <div className="mt-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
      <textarea
        value={replyText}
        onChange={(e) => setReplyText(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
        rows={3}
        disabled={sending}
      />
      <div className="flex items-center justify-between mt-2">
        <p className="text-xs text-gray-500">
          Press <kbd className="px-1 bg-gray-200 rounded">Ctrl</kbd>+<kbd className="px-1 bg-gray-200 rounded">Enter</kbd> to send
        </p>
        <div className="flex items-center space-x-2">
          <button
            onClick={onCancel}
            disabled={sending}
            className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800 disabled:opacity-50"
          >
            <X className="h-4 w-4" />
          </button>
          <button
            onClick={handleSend}
            disabled={!replyText.trim() || sending}
            className="flex items-center space-x-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send className="h-4 w-4" />
            <span className="text-sm font-medium">{sending ? 'Sending...' : 'Send'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
