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

interface AssistantResponse {
  output: string;
  feature_type?: string;
  structured_data?: any;
  summary?: string;
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

  // Enhanced browser STT with better feedback
  const handleStartListening = () => {
    if (!("webkitSpeechRecognition" in window)) {
      alert(t('alerts.speechNotSupported'));
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

  const renderFeatureContent = () => {
    if (!assistantResponse?.structured_data) return null;

    const { feature_type, structured_data } = assistantResponse;

    switch (feature_type) {
      case 'recommend_job':
        return <JobRenderer jobs={structured_data.jobs || []} compact={true} />;
      
      case 'scheme_recommendation':
        return <SchemeRenderer schemes={structured_data.schemes || []} compact={true} />;
      
      case 'business_suggestion':
        return <BusinessSuggestionRenderer suggestions={structured_data.suggestions || []} compact={true} />;
      
      case 'course_recommendation':
        return <CourseRenderer courses={structured_data.courses || []} compact={true} />;
      
      case 'skill_tutorial':
        return <TutorialRenderer tutorials={structured_data.tutorials || []} compact={true} />;
      
      case 'event_management':
        return <EventRenderer events={structured_data.events || []} compact={true} />;
      
      case 'project_showcase':
        return <ProjectRenderer projects={structured_data.projects || []} compact={true} />;
      
      case 'youtube_summary':
        return <YoutubeSummaryRenderer summaries={structured_data.summaries || []} compact={true} />;
      
      case 'profile_management':
      case 'dashboard_view':
        return <ProfileRenderer profile={structured_data.profile || {}} compact={true} />;
      
      default:
        return null;
    }
  };

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
            <p className="text-white text-sm">{assistantResponse.output}</p>
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
    </div>
  );
}
