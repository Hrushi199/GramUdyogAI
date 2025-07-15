import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import ParticleBackground from "../ui/ParticleBackground";
import { 
  Phone, Lock, Eye, EyeOff, User, Building2, 
  Users, Award, Globe, AlertCircle, CheckCircle,
  Mic, Square
} from 'lucide-react';
import { setAuthToken, getAuthToken, setUserId, getUserId, clearAuth } from '../../lib/api';
import { Toaster, toast } from 'react-hot-toast';
interface AuthForm {
  phone: string;
  password: string;
  confirmPassword?: string;
  userType: 'individual' | 'company' | 'ngo' | 'investor';
  name: string;
  organization?: string;
}

interface AuthResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  user_id: number;
  user_type: string;
  name: string;
}

const Auth: React.FC = () => {
  const { t } = useTranslation('auth');
  const { i18n } = useTranslation();
  const [isLogin, setIsLogin] = useState(true);
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [showRegisterPassword, setShowRegisterPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [currentStep, setCurrentStep] = useState<'auth' | 'language' | 'onboarding'>('auth');
  const [loaded, setLoaded] = useState(false);

  // Voice input states
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentVoiceField, setCurrentVoiceField] = useState<keyof AuthForm | null>(null);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [audioChunks, setAudioChunks] = useState<Blob[]>([]);
  const [audioUrl, setAudioUrl] = useState<string>('');
  const [isTyping, setIsTyping] = useState(false);

  const navigate = useNavigate();
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
  
  const [form, setForm] = useState<AuthForm>({
    phone: '',
    password: '',
    confirmPassword: '',
    userType: 'individual',
    name: '',
    organization: ''
  });

  const [passwordTouched, setPasswordTouched] = useState(false);
  const [confirmPasswordTouched, setConfirmPasswordTouched] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setLoaded(true), 100);
    return () => clearTimeout(timer);
  }, []);

  // Check if user is already logged in
  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      navigate('/profile');
    }
  }, [navigate]);

  const userTypes = [
    {
      type: 'individual',
      title: 'Individual',
      description: 'Skillers, learners, and professionals',
      icon: User,
      color: 'bg-blue-500'
    },
    {
      type: 'company',
      title: 'Company',
      description: 'Corporates and businesses',
      icon: Building2,
      color: 'bg-green-500'
    },
    {
      type: 'ngo',
      title: 'NGO',
      description: 'Non-profit organizations',
      icon: Users,
      color: 'bg-purple-500'
    },
    {
      type: 'investor',
      title: 'Investor',
      description: 'Angel investors and VCs',
      icon: Award,
      color: 'bg-orange-500'
    }
  ];

  const languages = [
    { code: 'en', name: 'English', flag: '🇺🇸' },
    { code: 'hi', name: 'Hindi', flag: '🇮🇳' },
    { code: 'bn', name: 'Bengali', flag: '🇧🇩' },
    { code: 'mr', name: 'Marathi', flag: '🇮🇳' },
    { code: 'te', name: 'Telugu', flag: '🇮🇳' },
    { code: 'ta', name: 'Tamil', flag: '🇮🇳' },
    { code: 'gu', name: 'Gujarati', flag: '🇮🇳' },
    { code: 'kn', name: 'Kannada', flag: '🇮🇳' },
    { code: 'ml', name: 'Malayalam', flag: '🇮🇳' },
    { code: 'pa', name: 'Punjabi', flag: '🇮🇳' }
  ];

  const passwordRequirements = [
    'At least 8 characters',
    'At least one uppercase letter',
    'At least one lowercase letter',
    'At least one number',
    'At least one special character (#@$!%*?&)',
  ];

  function validatePasswordStrength(password: string) {
    return {
      length: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      number: /[0-9]/.test(password),
      special: /[#@$!%*?&]/.test(password),
    };
  }

  const validateForm = () => {
    if (!form.phone.trim()) {
      setError(t('validation.phoneRequired'));
      return false;
    }
    // Phone validation (same as backend)
    if (!/^\+?[1-9]\d{1,14}$/.test(form.phone.trim())) {
      setError(t('validation.phoneInvalid'));
      return false;
    }
    if (!form.password.trim()) {
      setError(t('validation.passwordRequired'));
      return false;
    }
    if (!isLogin) {
      if (!form.name.trim()) {
        setError(t('validation.nameRequired'));
        return false;
      }
      const pw = form.password;
      const pwValid = validatePasswordStrength(pw);
      if (!pwValid.length || !pwValid.uppercase || !pwValid.lowercase || !pwValid.number || !pwValid.special) {
        setError(t('validation.passwordRequirements'));
        return false;
      }
      if (form.password !== form.confirmPassword) {
        setError(t('validation.passwordMismatch'));
        return false;
      }
    }
    return true;
  };

  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setSuccess('');

    if (!validateForm()) {
      setIsLoading(false);
      return;
    }

    try {
      if (isLogin) {
        // Login
        const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            phone: form.phone,
            password: form.password
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          // Handle specific error cases
          if (response.status === 401) {
            if (data.detail?.includes('deactivated')) {
              throw new Error(t('messages.accountDeactivated'));
            } else {
              throw new Error(t('messages.invalidCredentials'));
            }
          } else {
            throw new Error(data.detail || t('messages.loginFailed'));
          }
        }

        // After successful login
        console.log('Login response:', data);
        setAuthToken(data.access_token);
        setUserId(data.user_id);
        
        setSuccess(t('messages.loginSuccess'));
        setTimeout(() => {
          navigate('/profile');
        }, 1500);

      } else {
        // Register
        const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            phone: form.phone,
            password: form.password,
            confirm_password: form.confirmPassword,
            user_type: form.userType,
            name: form.name,
            organization: form.organization
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          // Handle specific registration errors
          if (response.status === 409) {
            throw new Error(t('messages.phoneExists'));
          } else if (response.status === 422) {
            throw new Error(t('messages.checkInput'));
          } else {
            throw new Error(data.detail || t('messages.registrationFailed'));
          }
        }

        // Store auth data using the new utility functions
        setAuthToken(data.access_token);
        setUserId(data.user_id);

        setSuccess(t('messages.registrationSuccess'));
        setTimeout(() => {
          navigate('/profile/create');
        }, 1500);
      }
    } catch (err: any) {
      setError(err.message || t('messages.authFailed'));
    } finally {
      setIsLoading(false);
    }
  };

  const updateForm = (field: keyof AuthForm, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const selectUserType = (type: AuthForm['userType']) => {
    setForm(prev => ({ ...prev, userType: type }));
  };

  const handleLogout = () => {
    clearAuth(); // Use the new utility function
    navigate('/');
  };

  const startVoiceRecording = async (field: keyof AuthForm) => {
    try {
      // Prevent multiple recordings
      if (isRecording || isProcessing) {
        return;
      }
      
      setCurrentVoiceField(field);
      setAudioChunks([]);
      setAudioUrl('');
      
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          setAudioChunks(prev => [...prev, event.data]);
        }
      };
      
      recorder.onstop = async () => {
        const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
        const url = URL.createObjectURL(audioBlob);
        setAudioUrl(url);
        await processVoiceInput(audioBlob);
      };
      
      setMediaRecorder(recorder);
      recorder.start();
      setIsRecording(true);
    } catch (error) {
      console.error('Error starting recording:', error);
      setError(t('messages.microphoneError'));
      setCurrentVoiceField(null);
    }
  };

  const stopVoiceRecording = () => {
    if (mediaRecorder && isRecording) {
      mediaRecorder.stop();
      mediaRecorder.stream.getTracks().forEach(track => track.stop());
      setIsRecording(false);
    }
  };

  const processVoiceInput = async (audioBlob: Blob) => {
    if (!currentVoiceField) return;
    
    try {
      setIsProcessing(true);
      
      // Get language from i18n
      const language = i18n.language || 'en';
      
      // Create form data
      const formData = new FormData();
      formData.append('audio', audioBlob, 'recording.webm');
      formData.append('language', language);
      
      // Send to backend STT service
      const response = await fetch(`${API_BASE_URL}/api/transcribe`, {
        method: 'POST',
        body: formData
      });
      
      if (response.ok) {
        const data = await response.json();
        const transcript = data.text;
        
        // Process the transcript based on field type
        let processedValue = transcript.trim();
        
        switch (currentVoiceField) {
          case 'phone':
            // Extract numbers from voice input
            processedValue = transcript.replace(/\D/g, '');
            if (processedValue.length > 0 && !processedValue.startsWith('0')) {
              processedValue = '+' + processedValue;
            }
            break;
          case 'password':
          case 'confirmPassword':
            // For passwords, use the transcript as-is but be careful with sensitive data
            processedValue = transcript.replace(/\s+/g, '');
            break;
          case 'name':
          case 'organization':
            // Capitalize first letter of each word
            processedValue = transcript.split(' ').map((word: string) => 
              word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
            ).join(' ');
            break;
          default:
            processedValue = transcript;
        }
        
        // Only update if the field is empty or if user explicitly wants to replace
        const currentValue = form[currentVoiceField];
        if (!currentValue || (typeof currentValue === 'string' && currentValue.trim() === '')) {
          setForm(prev => ({
            ...prev,
            [currentVoiceField]: processedValue
          }));
        } else {
          toast((t) => (
            <span>
              Replace "{currentValue}" with "{processedValue}"?
              <div className="mt-2 flex gap-2">
                <button
                  onClick={() => {
                    setForm(prev => ({ ...prev, [currentVoiceField]: processedValue }));
                    toast.dismiss(t.id);
                  }}
                  className="bg-green-600 px-3 py-1 rounded text-white"
                >
                  Yes
                </button>
                <button
                  onClick={() => toast.dismiss(t.id)}
                  className="bg-red-600 px-3 py-1 rounded text-white"
                >
                  No
                </button>
              </div>
            </span>
          ), {
            duration: 6000,
            style: {
              background: 'rgba(50, 20, 50, 0.9)',
              color: '#fff',
              borderRadius: '10px',
              boxShadow: '0 4px 15px rgba(0, 0, 0, 0.2)',
            },
          });
        }
        
      } else {
        const errorData = await response.json();
        setError(`Voice transcription failed: ${errorData.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error processing voice input:', error);
      setError('Voice transcription failed. Please try again.');
    } finally {
      setIsProcessing(false);
      setCurrentVoiceField(null);
    }
  };

  const handleVoiceFormEdit = async () => {
    if (isProcessing) {
      toast.error(t('messages.voiceInProgress'), {
        style: {
          background: 'rgba(17, 24, 39, 0.8)',
          color: '#fff',
          border: '1px solid #4f46e5',
          boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.37)',
        },
      });
      return;
    }

    if (!isRecording) {
      toast(t('messages.voiceInstructions'), {
        style: {
          background: 'rgba(17, 24, 39, 0.8)',
          color: '#fff',
          border: '1px solid #4f46e5',
          boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.37)',
        },
      });
      return;
    }

    if (isRecording) {
      stopVoiceRecording();
      toast.success(t('messages.voiceStopped'), {
        style: {
          background: 'rgba(17, 24, 39, 0.8)',
          color: '#fff',
          border: '1px solid #4f46e5',
          boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.37)',
        },
      });
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden">
      <ParticleBackground />
      
      {/* Background gradients */}
      <div className="absolute inset-0 z-0">
        <div className="h-full w-full bg-[radial-gradient(circle_at_center,rgba(38,38,38,0.3)_1px,transparent_1px)] bg-[length:24px_24px]"></div>
      </div>

      <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 via-black/60 to-blue-900/20 z-10"></div>

      <div className="absolute -top-24 -left-24 w-96 h-96 bg-purple-600 rounded-full filter blur-[128px] opacity-20 z-0"></div>
      <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-blue-600 rounded-full filter blur-[128px] opacity-20 z-0"></div>

      <div className="relative z-20 flex items-center justify-center min-h-screen p-4">
        <div className={`transform transition-all duration-1000 ${loaded ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
          <Card className="w-full max-w-md bg-gradient-to-br from-gray-800/30 to-gray-900/30 backdrop-blur-sm border border-gray-700/50">
            <CardHeader className="text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <Globe className="w-8 h-8 text-white" />
              </div>
              <CardTitle className="text-2xl font-bold text-white">
                {isLogin ? t('welcome.back') : t('welcome.join')}
              </CardTitle>
              <p className="text-gray-300">
                {isLogin ? t('welcome.signInSubtitle') : t('welcome.createAccountSubtitle')}
              </p>
            </CardHeader>
            <CardContent>
              {!isLogin && (
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-300 mb-3">
                    {t('userTypes.label')}
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    {userTypes.map((userType) => (
                      <button
                        key={userType.type}
                        onClick={() => selectUserType(userType.type as AuthForm['userType'])}
                        className={`p-3 border rounded-lg text-left transition-colors ${
                          form.userType === userType.type
                            ? 'border-purple-500 bg-purple-500/20'
                            : 'border-gray-600 hover:border-gray-500 bg-gray-800/50'
                        }`}
                      >
                        <div className="flex items-center space-x-2">
                          <div className={`w-8 h-8 ${userType.color} rounded-lg flex items-center justify-center`}>
                            <userType.icon className="w-4 h-4 text-white" />
                          </div>
                          <div>
                            <div className="font-medium text-sm text-white">{t(`userTypes.${userType.type}.title`)}</div>
                            <div className="text-xs text-gray-400">{t(`userTypes.${userType.type}.description`)}</div>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    {t('form.fields.phoneNumber')}
                    <span className="text-red-400 ml-1">{t('form.required')}</span>
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <input
                      type="tel"
                      value={form.phone}
                      onChange={(e) => updateForm('phone', e.target.value)}
                      className="w-full pl-10 pr-12 py-2 border border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-gray-900 text-white placeholder-gray-400"
                      placeholder={t('form.placeholders.phoneNumber')}
                      required
                      autoComplete="tel"
                    />
                  </div>
                </div>

                {/* Password field for login */}
                {isLogin && (
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      {t('form.fields.password')}
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                      <input
                        type={showLoginPassword ? 'text' : 'password'}
                        value={form.password}
                        onChange={(e) => updateForm('password', e.target.value)}
                        className="w-full pl-10 pr-10 py-2 border border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-gray-800/50 text-white placeholder-gray-400"
                        placeholder={t('form.placeholders.password')}
                        required
                        autoComplete="current-password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowLoginPassword(!showLoginPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-300"
                      >
                        {showLoginPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    {/* Forgot Password Link */}
                    <div className="mt-2 text-right">
                      <a
                        href="#"
                        onClick={(e) => e.preventDefault()}
                        className="text-sm text-purple-400 hover:text-purple-300 transition-colors disabled:opacity-50 cursor-not-allowed"
                        title={t('form.forgotPasswordTooltip')}
                      >
                        {t('form.forgotPassword')}
                      </a>
                    </div>
                  </div>
                )}

                {!isLogin && (
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      {form.userType === 'individual' ? t('form.fields.fullName') : t('form.fields.organizationName')}
                      <span className="text-red-400 ml-1">{t('form.required')}</span>
                    </label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                      <input
                        type="text"
                        value={form.name}
                        onChange={(e) => updateForm('name', e.target.value)}
                        className="w-full pl-10 pr-12 py-2 border border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-gray-800/50 text-white placeholder-gray-400"
                        placeholder={form.userType === 'individual' ? t('form.placeholders.fullName') : t('form.placeholders.organizationName')}
                        required
                      />
                    </div>
                  </div>
                )}

                {!isLogin && form.userType !== 'individual' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      {t('form.fields.contactPersonName')}
                    </label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                      <input
                        type="text"
                        value={form.organization || ''}
                        onChange={(e) => updateForm('organization', e.target.value)}
                        className="w-full pl-10 pr-12 py-2 border border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-gray-800/50 text-white placeholder-gray-400"
                        placeholder={t('form.placeholders.contactPersonName')}
                      />
                    </div>
                  </div>
                )}

                {!isLogin && (
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      {t('form.fields.password')}
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                      <input
                        type={showRegisterPassword ? 'text' : 'password'}
                        value={form.password}
                        onChange={(e) => { updateForm('password', e.target.value); setPasswordTouched(true); }}
                        onBlur={() => setPasswordTouched(true)}
                        className="w-full pl-10 pr-10 py-2 border border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-gray-800/50 text-white placeholder-gray-400"
                        placeholder="Enter your password"
                        required
                        autoComplete="new-password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowRegisterPassword(!showRegisterPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-300"
                      >
                        {showRegisterPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    {/* Password requirements */}
                    <ul className="mt-2 text-xs text-gray-400 space-y-1">
                      {[
                        t('passwordRequirements.length'),
                        t('passwordRequirements.uppercase'),
                        t('passwordRequirements.lowercase'),
                        t('passwordRequirements.number'),
                        t('passwordRequirements.special')
                      ].map((req, idx) => {
                        const pwValid = validatePasswordStrength(form.password);
                        let met = false;
                        if (idx === 0) met = pwValid.length;
                        if (idx === 1) met = pwValid.uppercase;
                        if (idx === 2) met = pwValid.lowercase;
                        if (idx === 3) met = pwValid.number;
                        if (idx === 4) met = pwValid.special;
                        return (
                          <li key={req} className={`transition-colors ${met ? 'text-green-500' : 'text-red-500'}`}>
                            {met ? '✔' : '✖'} {req}
                          </li>
                        );
                      })}
                    </ul>
                    {passwordTouched && form.password && (
                      <div className="mt-1 text-xs text-red-500">
                        {(() => {
                          const pwValid = validatePasswordStrength(form.password);
                          if (!pwValid.length) return t('validation.passwordLength');
                          if (!pwValid.uppercase) return t('validation.passwordUppercase');
                          if (!pwValid.lowercase) return t('validation.passwordLowercase');
                          if (!pwValid.number) return t('validation.passwordNumber');
                          if (!pwValid.special) return t('validation.passwordSpecial');
                          return '';
                        })()}
                      </div>
                    )}
                  </div>
                )}

                {!isLogin && (
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      {t('form.fields.confirmPassword')}
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                      <input
                        type={showConfirmPassword ? 'text' : 'password'}
                        value={form.confirmPassword}
                        onChange={(e) => { updateForm('confirmPassword', e.target.value); setConfirmPasswordTouched(true); }}
                        onBlur={() => setConfirmPasswordTouched(true)}
                        className="w-full pl-10 pr-10 py-2 border border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-gray-800/50 text-white placeholder-gray-400"
                        placeholder={t('form.placeholders.confirmPassword')}
                        required
                        autoComplete="new-password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-300"
                      >
                        {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    {confirmPasswordTouched && form.confirmPassword && form.password !== form.confirmPassword && (
                      <div className="mt-1 text-xs text-red-500">{t('validation.passwordsNoMatch')}</div>
                    )}
                  </div>
                )}

                {error && (
                  <div className="text-red-500 text-sm bg-red-500/10 p-3 rounded-lg border border-red-500/20 flex items-center space-x-2">
                    <AlertCircle className="h-4 w-4" />
                    <span>{error}</span>
                  </div>
                )}

                {success && (
                  <div className="text-green-500 text-sm bg-green-500/10 p-3 rounded-lg border border-green-500/20 flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4" />
                    <span>{success}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading || (!isLogin && (!form.phone.trim() || !form.name.trim() || !form.password.trim() || !form.confirmPassword || form.password !== form.confirmPassword || Object.values(validatePasswordStrength(form.password)).includes(false) || !/^\+?[1-9]\d{1,14}$/.test(form.phone.trim())))}
                  className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white py-2 px-4 rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                >
                  {loading ? t('buttons.processing') : (isLogin ? t('buttons.signIn') : t('buttons.createAccount'))}
                </button>

                <button
                  onClick={handleVoiceFormEdit}
                  className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white py-2 px-4 rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                  disabled={isProcessing}
                >
                  {isProcessing ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-purple-400"></div>
                  ) : (
                    <Mic className="w-4 h-4 mr-2" />
                  )}
                  {isProcessing ? t('buttons.voiceProcessing') : t('buttons.fillFormByVoice')}
                </button>
              </form>

              <div className="mt-6 text-center">
                <button
                  onClick={() => {
                    setIsLogin(!isLogin);
                    setError('');
                    setSuccess('');
                    setForm({
                      phone: '',
                      password: '',
                      confirmPassword: '',
                      userType: 'individual',
                      name: '',
                      organization: ''
                    });
                  }}
                  className="text-purple-400 hover:text-purple-300 text-sm"
                >
                  {isLogin ? t('links.noAccount') : t('links.hasAccount')}
                </button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: 'rgba(17, 24, 39, 0.9)',
            color: '#fff',
            border: '1px solid #4f46e5',
            boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.37)',
          },
        }}
      />
    </div>
  );
};

export default Auth; 
