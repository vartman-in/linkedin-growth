import { useState } from 'react';
import { useApp } from '../store';
import {
  User, Mic, Target, FileText, Shield, Link2,
  Save, Plus, X, CheckCircle2, AlertTriangle
} from 'lucide-react';

type SettingsTab = 'profile' | 'voice' | 'audience' | 'content' | 'evidence' | 'safety';

export default function SettingsPage() {
  const { state, dispatch } = useApp();
  const [activeTab, setActiveTab] = useState<SettingsTab>('profile');
  const [saved, setSaved] = useState(false);

  const tabs = [
    { id: 'profile' as const, label: 'Profile', icon: User },
    { id: 'voice' as const, label: 'Voice', icon: Mic },
    { id: 'audience' as const, label: 'Audience (ICP)', icon: Target },
    { id: 'content' as const, label: 'Content Pillars', icon: FileText },
    { id: 'evidence' as const, label: 'Evidence & Receipts', icon: Shield },
    { id: 'safety' as const, label: 'Safety & Automation', icon: AlertTriangle },
  ];

  const handleSave = () => {
    // Note: Settings are not yet persisted. This is a UI-only preview.
    // Persistence will be implemented when the backend is connected.
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="max-w-5xl mx-auto animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
          <p className="text-gray-500 text-sm mt-1">Configure your operator's behavior and preferences</p>
        </div>
        <button
          onClick={handleSave}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all shadow-sm ${
            saved ? 'bg-success text-white' : 'bg-primary text-white hover:bg-primary-dark'
          }`}
        >
          {saved ? <CheckCircle2 className="w-4 h-4" /> : <Save className="w-4 h-4" />}
          {saved ? 'Saved!' : 'Save Changes'}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-5">
        {/* Sidebar */}
        <div className="space-y-1">
          {tabs.map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium transition-all
                  ${activeTab === tab.id ? 'bg-primary-light text-primary' : 'text-gray-600 hover:bg-gray-100'}`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Content */}
        <div className="lg:col-span-3">
          {activeTab === 'profile' && <ProfileSettings />}
          {activeTab === 'voice' && <VoiceSettings />}
          {activeTab === 'audience' && <AudienceSettings />}
          {activeTab === 'content' && <ContentSettings />}
          {activeTab === 'evidence' && <EvidenceSettings />}
          {activeTab === 'safety' && <SafetySettings />}
        </div>
      </div>
    </div>
  );
}

function ProfileSettings() {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-5">
      <h3 className="text-lg font-semibold text-gray-800">Profile</h3>
      <p className="text-sm text-gray-500">Complete your profile to personalize your Growth Operator. Fields marked with * are recommended.</p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="text-xs font-medium text-gray-500 mb-1 block">Name *</label>
          <input type="text" placeholder="Your name" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" />
        </div>
        <div>
          <label className="text-xs font-medium text-gray-500 mb-1 block">Role</label>
          <input type="text" placeholder="e.g. Founder, Engineering Lead" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" />
        </div>
        <div className="md:col-span-2">
          <label className="text-xs font-medium text-gray-500 mb-1 block">LinkedIn Headline</label>
          <input type="text" placeholder="Your LinkedIn headline" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" />
        </div>
        <div className="md:col-span-2">
          <label className="text-xs font-medium text-gray-500 mb-1 block">Bio</label>
          <textarea placeholder="Brief description of your expertise and what you share about..." className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm h-24 resize-none focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" />
        </div>
      </div>
      <div>
        <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
          <Link2 className="w-4 h-4 text-gray-400" />
          Integrations
        </h4>
        <div className="space-y-2">
          {[
            { name: 'LinkedIn', desc: 'Publishing & Analytics', available: false },
            { name: 'AI Provider', desc: 'Content generation', available: false },
            { name: 'CRM', desc: 'Pipeline management', available: false },
          ].map(integration => (
            <div key={integration.name} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div>
                <p className="text-sm font-medium text-gray-800">{integration.name}</p>
                <p className="text-xs text-gray-500">{integration.desc}</p>
              </div>
              <span className="text-xs px-2 py-1 rounded-full font-medium bg-gray-200 text-gray-500">
                Coming soon
              </span>
            </div>
          ))}
        </div>
        <p className="text-xs text-gray-400 mt-2">Integration setup will be available in a future phase.</p>
      </div>
    </div>
  );
}

