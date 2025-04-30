import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';



// Dummy data for tutorials, courses, and live sessions
const dummyContent = [
  {
    id: 1,
    title: 'Introduction to Tailoring',
    type: 'Tutorial',
    format: 'Video',
    language: 'Hindi',
    provider: 'Local Trainer',
    uploader: null,
    isCSR: false,
    duration: '15 min',
    tokens: 10,
    url: 'https://example.com/tailoring-video.mp4',
    deliveryMode: 'Online',
    enrollments: 120,
    completions: 80,
  },
  {
    id: 2,
    title: 'Digital Marketing Basics',
    type: 'Course',
    format: 'Text + Audio',
    language: 'English',
    provider: null,
    uploader: 'Infosys',
    isCSR: true,
    duration: '1 hr',
    tokens: 20,
    url: 'https://example.com/digital-marketing.pdf',
    deliveryMode: 'Online',
    enrollments: 200,
    completions: 150,
  },
  {
    id: 3,
    title: 'Organic Farming Workshop',
    type: 'Course',
    format: 'Video + Physical',
    language: 'Tamil',
    provider: 'NSDC',
    uploader: 'NSDC',
    isCSR: false,
    duration: '2 hrs',
    tokens: 30,
    url: 'https://example.com/farming-video.mp4',
    deliveryMode: 'Hybrid',
    physicalDetails: { location: 'Chennai Community Center', date: '2025-05-01' },
    enrollments: 90,
    completions: 60,
  },
];

const dummyLiveSessions = [
  {
    id: 1,
    title: 'Q&A on Tailoring Techniques',
    provider: 'Local Trainer',
    uploader: null,
    date: '2025-04-30',
    time: '14:00 IST',
    meetingLink: 'https://zoom.us/j/123456789',
    chat: [],
    qna: [],
    participants: 50,
  },
  {
    id: 2,
    title: 'Digital Marketing Live Workshop',
    provider: null,
    uploader: 'Infosys (CSR)',
    date: '2025-05-02',
    time: '10:00 IST',
    meetingLink: 'https://meet.google.com/abc-def-ghi',
    chat: [],
    qna: [],
    participants: 100,
  },
];

interface VisualSummary {
  id: number;
  topic: string;
  summary_data: {
    type: string;
    title: string;
    sections: {
      title: string;
      text: string;
      imageUrl: string;
      audioUrl: string;
    }[];
  };
  created_at: string;
}

