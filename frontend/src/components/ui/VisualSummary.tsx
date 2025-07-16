import React, { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

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
  show?: boolean;
  apiBaseUrl?: string;
  language?: string;
}

const VisualSummary: React.FC<VisualSummaryProps> = ({ summary, onClose, show = true, apiBaseUrl = '', language = 'en' }) => {
  const [sectionIdx, setSectionIdx] = useState(0);
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

  if (!show) return null;

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
            aria-label="Close visual summary"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
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
                    View YouTube tutorials for "{section.title}" (Click to open)
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
                <p className="text-white/90 text-lg text-center">No video available for this section</p>
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent pointer-events-none" />
            <button
              className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/70 text-white p-2 rounded-full"
              onClick={() => setSectionIdx((idx) => Math.max(0, idx - 1))}
              disabled={sectionIdx === 0}
              aria-label="Previous section"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/70 text-white p-2 rounded-full"
              onClick={() => setSectionIdx((idx) => Math.min(sections.length - 1, idx + 1))}
              disabled={sectionIdx === sections.length - 1}
              aria-label="Next section"
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
                Section {sectionIdx + 1} of {sections.length}
              </span>
              <span className="inline-block px-3 py-1 text-xs rounded-full bg-blue-900/40 text-blue-200">
                {section.title}
              </span>
            </div>
            <p className="text-white/90 text-lg leading-relaxed mb-2">{section.text}</p>
            {section.audioUrl && section.audioUrl.length > 0 && (
              <audio controls src={`${apiBaseUrl}/api${section.audioUrl}`} className="mt-2 w-full" />
            )}
            <div className="flex justify-center gap-2 mt-6">
              {sections.map((_, idx) => (
                <button
                  key={idx}
                  className={`w-3 h-3 rounded-full border-2 ${
                    idx === sectionIdx ? 'bg-purple-400 border-purple-400' : 'bg-white/30 border-white/30'
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

export default VisualSummary;