function VoiceSettings() {
  const [newBanned, setNewBanned] = useState('');

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-5">
      <h3 className="text-lg font-semibold text-gray-800">Voice Profile</h3>
      <p className="text-sm text-gray-500">Define how you sound. The AI will match this voice in all generated content.</p>

      <div>
        <label className="text-xs font-medium text-gray-500 mb-2 block">How you sound (select all that apply)</label>
        <div className="flex flex-wrap gap-2">
          {['direct', 'conversational', 'analytical', 'technical', 'humorous', 'serious', 'empathetic', 'authoritative'].map(tone => (
            <label key={tone} className="flex items-center gap-1.5 px-3 py-1.5 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 has-[:checked]:bg-primary-light has-[:checked]:border-primary">
              <input type="checkbox" className="rounded text-primary" />
              <span className="text-sm text-gray-700">{tone}</span>
            </label>
          ))}
        </div>
      </div>

      <div>
        <label className="text-xs font-medium text-gray-500 mb-2 block">Sentence rhythm</label>
        <div className="flex gap-2">
          {['short', 'mixed', 'long-form'].map(rhythm => (
            <button
              key={rhythm}
              className="px-4 py-2 rounded-lg text-sm font-medium border border-gray-200 text-gray-600 hover:bg-gray-50 transition-all"
            >
              {rhythm}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="text-xs font-medium text-gray-500 mb-2 block">Preferred vocabulary</label>
        <div className="flex flex-wrap gap-1.5">
          <input type="text" placeholder="Add a preferred term..." className="text-xs px-2 py-1 border border-gray-200 rounded-md w-40 focus:outline-none focus:border-primary" />
        </div>
        <p className="text-xs text-gray-400 mt-1">Terms you commonly use and want the AI to include.</p>
      </div>

      <div>
        <label className="text-xs font-medium text-gray-500 mb-2 block">Banned words & phrases</label>
        <div className="flex gap-2">
          <input
            type="text"
            value={newBanned}
            onChange={(e) => setNewBanned(e.target.value)}
            placeholder="Add banned word..."
            className="flex-1 px-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-primary"
          />
          <button className="px-3 py-1.5 bg-gray-100 text-gray-600 rounded-lg text-sm hover:bg-gray-200">Add</button>
        </div>
        <p className="text-xs text-gray-400 mt-1">Words and phrases the AI should never use in your content.</p>
      </div>

      <div>
        <label className="text-xs font-medium text-gray-500 mb-2 block">Formatting preferences</label>
        <div className="flex flex-wrap gap-2">
          {['short paragraphs', 'bullet points', 'whitespace', 'numbered lists', 'minimal emojis', 'bold key phrases'].map(format => (
            <label key={format} className="flex items-center gap-1.5 px-3 py-1.5 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 has-[:checked]:bg-primary-light has-[:checked]:border-primary">
              <input type="checkbox" className="rounded text-primary" />
              <span className="text-sm text-gray-700">{format}</span>
            </label>
          ))}
        </div>
      </div>
    </div>
  );
}

function AudienceSettings() {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-5">
      <h3 className="text-lg font-semibold text-gray-800">Ideal Customer Profile (ICP)</h3>
      <p className="text-sm text-gray-500">Define who you want to reach. This guides both content strategy and prospect discovery.</p>

      <div>
        <label className="text-xs font-medium text-gray-500 mb-2 block">Target Roles</label>
        <div className="flex flex-wrap gap-1.5">
          <input type="text" placeholder="+ Add role" className="text-xs px-2 py-1 border border-gray-200 rounded-md w-40 focus:outline-none focus:border-accent" />
        </div>
      </div>

      <div>
        <label className="text-xs font-medium text-gray-500 mb-2 block">Industries</label>
        <div className="flex flex-wrap gap-1.5">
          <input type="text" placeholder="+ Add industry" className="text-xs px-2 py-1 border border-gray-200 rounded-md w-40 focus:outline-none focus:border-primary" />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="text-xs font-medium text-gray-500 mb-1 block">Company Size</label>
          <input type="text" placeholder="e.g. 10-200 employees" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent" />
        </div>
        <div>
          <label className="text-xs font-medium text-gray-500 mb-1 block">Geography</label>
          <input type="text" placeholder="+ Add location" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent" />
        </div>
      </div>

      <div>
        <label className="text-xs font-medium text-gray-500 mb-2 block">Pain Areas</label>
        <div className="flex flex-wrap gap-1.5">
          <input type="text" placeholder="+ Add pain area" className="text-xs px-2 py-1 border border-gray-200 rounded-md w-40 focus:outline-none focus:border-warning" />
        </div>
      </div>

      <div>
        <label className="text-xs font-medium text-gray-500 mb-2 block">Buying Triggers</label>
        <div className="flex flex-wrap gap-1.5">
          <input type="text" placeholder="+ Add trigger" className="text-xs px-2 py-1 border border-gray-200 rounded-md w-40 focus:outline-none focus:border-success" />
        </div>
      </div>

      <div>
        <label className="text-xs font-medium text-gray-500 mb-2 block">Exclusions</label>
        <div className="flex flex-wrap gap-1.5">
          <input type="text" placeholder="+ Add exclusion" className="text-xs px-2 py-1 border border-gray-200 rounded-md w-40 focus:outline-none focus:border-danger" />
        </div>
      </div>
    </div>
  );
}

function ContentSettings() {
  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-1">Content Pillars</h3>
        <p className="text-sm text-gray-500 mb-4">Define your content themes. Each pillar guides topic selection and format preferences.</p>
        <div className="space-y-3">
          <button className="w-full py-3 border-2 border-dashed border-gray-200 rounded-xl text-sm text-gray-400 hover:border-primary hover:text-primary transition-colors flex items-center justify-center gap-2">
            <Plus className="w-4 h-4" /> Add Your First Pillar
          </button>
        </div>
      </div>
    </div>
  );
}

