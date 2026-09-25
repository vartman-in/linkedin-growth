import { useState, useEffect } from 'react';
import { useWorkspace } from '../workspace/WorkspaceContext';
import { conversationsApi, leadsApi } from '../api/client';
import {
  MessageSquare, Send, CheckCircle2, AlertCircle,
  User, Clock, ThumbsUp, HelpCircle, XCircle,
  ArrowRight, Sparkles, Shield, Loader
} from 'lucide-react';

export default function InboxPage() {
  const { activeWorkspace } = useWorkspace();
  const [selectedConvId, setSelectedConvId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [showSuggested, setShowSuggested] = useState(true);
  const [sending, setSending] = useState(false);
  
  // Real data from API
  const [conversations, setConversations] = useState<any[]>([]);
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (activeWorkspace) {
      loadConversations();
    }
  }, [activeWorkspace]);

  useEffect(() => {
    if (selectedConvId) {
      loadMessages(selectedConvId);
    }
  }, [selectedConvId]);

  const loadConversations = async () => {
    try {
      setLoading(true);
      setError(null);
      // Note: Backend doesn't have a getAll conversations endpoint yet
      // We'll need to get conversations through leads
      const leads = await leadsApi.getAll();
      const allConversations: any[] = [];
      
      for (const lead of leads) {
        try {
          const leadConversations = await leadsApi.getConversations(lead.id);
          allConversations.push(...leadConversations.map((conv: any) => ({
            ...conv,
            leadName: lead.name,
            leadCompany: lead.company
          })));
        } catch (err) {
          console.error('Failed to load conversations for lead:', lead.id, err);
        }
      }
      
      setConversations(allConversations);
      if (allConversations.length > 0 && !selectedConvId) {
        setSelectedConvId(allConversations[0].id);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load conversations');
      console.error('Failed to load conversations:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async (conversationId: string) => {
    try {
      const msgs = await conversationsApi.getMessages(conversationId);
      setMessages(msgs);
    } catch (err) {
      console.error('Failed to load messages:', err);
      setMessages([]);
    }
  };

  const handleSendReply = async () => {
    if (!replyText.trim() || !selectedConvId) return;
    
    try {
      setSending(true);
      setError(null);
      const newMessage = await conversationsApi.addMessage(selectedConvId, 'OUTBOUND', replyText);
      setMessages([...messages, newMessage]);
      setReplyText('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send message');
      console.error('Failed to send message:', err);
    } finally {
      setSending(false);
    }
  };

  const selectedConv = conversations.find(c => c.id === selectedConvId);

  const classificationIcons: Record<string, any> = {
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto animate-fade-in">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Inbox</h1>
        <p className="text-gray-500 text-sm mt-1">Monitor conversations and craft responses with AI assistance</p>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Conversation List */}
        <div className="space-y-2">
          {conversations.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <MessageSquare className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">No conversations yet</h3>
              <p className="text-sm text-gray-500 max-w-md mx-auto">
                Conversations will appear here when you connect LinkedIn and start engaging with leads.
              </p>
            </div>
          ) : (
            conversations.map(conv => {
              const ClassIcon = classificationIcons[conv.classification] || MessageSquare;
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
                          {conv.leadName?.split(' ').map((n: string) => n[0]).join('') || '?'}
                        </span>
                      </div>
                      <div>
                        <h4 className="text-sm font-semibold text-gray-800">{conv.leadName || 'Unknown'}</h4>
                        <p className="text-xs text-gray-400">{conv.leadCompany || ''}</p>
                      </div>
                    </div>
                    {conv.unread && (
                      <span className="w-2.5 h-2.5 bg-primary rounded-full" />
                    )}
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium flex items-center gap-1 ${classificationColors[conv.classification] || 'bg-gray-100 text-gray-500'}`}>
                      <ClassIcon className="w-3 h-3" />
                      {conv.classification || 'unknown'}
                    </span>
                    <span className="text-xs text-gray-400 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {new Date(conv.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </span>
                  </div>
                </button>
              );
            })
          )}
        </div>

        {/* Conversation Detail */}
        {selectedConv ? (
          <div className="lg:col-span-2 flex flex-col bg-white rounded-xl border border-gray-200 overflow-hidden" style={{ minHeight: '600px' }}>
            {/* Conversation Header */}
            <div className="p-4 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-primary to-accent rounded-full flex items-center justify-center">
                  <span className="text-white font-bold text-sm">
                    {selectedConv.leadName?.split(' ').map((n: string) => n[0]).join('') || '?'}
                  </span>
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-gray-800">{selectedConv.leadName || 'Unknown'}</h3>
                  <p className="text-xs text-gray-500">{selectedConv.leadCompany || ''}</p>
                </div>
              </div>
              <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${classificationColors[selectedConv.classification] || 'bg-gray-100 text-gray-500'}`}>
                {selectedConv.classification || 'unknown'}
              </span>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-auto p-4 space-y-4">
              {messages.length === 0 ? (
                <div className="text-center py-12">
                  <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-sm text-gray-500">No messages yet</p>
                </div>
              ) : (
                messages.map(msg => (
                  <div key={msg.id} className={`flex ${msg.direction === 'OUTBOUND' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[75%] rounded-2xl px-4 py-2.5 ${
                      msg.direction === 'OUTBOUND'
                        ? 'bg-primary text-white rounded-br-md'
                        : 'bg-gray-100 text-gray-800 rounded-bl-md'
                    }`}>
                      <p className="text-sm leading-relaxed">{msg.body}</p>
                      <p className={`text-xs mt-1 ${msg.direction === 'OUTBOUND' ? 'text-white/60' : 'text-gray-400'}`}>
                        {new Date(msg.created_at).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>

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
                    disabled={!replyText.trim() || sending}
                    className="p-2.5 bg-primary text-white rounded-xl hover:bg-primary-dark disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {sending ? <Loader className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  </button>
                  <div className="flex items-center gap-1 px-2">
                    <Shield className="w-3 h-3 text-gray-400" />
                    <span className="text-[10px] text-gray-400">Draft only</span>
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
