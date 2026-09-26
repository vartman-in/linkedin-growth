import React, { createContext, useContext, useReducer, ReactNode } from 'react';
import {
  ContentIdea, ContentDraft, Prospect, Conversation,
  VoiceProfile, ICPProfile, ContentPillar, CarouselSlide,
  AudienceSegment, ContentOpportunity, PostDNA, LearnedPattern,
  Experiment, WeeklyLearningReport, BrainMetrics,
  emptyContentIdeas, emptyDrafts, emptyProspects, emptyConversations,
  defaultVoiceProfile, defaultICP, emptyPillars, emptyCarouselSlides,
  emptyAudienceSegments, emptyContentOpportunities, emptyPostDNA,
  emptyLearnedPatterns, emptyExperiments, defaultWeeklyReport, defaultBrainMetrics
} from './data';

interface AppState {
  ideas: ContentIdea[];
  drafts: ContentDraft[];
  prospects: Prospect[];
  conversations: Conversation[];
  voiceProfile: VoiceProfile;
  icp: ICPProfile;
  pillars: ContentPillar[];
  carouselSlides: CarouselSlide[];
  audienceSegments: AudienceSegment[];
  contentOpportunities: ContentOpportunity[];
  postDNA: PostDNA[];
  learnedPatterns: LearnedPattern[];
  experiments: Experiment[];
  weeklyReport: WeeklyLearningReport;
  brainMetrics: BrainMetrics;
  currentPage: string;
  selectedIdea: string | null;
  selectedDraft: string | null;
  selectedProspect: string | null;
  selectedConversation: string | null;
  notifications: AppNotification[];
}

interface AppNotification {
  id: string;
  type: 'success' | 'warning' | 'info' | 'error';
  message: string;
  timestamp: string;
}

type Action =
  | { type: 'SET_PAGE'; page: string }
  | { type: 'SELECT_IDEA'; id: string | null }
  | { type: 'SELECT_DRAFT'; id: string | null }
  | { type: 'SELECT_PROSPECT'; id: string | null }
  | { type: 'SELECT_CONVERSATION'; id: string | null }
  | { type: 'ADD_IDEA'; idea: ContentIdea }
  | { type: 'UPDATE_IDEA'; idea: ContentIdea }
  | { type: 'UPDATE_DRAFT'; draft: ContentDraft }
  | { type: 'APPROVE_DRAFT'; id: string }
  | { type: 'UPDATE_PROSPECT'; prospect: Prospect }
  | { type: 'SEND_REPLY'; conversationId: string; message: string }
  | { type: 'ADD_NOTIFICATION'; notification: AppNotification }
  | { type: 'DISMISS_NOTIFICATION'; id: string }
  | { type: 'UPDATE_VOICE'; profile: VoiceProfile }
  | { type: 'UPDATE_ICP'; icp: ICPProfile };

// Clean workspace initial state — no demo data
const initialState: AppState = {
  ideas: emptyContentIdeas,
  drafts: emptyDrafts,
  prospects: emptyProspects,
  conversations: emptyConversations,
  voiceProfile: defaultVoiceProfile,
  icp: defaultICP,
  pillars: emptyPillars,
  carouselSlides: emptyCarouselSlides,
  audienceSegments: emptyAudienceSegments,
  contentOpportunities: emptyContentOpportunities,
  postDNA: emptyPostDNA,
  learnedPatterns: emptyLearnedPatterns,
  experiments: emptyExperiments,
  weeklyReport: defaultWeeklyReport,
  brainMetrics: defaultBrainMetrics,
  currentPage: 'home',
  selectedIdea: null,
  selectedDraft: null,
  selectedProspect: null,
  selectedConversation: null,
  notifications: []
};

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'SET_PAGE':
      return { ...state, currentPage: action.page };
    case 'SELECT_IDEA':
      return { ...state, selectedIdea: action.id };
    case 'SELECT_DRAFT':
      return { ...state, selectedDraft: action.id };
    case 'SELECT_PROSPECT':
      return { ...state, selectedProspect: action.id };
    case 'SELECT_CONVERSATION':
      return { ...state, selectedConversation: action.id };
    case 'ADD_IDEA':
      return { ...state, ideas: [action.idea, ...state.ideas] };
    case 'UPDATE_IDEA':
      return { ...state, ideas: state.ideas.map(i => i.id === action.idea.id ? action.idea : i) };
    case 'UPDATE_DRAFT':
      return { ...state, drafts: state.drafts.map(d => d.id === action.draft.id ? action.draft : d) };
    case 'APPROVE_DRAFT':
      return {
        ...state,
        drafts: state.drafts.map(d =>
          d.id === action.id ? { ...d, status: 'approved' as const } : d
        )
      };
    case 'UPDATE_PROSPECT':
      return { ...state, prospects: state.prospects.map(p => p.id === action.prospect.id ? action.prospect : p) };
    case 'SEND_REPLY': {
      const newMessage = {
        id: `m${Date.now()}`,
        from: 'user' as const,
        content: action.message,
        timestamp: new Date().toISOString()
      };
      return {
        ...state,
        conversations: state.conversations.map(c =>
          c.id === action.conversationId
            ? { ...c, messages: [...c.messages, newMessage], unread: false }
            : c
        )
      };
    }
    case 'ADD_NOTIFICATION':
      return { ...state, notifications: [action.notification, ...state.notifications] };
    case 'DISMISS_NOTIFICATION':
      return { ...state, notifications: state.notifications.filter(n => n.id !== action.id) };
    case 'UPDATE_VOICE':
      return { ...state, voiceProfile: action.profile };
    case 'UPDATE_ICP':
      return { ...state, icp: action.icp };
    default:
      return state;
  }
}

const AppContext = createContext<{
  state: AppState;
  dispatch: React.Dispatch<Action>;
} | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  return (
    <AppContext.Provider value={{ state, dispatch }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within AppProvider');
  return context;
}