// Main Component
const SkillBuilder = () => {
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

  const [role, setRole] = useState('Consumer'); // Role state: Consumer, Provider, Uploader
  const [content, setContent] = useState(dummyContent);
  const [liveSessions, setLiveSessions] = useState(dummyLiveSessions);
  const [selectedContent, setSelectedContent] = useState(null);
  const [selectedSession, setSelectedSession] = useState(null);
  const [chatMessage, setChatMessage] = useState('');
  const [qnaQuestion, setQnaQuestion] = useState('');
  const [filterLanguage, setFilterLanguage] = useState('All');
  const [filterMode, setFilterMode] = useState('All');
  const [tokens, setTokens] = useState(0);
  const [progress, setProgress] = useState(0);
  const [newContent, setNewContent] = useState({
    title: '',
    type: 'Tutorial',
    format: 'Video',
    language: 'Hindi',
    duration: '',
    url: '',
    deliveryMode: 'Online',
    physicalDetails: { location: '', date: '' },
  });

  const [showSummaryCreator, setShowSummaryCreator] = useState(false);
  const [summaries, setSummaries] = useState<VisualSummary[]>([]);
  const [currentSummary, setCurrentSummary] = useState<VisualSummary | null>(null);
  const [currentSectionIndex, setCurrentSectionIndex] = useState(0);
  const [isCreating, setIsCreating] = useState(false);

  // Simulate offline caching with Service Worker
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').then(() => {
        console.log('Service Worker registered for offline caching');
      });
    }
  }, []);

  useEffect(() => {
    fetchSummaries();
  }, []);

  const fetchSummaries = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/visual-summaries`);
      const data = await response.json();
      setSummaries(data);
    } catch (error) {
      console.error('Error fetching summaries:', error);
    }
  };

  const createVisualSummary = async (topic: string, context: string) => {
    setIsCreating(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/visual-summary`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic, context })
      });
      const data = await response.json();
      setSummaries([data, ...summaries]);
      setCurrentSummary(data);
      setShowSummaryCreator(false);
    } catch (error) {
      console.error('Error creating summary:', error);
    }
    setIsCreating(false);
  };

  // Filter content based on role, language, and delivery mode
  const filteredContent = content.filter((item) => {
    if (role === 'Consumer') {
      return (
        (filterLanguage === 'All' || item.language === filterLanguage) &&
        (filterMode === 'All' || item.deliveryMode === filterMode)
      );
    } else if (role === 'Provider') {
      return item.provider && item.provider !== 'NSDC';
    } else if (role === 'Uploader') {
      return item.uploader;
    }
    return false;
  });

  // Handle content selection (Consumer)
  const handleContentSelect = (item) => {
    setSelectedContent(item);
    setProgress(progress + 10); // Simulate progress
    setTokens(tokens + item.tokens); // Award tokens
  };

  // Handle live session selection
  const handleSessionSelect = (session) => {
    setSelectedSession(session);
  };

  // Handle chat submission (Consumer)
  const handleChatSubmit = (e) => {
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

  // Handle Q&A submission (Consumer)
  const handleQnaSubmit = (e) => {
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

  // Handle content upload (Provider/Uploader)
  const handleContentUpload = (e) => {
    e.preventDefault();
    const newId = content.length + 1;
    const uploadedContent = {
      id: newId,
      ...newContent,
      provider: role === 'Provider' ? 'Local Trainer' : null,
      uploader: role === 'Uploader' ? 'New CSR/Government' : null,
      isCSR: role === 'Uploader',
      tokens: 10,
      enrollments: 0,
      completions: 0,
    };
    setContent([...content, uploadedContent]);
    setNewContent({
      title: '',
      type: 'Tutorial',
      format: 'Video',
      language: 'Hindi',
      duration: '',
      url: '',
      deliveryMode: 'Online',
      physicalDetails: { location: '', date: '' },
    });
  };

  // Handle analytics export (Uploader)
  const handleExportAnalytics = () => {
    const csvContent = filteredContent
      .map(
        (item) =>
          `${item.title},${item.enrollments},${item.completions},${(item.completions / item.enrollments) * 100 || 0}%`
      )
      .join('\n');
    const blob = new Blob([`Title,Enrollments,Completions,Completion Rate\n${csvContent}`], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'analytics.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const VisualSummaryModal = ({
    summary,
    onClose,
  }: {
    summary: VisualSummary;
    onClose: () => void;
  }) => {
    const [sectionIdx, setSectionIdx] = useState(0);
    const sections = summary.summary_data?.sections || [];
    const section = sections[sectionIdx] || { title: "", text: "", imageUrl: "", audioUrl: "" };
  
    // Keyboard navigation
    useEffect(() => {
      const handleKey = (e: KeyboardEvent) => {
        if (e.key === "ArrowLeft") setSectionIdx((idx) => Math.max(0, idx - 1));
        if (e.key === "ArrowRight")
          setSectionIdx((idx) =>
            Math.min(sections.length - 1, idx + 1)
          );
        if (e.key === "Escape") onClose();
      };
      window.addEventListener("keydown", handleKey);
      return () => window.removeEventListener("keydown", handleKey);
    }, [sections, onClose]);
  
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
            {/* Close button */}
            <button
              className="absolute top-4 right-4 z-10 text-white/80 hover:text-white p-2 bg-black/30 rounded-full"
              onClick={onClose}
              aria-label="Close"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
  
            {/* Image */}
            <div className="relative h-[60vh] bg-black">
              <img
                src={`${API_BASE_URL}/api/images/${section.imageUrl}`}
                alt={section.title}
                className="w-full h-full object-cover object-center transition-all duration-300"
                style={{ minHeight: 320, background: "#222" }}
                loading="lazy"
              />
              {/* Overlay gradient */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent pointer-events-none" />
              {/* Section navigation arrows */}
              <button
                className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/70 text-white p-2 rounded-full"
                onClick={() => setSectionIdx((idx) => Math.max(0, idx - 1))}
                disabled={sectionIdx === 0}
                aria-label="Previous"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <button
                className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/70 text-white p-2 rounded-full"
                onClick={() =>
                  setSectionIdx((idx) =>
                    Math.min(sections.length - 1, idx + 1)
                  )
                }
                disabled={sectionIdx === sections.length - 1}
                aria-label="Next"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
  
            {/* Section text */}
            <div className="p-6 pb-4">
              <h2 className="text-2xl font-bold text-purple-200 mb-2">{summary.summary_data.title}</h2>
              <div className="mb-4">
                <span className="inline-block px-3 py-1 text-xs rounded-full bg-purple-900/40 text-purple-200 mr-2">
                  Section {sectionIdx + 1} of {sections.length}
                </span>
                <span className="inline-block px-3 py-1 text-xs rounded-full bg-blue-900/40 text-blue-200">
                  {section.title}
                </span>
              </div>
              <p className="text-white/90 text-lg leading-relaxed mb-2">{section.text}</p>
              {/* Optionally, add audio if available */}
              {section.audioUrl && section.audioUrl.length > 0 && (
                <audio controls src={section.audioUrl} className="mt-2 w-full" />
              )}
              {/* Navigation dots */}
              <div className="flex justify-center gap-2 mt-6">
                {sections.map((_, idx) => (
                  <button
                    key={idx}
                    className={`w-3 h-3 rounded-full border-2 ${
                      idx === sectionIdx
                        ? "bg-purple-400 border-purple-400"
                        : "bg-white/30 border-white/30"
                    }`}
                    onClick={() => setSectionIdx(idx)}
                    aria-label={`Go to section ${idx + 1}`}
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
      {/* Background grid and accent lights */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="h-full w-full bg-[radial-gradient(circle_at_center,rgba(38,38,38,0.3)_1px,transparent_1px)] bg-[length:24px_24px]"></div>
      </div>
      <div className="absolute -top-24 -left-24 w-96 h-96 bg-purple-600 rounded-full filter blur-[128px] opacity-20 z-0 pointer-events-none"></div>
      <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-blue-600 rounded-full filter blur-[128px] opacity-20 z-0 pointer-events-none"></div>
      <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 via-black/60 to-blue-900/20 z-10 pointer-events-none"></div>

      <div className={`relative z-20 max-w-7xl mx-auto px-6 py-16 ${currentSummary ? "hidden" : ""}`}>
        {/* Header */}
        <h1 className="text-4xl md:text-5xl font-bold text-center mb-10 bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-blue-400">
          Skill Builder & Adaptive Learning
        </h1>

        {/* Role Switcher */}
        <div className="mb-8">
          <label className="block text-sm font-medium text-purple-200 mb-2">Select Role</label>
          <select
            className="p-2 border border-white/20 bg-black/50 text-white rounded focus:outline-none [&>option]:bg-gray-900"
            value={role}
            onChange={(e) => setRole(e.target.value)}
          >
            <option>Consumer</option>
            <option>Provider</option>
            <option>Uploader</option>
          </select>
        </div>

        {/* Consumer View */}
        {role === 'Consumer' && (
          <>
            {/* Progress Dashboard */}
            {/* <div className="bg-white/10 backdrop-blur-lg p-6 rounded-2xl shadow-lg mb-8 border border-white/10">
              <h2 className="text-2xl font-semibold mb-2 text-white">Your Progress</h2>
              <div className="flex justify-between text-lg">
                <p className="text-purple-200">Progress: <span className="font-bold">{progress}%</span></p>
                <p className="text-blue-200">Shiksha Tokens: <span className="font-bold">{tokens}</span></p>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-3 mt-3">
                <div className="bg-gradient-to-r from-purple-500 to-blue-500 h-3 rounded-full transition-all duration-300" style={{ width: `${progress}%` }}></div>
              </div>
            </div> */}
            {/* Search Bar */}
            <div className="mb-8">
              <input
                type="text"
                className="w-full p-2 bg-white/10 text-white border border-white/20 rounded focus:outline-none"
                placeholder="Search content..."
                onChange={(e) => {
                  const searchQuery = e.target.value.toLowerCase();
                  setContent(
                    dummyContent.filter((item) =>
                      item.title.toLowerCase().includes(searchQuery)
                    )
                  );
                }}
              />
            </div>

            {/* Filters */}
            <div className="flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-6 mb-8">
              <div>
                <label className="block text-sm font-medium text-purple-200">Language</label>
                <select
                  className="mt-1 block w-full p-2 bg-black/50 text-white border border-white/20 rounded focus:outline-none [&>option]:bg-gray-900"
                  value={filterLanguage}
                  onChange={(e) => setFilterLanguage(e.target.value)}
                >
                  <option>All</option>
                  <option>Hindi</option>
                  <option>English</option>
                  <option>Tamil</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-blue-200">Delivery Mode</label>
                <select
                  className="mt-1 block w-full p-2 bg-black/50 text-white border border-white/20 rounded focus:outline-none [&>option]:bg-gray-900"
                  value={filterMode}
                  onChange={(e) => setFilterMode(e.target.value)}
                >
                  <option>All</option>
                  <option>Online</option>
                  <option>Hybrid</option>
                </select>
              </div>
            </div>

            {/* Content List */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
              {filteredContent.map((item) => (
                <div key={item.id} className="bg-white/10 backdrop-blur-lg p-5 rounded-2xl shadow-lg border border-white/10 hover:shadow-2xl transition">
                  <h3 className="text-xl font-semibold text-purple-200">{item.title}</h3>
                  <p className="text-sm text-gray-200">Type: {item.type}</p>
                  <p className="text-sm text.gray-200">Format: {item.format}</p>
                  <p className="text-sm text-gray-200">Language: {item.language}</p>
                  <p className="text-sm text-gray-200">
                    Source: {item.uploader ? <span className="text-blue-300">{item.uploader} (CSR)</span> : <span className="text-purple-300">{item.provider}</span>}
                  </p>
                  <p className="text-sm text-gray-200">Duration: {item.duration}</p>
                  <p className="text-sm text-blue-200">Tokens: {item.tokens}</p>
                  <p className="text-sm text-gray-200">Mode: {item.deliveryMode}</p>
                  {item.physicalDetails && (
                    <p className="text-sm text-gray-200">
                      Physical: {item.physicalDetails.location} on {item.physicalDetails.date}
                    </p>
                  )}
                  <button
                    className="mt-3 bg-gradient-to-r from-purple-500 to-blue-500 text-white px-4 py-2 rounded-lg font-semibold hover:from-purple-600 hover:to-blue-600 transition"
                    onClick={() => handleContentSelect(item)}
                  >
                    Start Learning
                  </button>
                </div>
              ))}
            </div>

            {/* Selected Content Details */}
            {selectedContent && (
              <div className="bg-white/10 backdrop-blur-lg p-6 rounded-2xl shadow-lg mb-8 border border-white/10">
                <h2 className="text-2xl font-semibold mb-2 text-purple-200">{selectedContent.title}</h2>
                <p className="text-gray-200">Source: {selectedContent.uploader || selectedContent.provider}</p>
                <p className="text-gray-200">Format: {selectedContent.format}</p>
                <p className="text-gray-200">Language: {selectedContent.language}</p>
                <div className="mt-4">
                  {selectedContent.format.includes('Video') ? (
                    <video controls className="w-full rounded-lg border border-white/10">
                      <source src={selectedContent.url} type="video/mp4" />
                      Your browser does not support the video tag.
                    </video>
                  ) : (
                    <a
                      href={selectedContent.url}
                      className="text-blue-400 underline"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      View Content
                    </a>
                  )}
                </div>
                <button
                  className="mt-4 bg-gray-700 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition"
                  onClick={() => setSelectedContent(null)}
                >
                  Close
                </button>
              </div>
            )}

            {/* Live Sessions */}
            <div className="bg-white/10 backdrop-blur-lg p-6 rounded-2xl shadow-lg mb-8 border border-white/10">
              <h2 className="text-2xl font-semibold mb-4 text-blue-200">Live Sessions</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {liveSessions.map((session) => (
                  <div key={session.id} className="border border-white/10 bg-black/30 p-5 rounded-xl shadow">
                    <h3 className="text-lg font-semibold text-purple-200">{session.title}</h3>
                    <p className="text-sm text-gray-200">Source: {session.uploader || session.provider}</p>
                    <p className="text-sm text-gray-200">Date: {session.date}</p>
                    <p className="text-sm text-gray-200">Time: {session.time}</p>
                    <a
                      href={session.meetingLink}
                      className="text-blue-400 underline"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Join Meeting
                    </a>
                    <button
                      className="mt-3 bg-gradient-to-r from-purple-500 to-blue-500 text-white px-4 py-2 rounded-lg font-semibold hover:from-purple-600 hover:to-blue-600 transition"
                      onClick={() => handleSessionSelect(session)}
                    >
                      View Chat & Q&A
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Chat and Q&A for Selected Session */}
            {selectedSession && (
              <div className="bg-white/10 backdrop-blur-lg p-6 rounded-2xl shadow-lg border border-white/10">
                <h2 className="text-2xl font-semibold mb-4 text-blue-200">{selectedSession.title} - Interaction</h2>
                <div className="flex flex-col md:flex-row space-y-6 md:space-y-0 md:space-x-6">
                  {/* Chat Section */}
                  <div className="md:w-1/2">
                    <h3 className="text-lg font-semibold mb-2 text-purple-200">Chat</h3>
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
                        placeholder="Type your message..."
                        value={chatMessage}
                        onChange={(e) => setChatMessage(e.target.value)}
                      />
                      <button type="submit" className="bg-gradient-to-r from-purple-500 to-blue-500 text-white px-4 py-2 rounded-lg hover:from-purple-600 hover:to-blue-600 transition">
                        Send
                      </button>
                    </form>
                  </div>
                  {/* Q&A Section */}
                  <div className="md:w-1/2">
                    <h3 className="text-lg font-semibold mb-2 text-blue-200">Q&A</h3>
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
                        placeholder="Ask a question..."
                        value={qnaQuestion}
                        onChange={(e) => setQnaQuestion(e.target.value)}
                      />
                      <button type="submit" className="bg-gradient-to-r from-purple-500 to-blue-500 text-white px-4 py-2 rounded-lg hover:from-purple-600 hover:to-blue-600 transition">
                        Submit
                      </button>
                    </form>
                  </div>
                </div>
                <button
                  className="mt-6 bg-gray-700 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition"
                  onClick={() => setSelectedSession(null)}
                >
                  Close
                </button>
              </div>
            )}

            {/* Visual Summaries */}
            <div className="bg-white/10 backdrop-blur-lg p-6 rounded-2xl shadow-lg mb-8 border border-white/10">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-semibold text-purple-200">Visual Summaries</h2>
                <button
                  onClick={() => setShowSummaryCreator(true)}
                  className="bg-gradient-to-r from-purple-500 to-blue-500 text-white px-4 py-2 rounded-lg"
                >
                  Create New Summary
                </button>
              </div>
              {/* Thumbnails grid */}
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
                        setCurrentSectionIndex(0);
                      }}
                    >
                      <div className="relative h-48 w-full">
                        <img
                          src={`${API_BASE_URL}/api/images/${firstSection.imageUrl}`}
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
                    </div>
                  );
                })}
              </div>
            </div>
            
            {/* Summary Creator Modal */}
            {showSummaryCreator && (
              <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
                <div className="bg-gray-900 p-6 rounded-xl w-full max-w-md">
                  <h3 className="text-xl font-semibold text-purple-200 mb-4">Create Visual Summary</h3>
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      const form = e.target as HTMLFormElement;
                      const topic = (form.elements.namedItem('topic') as HTMLInputElement).value;
                      const context = (form.elements.namedItem('context') as HTMLTextAreaElement).value;
                      createVisualSummary(topic, context);
                    }}
                  >
                    <input
                      type="text"
                      name="topic"
                      placeholder="Enter topic..."
                      className="w-full p-2 bg-black/50 text-white border border-white/20 rounded mb-4"
                      required
                    />
                    <textarea
                      name="context"
                      placeholder="Enter additional context..."
                      className="w-full p-2 bg-black/50 text-white border border-white/20 rounded mb-4 h-32"
                      required
                    />
                    <div className="flex justify-end gap-4">
                      <button
                        type="button"
                        onClick={() => setShowSummaryCreator(false)}
                        className="px-4 py-2 text-gray-400 hover:text-white"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={isCreating}
                        className="bg-gradient-to-r from-purple-500 to-blue-500 text-white px-4 py-2 rounded-lg disabled:opacity-50"
                      >
                        {isCreating ? 'Creating...' : 'Create'}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
            
          </>
        )}

        {/* Provider View */}
        {role === 'Provider' && (
          <>
            {/* Content Upload Form */}
            <div className="bg-white/10 backdrop-blur-lg p-6 rounded-2xl shadow-lg mb-8 border border-white/10">
              <h2 className="text-2xl font-semibold mb-4 text-purple-200">Upload New Content</h2>
              <form onSubmit={handleContentUpload}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* ...existing form fields, update input backgrounds and text... */}
                  {/* Title */}
                  <div>
                    <label className="block text-sm font-medium text-gray-200">Title</label>
                    <input
                      type="text"
                      className="mt-1 block w-full p-2 bg-white/10 text-white border border-white/20 rounded focus:outline-none"
                      value={newContent.title}
                      onChange={(e) => setNewContent({ ...newContent, title: e.target.value })}
                      required
                    />
                  </div>
                  {/* ...repeat for all other fields, updating classes as above... */}
                  {/* ...existing code for other fields... */}
                  {/* Type */}
                  <div>
                    <label className="block text-sm font-medium text.gray-200">Type</label>
                    <select
                      className="mt-1 block w-full p-2 bg-black/50 text-white border border-white/20 rounded focus:outline-none [&>option]:bg-gray-900"
                      value={newContent.type}
                      onChange={(e) => setNewContent({ ...newContent, type: e.target.value })}
                    >
                      <option>Tutorial</option>
                      <option>Course</option>
                    </select>
                  </div>
                  {/* Format */}
                  <div>
                    <label className="block text-sm font-medium text-gray-200">Format</label>
                    <select
                      className="mt-1 block w-full p-2 bg-black/50 text-white border border-white/20 rounded focus:outline-none [&>option]:bg-gray-900"
                      value={newContent.format}
                      onChange={(e) => setNewContent({ ...newContent, format: e.target.value })}
                    >
                      <option>Video</option>
                      <option>Text + Audio</option>
                      <option>Video + Physical</option>
                    </select>
                  </div>
                  {/* Language */}
                  <div>
                    <label className="block text-sm font-medium text-gray-200">Language</label>
                    <select
                      className="mt-1 block w-full p-2 bg-black/50 text-white border border-white/20 rounded focus:outline-none [&>option]:bg-gray-900"
                      value={newContent.language}
                      onChange={(e) => setNewContent({ ...newContent, language: e.target.value })}
                    >
                      <option>Hindi</option>
                      <option>English</option>
                      <option>Tamil</option>
                    </select>
                  </div>
                  {/* Duration */}
                  <div>
                    <label className="block text-sm font-medium text-gray-200">Duration</label>
                    <input
                      type="text"
                      className="mt-1 block w-full p-2 bg.white/10 text-white border border-white/20 rounded focus:outline-none"
                      value={newContent.duration}
                      onChange={(e) => setNewContent({ ...newContent, duration: e.target.value })}
                      required
                    />
                  </div>
                  {/* Content URL */}
                  <div>
                    <label className="block text-sm font-medium text-gray-200">Content URL</label>
                    <input
                      type="url"
                      className="mt-1 block w-full p-2 bg-white/10 text.white border border-white/20 rounded focus:outline-none"
                      value={newContent.url}
                      onChange={(e) => setNewContent({ ...newContent, url: e.target.value })}
                      required
                    />
                  </div>
                  {/* Delivery Mode */}
                  <div>
                    <label className="block text-sm font-medium text-gray-200">Delivery Mode</label>
                    <select
                      className="mt-1 block w-full p-2 bg-black/50 text-white border border-white/20 rounded focus:outline-none [&>option]:bg-gray-900"
                      value={newContent.deliveryMode}
                      onChange={(e) => setNewContent({ ...newContent, deliveryMode: e.target.value })}
                    >
                      <option>Online</option>
                      <option>Hybrid</option>
                    </select>
                  </div>
                  {newContent.deliveryMode === 'Hybrid' && (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-gray-200">Physical Location</label>
                        <input
                          type="text"
                          className="mt-1 block w-full p-2 bg-white/10 text-white border border-white/20 rounded focus:outline-none"
                          value={newContent.physicalDetails.location}
                          onChange={(e) =>
                            setNewContent({
                              ...newContent,
                              physicalDetails: { ...newContent.physicalDetails, location: e.target.value },
                            })
                          }
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-200">Physical Date</label>
                        <input
                          type="date"
                          className="mt-1 block w-full p-2 bg-white/10 text-white border border-white/20 rounded focus:outline-none"
                          value={newContent.physicalDetails.date}
                          onChange={(e) =>
                            setNewContent({
                              ...newContent,
                              physicalDetails: { ...newContent.physicalDetails, date: e.target.value },
                            })
                          }
                        />
                      </div>
                    </>
                  )}
                </div>
                <button type="submit" className="mt-4 bg-gradient-to-r from-purple-500 to-blue-500 text-white px-4 py-2 rounded-lg hover:from-purple-600 hover:to-blue-600 transition">
                  Upload Content
                </button>
              </form>
            </div>

            {/* Provider Content List */}
            <div className="bg-white/10 backdrop-blur-lg p-6 rounded-2xl shadow-lg mb-8 border border-white/10">
              <h2 className="text-2xl font-semibold mb-4 text-blue-200">Your Content</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredContent.map((item) => (
                  <div key={item.id} className="border border-white/10 bg-black/20 p-4 rounded">
                    <h3 className="text-lg font-semibold text-purple-200">{item.title}</h3>
                    <p className="text-sm text-gray-200">Type: {item.type}</p>
                    <p className="text-sm text-blue-200">Enrollments: {item.enrollments}</p>
                    <p className="text-sm text-blue-200">Completions: {item.completions}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Provider Live Sessions */}
            <div className="bg-white/10 backdrop-blur-lg p-6 rounded-2xl shadow-lg border border-white/10">
              <h2 className="text-2xl font-semibold mb-4 text-blue-200">Your Live Sessions</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {liveSessions
                  .filter((session) => session.provider)
                  .map((session) => (
                    <div key={session.id} className="border border-white/10 bg-black/20 p-4 rounded">
                      <h3 className="text-lg font-semibold text-purple-200">{session.title}</h3>
                      <p className="text-sm text-gray-200">Date: {session.date}</p>
                      <p className="text-sm text-gray-200">Time: {session.time}</p>
                      <p className="text-sm text-blue-200">Participants: {session.participants}</p>
                      <a
                        href={session.meetingLink}
                        className="text-blue-400 underline"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Host Meeting
                      </a>
                    </div>
                  ))}
              </div>
            </div>
          </>
        )}

        {/* Uploader View */}
        {role === 'Uploader' && (
          <>
            {/* Content Upload Form (CSR-Branded) */}
            <div className="bg-white/10 backdrop-blur-lg p-6 rounded-2xl shadow-lg mb-8 border border-white/10">
              <h2 className="text-2xl font-semibold mb-4 text-purple-200">Upload CSR-Branded Content</h2>
              <form onSubmit={handleContentUpload}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* ...same input fields as above, with dark theme classes... */}
                  {/* Title */}
                  <div>
                    <label className="block text-sm font-medium text-gray-200">Title</label>
                    <input
                      type="text"
                      className="mt-1 block w-full p-2 bg-white/10 text-white border border-white/20 rounded focus:outline-none"
                      value={newContent.title}
                      onChange={(e) => setNewContent({ ...newContent, title: e.target.value })}
                      required
                    />
                  </div>
                  {/* ...repeat for all other fields, updating classes as above... */}
                  {/* Type */}
                  <div>
                    <label className="block text-sm font-medium text-gray-200">Type</label>
                    <select
                      className="mt-1 block w-full p-2 bg-black/50 text-white border border-white/20 rounded focus:outline-none [&>option]:bg-gray-900"
                      value={newContent.type}
                      onChange={(e) => setNewContent({ ...newContent, type: e.target.value })}
                    >
                      <option>Tutorial</option>
                      <option>Course</option>
                    </select>
                  </div>
                  {/* Format */}
                  <div>
                    <label className="block text-sm font-medium text-gray-200">Format</label>
                    <select
                      className="mt-1 block w-full p-2 bg.black/50 text-white border border-white/20 rounded focus:outline-none [&>option]:bg-gray-900"
                      value={newContent.format}
                      onChange={(e) => setNewContent({ ...newContent, format: e.target.value })}
                    >
                      <option>Video</option>
                      <option>Text + Audio</option>
                      <option>Video + Physical</option>
                    </select>
                  </div>
                  {/* Language */}
                  <div>
                    <label className="block text-sm font-medium text-gray-200">Language</label>
                    <select
                      className="mt-1 block w-full p-2 bg-black/50 text-white border border-white/20 rounded focus:outline-none [&>option]:bg-gray-900"
                      value={newContent.language}
                      onChange={(e) => setNewContent({ ...newContent, language: e.target.value })}
                    >
                      <option>Hindi</option>
                      <option>English</option>
                      <option>Tamil</option>
                    </select>
                  </div>
                  {/* Duration */}
                  <div>
                    <label className="block text-sm font-medium text-gray-200">Duration</label>
                    <input
                      type="text"
                      className="mt-1 block w-full p-2 bg.white/10 text-white border border-white/20 rounded focus:outline-none"
                      value={newContent.duration}
                      onChange={(e) => setNewContent({ ...newContent, duration: e.target.value })}
                      required
                    />
                  </div>
                  {/* Content URL */}
                  <div>
                    <label className="block text-sm font-medium text-gray-200">Content URL</label>
                    <input
                      type="url"
                      className="mt-1 block w-full p-2 bg.white/10 text-white border border-white/20 rounded focus:outline-none"
                      value={newContent.url}
                      onChange={(e) => setNewContent({ ...newContent, url: e.target.value })}
                      required
                    />
                  </div>
                  {/* Delivery Mode */}
                  <div>
                    <label className="block text-sm font-medium text-gray-200">Delivery Mode</label>
                    <select
                      className="mt-1 block w-full p-2 bg-black/50 text-white border border-white/20 rounded focus:outline-none [&>option]:bg-gray-900"
                      value={newContent.deliveryMode}
                      onChange={(e) => setNewContent({ ...newContent, deliveryMode: e.target.value })}
                    >
                      <option>Online</option>
                      <option>Hybrid</option>
                    </select>
                  </div>
                  {newContent.deliveryMode === 'Hybrid' && (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-gray-200">Physical Location</label>
                        <input
                          type="text"
                          className="mt-1 block w-full p-2 bg-white/10 text-white border border-white/20 rounded focus:outline-none"
                          value={newContent.physicalDetails.location}
                          onChange={(e) =>
                            setNewContent({
                              ...newContent,
                              physicalDetails: { ...newContent.physicalDetails, location: e.target.value },
                            })
                          }
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-200">Physical Date</label>
                        <input
                          type="date"
                          className="mt-1 block w-full p-2 bg-white/10 text-white border border-white/20 rounded focus:outline-none"
                          value={newContent.physicalDetails.date}
                          onChange={(e) =>
                            setNewContent({
                              ...newContent,
                              physicalDetails: { ...newContent.physicalDetails, date: e.target.value },
                            })
                          }
                        />
                      </div>
                    </>
                  )}
                </div>
                <button type="submit" className="mt-4 bg-gradient-to-r from-purple-500 to-blue-500 text-white px-4 py-2 rounded-lg hover:from-purple-600 hover:to-blue-600 transition">
                  Upload Content
                </button>
              </form>
            </div>

            {/* Uploader Analytics Dashboard */}
            <div className="bg-white/10 backdrop-blur-lg p-6 rounded-2xl shadow-lg mb-8 border border-white/10">
              <h2 className="text-2xl font-semibold mb-4 text-blue-200">Analytics Dashboard</h2>
              <button
                className="mb-4 bg-gradient-to-r from-green-500 to-blue-500 text-white px-4 py-2 rounded-lg hover:from-green-600 hover:to-blue-600 transition"
                onClick={handleExportAnalytics}
              >
                Export Analytics (CSV)
              </button>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredContent.map((item) => (
                  <div key={item.id} className="border border-white/10 bg-black/20 p-4 rounded">
                    <h3 className="text-lg font-semibold text-purple-200">{item.title}</h3>
                    <p className="text-sm text-blue-200">Enrollments: {item.enrollments}</p>
                    <p className="text-sm text.blue-200">Completions: {item.completions}</p>
                    <p className="text-sm text-gray-200">
                      Completion Rate: {((item.completions / item.enrollments) * 100 || 0).toFixed(2)}%
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Uploader Live Sessions */}
            <div className="bg-white/10 backdrop-blur-lg p-6 rounded-2xl shadow-lg border border-white/10">
              <h2 className="text-2xl font-semibold mb-4 text-blue-200">Your Live Sessions</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {liveSessions
                  .filter((session) => session.uploader)
                  .map((session) => (
                    <div key={session.id} className="border border-white/10 bg-black/20 p-4 rounded">
                      <h3 className="text-lg font-semibold text-purple-200">{session.title}</h3>
                      <p className="text-sm text-gray-200">Date: {session.date}</p>
                      <p className="text-sm text-gray-200">Time: {session.time}</p>
                      <p className="text-sm text-blue-200">Participants: {session.participants}</p>
                      <a
                        href={session.meetingLink}
                        className="text-blue-400 underline"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Host Meeting
                      </a>
                    </div>
                  ))}
              </div>
            </div>
          </>
        )}
      </div>
      {/* Visual Summary Modal */}
      {currentSummary && (
        <VisualSummaryModal
          summary={currentSummary}
          onClose={() => setCurrentSummary(null)}
        />
      )}
    </div>
  );
};

export default SkillBuilder;