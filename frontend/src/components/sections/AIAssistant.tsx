import { useState } from "react";
import { useTranslation } from 'react-i18next';
import { Volume2, VolumeX, Mic, Square, Settings } from 'lucide-react';
import { 
  JobRenderer, 
  SchemeRenderer, 
  BusinessSuggestionRenderer, 
  CourseRenderer, 
  TutorialRenderer, 
  EventRenderer,
  ProjectRenderer,
  YoutubeSummaryRenderer,
  ProfileRenderer
} from '../ui/FeatureRenderers';
import { useEffect } from 'react';
import VisualSummary from '../ui/VisualSummary';

interface AssistantResponse {
  output: string;
  feature_type?: string;
  structured_data?: any;
  summary?: string;
}
import { Toaster, toast } from 'react-hot-toast';

// Helper for chunked translation
async function translateInChunks(text: string, lang: string, chunkSize = 400) {
  if (!text || lang === 'en') return text;
  const chunks = [];
  for (let i = 0; i < text.length; i += chunkSize) {
    chunks.push(text.slice(i, i + chunkSize));
  }
  const translatedChunks = await Promise.all(
    chunks.map(async (chunk) => {
      // Call your backend translation endpoint (replace with actual API call)
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/translate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: chunk, lang }),
      });
      const data = await res.json();
      return data.translated || chunk;
    })
  );
  return translatedChunks.join('');
}

