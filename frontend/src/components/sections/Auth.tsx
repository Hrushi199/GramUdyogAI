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
    'At least one special character (@$!%*?&)',
  ];

  function validatePasswordStrength(password: string) {
    return {
      length: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      number: /[0-9]/.test(password),
      special: /[@$!%*?&]/.test(password),
    };
  }

  const validateForm = () => {
    if (!form.phone.trim()) {
      setError('Phone number is required');
      return false;
    }
    // Phone validation (same as backend)
    if (!/^\+?[1-9]\d{1,14}$/.test(form.phone.trim())) {
      setError('Phone number must be valid and not start with 0.');
      return false;
    }
    if (!form.password.trim()) {
      setError('Password is required');
      return false;
    }
    if (!isLogin) {
      if (!form.name.trim()) {
        setError('Name is required');
        return false;
      }
      const pw = form.password;
      const pwValid = validatePasswordStrength(pw);
      if (!pwValid.length || !pwValid.uppercase || !pwValid.lowercase || !pwValid.number || !pwValid.special) {
        setError('Password does not meet requirements.');
        return false;
      }
      if (form.password !== form.confirmPassword) {
        setError('Passwords do not match');
        return false;
      }
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    if (!validateForm()) {
      setLoading(false);
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
              throw new Error('Account is deactivated. Please contact support.');
            } else {
              throw new Error('Invalid phone number or password. Please check your credentials.');
            }
          } else {
            throw new Error(data.detail || 'Login failed. Please try again.');
          }
        }

        // Store auth data using the new utility functions
        setAuthToken(data.access_token);
        setUserId(data.user_id);
        
        setSuccess('Login successful! Redirecting to your profile...');
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
            throw new Error('An account with this phone number already exists. Please login instead.');
          } else if (response.status === 422) {
            throw new Error('Please check your input and try again.');
          } else {
            throw new Error(data.detail || 'Registration failed. Please try again.');
          }
        }

        // Store auth data using the new utility functions
        setAuthToken(data.access_token);
        setUserId(data.user_id);

        setSuccess('Registration successful! Please choose your preferred language.');
        setTimeout(() => {
          setCurrentStep('language');
        }, 1500);
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const selectLanguage = (languageCode: string) => {
    // Set language and move to onboarding
    localStorage.setItem('preferred_language', languageCode);
    setCurrentStep('onboarding');
  };

  const completeOnboarding = () => {
    // Navigate to profile creation
    navigate('/profile/create');
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
      setError('Could not access microphone. Please check permissions.');
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
        if (!currentValue || currentValue.trim() === '') {
          setForm(prev => ({
            ...prev,
            [currentVoiceField]: processedValue
          }));
        } else {
          // Ask user if they want to replace existing content
          if (window.confirm(`Replace "${currentValue}" with "${processedValue}"?`)) {
            setForm(prev => ({
              ...prev,
              [currentVoiceField]: processedValue
            }));
          }
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

  const VoiceInputButton = ({ field, label }: { field: keyof AuthForm, label: string }) => (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        if (isTyping) {
          alert('Please finish typing before using voice input');
          return;
        }
        isRecording ? stopVoiceRecording() : startVoiceRecording(field);
      }}
      disabled={isProcessing || isTyping}
      className={`p-2 transition-colors disabled:opacity-50 pointer-events-auto ${
        isTyping ? 'text-gray-500 cursor-not-allowed' : 'text-gray-400 hover:text-purple-400'
      }`}
    >
      {isProcessing ? (
        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-purple-400"></div>
      ) : isRecording && currentVoiceField === field ? (
        <Square className="w-4 h-4 text-red-400" />
      ) : (
        <Mic className="w-4 h-4" />
      )}
    </button>
  );

  const VoiceInputField = ({ 
    field, 
    label, 
    type = 'text', 
    placeholder, 
    value, 
    onChange, 
    required = false 
  }: {
    field: keyof AuthForm;
    label: string;
    type?: string;
    placeholder: string;
    value: string;
    onChange: (value: string) => void;
    required?: boolean;
  }) => (
    <div className="relative">
      <label className="block text-sm font-medium text-gray-300 mb-2">
        {label}
        {required && <span className="text-red-400 ml-1">*</span>}
      </label>
      <div className="relative">
        <input
          type={type}
          value={value}
          onChange={(e) => {
            // Ensure manual typing works properly
            onChange(e.target.value);
            setIsTyping(true);
            // Stop recording if user starts typing
            if (isRecording && currentVoiceField === field) {
              stopVoiceRecording();
            }
          }}
          onKeyDown={(e) => {
            setIsTyping(true);
            // Stop recording if user starts typing
            if (isRecording && currentVoiceField === field) {
              stopVoiceRecording();
            }
          }}
          onBlur={() => {
            // Reset typing state after a short delay
            setTimeout(() => setIsTyping(false), 100);
          }}
          placeholder={placeholder}
          required={required}
          className="w-full p-3 pr-12 bg-gray-800/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 focus:outline-none"
        />
        <div className="absolute right-2 top-1/2 transform -translate-y-1/2 pointer-events-none">
          <VoiceInputButton field={field} label={label} />
        </div>
      </div>
      {isRecording && currentVoiceField === field && (
        <div className="mt-2 text-xs text-purple-400 flex items-center">
          <div className="animate-pulse mr-2">🔴</div>
          Recording... Click to stop
        </div>
      )}
    </div>
  );


  if (currentStep === 'language') {
    return (
      <div className="relative min-h-screen overflow-hidden">
        <ParticleBackground />
        <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 via-black/60 to-blue-900/20 z-10"></div>
        <div className="relative z-20 flex items-center justify-center min-h-screen p-4">
          <Card className="w-full max-w-2xl bg-gradient-to-br from-gray-800/30 to-gray-900/30 backdrop-blur-sm border border-gray-700/50">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl font-bold text-white">Choose Your Language</CardTitle>
              <p className="text-gray-300">Select your preferred language for the platform</p>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {languages.map((language) => (
                  <button
                    key={language.code}
                    onClick={() => selectLanguage(language.code)}
                    className="p-4 border border-gray-600 rounded-lg hover:border-purple-500 hover:bg-purple-500/10 transition-colors text-left bg-gray-800/50"
                  >
                    <div className="text-2xl mb-2">{language.flag}</div>
                    <div className="font-medium text-white">{language.name}</div>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (currentStep === 'onboarding') {
    return (
      <div className="relative min-h-screen overflow-hidden">
        <ParticleBackground />
        <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 via-black/60 to-blue-900/20 z-10"></div>
        <div className="relative z-20 flex items-center justify-center min-h-screen p-4">
          <Card className="w-full max-w-2xl bg-gradient-to-br from-gray-800/30 to-gray-900/30 backdrop-blur-sm border border-gray-700/50">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl font-bold text-white">Welcome to GramUdyogAI!</CardTitle>
              <p className="text-gray-300">Your account has been created successfully. Let's complete your profile to get started.</p>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="text-center">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full mb-4">
                    <CheckCircle className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-2">Account Created Successfully</h3>
                  <p className="text-gray-300 mb-6">You're now ready to explore the platform and connect with others.</p>
                </div>
                
                <button
                  onClick={completeOnboarding}
                  className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white py-3 px-6 rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all duration-200 transform hover:scale-105"
                >
                  Complete Your Profile
                </button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

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
                {isLogin ? 'Welcome Back' : 'Join GramUdyogAI'}
              </CardTitle>
              <p className="text-gray-300">
                {isLogin ? 'Sign in to your account' : 'Create your account to get started'}
              </p>
            </CardHeader>
            <CardContent>
              {!isLogin && (
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-300 mb-3">
                    I am a...
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
                            <div className="font-medium text-sm text-white">{userType.title}</div>
                            <div className="text-xs text-gray-400">{userType.description}</div>
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
                    Phone Number
                    <span className="text-red-400 ml-1">*</span>
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <input
                      type="tel"
                      value={form.phone}
                      onChange={(e) => updateForm('phone', e.target.value)}
                      className="w-full pl-10 pr-12 py-2 border border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-gray-900 text-white placeholder-gray-400"
                      placeholder="Enter your phone number"
                      required
                      autoComplete="tel"
                    />
                    <VoiceInputButton field="phone" label="Phone Number" />
                  </div>
                </div>

                {/* Password field for login */}
                {isLogin && (
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Password
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                      <input
                        type={showLoginPassword ? 'text' : 'password'}
                        value={form.password}
                        onChange={(e) => updateForm('password', e.target.value)}
                        className="w-full pl-10 pr-10 py-2 border border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-gray-800/50 text-white placeholder-gray-400"
                        placeholder="Enter your password"
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
                        title="Feature under development"
                      >
                        Forgot Password?
                      </a>
                    </div>
                  </div>
                )}

                {!isLogin && (
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      {form.userType === 'individual' ? 'Full Name' : 'Organization Name'}
                      <span className="text-red-400 ml-1">*</span>
                    </label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                      <input
                        type="text"
                        value={form.name}
                        onChange={(e) => updateForm('name', e.target.value)}
                        className="w-full pl-10 pr-12 py-2 border border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-gray-800/50 text-white placeholder-gray-400"
                        placeholder={form.userType === 'individual' ? 'Enter your full name' : 'Enter organization name'}
                        required
                      />
                      <VoiceInputButton field="name" label={form.userType === 'individual' ? 'Full Name' : 'Organization Name'} />
                    </div>
                  </div>
                )}

                {!isLogin && form.userType !== 'individual' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Contact Person Name
                    </label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                      <input
                        type="text"
                        value={form.organization || ''}
                        onChange={(e) => updateForm('organization', e.target.value)}
                        className="w-full pl-10 pr-12 py-2 border border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-gray-800/50 text-white placeholder-gray-400"
                        placeholder="Enter contact person name"
                      />
                      <VoiceInputButton field="organization" label="Contact Person Name" />
                    </div>
                  </div>
                )}

                {!isLogin && (
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Password
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
                      {passwordRequirements.map((req, idx) => {
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
                          if (!pwValid.length) return 'Password must be at least 8 characters.';
                          if (!pwValid.uppercase) return 'Password must contain an uppercase letter.';
                          if (!pwValid.lowercase) return 'Password must contain a lowercase letter.';
                          if (!pwValid.number) return 'Password must contain a number.';
                          if (!pwValid.special) return 'Password must contain a special character (@$!%*?&).';
                          return '';
                        })()}
                      </div>
                    )}
                  </div>
                )}

                {!isLogin && (
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Confirm Password
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                      <input
                        type={showConfirmPassword ? 'text' : 'password'}
                        value={form.confirmPassword}
                        onChange={(e) => { updateForm('confirmPassword', e.target.value); setConfirmPasswordTouched(true); }}
                        onBlur={() => setConfirmPasswordTouched(true)}
                        className="w-full pl-10 pr-10 py-2 border border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-gray-800/50 text-white placeholder-gray-400"
                        placeholder="Confirm your password"
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
                      <div className="mt-1 text-xs text-red-500">Passwords do not match.</div>
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
                  {loading ? 'Processing...' : (isLogin ? 'Sign In' : 'Create Account')}
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
                  {isLogin ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
                </button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Auth; 