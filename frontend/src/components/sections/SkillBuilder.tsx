import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import ParticleBackground from '../ui/ParticleBackground';
import { visualSummaryAPI, csrCourseAPI, courseAPI } from '../../lib/api';
import { Toaster, toast } from 'react-hot-toast';
interface Section {
  title: string;
  text: string;
  imageUrl: string; // Contains YouTube video URL or search URL
  audioUrl: string;
}

interface VisualSummaryData {
  type: string;
  title: string;
  sections: Section[];
}

interface VisualSummary {
  id?: number;
  topic?: string;
  summary_data: VisualSummaryData;
  created_at?: string;
}

interface VisualSummaryProps {
  summary: VisualSummary;
  onClose: () => void;
  API_BASE_URL?: string; // Added to match backend audio/image URL resolution
  translatingSummaryId?: number; // For translation button
  handleTranslateSummary: (summary: VisualSummary) => void; // For translation button
  generateSectionAudio: (text: string, language: string, summaryId: number | undefined, sectionIdx: number) => Promise<string | null>; // For audio generation
  setCurrentSummary: (summary: VisualSummary) => void; // For updating current summary
  setSummaries: (updater: (prevSummaries: VisualSummary[]) => VisualSummary[]) => void; // For updating summaries list
}
interface CSRCourse {
  id: number;
  company_id: number;
  title: string;
  description: string;
  skills: string[];
  duration: string;
  language: string;
  certification: boolean;
  max_seats: number;
  start_date: string;
  status: string;
  created_at: string;
  updated_at: string;
  content_url?: string;
  enrollments?: number;
  completions?: number;
}

interface ContentItem {
  id: number;
  titleKey: string;
  type: string;
  format: string;
  language: string;
  provider: string | null;
  uploader: string | null;
  isCSR: boolean;
  duration: string;
  tokens: number;
  content_url: string;
  deliveryMode: string;
  enrollments: number;
  completions: number;
  skills: string[];
  description?: string;
  certification?: boolean;
  max_seats?: number;
  start_date?: string;
  status?: string;
  physicalDetails?: { location: string; date: string };
}

interface LiveSession {
  id: number;
  titleKey: string;
  provider: string | null;
  uploader: string | null;
  date: string;
  time: string;
  meetingLink: string;
  chat: { user: string; message: string; timestamp: string }[];
  qna: { user: string; question: string; timestamp: string }[];
  participants: number;
}