function EvidenceSettings() {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-5">
      <h3 className="text-lg font-semibold text-gray-800">Evidence & Receipts</h3>
      <p className="text-sm text-gray-500">Verified facts the AI can reference. These become high-confidence claims in your content.</p>

      <div>
        <label className="text-xs font-medium text-gray-500 mb-2 block">Verified Receipts</label>
        <p className="text-sm text-gray-500 mb-3">Add achievements, case studies, or verified facts that you want the AI to reference.</p>
        <button className="flex items-center gap-2 text-sm text-primary font-medium hover:text-primary-dark">
          <Plus className="w-4 h-4" /> Add Your First Receipt
        </button>
      </div>

      <div>
        <label className="text-xs font-medium text-gray-500 mb-2 block">Case Studies</label>
        <p className="text-sm text-gray-500 mb-3">Document real projects, results, and outcomes.</p>
        <button className="flex items-center gap-2 text-sm text-primary font-medium hover:text-primary-dark">
          <Plus className="w-4 h-4" /> Add Case Study
        </button>
      </div>
    </div>
  );
}

function SafetySettings() {
  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Automation Levels</h3>

        <div className="space-y-4">
          <div className="p-4 bg-success-light/50 border border-success/20 rounded-xl">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-6 h-6 bg-success rounded-full flex items-center justify-center">
                <span className="text-white text-xs font-bold">1</span>
              </div>
              <h4 className="text-sm font-semibold text-gray-800">Safe Automation (Automatic)</h4>
            </div>
            <p className="text-xs text-gray-600 mb-2">AI can perform these without approval:</p>
            <div className="flex flex-wrap gap-1.5">
              {['Research', 'Classification', 'Scoring', 'Draft preparation', 'Analytics', 'Recommendations'].map(item => (
                <span key={item} className="text-xs bg-success-light text-success px-2 py-0.5 rounded">{item}</span>
              ))}
            </div>
          </div>

          <div className="p-4 bg-warning-light/50 border border-warning/20 rounded-xl">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-6 h-6 bg-warning rounded-full flex items-center justify-center">
                <span className="text-white text-xs font-bold">2</span>
              </div>
              <h4 className="text-sm font-semibold text-gray-800">Human Approval Required</h4>
            </div>
            <p className="text-xs text-gray-600 mb-2">These require your explicit approval:</p>
            <div className="flex flex-wrap gap-1.5">
              {['Publishing', 'Connection requests', 'DMs', 'Comments', 'Follow-ups'].map(item => (
                <span key={item} className="text-xs bg-warning-light text-warning px-2 py-0.5 rounded">{item}</span>
              ))}
            </div>
          </div>

          <div className="p-4 bg-danger-light/50 border border-danger/20 rounded-xl">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-6 h-6 bg-danger rounded-full flex items-center justify-center">
                <span className="text-white text-xs font-bold">3</span>
              </div>
              <h4 className="text-sm font-semibold text-gray-800">Never Automate (Hard Block)</h4>
            </div>
            <p className="text-xs text-gray-600 mb-2">These are always blocked:</p>
            <div className="flex flex-wrap gap-1.5">
              {['Spam', 'Mass unsolicited activity', 'CAPTCHA bypass', 'Credential harvesting', 'Platform evasion', 'Fake identity'].map(item => (
                <span key={item} className="text-xs bg-danger-light text-danger px-2 py-0.5 rounded">{item}</span>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="text-sm font-semibold text-gray-800 mb-3">Approval Settings</h3>
        <div className="space-y-3">
          {[
            { label: 'Require approval before publishing', enabled: true },
            { label: 'Require approval before sending DMs', enabled: true },
            { label: 'Require approval before connection requests', enabled: true },
            { label: 'Allow AI to schedule posts (after approval)', enabled: false },
            { label: 'Allow auto-follow-up after N days', enabled: false },
          ].map((setting, idx) => (
            <div key={idx} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
              <span className="text-sm text-gray-700">{setting.label}</span>
              <div className={`w-10 h-5 rounded-full relative cursor-pointer transition-colors ${setting.enabled ? 'bg-primary' : 'bg-gray-200'}`}>
                <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${setting.enabled ? 'translate-x-5' : 'translate-x-0.5'}`} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
