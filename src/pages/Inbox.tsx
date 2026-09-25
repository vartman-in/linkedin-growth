import { useState } from 'react';
import { useApp } from '../store';
import {
  MessageSquare, Send, CheckCircle2, AlertCircle,
  User, Clock, ThumbsUp, HelpCircle, XCircle,
  ArrowRight, Sparkles, Shield
} from 'lucide-react';

export default function InboxPage() {
  const { state, dispatch } = useApp();
  const [selectedConvId, setSelectedConvId] = useState<string | null>(
    state.conversations.find(c => c.unread)?.id || state.conversations[0]?.id || null
  );
  const [replyText, setReplyText] = useState('');
  const [showSuggested, setShowSuggested] = useState(true);

  const selectedConv = state.conversations.find(c => c.id === selectedConvId);

  const classificationIcons: Record<string, typeof MessageSquare> = {
    interested: ThumbsUp,
    question: HelpCircle,
    objection: AlertCircle,
    'not-now': Clock,
    no: XCircle,
    meeting: CheckCircle2,
    pricing: HelpCircle,
    unknown: MessageSquare,
  };

  const classificationColors: Record<string, string> = {
    interested: 'bg-success-light text-success',
    question: 'bg-blue-100 text-blue-700',
    objection: 'bg-warning-light text-warning',
    'not-now': 'bg-gray-100 text-gray-600',
    no: 'bg-danger-light text-danger',
    meeting: 'bg-green-100 text-green-700',
    pricing: 'bg-purple-100 text-purple-700',
    unknown: 'bg-gray-100 text-gray-500',
  };

  const handleSendReply = () => {
    if (!replyText.trim() || !selectedConvId) return;
    dispatch({ type: 'SEND_REPLY', conversationId: selectedConvId, message: replyText });
    setReplyText('');
  };

  const handleUseSuggested = () => {
    if (selectedConv?.suggestedResponse) {
      setReplyText(selectedConv.suggestedResponse);
    }
  };

  return (
    <div className="max-w-6xl mx-auto animate-fade-in">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Inbox</h1>
        <p className="text-gray-500 text-sm mt-1">Monitor conversations and craft responses with AI assistance</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Conversation List */}
        <div className="space-y-2">
          {state.conversations.map(conv => {
            const ClassIcon = classificationIcons[conv.classification] || MessageSquare;
            const lastMsg = conv.messages[conv.messages.length - 1];
            return (
              <button
                key={conv.id}
                onClick={() => setSelectedConvId(conv.id)}
                className={`w-full text-left p-3.5 rounded-xl border transition-all
                  ${conv.id === selectedConvId ? 'border-primary bg-primary-light/50' : 'border-gray-200 bg-white hover:border-gray-300'}
                  ${conv.unread ? 'ring-2 ring-primary/20' : ''}`}
              >
                <div className="flex items-start justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-gradient-to-br from-primary to-accent rounded-full flex items-center justify-center">
                      <span className="text-white text-xs font-bold">
                        {conv.prospectName.split(' ').map(n => n[0]).join('')}
                      </span>
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-gray-800">{conv.prospectName}</h4>
                      <p className="text-xs text-gray-400">{conv.messages.length} messages</p>
                    </div>
                  </div>
                  {conv.unread && (
                    <span className="w-2.5 h-2.5 bg-primary rounded-full" />
                  )}
                </div>
                <p className="text-xs text-gray-500 truncate mb-2">{lastMsg?.content}</p>
                <div className="flex items-center justify-between">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium flex items-center gap-1 ${classificationColors[conv.classification]}`}>
                    <ClassIcon className="w-3 h-3" />
                    {conv.classification}
                  </span>
                  <span className="text-xs text-gray-400 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {new Date(conv.lastMessage).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Conversation Detail */}
        {selectedConv ? (
          <div className="lg:col-span-2 flex flex-col bg-white rounded-xl border border-gray-200 overflow-hidden" style={{ minHeight: '600px' }}>
            {/* Conversation Header */}
            <div className="p-4 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-primary to-accent rounded-full flex items-center justify-center">
                  <span className="text-white font-bold text-sm">
                    {selectedConv.prospectName.split(' ').map(n => n[0]).join('')}
                  </span>
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-gray-800">{selectedConv.prospectName}</h3>
                  <p className="text-xs text-gray-500">
                    {state.prospects.find(p => p.id === selectedConv.prospectId)?.role} @ {state.prospects.find(p => p.id === selectedConv.prospectId)?.company}
                  </p>
                </div>
              </div>
              <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${classificationColors[selectedConv.classification]}`}>
                {selectedConv.classification}
              </span>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-auto p-4 space-y-4">
              {selectedConv.messages.map(msg => (
                <div key={msg.id} className={`flex ${msg.from === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[75%] rounded-2xl px-4 py-2.5 ${
                    msg.from === 'user'
                      ? 'bg-primary text-white rounded-br-md'
                      : 'bg-gray-100 text-gray-800 rounded-bl-md'
                  }`}>
                    <p className="text-sm leading-relaxed">{msg.content}</p>
                    <p className={`text-xs mt-1 ${msg.from === 'user' ? 'text-white/60' : 'text-gray-400'}`}>
                      {new Date(msg.timestamp).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* AI Suggestion */}
            {showSuggested && selectedConv.suggestedResponse && (
              <div className="mx-4 mb-3 bg-accent-light/50 border border-accent/20 rounded-xl p-3">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-accent" />
                    <span className="text-xs font-semibold text-accent">Suggested Response</span>
                  </div>
                  <button onClick={() => setShowSuggested(false)} className="text-gray-400 hover:text-gray-600">
                    <XCircle className="w-3.5 h-3.5" />
                  </button>
                </div>
                <p className="text-sm text-gray-700 mb-2">{selectedConv.suggestedResponse}</p>
                {selectedConv.responseReasoning && (
                  <p className="text-xs text-gray-500 italic mb-2">Why: {selectedConv.responseReasoning}</p>
                )}
                <button
                  onClick={handleUseSuggested}
                  className="text-xs text-accent font-medium hover:text-accent/80 flex items-center gap-1"
                >
                  Use this response <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            )}

            {/* Reply Input */}
            <div className="p-4 border-t border-gray-100">
              <div className="flex items-start gap-2">
                <div className="flex-1 relative">
                  <textarea
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder="Type your reply..."
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    rows={2}
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <button
                    onClick={handleSendReply}
                    disabled={!replyText.trim()}
                    className="p-2.5 bg-primary text-white rounded-xl hover:bg-primary-dark disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                  <div className="flex items-center gap-1 px-2">
                    <Shield className="w-3 h-3 text-gray-400" />
                    <span className="text-[10px] text-gray-400">Requires approval</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="lg:col-span-2 flex items-center justify-center bg-white rounded-xl border border-gray-200" style={{ minHeight: '400px' }}>
            <div className="text-center">
              <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-sm text-gray-500">Select a conversation to view</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
