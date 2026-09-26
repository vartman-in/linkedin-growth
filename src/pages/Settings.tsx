import { useState, useEffect } from 'react';
import { useAuth } from '../auth/AuthContext';
import { useWorkspace } from '../workspace/WorkspaceContext';
import { profileApi, icpApi } from '../api/client';
import {
  User, Mic, Target, FileText, Shield, Link2,
  Save, Plus, X, CheckCircle2, AlertTriangle, Loader
} from 'lucide-react';

type SettingsTab = 'profile' | 'voice' | 'audience' | 'content' | 'evidence' | 'safety';

export default function SettingsPage() {
  const { user } = useAuth();
  const { activeWorkspace } = useWorkspace();
  const [activeTab, setActiveTab] = useState<SettingsTab>('profile');
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Profile state
  const [profile, setProfile] = useState<any>(null);
  const [profileLoading, setProfileLoading] = useState(true);

  // ICP state
  const [icps, setIcps] = useState<any[]>([]);
  const [icpLoading, setIcpLoading] = useState(true);

  // Load profile on mount
  useEffect(() => {
    loadProfile();
    loadICPs();
  }, [activeWorkspace]);

  const loadProfile = async () => {
    try {
      setProfileLoading(true);
      const data = await profileApi.getMe();
      setProfile(data);
    } catch (err) {
      console.error('Failed to load profile:', err);
      // Profile might not exist yet, that's ok
      setProfile(null);
    } finally {
      setProfileLoading(false);
    }
  };

  const loadICPs = async () => {
    try {
      setIcpLoading(true);
      const data = await icpApi.getAll();
      setIcps(data);
    } catch (err) {
      console.error('Failed to load ICPs:', err);
      setIcps([]);
    } finally {
      setIcpLoading(false);
    }
  };

  const handleSaveProfile = async (profileData: any) => {
    try {
      setSaving(true);
      setError(null);
      
      if (profile?.id) {
        // Update existing profile
        await profileApi.updateMe(profileData);
      } else {
        // Create new profile
        const newProfile = await profileApi.create({
          ...profileData,
          userId: user?.id
        });
        setProfile(newProfile);
      }
      
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2000);
      await loadProfile(); // Reload to get fresh data
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save profile');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveICP = async (icpData: any) => {
    try {
      setSaving(true);
      setError(null);
      
      if (icpData.id) {
        // Update existing ICP
        await icpApi.update(icpData.id, icpData);
      } else {
        // Create new ICP
        await icpApi.create(icpData);
      }
      
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2000);
      await loadICPs(); // Reload to get fresh data
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save ICP');
    } finally {
      setSaving(false);
    }
  };

  const tabs = [
    { id: 'profile' as const, label: 'Profile', icon: User },
    { id: 'voice' as const, label: 'Voice', icon: Mic },
    { id: 'audience' as const, label: 'Audience (ICP)', icon: Target },
    { id: 'content' as const, label: 'Content Pillars', icon: FileText },
    { id: 'evidence' as const, label: 'Evidence & Receipts', icon: Shield },
    { id: 'safety' as const, label: 'Safety & Automation', icon: AlertTriangle },
  ];

  if (profileLoading || icpLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
          <p className="text-gray-500 text-sm mt-1">Configure your operator's behavior and preferences</p>
        </div>
        <button
          onClick={() => {
            // Save will be handled by individual tab components
          }}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all shadow-sm ${
            saveSuccess ? 'bg-success text-white' : saving ? 'bg-gray-300 text-gray-500' : 'bg-primary text-white hover:bg-primary-dark'
          }`}
          disabled={saving}
        >
          {saveSuccess ? <CheckCircle2 className="w-4 h-4" /> : saving ? <Loader className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {saveSuccess ? 'Saved!' : saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

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
          {activeTab === 'profile' && (
            <ProfileSettings 
              profile={profile} 
              onSave={handleSaveProfile}
              saving={saving}
            />
          )}
          {activeTab === 'voice' && (
            <VoiceSettings 
              profile={profile} 
              onSave={handleSaveProfile}
              saving={saving}
            />
          )}
          {activeTab === 'audience' && (
            <AudienceSettings 
              icps={icps}
              onSave={handleSaveICP}
              saving={saving}
            />
          )}
          {activeTab === 'content' && <ContentSettings />}
          {activeTab === 'evidence' && <EvidenceSettings />}
          {activeTab === 'safety' && <SafetySettings />}
        </div>
      </div>
    </div>
  );
}

function ProfileSettings({ profile, onSave, saving }: any) {
  const [formData, setFormData] = useState({
    displayName: profile?.display_name || '',
    headline: profile?.headline || '',
    role: profile?.role || '',
    company: profile?.company || '',
    bio: profile?.bio || '',
  });

  useEffect(() => {
    if (profile) {
      setFormData({
        displayName: profile.display_name || '',
        headline: profile.headline || '',
        role: profile.role || '',
        company: profile.company || '',
        bio: profile.bio || '',
      });
    }
  }, [profile]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-200 p-6 space-y-5">
      <h3 className="text-lg font-semibold text-gray-800">Profile</h3>
      <p className="text-sm text-gray-500">Complete your profile to personalize your Growth Operator. Fields marked with * are recommended.</p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="text-xs font-medium text-gray-500 mb-1 block">Name *</label>
          <input 
            type="text" 
            value={formData.displayName}
            onChange={(e) => setFormData({...formData, displayName: e.target.value})}
            placeholder="Your name" 
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" 
            required
          />
        </div>
        <div>
          <label className="text-xs font-medium text-gray-500 mb-1 block">Role</label>
          <input 
            type="text" 
            value={formData.role}
            onChange={(e) => setFormData({...formData, role: e.target.value})}
            placeholder="e.g. Founder, Engineering Lead" 
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" 
          />
        </div>
        <div className="md:col-span-2">
          <label className="text-xs font-medium text-gray-500 mb-1 block">LinkedIn Headline</label>
          <input 
            type="text" 
            value={formData.headline}
            onChange={(e) => setFormData({...formData, headline: e.target.value})}
            placeholder="Your LinkedIn headline" 
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" 
          />
        </div>
        <div>
          <label className="text-xs font-medium text-gray-500 mb-1 block">Company</label>
          <input 
            type="text" 
            value={formData.company}
            onChange={(e) => setFormData({...formData, company: e.target.value})}
            placeholder="Your company" 
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" 
          />
        </div>
        <div className="md:col-span-2">
          <label className="text-xs font-medium text-gray-500 mb-1 block">Bio</label>
          <textarea 
            value={formData.bio}
            onChange={(e) => setFormData({...formData, bio: e.target.value})}
            placeholder="Brief description of your expertise and what you share about..." 
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm h-24 resize-none focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" 
          />
        </div>
      </div>
      <div className="flex justify-end">
        <button
          type="submit"
          disabled={saving}
          className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-dark disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving ? 'Saving...' : 'Save Profile'}
        </button>
      </div>
    </form>
  );
}

function VoiceSettings({ profile, onSave, saving }: any) {
  const [voiceTone, setVoiceTone] = useState(profile?.voice_tone || '');
  const [bannedWords, setBannedWords] = useState<string[]>(profile?.banned_words || []);
  const [newBannedWord, setNewBannedWord] = useState('');

  useEffect(() => {
    if (profile) {
      setVoiceTone(profile.voice_tone || '');
      setBannedWords(profile.banned_words || []);
    }
  }, [profile]);

  const handleAddBannedWord = () => {
    if (newBannedWord.trim() && !bannedWords.includes(newBannedWord.trim())) {
      setBannedWords([...bannedWords, newBannedWord.trim()]);
      setNewBannedWord('');
    }
  };

  const handleRemoveBannedWord = (word: string) => {
    setBannedWords(bannedWords.filter(w => w !== word));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      voice_tone: voiceTone,
      banned_words: bannedWords,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-200 p-6 space-y-5">
      <h3 className="text-lg font-semibold text-gray-800">Voice Profile</h3>
      <p className="text-sm text-gray-500">Define how you sound. The AI will match this voice in all generated content.</p>

      <div>
        <label className="text-xs font-medium text-gray-500 mb-2 block">Voice Tone</label>
        <textarea
          value={voiceTone}
          onChange={(e) => setVoiceTone(e.target.value)}
          placeholder="Describe your voice tone (e.g., professional, casual, authoritative, friendly)..."
          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm h-24 resize-none focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
        />
      </div>

      <div>
        <label className="text-xs font-medium text-gray-500 mb-2 block">Banned words & phrases</label>
        <div className="flex flex-wrap gap-1.5 mb-2">
          {bannedWords.map((word, idx) => (
            <span key={idx} className="text-xs bg-danger-light text-danger px-2 py-1 rounded-md flex items-center gap-1">
              {word}
              <X className="w-3 h-3 cursor-pointer hover:text-danger" onClick={() => handleRemoveBannedWord(word)} />
            </span>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            value={newBannedWord}
            onChange={(e) => setNewBannedWord(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleAddBannedWord();
              }
            }}
            placeholder="Add banned word..."
            className="flex-1 px-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-primary"
          />
          <button 
            type="button"
            onClick={handleAddBannedWord}
            className="px-3 py-1.5 bg-gray-100 text-gray-600 rounded-lg text-sm hover:bg-gray-200"
          >
            Add
          </button>
        </div>
      </div>

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={saving}
          className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-dark disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving ? 'Saving...' : 'Save Voice Settings'}
        </button>
      </div>
    </form>
  );
}

function AudienceSettings({ icps, onSave, saving }: any) {
  const [selectedICP, setSelectedICP] = useState<any>(icps[0] || null);
  const [formData, setFormData] = useState({
    name: '',
    targetRoles: [] as string[],
    industries: [] as string[],
    companySizes: [] as string[],
    geography: [] as string[],
    problems: [] as string[],
    buyingSignals: [] as string[],
    exclusions: [] as string[],
  });

  useEffect(() => {
    if (icps.length > 0 && !selectedICP) {
      setSelectedICP(icps[0]);
    }
  }, [icps]);

  useEffect(() => {
    if (selectedICP) {
      setFormData({
        name: selectedICP.name || '',
        targetRoles: selectedICP.target_roles || [],
        industries: selectedICP.industries || [],
        companySizes: selectedICP.company_sizes || [],
        geography: selectedICP.geography || [],
        problems: selectedICP.problems || [],
        buyingSignals: selectedICP.buying_signals || [],
        exclusions: selectedICP.exclusions || [],
      });
    }
  }, [selectedICP]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      ...selectedICP,
      ...formData,
    });
  };

  const handleArrayField = (field: string, value: string) => {
    const currentArray = formData[field as keyof typeof formData] as string[];
    if (value.trim() && !currentArray.includes(value.trim())) {
      setFormData({
        ...formData,
        [field]: [...currentArray, value.trim()],
      });
    }
  };

  const removeArrayItem = (field: string, item: string) => {
    const currentArray = formData[field as keyof typeof formData] as string[];
    setFormData({
      ...formData,
      [field]: currentArray.filter(i => i !== item),
    });
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-200 p-6 space-y-5">
      <h3 className="text-lg font-semibold text-gray-800">Ideal Customer Profile (ICP)</h3>
      <p className="text-sm text-gray-500">Define who you want to reach. This guides both content strategy and prospect discovery.</p>

      <div>
        <label className="text-xs font-medium text-gray-500 mb-1 block">ICP Name *</label>
        <input
          type="text"
          value={formData.name}
          onChange={(e) => setFormData({...formData, name: e.target.value})}
          placeholder="e.g., Tech Startup Founders"
          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent"
          required
        />
      </div>

      <div>
        <label className="text-xs font-medium text-gray-500 mb-2 block">Target Roles</label>
        <div className="flex flex-wrap gap-1.5 mb-2">
          {formData.targetRoles.map((role, idx) => (
            <span key={idx} className="text-xs bg-accent-light text-accent px-2.5 py-1 rounded-md flex items-center gap-1">
              {role}
              <X className="w-3 h-3 cursor-pointer" onClick={() => removeArrayItem('targetRoles', role)} />
            </span>
          ))}
        </div>
        <input
          type="text"
          placeholder="+ Add role (press Enter)"
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              handleArrayField('targetRoles', (e.target as HTMLInputElement).value);
              (e.target as HTMLInputElement).value = '';
            }
          }}
          className="text-xs px-2 py-1 border border-gray-200 rounded-md w-40 focus:outline-none focus:border-accent"
        />
      </div>

      <div>
        <label className="text-xs font-medium text-gray-500 mb-2 block">Industries</label>
        <div className="flex flex-wrap gap-1.5 mb-2">
          {formData.industries.map((ind, idx) => (
            <span key={idx} className="text-xs bg-primary-light text-primary px-2.5 py-1 rounded-md flex items-center gap-1">
              {ind}
              <X className="w-3 h-3 cursor-pointer" onClick={() => removeArrayItem('industries', ind)} />
            </span>
          ))}
        </div>
        <input
          type="text"
          placeholder="+ Add industry (press Enter)"
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              handleArrayField('industries', (e.target as HTMLInputElement).value);
              (e.target as HTMLInputElement).value = '';
            }
          }}
          className="text-xs px-2 py-1 border border-gray-200 rounded-md w-40 focus:outline-none focus:border-primary"
        />
      </div>

      <div>
        <label className="text-xs font-medium text-gray-500 mb-2 block">Company Sizes</label>
        <div className="flex flex-wrap gap-1.5 mb-2">
          {formData.companySizes.map((size, idx) => (
            <span key={idx} className="text-xs bg-gray-100 text-gray-600 px-2.5 py-1 rounded-md flex items-center gap-1">
              {size}
              <X className="w-3 h-3 cursor-pointer" onClick={() => removeArrayItem('companySizes', size)} />
            </span>
          ))}
        </div>
        <input
          type="text"
          placeholder="+ Add size (press Enter)"
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              handleArrayField('companySizes', (e.target as HTMLInputElement).value);
              (e.target as HTMLInputElement).value = '';
            }
          }}
          className="text-xs px-2 py-1 border border-gray-200 rounded-md w-40 focus:outline-none focus:border-gray-400"
        />
      </div>

      <div>
        <label className="text-xs font-medium text-gray-500 mb-2 block">Geography</label>
        <div className="flex flex-wrap gap-1.5 mb-2">
          {formData.geography.map((geo, idx) => (
            <span key={idx} className="text-xs bg-gray-100 text-gray-600 px-2.5 py-1 rounded-md flex items-center gap-1">
              {geo}
              <X className="w-3 h-3 cursor-pointer" onClick={() => removeArrayItem('geography', geo)} />
            </span>
          ))}
        </div>
        <input
          type="text"
          placeholder="+ Add location (press Enter)"
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              handleArrayField('geography', (e.target as HTMLInputElement).value);
              (e.target as HTMLInputElement).value = '';
            }
          }}
          className="text-xs px-2 py-1 border border-gray-200 rounded-md w-40 focus:outline-none focus:border-gray-400"
        />
      </div>

      <div>
        <label className="text-xs font-medium text-gray-500 mb-2 block">Pain Points</label>
        <div className="flex flex-wrap gap-1.5 mb-2">
          {formData.problems.map((problem, idx) => (
            <span key={idx} className="text-xs bg-warning-light text-warning px-2.5 py-1 rounded-md flex items-center gap-1">
              {problem}
              <X className="w-3 h-3 cursor-pointer" onClick={() => removeArrayItem('problems', problem)} />
            </span>
          ))}
        </div>
        <input
          type="text"
          placeholder="+ Add pain point (press Enter)"
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              handleArrayField('problems', (e.target as HTMLInputElement).value);
              (e.target as HTMLInputElement).value = '';
            }
          }}
          className="text-xs px-2 py-1 border border-gray-200 rounded-md w-40 focus:outline-none focus:border-warning"
        />
      </div>

      <div>
        <label className="text-xs font-medium text-gray-500 mb-2 block">Buying Signals</label>
        <div className="flex flex-wrap gap-1.5 mb-2">
          {formData.buyingSignals.map((signal, idx) => (
            <span key={idx} className="text-xs bg-success-light text-success px-2.5 py-1 rounded-md flex items-center gap-1">
              {signal}
              <X className="w-3 h-3 cursor-pointer" onClick={() => removeArrayItem('buyingSignals', signal)} />
            </span>
          ))}
        </div>
        <input
          type="text"
          placeholder="+ Add signal (press Enter)"
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              handleArrayField('buyingSignals', (e.target as HTMLInputElement).value);
              (e.target as HTMLInputElement).value = '';
            }
          }}
          className="text-xs px-2 py-1 border border-gray-200 rounded-md w-40 focus:outline-none focus:border-success"
        />
      </div>

      <div>
        <label className="text-xs font-medium text-gray-500 mb-2 block">Exclusions</label>
        <div className="flex flex-wrap gap-1.5 mb-2">
          {formData.exclusions.map((exc, idx) => (
            <span key={idx} className="text-xs bg-danger-light text-danger px-2.5 py-1 rounded-md flex items-center gap-1">
              {exc}
              <X className="w-3 h-3 cursor-pointer" onClick={() => removeArrayItem('exclusions', exc)} />
            </span>
          ))}
        </div>
        <input
          type="text"
          placeholder="+ Add exclusion (press Enter)"
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              handleArrayField('exclusions', (e.target as HTMLInputElement).value);
              (e.target as HTMLInputElement).value = '';
            }
          }}
          className="text-xs px-2 py-1 border border-gray-200 rounded-md w-40 focus:outline-none focus:border-danger"
        />
      </div>

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={saving}
          className="px-4 py-2 bg-accent text-white rounded-lg text-sm font-medium hover:bg-accent/90 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving ? 'Saving...' : 'Save ICP'}
        </button>
      </div>
    </form>
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
