import React, { useState, useEffect } from 'react';

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

// Main Component
const SkillBuilder = () => {
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

  // Simulate offline caching with Service Worker
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').then(() => {
        console.log('Service Worker registered for offline caching');
      });
    }
  }, []);

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

  return (
    <div className="relative min-h-screen bg-black text-white overflow-hidden">
      {/* Background grid and accent lights */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="h-full w-full bg-[radial-gradient(circle_at_center,rgba(38,38,38,0.3)_1px,transparent_1px)] bg-[length:24px_24px]"></div>
      </div>
      <div className="absolute -top-24 -left-24 w-96 h-96 bg-purple-600 rounded-full filter blur-[128px] opacity-20 z-0 pointer-events-none"></div>
      <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-blue-600 rounded-full filter blur-[128px] opacity-20 z-0 pointer-events-none"></div>
      <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 via-black/60 to-blue-900/20 z-10 pointer-events-none"></div>

      <div className="relative z-20 max-w-7xl mx-auto px-6 py-16">
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
                  <p className="text-sm text-gray-200">Format: {item.format}</p>
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
                      className="mt-1 block w-full p-2 bg-white/10 text-white border border-white/20 rounded focus:outline-none"
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
                      className="mt-1 block w-full p-2 bg-white/10 text-white border border-white/20 rounded focus:outline-none"
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
                      className="mt-1 block w-full p-2 bg-white/10 text-white border border-white/20 rounded focus:outline-none"
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
                      className="mt-1 block w-full p-2 bg-white/10 text-white border border-white/20 rounded focus:outline-none"
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
                    <p className="text-sm text-blue-200">Completions: {item.completions}</p>
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
    </div>
  );
};

export default SkillBuilder;