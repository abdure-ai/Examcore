import { create } from 'zustand';
import axios from 'axios';

export const useExamStore = create((set, get) => ({
  activeSession: null,
  exam: null,
  questions: [],
  currentIndex: 0,
  remainingSeconds: 0,
  isLoading: false,
  tabSwitches: 0,

  fetchSession: async (sessionId) => {
    set({ isLoading: true });
    try {
      const response = await axios.get(`/api/sessions/${sessionId}`);
      const { session, exam, questions, remaining_seconds } = response.data;
      set({
        activeSession: session,
        exam,
        questions,
        remainingSeconds: remaining_seconds,
        tabSwitches: session.tab_switches || 0,
        isLoading: false,
      });
    } catch (error) {
      set({ isLoading: false });
      console.error('Failed to fetch session', error);
    }
  },

  setCurrentIndex: (index) => {
    if (index >= 0 && index < get().questions.length) {
      set({ currentIndex: index });
    }
  },

  saveAnswer: async (questionId, answer) => {
    const { activeSession, questions } = get();
    if (!activeSession) return;

    // Optimistically update local questions state
    const updatedQuestions = questions.map((q) => 
      q.id === questionId ? { ...q, saved_answer: answer } : q
    );
    set({ questions: updatedQuestions });

    try {
      await axios.post(`/api/sessions/${activeSession.id}/answer`, {
        question_id: questionId,
        answer: answer
      });
    } catch (error) {
      console.error('Failed to save answer server-side', error);
    }
  },

  flagQuestion: async (questionId, isFlagged) => {
    const { activeSession, questions } = get();
    if (!activeSession) return;

    // Optimistically update local questions state
    const updatedQuestions = questions.map((q) => 
      q.id === questionId ? { ...q, is_flagged: isFlagged } : q
    );
    set({ questions: updatedQuestions });

    try {
      await axios.post(`/api/sessions/${activeSession.id}/answer`, {
        question_id: questionId,
        is_flagged: isFlagged
      });
    } catch (error) {
      console.error('Failed to flag question server-side', error);
    }
  },

  decrementTimer: () => {
    const { remainingSeconds } = get();
    if (remainingSeconds > 0) {
      set({ remainingSeconds: remainingSeconds - 1 });
    }
  },

  submitExam: async (cheatAudit = 0) => {
    const { activeSession } = get();
    if (!activeSession) return;

    set({ isLoading: true });
    try {
      const response = await axios.post(`/api/sessions/${activeSession.id}/submit`, {
        tab_switches: cheatAudit
      });
      set({ activeSession: response.data.session, isLoading: false });
      return response.data;
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  resetSession: () => set({
    activeSession: null,
    exam: null,
    questions: [],
    currentIndex: 0,
    remainingSeconds: 0,
    tabSwitches: 0,
  }),

  reportCheat: async (action) => {
    const { activeSession, tabSwitches } = get();
    if (!activeSession) return;

    try {
      const response = await axios.post(`/api/sessions/${activeSession.id}/cheat`, { action });
      if (action === 'tab_switch') {
        set({ tabSwitches: response.data.tab_switches });
      }
    } catch (error) {
      console.error('Failed to report anti-cheat event', error);
    }
  }
}));