export default function AIAssistant({ lang }: { lang: string }) {
  const { t } = useTranslation('ai-assistant');
  const [userInput, setUserInput] = useState("");
  const [assistantResponse, setAssistantResponse] = useState<AssistantResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [transcribed, setTranscribed] = useState("");
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [ttsEnabled, setTtsEnabled] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const VITE_API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
  const [translating, setTranslating] = useState(false);
  const [showVisualSummary, setShowVisualSummary] = useState(false);

  // Enhanced browser STT with better feedback
  const handleStartListening = () => {
    if (!("webkitSpeechRecognition" in window)) {
      toast.error(t('alerts.speechNotSupported'), {
        style: {
          background: 'rgba(100, 50, 100, 0.9)',
          color: '#fff',
          borderRadius: '10px',
          boxShadow: '0 4px 15px rgba(0, 0, 0, 0.2)',
        },
      });
      return;
    }
    
    const recognition = new (window as any).webkitSpeechRecognition();
    recognition.lang = lang;
    recognition.continuous = false;
    recognition.interimResults = false;
    
    setIsListening(true);
    
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setUserInput(transcript);
      setTranscribed(transcript);
      console.log("Transcribed audio:", transcript);
    };
    
    recognition.onend = () => {
      setIsListening(false);
    };
    
    recognition.onerror = (event: any) => {
      console.error("Speech recognition error:", event.error);
      setIsListening(false);
      alert(t('alerts.speechError', 'Speech recognition error. Please try again.'));
    };
    
    recognition.start();
  };

  const stopListening = () => {
    setIsListening(false);
    // Stop recognition if it's running
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
  };

  const handleProcess = async () => {
    setLoading(true);
    setAssistantResponse(null);
    
    try {
      const response = await fetch(`${VITE_API_BASE_URL}/api/ai-assistant-enhanced`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: userInput, lang }),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data: AssistantResponse = await response.json();
      setAssistantResponse(data);
      
      // Optional TTS
      if (ttsEnabled && "speechSynthesis" in window && data.output) {
        const utter = new SpeechSynthesisUtterance(data.output);
        utter.lang = lang;
        utter.onstart = () => setIsSpeaking(true);
        utter.onend = () => setIsSpeaking(false);
        utter.onerror = () => setIsSpeaking(false);
        window.speechSynthesis.speak(utter);
      }
    } catch (error) {
      console.error("Error processing request:", error);
      setAssistantResponse({
        output: t('error.processing', 'Sorry, I encountered an error while processing your request. Please try again.'),
        feature_type: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const stopSpeaking = () => {
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  };

  // Helper to render all new structured data types
  const renderFeatureContent = () => {
    if (!assistantResponse?.structured_data) return null;
    const d = assistantResponse.structured_data;
    switch (assistantResponse.feature_type) {
      case 'event_management':
        if (d.event) return <EventRenderer events={[d.event]} compact={false} />;
        if (d.events) return <EventRenderer events={d.events} compact={true} />;
        break;
      case 'project_showcase':
        if (d.projects) return <ProjectRenderer projects={d.projects} compact={true} />;
        break;
      case 'profile_management':
      case 'dashboard_view':
        if (d.profile) return <ProfileRenderer profile={d.profile} compact={false} />;
        break;
      case 'recommend_job':
        if (d.jobs) return <JobRenderer jobs={d.jobs} compact={true} />;
        break;
      case 'scheme_recommendation':
        if (d.schemes) return <SchemeRenderer schemes={d.schemes} compact={true} />;
        break;
      case 'business_suggestion':
        if (d.suggestions) return <BusinessSuggestionRenderer suggestions={d.suggestions} compact={true} />;
        break;
      case 'course_recommendation':
        if (d.courses) return <CourseRenderer courses={d.courses} compact={true} />;
        break;
      case 'skill_tutorial':
        if (d.tutorials) return <TutorialRenderer tutorials={d.tutorials} compact={true} />;
        break;
      case 'youtube_summary':
        if (d.youtube_summary) return <YoutubeSummaryRenderer summaries={[d.youtube_summary]} compact={true} />;
        if (d.youtube_search_url) return (
          <div className="p-3 bg-gray-800 rounded-lg border border-gray-700 mt-2">
            <a href={d.youtube_search_url} target="_blank" rel="noopener noreferrer" className="text-blue-400 underline">Search YouTube for this topic</a>
          </div>
        );
        break;
      case 'csr_dashboard':
        if (d.companies) return (
          <div className="p-3 bg-gray-800 rounded-lg border border-gray-700 mt-2">
            <h3 className="text-lg font-bold mb-2">CSR Companies</h3>
            <ul className="list-disc ml-6">
              {d.companies.map((c: any) => <li key={c.id}>{c.name}</li>)}
            </ul>
          </div>
        );
        break;
      case 'csr_course':
        if (d.csr_courses) return <CourseRenderer courses={d.csr_courses} compact={true} />;
        break;
      case 'visual_summary':
        if (d.visual_summary) return (
          <div className="p-3 bg-gray-800 rounded-lg border border-gray-700 mt-2">
            <h3 className="text-lg font-bold mb-2">Visual Summary</h3>
            <pre className="text-xs text-gray-300 whitespace-pre-wrap">{JSON.stringify(d.visual_summary, null, 2)}</pre>
          </div>
        );
        break;
      case 'product_recommendation':
        if (d.product_links && Array.isArray(d.product_links)) return (
          <div className="p-3 bg-green-900/20 rounded-lg border border-green-700 mt-2">
            <h3 className="text-lg font-bold mb-2">Product Search</h3>
            <ul className="space-y-2">
              {d.product_links.map((link: any) => (
                <li key={link.product_term}>
                  <span className="font-semibold">{link.product_term}</span>: {' '}
                  <a href={link.product_search_url} target="_blank" rel="noopener noreferrer" className="text-green-400 underline">View on GeM</a>
                </li>
              ))}
            </ul>
          </div>
        );
        break;
      default:
        return null;
    }
    return null;
  };

  // Translation effect for output and summary
  useEffect(() => {
    if (assistantResponse && lang !== 'en' && assistantResponse.output) {
      setTranslating(true);
      translateInChunks(assistantResponse.output, lang).then(translated => {
        setAssistantResponse(r => r ? { ...r, output: translated } : r);
        setTranslating(false);
      });
    }
    // Optionally translate summary as well
    // eslint-disable-next-line
  }, [assistantResponse?.output, lang]);

  // Show VisualSummary modal if feature_type is 'visual_summary' and data exists
  useEffect(() => {
    if (
      assistantResponse?.feature_type === 'visual_summary' &&
      assistantResponse.structured_data?.visual_summary
    ) {
      setShowVisualSummary(true);
    } else {
      setShowVisualSummary(false);
    }
  }, [assistantResponse]);

  return (
    <div
      className="text-white bg-gray-900 rounded-xl shadow-2xl p-6 relative"
      style={{
        width: 420,
        height: 700,
        maxWidth: "100vw",
        maxHeight: "100vh",
        overflowY: "auto",
        margin: "0 auto",
        display: "flex",
        flexDirection: "column"
      }}
    >
      {/* Visual Summary Modal */}
      {showVisualSummary && assistantResponse?.structured_data?.visual_summary && (
        <VisualSummary
          summary={assistantResponse.structured_data.visual_summary}
          onClose={() => setShowVisualSummary(false)}
          apiBaseUrl={VITE_API_BASE_URL}
        />
      )}
      {/* Header with Settings */}
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">{t('title', 'AI Assistant')}</h2>
        <button
          onClick={() => setShowSettings(!showSettings)}
          className="p-2 rounded-lg bg-gray-800 hover:bg-gray-700 transition-colors"
        >
          <Settings className="w-4 h-4" />
        </button>
      </div>

      {/* Settings Panel */}
      {showSettings && (
        <div className="mb-4 p-3 bg-gray-800 rounded-lg border border-gray-700">
          <div className="flex items-center justify-between">
            <span className="text-sm">{t('settings.tts', 'Read responses aloud')}</span>
            <button
              onClick={() => setTtsEnabled(!ttsEnabled)}
              className={`p-1 rounded ${ttsEnabled ? 'text-green-400' : 'text-gray-500'}`}
            >
              {ttsEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>
          </div>
        </div>
      )}

      {/* Voice Assistant Avatar */}
      <div className="flex flex-col items-center mb-4">
        <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full transition-all duration-300 ${
          isSpeaking ? 'bg-green-500 animate-pulse scale-110' : 
          isListening ? 'bg-blue-500 animate-pulse' : 
          'bg-gray-600'
        }`}>
          <span className="text-2xl">🤖</span>
        </div>
        
        {/* Status Indicator */}
        {isListening && (
          <p className="text-blue-400 text-xs mt-2 animate-pulse">
            {t('status.listening', 'Listening...')}
          </p>
        )}
        {isSpeaking && (
          <p className="text-green-400 text-xs mt-2 animate-pulse">
            {t('status.speaking', 'Speaking...')}
          </p>
        )}
      </div>

      {/* Voice Input Button */}
      <button
        className={`mb-3 px-4 py-2 rounded-lg font-medium transition-all duration-300 flex items-center justify-center gap-2 ${
          isListening 
            ? 'bg-red-600 hover:bg-red-700' 
            : 'bg-blue-600 hover:bg-blue-700'
        }`}
        onClick={isListening ? stopListening : handleStartListening}
        disabled={loading}
      >
        {isListening ? (
          <>
            <Square className="w-4 h-4" />
            {t('buttons.stopListening', 'Stop Listening')}
          </>
        ) : (
          <>
            <Mic className="w-4 h-4" />
            {t('buttons.speak', 'Speak')}
          </>
        )}
      </button>

      {/* Transcribed Text Display */}
      {transcribed && (
        <div className="mb-3 p-2 bg-green-900/30 border border-green-700/50 rounded-lg">
          <p className="text-green-400 text-xs font-medium mb-1">{t('labels.transcribed', 'Transcribed:')}</p>
          <p className="text-white text-sm">{transcribed}</p>
        </div>
      )}

      {/* Text Input */}
      <textarea
        className="w-full p-3 rounded-lg bg-gray-800 text-white border border-gray-700 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 focus:outline-none mb-3 resize-none"
        value={userInput}
        onChange={(e) => setUserInput(e.target.value)}
        placeholder={t('placeholders.typeOrSpeak', 'Type your question or use voice input...')}
        rows={3}
        disabled={loading}
      />

      {/* Process Button */}
      <button
        className="bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg w-full font-medium transition-colors mb-4 flex items-center justify-center gap-2"
        onClick={handleProcess}
        disabled={loading || (!userInput.trim())}
      >
        {loading ? (
          <>
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            {t('status.processing', 'Processing...')}
          </>
        ) : (
          t('buttons.askAssistant', 'Ask Assistant')
        )}
      </button>

      {/* Response Section */}
      {assistantResponse && (
        <div className="flex-1 space-y-4">
          {/* Text Response */}
          <div className="bg-gray-800/50 rounded-lg p-3 border border-gray-700">
            <div className="flex justify-between items-start mb-2">
              <p className="text-purple-400 text-sm font-medium">{t('labels.assistant', 'Assistant:')}</p>
              {isSpeaking && ttsEnabled && (
                <button
                  onClick={stopSpeaking}
                  className="text-red-400 hover:text-red-300 transition-colors"
                >
                  <VolumeX className="w-4 h-4" />
                </button>
              )}
            </div>
            <p className="text-white text-sm">{translating ? t('status.translating', 'Translating...') : assistantResponse.output}</p>
          </div>

          {/* Feature-Specific Content */}
          {renderFeatureContent()}

          {/* Summary if available */}
          {assistantResponse.summary && assistantResponse.summary !== assistantResponse.output && (
            <div className="bg-blue-900/20 rounded-lg p-3 border border-blue-700/50">
              <p className="text-blue-400 text-sm font-medium mb-2">{t('labels.summary', 'Summary:')}</p>
              <p className="text-gray-300 text-sm">{assistantResponse.summary}</p>
            </div>
          )}
        </div>
      )}

      {/* Help Text */}
      {!assistantResponse && (
        <div className="text-center text-gray-400 text-xs">
          <p className="mb-2">{t('help.title', 'I can help you with:')}</p>
          <div className="grid grid-cols-2 gap-1 text-xs">
            <span>• {t('help.jobs', 'Job recommendations')}</span>
            <span>• {t('help.schemes', 'Government schemes')}</span>
            <span>• {t('help.business', 'Business ideas')}</span>
            <span>• {t('help.courses', 'Course suggestions')}</span>
            <span>• {t('help.skills', 'Skill tutorials')}</span>
            <span>• {t('help.events', 'Event information')}</span>
            <span>• {t('help.projects', 'Project showcase')}</span>
            <span>• {t('help.youtube', 'Video summaries')}</span>
            <span>• {t('help.profile', 'Profile management')}</span>
            <span>• {t('help.general', 'General questions')}</span>
          </div>
        </div>
      )}
      <Toaster
        toastOptions={{
          style: {
            background: 'rgba(50, 20, 50, 0.9)',
            color: '#fff',
            borderRadius: '10px',
            boxShadow: '0 4px 15px rgba(0, 0, 0, 0.2)',
          },
        }}
      />
    </div>
  );
}