// Main Component
const SkillBuilder = () => {
  const { t, i18n } = useTranslation('skillbuilder');
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
  const USER_ID = 1; // Simulated user ID
  const COMPANY_ID = 1; // Simulated company ID

  const [role, setRole] = useState('Consumer');
  const [content, setContent] = useState<ContentItem[]>([]);
  const [liveSessions, setLiveSessions] = useState<LiveSession[]>([]);
  
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(12);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedContent, setSelectedContent] = useState<ContentItem | null>(null);
  const [selectedSession, setSelectedSession] = useState<LiveSession | null>(null);
  const [chatMessage, setChatMessage] = useState('');
  const [qnaQuestion, setQnaQuestion] = useState('');
  const [tokens, setTokens] = useState(0);
  const [progress, setProgress] = useState(0);
  const [newContent, setNewContent] = useState({
    title: '',
    description: '',
    skills: '',
    type: 'Course',
    format: 'Video',
    language: 'Hindi',
    duration: '',
    content_url: '',
    deliveryMode: 'Online',
    physicalDetails: { location: '', date: '' },
    certification: false,
    max_seats: 0,
    start_date: '',
    status: 'active',
  });
  const [showSummaryCreator, setShowSummaryCreator] = useState(false);
  const [summaries, setSummaries] = useState<VisualSummary[]>([]);
  const [currentSummary, setCurrentSummary] = useState<VisualSummary | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [translatingSummaryId, setTranslatingSummaryId] = useState<number | null>(null);
  const [audioGenType, setAudioGenType] = useState('none');

  // Simulate offline caching with Service Worker
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').then(() => {
        console.log('Service Worker registered for offline caching');
      }).catch((error) => {
        console.error('Service Worker registration failed:', error);
      });
    }
  }, []);

  useEffect(() => {
    fetchSummaries();
    fetchCourses();
  }, [API_BASE_URL]);

  // Search with debouncing
  useEffect(() => {
    const delayedSearch = setTimeout(() => {
      if (searchQuery !== '') {
        setCurrentPage(1);
        fetchCourses(1, searchQuery);
      } else {
        fetchCourses(1, '');
      }
    }, 500);

    return () => clearTimeout(delayedSearch);
  }, [searchQuery]);

  // Handle page changes
  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
    fetchCourses(newPage, searchQuery);
  };

  // Handle page size changes
  const handlePageSizeChange = (newPageSize: number) => {
    setPageSize(newPageSize);
    setCurrentPage(1);
    fetchCourses(1, searchQuery);
  };

  const fetchSummaries = async () => {
    try {
      const response = await visualSummaryAPI.getVisualSummaries();
      if (response.data) {
        setSummaries(response.data);
      } else if (response.error) {
        console.error('Error fetching summaries:', response.error);
      }
    } catch (error) {
      console.error('Error fetching summaries:', error);
    }
  };

  const createVisualSummary = async (topic: string, context: string) => {
    setIsCreating(true);
    try {
      const response = await visualSummaryAPI.createVisualSummary({ 
        topic, 
        context, 
        language: 'en',
        generateAudio: false,
        audioOnDemand: false
      });
      if (response.data) {
        setSummaries([response.data, ...summaries]);
        setCurrentSummary(response.data);
        setShowSummaryCreator(false);
      } else if (response.error) {
        console.error('Error creating summary:', response.error);
        toast.error(t('consumer.summaryCreatorModal.error'));
      }
    } catch (error) {
      console.error('Error creating summary:', error);
      toast.error(t('consumer.summaryCreatorModal.error'));
    } finally {
      setIsCreating(false);
    }
  };

  const handleTranslateSummary = async (summary: VisualSummary) => {
    setTranslatingSummaryId(summary.id);
    try {
      const response = await fetch(`${API_BASE_URL}/translate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ json: summary, target_language: i18n.language }),
      });
      if (!response.ok) throw new Error('Translation failed');
      const translated = await response.json();
      setSummaries((prev) =>
        prev.map((s) => (s.id === summary.id ? { ...s, ...translated, id: s.id } : s))
      );
      if (currentSummary && currentSummary.id === summary.id) {
        setCurrentSummary({ ...currentSummary, ...translated, id: summary.id });
      }
    } catch (error) {
      console.error('Error translating summary:', error);
      toast.error(t('consumer.visualSummaryModal.translateError'));
    } finally {
      setTranslatingSummaryId(null);
    }
  };

  const generateSectionAudio = async (text: string, language: string, summaryId: number, sectionIndex: number) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/generate/${language}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify({ text, speaker: 'male' }),
      });
      if (!response.ok) throw new Error('Audio generation failed');
      const data = await response.json();
      if (!data.filename) throw new Error('No filename in response');

      const updateResponse = await fetch(`${API_BASE_URL}/api/update-summary-audio`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          summary_id: summaryId,
          section_index: sectionIndex,
          audio_url: data.filename,
        }),
      });
      if (!updateResponse.ok) throw new Error('Failed to update summary');
      return data.filename;
    } catch (error) {
      console.error('Error generating audio:', error);
      return null;
    }
  };

  const fetchCourses = async (page: number = currentPage, search: string = searchQuery) => {
    setLoading(true);
    try {
      const offset = (page - 1) * pageSize;
      
      // Fetch both regular courses and CSR courses with pagination
      const [coursesResponse, csrCoursesResponse] = await Promise.all([
        courseAPI.getCourses({
          limit: Math.floor(pageSize / 2), // Split between regular and CSR courses
          offset: Math.floor(offset / 2),
          search: search || undefined,
        }),
        csrCourseAPI.getCourses({
          limit: Math.floor(pageSize / 2),
          offset: Math.floor(offset / 2),
          search: search || undefined,
        }),
      ]);

      const allContent: ContentItem[] = [];
      let totalCombinedCount = 0;

      // Process regular courses
      if (coursesResponse.data?.courses) {
        const regularCourses: ContentItem[] = coursesResponse.data.courses.map((course) => ({
          id: course.id + 10000, // Offset to avoid conflicts with CSR course IDs
          titleKey: course.name,
          type: 'Course',
          format: 'Online Course',
          language: course.skill_level, // Use skill_level as language for now
          provider: course.provider,
          uploader: null,
          isCSR: false,
          duration: course.duration,
          tokens: 15,
          content_url: course.link,
          deliveryMode: 'Online',
          enrollments: 0,
          completions: 0,
          skills: course.tags || [],
          description: course.description,
        }));
        allContent.push(...regularCourses);
        totalCombinedCount += coursesResponse.data.total_count || 0;
      }

      // Process CSR courses
      if (csrCoursesResponse.data?.courses) {
        const csrCourses: ContentItem[] = csrCoursesResponse.data.courses.map((course) => ({
          id: course.id,
          titleKey: course.title,
          type: 'Course',
          format: 'CSR Course',
          language: course.language,
          provider: null,
          uploader: `CSR Provider ${course.company_id}`,
          isCSR: true,
          duration: course.duration,
          tokens: 0,
          content_url: course.content_url || '#',
          deliveryMode: 'Online',
          enrollments: 0,
          completions: 0,
          certification: course.certification,
          max_seats: course.max_seats,
          start_date: course.start_date,
          skills: course.skills,
          description: course.description,
          status: course.status,
        }));
        allContent.push(...csrCourses);
        totalCombinedCount += csrCoursesResponse.data.total_count || 0;
      }

      setContent(allContent);
      setTotalCount(totalCombinedCount);
      
    } catch (error) {
      console.error('Error fetching courses:', error);
      toast.error(t('consumer.contentList.fetchError'));
    } finally {
      setLoading(false);
    }
  };

  const createCourse = async (courseData: typeof newContent) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/csr/courses`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          company_id: COMPANY_ID,
          title: courseData.title,
          description: courseData.description,
          skills: courseData.skills.split(',').map((s: string) => s.trim()),
          duration: courseData.duration,
          language: courseData.language,
          certification: courseData.certification,
          max_seats: courseData.max_seats,
          start_date: courseData.start_date,
          status: courseData.status,
          content_url: courseData.content_url,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to create course');
      }
      const newCourse: CSRCourse = await response.json();
      setContent([
        ...content,
        {
          id: newCourse.id,
          titleKey: newCourse.title,
          type: 'Course',
          format: 'CSR Course',
          language: newCourse.language,
          provider: null,
          uploader: `CSR Provider ${newCourse.company_id}`,
          isCSR: true,
          duration: newCourse.duration,
          tokens: 0,
          content_url: newCourse.content_url || '#',
          deliveryMode: 'Online',
          enrollments: 0,
          completions: 0,
          certification: newCourse.certification,
          max_seats: newCourse.max_seats,
          start_date: newCourse.start_date,
          skills: newCourse.skills,
          description: newCourse.description,
          status: newCourse.status,
        },
      ]);
      toast.success(t('uploader.contentUpload.success'));
    } catch (error: any) {
      console.error('Error creating course:', error);
      toast.error(t('uploader.contentUpload.error') + ': ' + error.message);
    }
  };

  const enrollCourse = async (courseId: number) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/csr/courses/${courseId}/enroll`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          course_id: courseId,
          user_id: USER_ID,
          status: 'pending',
          progress: 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        const errorMessage = Array.isArray(errorData.detail)
          ? errorData.detail.map((err: any) => err.msg).join(', ')
          : errorData.detail;
        throw new Error(errorMessage);
      }
      toast.success(t('consumer.enrollment.success'));
      setTokens(tokens + (selectedContent?.tokens || 0));
      setProgress(progress + 10);
      await fetchCourses(); // Refresh to update metrics
    } catch (error: any) {
      console.error('Error enrolling in course:', error);
      toast.error(t('consumer.enrollment.failure') + ': ' + error.message);
    }
  };

  const completeCourse = async (courseId: number) => {
    try {
      // For now, just show success message since the API method doesn't exist
      toast.success(t('consumer.completion.success'));
      setTokens(tokens + 20);
      setProgress(progress + 15);
    } catch (error: any) {
      console.error('Error completing course:', error);
      toast.error(t('consumer.completion.failure') + ': ' + error.message);
    }
  };

  // Enhanced filtering function - only search-based
  const filteredContent = content.filter((item) => {
    if (role === 'Consumer') {
      // Apply search filter only
      if (searchQuery && !item.titleKey.toLowerCase().includes(searchQuery.toLowerCase()) &&
          !item.description?.toLowerCase().includes(searchQuery.toLowerCase()) &&
          !item.skills.some(skill => skill.toLowerCase().includes(searchQuery.toLowerCase()))) {
        return false;
      }
      return true;
    } else if (role === 'Uploader') {
      return item.uploader && item.isCSR;
    }
    return false;
  });

  // Highlight search terms
  const highlightText = (text: string, searchTerm: string) => {
    if (!searchTerm || !text) return text;
    
    const regex = new RegExp(`(${searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    return text.replace(regex, '<mark class="bg-yellow-300 text-black px-1 rounded">$1</mark>');
  };

  const handleContentSelect = (item: ContentItem) => {
    setSelectedContent(item);
    // Auto-scroll to the selected content section
    setTimeout(() => {
      const selectedContentElement = document.getElementById('selected-content-section');
      if (selectedContentElement) {
        selectedContentElement.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'start' 
        });
      }
    }, 100);
  };

  const handleSessionSelect = (session: LiveSession) => {
    setSelectedSession(session);
  };

  const handleChatSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (chatMessage.trim() && selectedSession) {
      const updatedSessions = liveSessions.map((session) =>
        session.id === selectedSession.id
          ? {
              ...session,
              chat: [...session.chat, { user: 'You', message: chatMessage, timestamp: new Date().toLocaleTimeString() }],
            }
          : session
      );
      setLiveSessions(updatedSessions);
      setSelectedSession({
        ...selectedSession,
        chat: [...selectedSession.chat, { user: 'You', message: chatMessage, timestamp: new Date().toLocaleTimeString() }],
      });
      setChatMessage('');
    }
  };

  const handleQnaSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (qnaQuestion.trim() && selectedSession) {
      const updatedSessions = liveSessions.map((session) =>
        session.id === selectedSession.id
          ? {
              ...session,
              qna: [...session.qna, { user: 'You', question: qnaQuestion, timestamp: new Date().toLocaleTimeString() }],
            }
          : session
      );
      setLiveSessions(updatedSessions);
      setSelectedSession({
        ...selectedSession,
        qna: [...selectedSession.qna, { user: 'You', question: qnaQuestion, timestamp: new Date().toLocaleTimeString() }],
      });
      setQnaQuestion('');
    }
  };

  const handleContentUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newContent.content_url.match(/^https?:\/\/[^\s$.?#].[^\s]*$/)) {
      toast.error(t('uploader.contentUpload.invalidUrl'));
      return;
    }
    await createCourse(newContent);
    setNewContent({
      title: '',
      description: '',
      skills: '',
      type: 'Course',
      format: 'Video',
      language: 'Hindi',
      duration: '',
      content_url: '',
      deliveryMode: 'Online',
      physicalDetails: { location: '', date: '' },
      certification: false,
      max_seats: 0,
      start_date: '',
      status: 'active',
    });
  };

  const handleExportAnalytics = () => {
    const csvContent = filteredContent
      .map((item) => {
        const completionRate = item.enrollments > 0 ? ((item.completions / item.enrollments) * 100).toFixed(2) : '0.00';
        const seatsAvailable = item.max_seats ? item.max_seats - item.enrollments : 'N/A';
        return `${item.titleKey},${item.language},${item.duration},${item.enrollments},${item.completions},${completionRate}%,${item.max_seats || 'N/A'},${seatsAvailable},${item.start_date || 'N/A'},${item.status || 'N/A'},${item.content_url || 'N/A'}`;
      })
      .join('\n');
    const blob = new Blob(
      [
        `Title,Language,Duration,Enrollments,Completions,Completion Rate,Max Seats,Seats Available,Start Date,Status,Content URL\n${csvContent}`,
      ],
      { type: 'text/csv' }
    );
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'course_analytics.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const VisualSummaryModal: React.FC<VisualSummaryProps> = ({
    summary,
    onClose,
    API_BASE_URL = '',
    translatingSummaryId,
    handleTranslateSummary,
    generateSectionAudio,
    setCurrentSummary,
    setSummaries,
  }) => {
    const { t, i18n } = useTranslation(); // For internationalization
    const [sectionIdx, setSectionIdx] = useState(0);
    const [isGeneratingAudio, setIsGeneratingAudio] = useState(false);
    const sections = summary.summary_data?.sections || [];
    const section = sections[sectionIdx] || { title: '', text: '', imageUrl: '', audioUrl: '' };
  
    useEffect(() => {
      const handleKey = (e: KeyboardEvent) => {
        if (e.key === 'ArrowLeft') setSectionIdx((idx) => Math.max(0, idx - 1));
        if (e.key === 'ArrowRight') setSectionIdx((idx) => Math.min(sections.length - 1, idx + 1));
        if (e.key === 'Escape') onClose();
      };
      window.addEventListener('keydown', handleKey);
      return () => window.removeEventListener('keydown', handleKey);
    }, [sections, onClose]);
  
    // Check if the imageUrl is a YouTube URL
    const isYouTubeUrl = section.imageUrl.includes('youtube.com') || section.imageUrl.includes('youtu.be');
    const isYouTubeSearch = section.imageUrl.includes('youtube.com/results');
    // Convert direct video URL to embed URL
    const embedUrl = isYouTubeUrl && !isYouTubeSearch
      ? section.imageUrl.replace('watch?v=', 'embed/').replace('youtu.be/', 'youtube.com/embed/')
      : '';
  
    return (
      <AnimatePresence>
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="relative w-full max-w-lg max-h-[90vh] rounded-3xl overflow-auto shadow-2xl bg-gradient-to-br from-[#1a1333] via-[#181a2a] to-[#1a2333] border border-white/10"
            initial={{ scale: 0.98, y: 40 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.98, y: 40 }}
          >
            <button
              className="absolute top-4 right-4 z-10 text-white/80 hover:text-white p-2 bg-black/30 rounded-full"
              onClick={onClose}
              aria-label={t('consumer.visualSummaryModal.close')}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <button
              className="absolute top-4 left-4 z-10 text-white/80 hover:text-white p-2 bg-black/30 rounded-full"
              onClick={() => handleTranslateSummary(summary)}
              disabled={translatingSummaryId === summary.id}
              aria-label={t('consumer.visualSummaryModal.translate')}
            >
              {translatingSummaryId === summary.id
                ? t('consumer.visualSummaryModal.translating')
                : t('consumer.visualSummaryModal.translate')}
            </button>
            <div className="relative h-[60vh] bg-black">
              {isYouTubeUrl ? (
                isYouTubeSearch ? (
                  <div className="w-full h-full flex items-center justify-center bg-[#222] p-4">
                    <a
                      href={section.imageUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-white/90 text-lg text-center hover:underline"
                    >
                      {t('consumer.visualSummaryModal.viewYouTubeTutorials', { sectionTitle: section.title })}
                    </a>
                  </div>
                ) : (
                  <iframe
                    src={embedUrl}
                    title={section.title}
                    className="w-full h-full object-cover object-center transition-all duration-300"
                    style={{ minHeight: 320, background: '#222' }}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                )
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-[#222] p-4">
                  <p className="text-white/90 text-lg text-center">{t('consumer.visualSummaryModal.noVideoAvailable')}</p>
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent pointer-events-none" />
              <button
                className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/70 text-white p-2 rounded-full"
                onClick={() => setSectionIdx((idx) => Math.max(0, idx - 1))}
                disabled={sectionIdx === 0}
                aria-label={t('consumer.visualSummaryModal.previous')}
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <button
                className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/70 text-white p-2 rounded-full"
                onClick={() => setSectionIdx((idx) => Math.min(sections.length - 1, idx + 1))}
                disabled={sectionIdx === sections.length - 1}
                aria-label={t('consumer.visualSummaryModal.next')}
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
            <div className="p-6 pb-4">
              <h2 className="text-2xl font-bold text-purple-200 mb-2">{summary.summary_data.title}</h2>
              <div className="mb-4">
                <span className="inline-block px-3 py-1 text-xs rounded-full bg-purple-900/40 text-purple-200 mr-2">
                  {t('consumer.visualSummaryModal.sectionInfo', {
                    sectionIdx: sectionIdx + 1,
                    sectionsLength: sections.length,
                  })}
                </span>
                <span className="inline-block px-3 py-1 text-xs rounded-full bg-blue-900/40 text-blue-200">
                  {section.title}
                </span>
              </div>
              <p className="text-white/90 text-lg leading-relaxed mb-2">{section.text}</p>
              <div className="mt-4 flex items-center gap-4">
                {section.audioUrl ? (
                  <audio
                    controls
                    src={`${API_BASE_URL}/api/audio/${i18n.language}/${section.audioUrl}`}
                    className="flex-1"
                  />
                ) : (
                  <button
                    onClick={async () => {
                      setIsGeneratingAudio(true);
                      try {
                        const audioUrl = await generateSectionAudio(
                          section.text,
                          i18n.language,
                          summary.id,
                          sectionIdx
                        );
                        if (audioUrl) {
                          const updatedSummary = { ...summary };
                          updatedSummary.summary_data.sections[sectionIdx].audioUrl = audioUrl;
                          setCurrentSummary(updatedSummary);
                          setSummaries((prevSummaries) =>
                            prevSummaries.map((s) => (s.id === summary.id ? updatedSummary : s))
                          );
                        }
                      } finally {
                        setIsGeneratingAudio(false);
                      }
                    }}
                    disabled={isGeneratingAudio}
                    className="bg-purple-500 text-white px-4 py-2 rounded-lg disabled:opacity-50"
                  >
                    {isGeneratingAudio
                      ? t('consumer.visualSummaryModal.generatingAudio')
                      : t('consumer.visualSummaryModal.generateAudio')}
                  </button>
                )}
              </div>
              <div className="flex justify-center gap-2 mt-6">
                {sections.map((_, idx) => (
                  <button
                    key={idx}
                    className={`w-3 h-3 rounded-full border-2 ${
                      idx === sectionIdx ? 'bg-purple-400 border-purple-400' : 'bg-white/30 border-white/30'
                    }`}
                    onClick={() => setSectionIdx(idx)}
                    aria-label={t('consumer.visualSummaryModal.goToSection', { sectionIdx: idx + 1 })}
                  />
                ))}
              </div>
            </div>
          </motion.div>
        </motion.div>
      </AnimatePresence>
    );
  };
  
  return (
    <div className="relative min-h-screen bg-black text-white overflow-hidden">
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="h-full w-full bg-[radial-gradient(circle_at_center,rgba(38,38,38,0.3)_1px,transparent_1px)] bg-[length:24px_24px]"></div>
      </div>
      <div className="absolute -top-24 -left-24 w-96 h-96 bg-purple-600 rounded-full filter blur-[128px] opacity-20 z-0 pointer-events-none"></div>
      <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-blue-600 rounded-full filter blur-[128px] opacity-20 z-0 pointer-events-none"></div>
      <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 via-black/60 to-blue-900/20 z-10 pointer-events-none"></div>

      <div className={`relative z-20 max-w-7xl mx-auto px-6 py-16 ${currentSummary ? 'hidden' : ''}`}>
        <h1 className="text-4xl md:text-5xl font-bold text-center mb-10 bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-blue-400">
          {t('header.title')}
        </h1>

        <div className="mb-8">
          <label className="block text-sm font-medium text-purple-200 mb-2">{t('roleSwitcher.label')}</label>
          <select
            className="p-2 border border-white/20 bg-black/50 text-white rounded focus:outline-none [&>option]:bg-gray-900"
            value={role}
            onChange={(e) => setRole(e.target.value)}
          >
            <option value="Consumer">{t('roleSwitcher.consumer')}</option>
            <option value="Uploader">{t('roleSwitcher.uploader')}</option>
          </select>
        </div>

        {role === 'Consumer' && (
          <>
            <div className="mb-8">
              <input
                type="text"
                className="w-full p-3 bg-white/10 text-white border border-white/20 rounded-lg focus:outline-none focus:border-purple-400 transition-colors"
                placeholder={t('consumer.searchBar.placeholder')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {/* Results Summary */}
            <div className="mb-6 flex justify-between items-center">
              <p className="text-sm text-gray-300">
                Found <span className="font-semibold text-purple-300">{filteredContent.length}</span> courses
                {searchQuery && (
                  <span> matching "<span className="font-semibold text-blue-300">{searchQuery}</span>"</span>
                )}
              </p>
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="text-xs text-gray-400 hover:text-white transition-colors underline"
                >
                  Clear search
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
              {filteredContent.length === 0 ? (
                <div className="col-span-full text-center py-12">
                  <div className="text-gray-400 mb-4">
                    <svg className="mx-auto h-16 w-16 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-medium text-gray-300 mb-2">No courses found</h3>
                  <p className="text-gray-400 mb-4">
                    {searchQuery
                      ? "Try adjusting your search terms to find more courses."
                      : "No courses are available at the moment."}
                  </p>
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg transition-colors"
                    >
                      Clear search
                    </button>
                  )}
                </div>
              ) : (
                filteredContent.map((item) => (
                  <div
                    key={item.id}
                    className="bg-white/10 backdrop-blur-lg p-5 rounded-2xl shadow-lg border border-white/10 hover:shadow-2xl transition"
                  >
                    <h3 
                      className="text-xl font-semibold text-purple-200 mb-2"
                      dangerouslySetInnerHTML={{
                        __html: highlightText(item.isCSR ? item.titleKey : t(item.titleKey), searchQuery)
                      }}
                    />
                    {item.isCSR && (
                      <span className="inline-block px-2 py-1 rounded-full text-xs bg-blue-600 text-white mb-2">
                        CSR Course
                      </span>
                    )}
                    <p className="text-sm text-gray-200">{t('consumer.contentList.type')}{item.type}</p>
                    <p className="text-sm text-gray-200">{t('consumer.contentList.format')}{item.format}</p>
                    <p className="text-sm text-gray-200">{t('consumer.contentList.language')}{item.language}</p>
                    <p className="text-sm text-gray-200">
                      {t('consumer.contentList.source')}
                      {item.uploader ? (
                        <span className="text-blue-300">{item.uploader}</span>
                      ) : (
                        <span className="text-purple-300">{item.provider}</span>
                      )}
                    </p>
                    <p className="text-sm text-gray-200">{t('consumer.contentList.duration')}{item.duration}</p>
                    <p className="text-sm text-blue-200">{t('consumer.contentList.tokens')}{item.tokens}</p>
                    <p className="text-sm text-gray-200">{t('consumer.contentList.mode')}{item.deliveryMode}</p>
                    
                    {item.description && (
                      <p 
                        className="text-sm text-gray-300 mt-2 line-clamp-2"
                        dangerouslySetInnerHTML={{
                          __html: highlightText(item.description, searchQuery)
                        }}
                      />
                    )}
                    
                    {item.physicalDetails && (
                      <p className="text-sm text-gray-200">
                        {t('consumer.contentList.physical')}
                        {item.physicalDetails.location} on {item.physicalDetails.date}
                      </p>
                    )}
                    
                    {item.isCSR && Array.isArray(item.skills) && item.skills.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-2">
                        {item.skills.map((skill, idx) => (
                          <span 
                            key={idx} 
                            className="text-xs bg-purple-900/50 text-purple-200 px-2 py-1 rounded-full"
                            dangerouslySetInnerHTML={{
                              __html: highlightText(skill, searchQuery)
                            }}
                          />
                        ))}
                      </div>
                    )}
                    
                    {item.isCSR && (
                      <>
                        <p className="text-sm text-gray-200">
                          {t('consumer.contentList.seats')}{item.max_seats ? (item.max_seats - (item.enrollments || 0)) : 0}/{item.max_seats || 'N/A'}
                        </p>
                        <p className="text-sm text-gray-200">
                          {t('consumer.contentList.startDate')}{item.start_date}
                        </p>
                        <p className="text-sm text-gray-200">
                          {t('consumer.contentList.enrollments')}{item.enrollments || 0}
                        </p>
                        <p className="text-sm text-gray-200">
                          {t('consumer.contentList.completions')}{item.completions || 0}
                        </p>
                      </>
                    )}
                    
                    <button
                      className="mt-3 bg-gradient-to-r from-purple-500 to-blue-500 text-white px-4 py-2 rounded-lg font-semibold hover:from-purple-600 hover:to-blue-600 transition"
                      onClick={() => handleContentSelect(item)}
                    >
                      {t('consumer.contentList.startLearning')}
                    </button>
                    {item.isCSR && (
                      <button
                        className="mt-3 ml-2 bg-gradient-to-r from-green-500 to-blue-500 text-white px-4 py-2 rounded-lg font-semibold hover:from-green-600 hover:to-blue-600 transition"
                        onClick={() => enrollCourse(item.id)}
                      >
                        {t('consumer.contentList.enroll')}
                      </button>
                    )}
                  </div>
                ))
              )}
            </div>

            {/* Pagination Controls */}
            <div className="mb-8 flex flex-col sm:flex-row justify-between items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-300">
                  Showing {((currentPage - 1) * pageSize) + 1} - {Math.min(currentPage * pageSize, totalCount)} of {totalCount} courses
                </span>
              </div>
              
              <div className="flex items-center gap-2">
                <select
                  value={pageSize}
                  onChange={(e) => handlePageSizeChange(Number(e.target.value))}
                  className="px-3 py-1 bg-black/50 text-white border border-white/20 rounded focus:outline-none [&>option]:bg-gray-900"
                >
                  <option value={6}>6 per page</option>
                  <option value={12}>12 per page</option>
                  <option value={24}>24 per page</option>
                  <option value={48}>48 per page</option>
                </select>
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={() => handlePageChange(1)}
                  disabled={currentPage === 1 || loading}
                  className="px-3 py-1 bg-white/10 text-white rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white/20 transition"
                >
                  &lt;&lt;
                </button>
                
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1 || loading}
                  className="px-3 py-1 bg-white/10 text-white rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white/20 transition"
                >
                  &lt;
                </button>

                {/* Page numbers */}
                {Array.from({ length: Math.min(5, Math.ceil(totalCount / pageSize)) }, (_, i) => {
                  const totalPages = Math.ceil(totalCount / pageSize);
                  let pageNum;
                  
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }

                  return (
                    <button
                      key={pageNum}
                      onClick={() => handlePageChange(pageNum)}
                      disabled={loading}
                      className={`px-3 py-1 rounded transition ${
                        currentPage === pageNum
                          ? 'bg-purple-500 text-white'
                          : 'bg-white/10 text-white hover:bg-white/20'
                      } disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                      {pageNum}
                    </button>
                  );
                })}

                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage >= Math.ceil(totalCount / pageSize) || loading}
                  className="px-3 py-1 bg-white/10 text-white rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white/20 transition"
                >
                  &gt;
                </button>
                
                <button
                  onClick={() => handlePageChange(Math.ceil(totalCount / pageSize))}
                  disabled={currentPage >= Math.ceil(totalCount / pageSize) || loading}
                  className="px-3 py-1 bg-white/10 text-white rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white/20 transition"
                >
                  &gt;&gt;
                </button>
              </div>
            </div>

            {loading && (
              <div className="text-center py-8">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
                <p className="mt-2 text-gray-300">Loading courses...</p>
              </div>
            )}

            {selectedContent && (
              <div id="selected-content-section" className="bg-white/10 backdrop-blur-lg p-6 rounded-2xl shadow-lg mb-8 border border-white/10">
                <h2 className="text-2xl font-semibold mb-2 text-purple-200">{selectedContent.titleKey}</h2>
                <p className="text-gray-200">
                  {t('consumer.selectedContent.source')}
                  {selectedContent.uploader || selectedContent.provider}
                </p>
                <p className="text-gray-200">{t('consumer.selectedContent.format')}{selectedContent.format}</p>
                <p className="text-gray-200">{t('consumer.selectedContent.language')}{selectedContent.language}</p>
                {selectedContent.isCSR && (
                  <>
                    <p className="text-gray-200">{t('consumer.selectedContent.description')}{selectedContent.description}</p>
                    <p className="text-gray-200">
                      {t('consumer.selectedContent.certification')}{selectedContent.certification ? 'Yes' : 'No'}
                    </p>
                    <p className="text-gray-200">
                      {t('consumer.selectedContent.seats')}{selectedContent.max_seats ? (selectedContent.max_seats - (selectedContent.enrollments || 0)) : 0}/
                      {selectedContent.max_seats || 'N/A'}
                    </p>
                    <p className="text-gray-200">
                      {t('consumer.selectedContent.startDate')}{selectedContent.start_date}
                    </p>
                  </>
                )}
                <div className="mt-4">
                  {selectedContent.content_url && selectedContent.content_url !== '#' ? (
                    <a
                      href={selectedContent.content_url}
                      className="text-blue-400 underline"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {t('consumer.selectedContent.accessCourse')}
                    </a>
                  ) : (
                    <p className="text-gray-400">{t('consumer.selectedContent.noContentAvailable')}</p>
                  )}
                </div>
                {selectedContent.isCSR && (
                  <button
                    className="mt-4 bg-gradient-to-r from-green-500 to-blue-500 text-white px-4 py-2 rounded-lg font-semibold hover:from-green-600 hover:to-blue-600 transition"
                    onClick={() => completeCourse(selectedContent.id)}
                  >
                    {t('consumer.selectedContent.markComplete')}
                  </button>
                )}
                <button
                  className="mt-4 ml-4 bg-gray-700 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition"
                  onClick={() => setSelectedContent(null)}
                >
                  {t('consumer.selectedContent.close')}
                </button>
              </div>
            )}

            <div className="bg-white/10 backdrop-blur-lg p-6 rounded-2xl shadow-lg mb-8 border border-white/10">
              <h2 className="text-2xl font-semibold mb-4 text-blue-200">{t('consumer.liveSessions.title')}</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {liveSessions.map((session) => (
                  <div key={session.id} className="border border-white/10 bg-black/30 p-5 rounded-xl shadow">
                    <h3 className="text-lg font-semibold text-purple-200">{t(session.titleKey)}</h3>
                    <p className="text-sm text-gray-200">
                      {t('consumer.liveSessions.source')}
                      {session.uploader || session.provider}
                    </p>
                    <p className="text-sm text-gray-200">{t('consumer.liveSessions.date')}{session.date}</p>
                    <p className="text-sm text-gray-200">{t('consumer.liveSessions.time')}{session.time}</p>
                    <a
                      href={session.meetingLink}
                      className="text-blue-400 underline"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {t('consumer.liveSessions.joinMeeting')}
                    </a>
                    <button
                      className="mt-3 bg-gradient-to-r from-purple-500 to-blue-500 text-white px-4 py-2 rounded-lg font-semibold hover:from-purple-600 hover:to-blue-600 transition"
                      onClick={() => handleSessionSelect(session)}
                    >
                      {t('consumer.liveSessions.viewChatQna')}
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {selectedSession && (
              <div className="bg-white/10 backdrop-blur-lg p-6 rounded-2xl shadow-lg border border-white/10">
                <h2 className="text-2xl font-semibold mb-4 text-blue-200">
                  {t(selectedSession.titleKey)} - {t('consumer.chatQna.interaction')}
                </h2>
                <div className="flex flex-col md:flex-row space-y-6 md:space-y-0 md:space-x-6">
                  <div className="md:w-1/2">
                    <h3 className="text-lg font-semibold mb-2 text-purple-200">{t('consumer.chatQna.chatTitle')}</h3>
                    <div className="h-64 overflow-y-auto border border-white/10 bg-black/20 p-2 rounded-lg mb-4">
                      {selectedSession.chat.map((msg, index) => (
                        <div key={index} className="mb-2">
                          <span className="font-bold text-blue-300">{msg.user} ({msg.timestamp}): </span>
                          <span className="text-gray-100">{msg.message}</span>
                        </div>
                      ))}
                    </div>
                    <form onSubmit={handleChatSubmit}>
                      <input
                        type="text"
                        className="w-full p-2 bg-white/10 text-white border border-white/20 rounded mb-2 focus:outline-none"
                        placeholder={t('consumer.chatQna.chatPlaceholder')}
                        value={chatMessage}
                        onChange={(e) => setChatMessage(e.target.value)}
                      />
                      <button
                        type="submit"
                        className="bg-gradient-to-r from-purple-500 to-blue-500 text-white px-4 py-2 rounded-lg hover:from-purple-600 hover:to-blue-600 transition"
                      >
                        {t('consumer.chatQna.chatSend')}
                      </button>
                    </form>
                  </div>
                  <div className="md:w-1/2">
                    <h3 className="text-lg font-semibold mb-2 text-blue-200">{t('consumer.chatQna.qnaTitle')}</h3>
                    <div className="h-64 overflow-y-auto border border-white/10 bg-black/20 p-2 rounded-lg mb-4">
                      {selectedSession.qna.map((q, index) => (
                        <div key={index} className="mb-2">
                          <span className="font-bold text-purple-300">{q.user} ({q.timestamp}): </span>
                          <span className="text-gray-100">{q.question}</span>
                        </div>
                      ))}
                    </div>
                    <form onSubmit={handleQnaSubmit}>
                      <input
                        type="text"
                        className="w-full p-2 bg-white/10 text-white border border-white/20 rounded mb-2 focus:outline-none"
                        placeholder={t('consumer.chatQna.qnaPlaceholder')}
                        value={qnaQuestion}
                        onChange={(e) => setQnaQuestion(e.target.value)}
                      />
                      <button
                        type="submit"
                        className="bg-gradient-to-r from-purple-500 to-blue-500 text-white px-4 py-2 rounded-lg hover:from-purple-600 hover:to-blue-600 transition"
                      >
                        {t('consumer.chatQna.qnaSubmit')}
                      </button>
                    </form>
                  </div>
                </div>
                <button
                  className="mt-6 bg-gray-700 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition"
                  onClick={() => setSelectedSession(null)}
                >
                  {t('consumer.chatQna.close')}
                </button>
              </div>
            )}

            <div className="bg-white/10 backdrop-blur-lg p-6 rounded-2xl shadow-lg mb-8 border border-white/10">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-semibold text-purple-200">{t('consumer.visualSummaries.title')}</h2>
                <button
                  onClick={() => setShowSummaryCreator(true)}
                  className="bg-gradient-to-r from-purple-500 to-blue-500 text-white px-4 py-2 rounded-lg"
                >
                  {t('consumer.visualSummaries.createNew')}
                </button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {summaries.map((summary) => {
                  const firstSection = summary.summary_data?.sections?.[0];
                  if (!firstSection) return null;
                  return (
                    <div
                      key={summary.id}
                      className="relative group cursor-pointer rounded-xl overflow-hidden border border-white/10 bg-black/40 hover:shadow-xl transition"
                      onClick={() => {
                        setCurrentSummary(summary);
                      }}
                    >
                      <div className="relative h-48 w-full">
                        <img
                          src={`${API_BASE_URL}/api${firstSection.imageUrl}`}
                          alt={firstSection.title}
                          className="w-full h-full object-cover object-center transition-all duration-300 group-hover:scale-105"
                          loading="lazy"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />
                      </div>
                      <div className="absolute top-2 left-2 bg-purple-800/70 text-xs px-3 py-1 rounded-full text-white">
                        {summary.summary_data.title}
                      </div>
                      <div className="absolute bottom-2 left-2 right-2 flex flex-col gap-1">
                        <span className="text-sm font-semibold text-purple-200 drop-shadow">{firstSection.title}</span>
                        <span className="text-xs text-white/80">{firstSection.text.slice(0, 60)}...</span>
                      </div>
                      <div className="absolute top-2 right-2 bg-black/60 text-xs px-2 py-1 rounded text-white">
                        {summary.summary_data.sections.length} sections
                      </div>
                      <div className="absolute bottom-2 right-2 text-xs text-gray-400">
                        {new Date(summary.created_at).toLocaleDateString()}
                      </div>
                      <button
                        className="absolute bottom-2 left-2 bg-blue-700/80 text-xs px-3 py-1 rounded text-white hover:bg-blue-800 transition"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleTranslateSummary(summary);
                        }}
                        disabled={translatingSummaryId === summary.id}
                      >
                        {translatingSummaryId === summary.id
                          ? t('consumer.visualSummaryModal.translating')
                          : t('consumer.visualSummaryModal.translate')}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>

            {showSummaryCreator && (
              <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
                <div className="bg-gray-900 p-6 rounded-xl w-full max-w-md">
                  <h3 className="text-xl font-semibold text-purple-200 mb-4">{t('consumer.summaryCreatorModal.title')}</h3>
                  <form
                    onSubmit={async (e) => {
                      e.preventDefault();
                      const form = e.target as HTMLFormElement;
                      const topic = (form.elements.namedItem('topic') as HTMLInputElement).value;
                      const context = (form.elements.namedItem('context') as HTMLTextAreaElement).value;

                      if (audioGenType === 'all') {
                        const response = await fetch(`${API_BASE_URL}/api/visual-summary`, {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({
                            topic,
                            context,
                            generateAudio: true,
                            language: i18n.language,
                          }),
                        });
                        if (!response.ok) throw new Error('Failed to create summary with audio');
                        const data = await response.json();
                        setSummaries([data, ...summaries]);
                        setCurrentSummary(data);
                      } else {
                        await createVisualSummary(topic, context);
                      }
                      setShowSummaryCreator(false);
                    }}
                  >
                    <input
                      type="text"
                      name="topic"
                      placeholder={t('consumer.summaryCreatorModal.topicPlaceholder')}
                      className="w-full p-2 bg-black/50 text-white border border-white/20 rounded mb-4"
                      required
                    />
                    <textarea
                      name="context"
                      placeholder={t('consumer.summaryCreatorModal.contextPlaceholder')}
                      className="w-full p-2 bg-black/50 text-white border border-white/20 rounded mb-4 h-32"
                      required
                    />
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-200 mb-2">
                        {t('consumer.summaryCreatorModal.audioOptions')}
                      </label>
                      <div className="space-y-2">
                        <label className="flex items-center space-x-2">
                          <input
                            type="radio"
                            name="audioGen"
                            value="none"
                            checked={audioGenType === 'none'}
                            onChange={(e) => setAudioGenType(e.target.value)}
                            className="text-purple-500"
                          />
                          <span className="text-white">{t('consumer.summaryCreatorModal.audioNone')}</span>
                        </label>
                        <label className="flex items-center space-x-2">
                          <input
                            type="radio"
                            name="audioGen"
                            value="onDemand"
                            checked={audioGenType === 'onDemand'}
                            onChange={(e) => setAudioGenType(e.target.value)}
                            className="text-purple-500"
                          />
                          <span className="text-white">{t('consumer.summaryCreatorModal.audioOnDemand')}</span>
                        </label>
                        <label className="flex items-center space-x-2">
                          <input
                            type="radio"
                            name="audioGen"
                            value="all"
                            checked={audioGenType === 'all'}
                            onChange={(e) => setAudioGenType(e.target.value)}
                            className="text-purple-500"
                          />
                          <span className="text-white">{t('consumer.summaryCreatorModal.audioAll')}</span>
                        </label>
                      </div>
                    </div>

                    <div className="flex justify-end gap-4">
                      <button
                        type="button"
                        onClick={() => setShowSummaryCreator(false)}
                        className="px-4 py-2 text-gray-400 hover:text-white"
                      >
                        {t('consumer.summaryCreatorModal.cancel')}
                      </button>
                      <button
                        type="submit"
                        disabled={isCreating}
                        className="bg-gradient-to-r from-purple-500 to-blue-500 text-white px-4 py-2 rounded-lg disabled:opacity-50"
                      >
                        {isCreating
                          ? t('consumer.summaryCreatorModal.creating')
                          : t('consumer.summaryCreatorModal.create')}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </>
        )}

        {role === 'Uploader' && (
          <>
            <div className="bg-white/10 backdrop-blur-lg p-6 rounded-2xl shadow-lg mb-8 border border-white/10">
              <h2 className="text-2xl font-semibold mb-4 text-purple-200">{t('uploader.contentUpload.title')}</h2>
              <form onSubmit={handleContentUpload}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-200">{t('uploader.contentUpload.titleLabel')}</label>
                    <input
                      type="text"
                      className="mt-1 block w-full p-2 bg-white/10 text-white border border-white/20 rounded focus:outline-none"
                      value={newContent.title}
                      onChange={(e) => setNewContent({ ...newContent, title: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-200">{t('uploader.contentUpload.descriptionLabel')}</label>
                    <textarea
                      className="mt-1 block w-full p-2 bg-white/10 text-white border border-white/20 rounded focus:outline-none"
                      value={newContent.description}
                      onChange={(e) => setNewContent({ ...newContent, description: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-200">{t('uploader.contentUpload.skillsLabel')}</label>
                    <input
                      type="text"
                      className="mt-1 block w-full p-2 bg-white/10 text-white border border-white/20 rounded focus:outline-none"
                      value={newContent.skills}
                      onChange={(e) => setNewContent({ ...newContent, skills: e.target.value })}
                      placeholder="Comma-separated skills (e.g., Python, Data Analysis)"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-200">{t('uploader.contentUpload.languageLabel')}</label>
                    <select
                      className="mt-1 block w-full p-2 bg-black/50 text-white border border-white/20 rounded focus:outline-none [&>option]:bg-gray-900"
                      value={newContent.language}
                      onChange={(e) => setNewContent({ ...newContent, language: e.target.value })}
                    >
                      <option>{t('uploader.contentUpload.languageHindi')}</option>
                      <option>{t('uploader.contentUpload.languageEnglish')}</option>
                      <option>{t('uploader.contentUpload.languageTamil')}</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-200">{t('uploader.contentUpload.durationLabel')}</label>
                    <input
                      type="text"
                      className="mt-1 block w-full p-2 bg-white/10 text-white border border-white/20 rounded focus:outline-none"
                      value={newContent.duration}
                      onChange={(e) => setNewContent({ ...newContent, duration: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-200">{t('uploader.contentUpload.contentUrlLabel')}</label>
                    <input
                      type="url"
                      className="mt-1 block w-full p-2 bg-white/10 text-white border border-white/20 rounded focus:outline-none"
                      value={newContent.content_url}
                      onChange={(e) => setNewContent({ ...newContent, content_url: e.target.value })}
                      placeholder="https://example.com/course-content"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-200">{t('uploader.contentUpload.maxSeatsLabel')}</label>
                    <input
                      type="number"
                      className="mt-1 block w-full p-2 bg-white/10 text-white border border-white/20 rounded focus:outline-none"
                      value={newContent.max_seats}
                      onChange={(e) => setNewContent({ ...newContent, max_seats: parseInt(e.target.value) })}
                      min="1"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-200">{t('uploader.contentUpload.startDateLabel')}</label>
                    <input
                      type="date"
                      className="mt-1 block w-full p-2 bg-white/10 text-white border border-white/20 rounded focus:outline-none"
                      value={newContent.start_date}
                      onChange={(e) => setNewContent({ ...newContent, start_date: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-200">{t('uploader.contentUpload.certificationLabel')}</label>
                    <input
                      type="checkbox"
                      className="mt-1"
                      checked={newContent.certification}
                      onChange={(e) => setNewContent({ ...newContent, certification: e.target.checked })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-200">{t('uploader.contentUpload.statusLabel')}</label>
                    <select
                      className="mt-1 block w-full p-2 bg-black/50 text-white border border-white/20 rounded focus:outline-none [&>option]:bg-gray-900"
                      value={newContent.status}
                      onChange={(e) => setNewContent({ ...newContent, status: e.target.value })}
                    >
                      <option value="active">{t('uploader.contentUpload.statusActive')}</option>
                      <option value="inactive">{t('uploader.contentUpload.statusInactive')}</option>
                    </select>
                  </div>
                </div>
                <button
                  type="submit"
                  className="mt-4 bg-gradient-to-r from-purple-500 to-blue-500 text-white px-4 py-2 rounded-lg hover:from-purple-600 hover:to-blue-600 transition"
                >
                  {t('uploader.contentUpload.uploadButton')}
                </button>
              </form>
            </div>

            <div className="bg-white/10 backdrop-blur-lg p-6 rounded-2xl shadow-lg mb-8 border border-white/10">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-semibold text-blue-200">{t('uploader.analytics.title')}</h2>
                <button
                  onClick={handleExportAnalytics}
                  className="bg-gradient-to-r from-purple-500 to-blue-500 text-white px-4 py-2 rounded-lg hover:from-purple-600 hover:to-blue-600 transition"
                >
                  {t('uploader.analytics.exportButton')}
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="text-gray-200 border-b border-white/10">
                      <th className="py-2">{t('uploader.analytics.table.title')}</th>
                      <th className="py-2">{t('uploader.analytics.table.language')}</th>
                      <th className="py-2">{t('uploader.analytics.table.duration')}</th>
                      <th className="py-2">{t('uploader.analytics.table.enrollments')}</th>
                      <th className="py-2">{t('uploader.analytics.table.completions')}</th>
                      <th className="py-2">{t('uploader.analytics.table.completionRate')}</th>
                      <th className="py-2">{t('uploader.analytics.table.maxSeats')}</th>
                      <th className="py-2">{t('uploader.analytics.table.seatsAvailable')}</th>
                      <th className="py-2">{t('uploader.analytics.table.startDate')}</th>
                      <th className="py-2">{t('uploader.analytics.table.status')}</th>
                      <th className="py-2">{t('uploader.analytics.table.contentUrl')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredContent.map((item) => {
                      const completionRate = item.enrollments > 0 ? ((item.completions / item.enrollments) * 100).toFixed(2) : '0.00';
                      const seatsAvailable = item.max_seats ? item.max_seats - item.enrollments : 'N/A';
                      return (
                        <tr key={item.id} className="border-b border-white/10">
                          <td className="py-2">{item.titleKey}</td>
                          <td className="py-2">{item.language}</td>
                          <td className="py-2">{item.duration}</td>
                          <td className="py-2">{item.enrollments}</td>
                          <td className="py-2">{item.completions}</td>
                          <td className="py-2">{completionRate}%</td>
                          <td className="py-2">{item.max_seats || 'N/A'}</td>
                          <td className="py-2">{seatsAvailable}</td>
                          <td className="py-2">{item.start_date || 'N/A'}</td>
                          <td className="py-2">{item.status || 'N/A'}</td>
                          <td className="py-2">
                            <a href={item.content_url} className="text-blue-400 underline" target="_blank" rel="noopener noreferrer">
                              {item.content_url || 'N/A'}
                            </a>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>

      {currentSummary && (
        <VisualSummaryModal summary={currentSummary} onClose={() => setCurrentSummary(null)} />
      )}
      <Toaster />
    </div>
  );
};

export default SkillBuilder;