import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
}

const Chatbot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [mode, setMode] = useState<'selecting' | 'voice' | 'text'>('selecting');
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: 'Merhaba! Ben CeRRoute asistanınız. Size nasıl yardımcı olabilirim?',
      sender: 'bot',
      timestamp: new Date()
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [micPermission, setMicPermission] = useState<'granted' | 'denied' | 'unknown'>('unknown');
  const [micError, setMicError] = useState<string>('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  // Check microphone permission on component mount
  useEffect(() => {
    checkMicrophonePermission();
  }, []);

  const checkMicrophonePermission = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach(track => track.stop()); // Stop the stream immediately
      setMicPermission('granted');
      setMicError('');
    } catch (error: any) {
      console.error('Microphone permission error:', error);
      setMicPermission('denied');
      
      if (error.name === 'NotAllowedError') {
        setMicError('Mikrofon izni reddedildi. Lütfen tarayıcı ayarlarından mikrofon iznini verin.');
      } else if (error.name === 'NotFoundError') {
        setMicError('Mikrofon bulunamadı. Lütfen mikrofonunuzun bağlı olduğundan emin olun.');
      } else if (error.name === 'NotSupportedError') {
        setMicError('Mikrofon desteklenmiyor. Lütfen farklı bir cihaz deneyin.');
      } else {
        setMicError('Mikrofon erişiminde hata oluştu. Lütfen tekrar deneyin.');
      }
    }
  };

  // Speech Recognition setup
  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      
      try {
        recognitionRef.current = new SpeechRecognition();
        recognitionRef.current.continuous = false;
        recognitionRef.current.interimResults = false;
        recognitionRef.current.lang = 'tr-TR';
        recognitionRef.current.maxAlternatives = 1;

        recognitionRef.current.onstart = () => {
          setIsListening(true);
          setMicError('');
        };

        recognitionRef.current.onresult = (event: any) => {
          const transcript = event.results[0][0].transcript;
          setInputText(transcript);
          // Call handleSendMessage directly to avoid dependency issues
          const userMessage: Message = {
            id: Date.now().toString(),
            text: transcript,
            sender: 'user',
            timestamp: new Date()
          };
          setMessages(prev => [...prev, userMessage]);
          
          // Simulate bot response
          setTimeout(() => {
            const botResponse = generateBotResponse(transcript.toLowerCase());
            const botMessage: Message = {
              id: (Date.now() + 1).toString(),
              text: botResponse,
              sender: 'bot',
              timestamp: new Date()
            };
            setMessages(prev => [...prev, botMessage]);
            
            // Speak the response
            speakText(botResponse);
          }, 1000);
          
          setIsListening(false);
        };

        recognitionRef.current.onerror = (event: any) => {
          setIsListening(false);
          
          switch (event.error) {
            case 'no-speech':
              setMicError('Ses algılanamadı. Lütfen tekrar konuşun.');
              break;
            case 'audio-capture':
              setMicError('Mikrofon erişiminde sorun var. Lütfen mikrofon iznini kontrol edin.');
              break;
            case 'not-allowed':
              setMicError('Mikrofon izni reddedildi. Lütfen tarayıcı ayarlarından izin verin.');
              setMicPermission('denied');
              break;
            case 'network':
              setMicError('Ağ bağlantısında sorun var.');
              break;
            case 'aborted':
              // User manually stopped, don't show error
              break;
            default:
              setMicError('Ses tanıma hatası oluştu. Lütfen tekrar deneyin.');
          }
        };

        recognitionRef.current.onend = () => {
          setIsListening(false);
        };
      } catch (error) {
        console.error('Speech Recognition initialization error:', error);
        setMicError('Ses tanıma başlatılamadı. Lütfen sayfayı yenileyin.');
      }
    } else {
      setMicError('Ses tanıma desteklenmiyor. Lütfen modern bir tarayıcı kullanın.');
    }
  }, []);

  // Auto scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (text: string) => {
    if (!text.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: text.trim(),
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');

    // Simulate bot response
    setTimeout(() => {
      const botResponse = generateBotResponse(text.trim().toLowerCase());
      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: botResponse,
        sender: 'bot',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, botMessage]);
      
      // Speak the response
      speakText(botResponse);
    }, 1000);
  };

  const generateBotResponse = (userInput: string): string => {
    const responses = {
      'merhaba': 'Merhaba! CeRRoute hakkında bilgi almak ister misiniz?',
      'nasılsın': 'Teşekkürler, iyiyim! Size nasıl yardımcı olabilirim?',
      'özellikler': 'CeRRoute\'un özellikleri: Yapay zeka destekli öğrenme, erişilebilir eğitim, etkileşimli öğrenme, canlı mentorluk, çevrimdışı erişim ve ilerleme takibi. Hangi özellik hakkında detay istiyorsunuz?',
      'fiyat': 'CeRRoute henüz lansman aşamasında. Erken kayıt avantajlarından yararlanmak için kayıt olabilirsiniz.',
      'kayıt': 'Kayıt olmak için sayfanın alt kısmındaki "Erken Kayıt Ol" butonuna tıklayabilirsiniz.',
      'yardım': 'Size yardımcı olabileceğim konular: Özellikler, fiyat, kayıt, erişilebilirlik. Hangi konuda bilgi istiyorsunuz?',
      'erişilebilirlik': 'CeRRoute tamamen erişilebilir tasarlandı. Sesli komutlar, ekran okuyucu desteği ve klavye navigasyonu mevcuttur.',
      'teşekkür': 'Rica ederim! Başka bir sorunuz var mı?',
      'görüşürüz': 'Görüşmek üzere! CeRRoute ile başarılar dilerim.',
      'navigasyon': 'Sayfada gezinmek için: Üst menüdeki linkleri kullanabilir, aşağı kaydırabilir veya "Erken Kayıt Ol" butonuna tıklayabilirsiniz.'
    };

    for (const [key, response] of Object.entries(responses)) {
      if (userInput.includes(key)) {
        return response;
      }
    }

    return 'Üzgünüm, bu konuda size yardımcı olamıyorum. "Yardım" diyerek desteklenen konuları görebilirsiniz.';
  };

  const speakText = (text: string) => {
    if ('speechSynthesis' in window) {
      setIsSpeaking(true);
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'tr-TR';
      utterance.rate = 0.9;
      utterance.pitch = 1;
      
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);
      
      speechSynthesis.speak(utterance);
    }
  };

  const startListening = async () => {
    if (micPermission === 'denied') {
      setMicError('Mikrofon izni gerekli. Lütfen tarayıcı ayarlarından izin verin.');
      return;
    }

    if (micPermission === 'unknown') {
      await checkMicrophonePermission();
    }

    if (!recognitionRef.current) {
      setMicError('Ses tanıma başlatılamadı. Lütfen sayfayı yenileyin.');
      return;
    }

    if (isListening) {
      stopListening();
      return;
    }

    if (micPermission === 'granted') {
      try {
        setMicError(''); // Clear any previous errors
        recognitionRef.current.start();
      } catch (error) {
        console.error('Error starting speech recognition:', error);
        setMicError('Ses tanıma başlatılamadı. Lütfen tekrar deneyin.');
        setIsListening(false);
        
        // Try to reinitialize if it's a state error
        if (error.toString().includes('already started') || error.toString().includes('not started')) {
          setTimeout(() => {
            try {
              recognitionRef.current?.stop();
            } catch (e) {
              // Ignore stop errors
            }
          }, 100);
        }
      }
    } else {
      setMicError('Mikrofon izni gerekli. Lütfen tarayıcı ayarlarından izin verin.');
    }
  };

  const stopListening = () => {
    if (recognitionRef.current && isListening) {
      try {
        recognitionRef.current.stop();
      } catch (error) {
        console.error('Error stopping speech recognition:', error);
        setIsListening(false);
      }
    }
  };

  const selectVoiceMode = () => {
    setMode('voice');
    const voiceMessage: Message = {
      id: Date.now().toString(),
      text: 'Sesli mod seçildi! Mikrofon butonuna basarak konuşmaya başlayabilirsiniz. "Merhaba" diyerek test edebilirsiniz.',
      sender: 'bot',
      timestamp: new Date()
    };
    setMessages(prev => [...prev, voiceMessage]);
    speakText('Sesli mod seçildi! Mikrofon butonuna basarak konuşmaya başlayabilirsiniz.');
  };

  const selectTextMode = () => {
    setMode('text');
    const textMessage: Message = {
      id: Date.now().toString(),
      text: 'Yazılı mod seçildi! Aşağıdaki metin kutusuna yazarak sorularınızı sorabilirsiniz.',
      sender: 'bot',
      timestamp: new Date()
    };
    setMessages(prev => [...prev, textMessage]);
  };

  const toggleChat = () => {
    setIsOpen(!isOpen);
    if (!isOpen) {
      // Reset mode to selecting when opening
      setMode('selecting');
      // Speak welcome message when opening
      setTimeout(() => {
        speakText('CeRRoute asistanına hoş geldiniz. Lütfen sesli veya yazılı iletişim modunu seçin.');
      }, 500);
    }
  };

  // Auto clear microphone errors after 5 seconds
  useEffect(() => {
    if (micError) {
      const timer = setTimeout(() => {
        setMicError('');
      }, 5000);
      
      return () => clearTimeout(timer);
    }
  }, [micError]);

  return (
    <>
      {/* Floating Chat Button */}
      <button
        onClick={toggleChat}
        style={{
          position: 'fixed',
          bottom: 30,
          right: 30,
          width: 60,
          height: 60,
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #FF9900 0%, #ffb84d 100%)',
          border: 'none',
          boxShadow: '0 8px 32px rgba(255, 153, 0, 0.4)',
          cursor: 'pointer',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#fff',
          fontSize: 24,
          transition: 'all 0.3s ease',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'scale(1.1)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'scale(1)';
        }}
        aria-label={isOpen ? "Sohbeti kapat" : "Sohbeti aç"}
      >
        {isOpen ? (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        ) : (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M21 15C21 15.5304 20.7893 16.0391 20.4142 16.4142C20.0391 16.7893 19.5304 17 19 17H7L3 21V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H19C19.5304 3 20.0391 3.21071 20.4142 3.58579C20.7893 3.96086 21 4.46957 21 5V15Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        )}
      </button>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            style={{
              position: 'fixed',
              bottom: 100,
              right: 30,
              width: 360,
              height: 480,
              background: 'rgba(255, 255, 255, 0.98)',
              backdropFilter: 'blur(20px)',
              borderRadius: 24,
              boxShadow: '0 25px 80px rgba(0, 0, 0, 0.15)',
              border: '1px solid rgba(255, 255, 255, 0.3)',
              zIndex: 999,
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
            }}
          >
            {/* Header */}
            <div style={{
              background: 'linear-gradient(135deg, #FF9900 0%, #ffb84d 100%)',
              padding: '16px 20px',
              borderRadius: '24px 24px 0 0',
              color: '#fff',
              fontWeight: 700,
              fontSize: 15,
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              flexShrink: 0,
            }}>
              <div style={{
                width: 32,
                height: 32,
                borderRadius: '50%',
                background: 'rgba(255, 255, 255, 0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 2L13.09 8.26L20 9L13.09 9.74L12 16L10.91 9.74L4 9L10.91 8.26L12 2Z" fill="currentColor"/>
                </svg>
              </div>
              <span style={{ flex: 1 }}>CeRRoute Asistanı</span>
              {isSpeaking && (
                <motion.div
                  animate={{ opacity: [0.5, 1, 0.5] }}
                  transition={{ duration: 1, repeat: Infinity }}
                  style={{ 
                    width: 20,
                    height: 20,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 2L13.09 8.26L20 9L13.09 9.74L12 16L10.91 9.74L4 9L10.91 8.26L12 2Z" fill="currentColor"/>
                  </svg>
                </motion.div>
              )}
            </div>

            {/* Messages */}
            <div style={{
              flex: 1,
              padding: '16px 20px',
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              gap: 12,
              background: 'rgba(248, 250, 252, 0.5)',
              minHeight: 0,
            }}>
              {messages.map((message) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  style={{
                    alignSelf: message.sender === 'user' ? 'flex-end' : 'flex-start',
                    maxWidth: '85%',
                  }}
                >
                  <div style={{
                    background: message.sender === 'user' 
                      ? 'linear-gradient(135deg, #FF9900 0%, #ffb84d 100%)'
                      : 'rgba(255, 255, 255, 0.95)',
                    color: message.sender === 'user' ? '#fff' : '#333',
                    padding: '12px 16px',
                    borderRadius: 18,
                    fontSize: 13,
                    lineHeight: 1.4,
                    wordWrap: 'break-word',
                    boxShadow: message.sender === 'user' 
                      ? '0 4px 12px rgba(255, 153, 0, 0.3)'
                      : '0 2px 8px rgba(0, 0, 0, 0.1)',
                    border: message.sender === 'user' 
                      ? 'none'
                      : '1px solid rgba(0, 0, 0, 0.05)',
                  }}>
                    {message.text}
                  </div>
                </motion.div>
              ))}

              {/* Mode Selection Screen */}
              {mode === 'selecting' && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 16,
                    padding: '20px 0',
                  }}
                >
                  <div style={{
                    textAlign: 'center',
                    fontSize: 16,
                    fontWeight: 600,
                    color: '#333',
                    marginBottom: 8,
                  }}>
                    İletişim Modunu Seçin
                  </div>
                  
                  {/* Voice Mode Button */}
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <button
                      onClick={selectVoiceMode}
                      style={{
                        background: 'linear-gradient(135deg, #FF9900 0%, #ffb84d 100%)',
                        border: 'none',
                        borderRadius: 16,
                        padding: '16px 20px',
                        color: '#fff',
                        fontSize: 14,
                        fontWeight: 600,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 12,
                        boxShadow: '0 4px 12px rgba(255, 153, 0, 0.3)',
                        transition: 'all 0.3s ease',
                        width: '100%',
                      }}
                    >
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M12 1C10.9 1 10 1.9 10 3V11C10 12.1 10.9 13 12 13C13.1 13 14 12.1 14 11V3C14 1.9 13.1 1 12 1Z" fill="currentColor"/>
                        <path d="M19 10V11C19 14.87 15.87 18 12 18C8.13 18 5 14.87 5 11V10C5 9.45 4.55 9 4 9C3.45 9 3 9.45 3 10V11C3 15.97 7.03 20 12 20C16.97 20 21 15.97 21 11V10C21 9.45 20.55 9 20 9C19.45 9 19 9.45 19 10Z" fill="currentColor"/>
                      </svg>
                      Sesli İletişim
                    </button>
                  </motion.div>

                  {/* Text Mode Button */}
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <button
                      onClick={selectTextMode}
                      style={{
                        background: 'rgba(255, 255, 255, 0.9)',
                        border: '1px solid rgba(0, 0, 0, 0.1)',
                        borderRadius: 16,
                        padding: '16px 20px',
                        color: '#333',
                        fontSize: 14,
                        fontWeight: 600,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 12,
                        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
                        transition: 'all 0.3s ease',
                        width: '100%',
                      }}
                    >
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M20 2H4C2.9 2 2 2.9 2 4V22L6 18H20C21.1 18 22 17.1 22 16V4C22 2.9 21.1 2 20 2ZM20 16H6L4 18V4H20V16Z" fill="currentColor"/>
                        <path d="M7 9H17V11H7V9ZM7 12H14V14H7V12Z" fill="currentColor"/>
                      </svg>
                      Yazılı İletişim
                    </button>
                  </motion.div>
                </motion.div>
              )}
              
              {/* Microphone Status Messages */}
              {isListening && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  style={{
                    alignSelf: 'center',
                    background: 'rgba(255, 153, 0, 0.1)',
                    color: '#FF9900',
                    padding: '12px 16px',
                    borderRadius: 16,
                    fontSize: 13,
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    border: '1px solid rgba(255, 153, 0, 0.2)',
                    margin: '4px 0',
                  }}
                >
                  <motion.div
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 1, repeat: Infinity }}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M12 1C10.9 1 10 1.9 10 3V11C10 12.1 10.9 13 12 13C13.1 13 14 12.1 14 11V3C14 1.9 13.1 1 12 1Z" fill="currentColor"/>
                      <path d="M19 10V11C19 14.87 15.87 18 12 18C8.13 18 5 14.87 5 11V10C5 9.45 4.55 9 4 9C3.45 9 3 9.45 3 10V11C3 15.97 7.03 20 12 20C16.97 20 21 15.97 21 11V10C21 9.45 20.55 9 20 9C19.45 9 19 9.45 19 10Z" fill="currentColor"/>
                    </svg>
                  </motion.div>
                  Dinliyorum...
                </motion.div>
              )}

              {micError && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  style={{
                    alignSelf: 'center',
                    background: 'rgba(255, 68, 68, 0.1)',
                    color: '#ff4444',
                    padding: '12px 16px',
                    borderRadius: 16,
                    fontSize: 13,
                    fontWeight: 500,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    border: '1px solid rgba(255, 68, 68, 0.2)',
                    maxWidth: '90%',
                    textAlign: 'center',
                    margin: '4px 0',
                  }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                    <line x1="15" y1="9" x2="9" y2="15" stroke="currentColor" strokeWidth="2"/>
                    <line x1="9" y1="9" x2="15" y2="15" stroke="currentColor" strokeWidth="2"/>
                  </svg>
                  {micError}
                </motion.div>
              )}

              {micPermission === 'denied' && !micError && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  style={{
                    alignSelf: 'center',
                    background: 'rgba(255, 193, 7, 0.1)',
                    color: '#ffc107',
                    padding: '12px 16px',
                    borderRadius: 16,
                    fontSize: 13,
                    fontWeight: 500,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    border: '1px solid rgba(255, 193, 7, 0.2)',
                    maxWidth: '90%',
                    textAlign: 'center',
                    margin: '4px 0',
                  }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 2L13.09 8.26L20 9L13.09 9.74L12 16L10.91 9.74L4 9L10.91 8.26L12 2Z" fill="currentColor"/>
                  </svg>
                  Mikrofon izni gerekli
                </motion.div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            {mode !== 'selecting' && (
              <div style={{
                padding: '16px 20px',
                borderTop: '1px solid rgba(0, 0, 0, 0.08)',
                background: 'rgba(255, 255, 255, 0.95)',
                display: 'flex',
                gap: 12,
                alignItems: 'center',
                flexShrink: 0,
              }}>
                {mode === 'text' && (
                  <input
                    type="text"
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSendMessage(inputText)}
                    placeholder="Mesajınızı yazın..."
                    style={{
                      flex: 1,
                      padding: '12px 16px',
                      border: '1px solid rgba(0, 0, 0, 0.1)',
                      borderRadius: 20,
                      fontSize: 13,
                      outline: 'none',
                      background: 'rgba(255, 255, 255, 0.9)',
                      transition: 'all 0.3s ease',
                      minHeight: '40px',
                    }}
                    aria-label="Mesaj girişi"
                  />
                )}
                
                {mode === 'voice' && (
                  <div style={{
                    flex: 1,
                    padding: '12px 16px',
                    border: '1px solid rgba(0, 0, 0, 0.1)',
                    borderRadius: 20,
                    fontSize: 13,
                    background: 'rgba(255, 255, 255, 0.9)',
                    color: '#666',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                  }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M12 1C10.9 1 10 1.9 10 3V11C10 12.1 10.9 13 12 13C13.1 13 14 12.1 14 11V3C14 1.9 13.1 1 12 1Z" fill="currentColor"/>
                      <path d="M19 10V11C19 14.87 15.87 18 12 18C8.13 18 5 14.87 5 11V10C5 9.45 4.55 9 4 9C3.45 9 3 9.45 3 10V11C3 15.97 7.03 20 12 20C16.97 20 21 15.97 21 11V10C21 9.45 20.55 9 20 9C19.45 9 19 9.45 19 10Z" fill="currentColor"/>
                    </svg>
                    {isListening ? 'Dinliyorum...' : 'Mikrofon butonuna basın'}
                  </div>
                )}
                
                {/* Voice Button - Only show in voice mode */}
                {mode === 'voice' && (
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <button
                      onClick={isListening ? stopListening : startListening}
                      disabled={micPermission === 'denied'}
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: '50%',
                        background: isListening 
                          ? 'linear-gradient(135deg, #ff4444 0%, #ff6666 100%)'
                          : micPermission === 'denied'
                          ? 'linear-gradient(135deg, #999 0%, #ccc 100%)'
                          : 'linear-gradient(135deg, #FF9900 0%, #ffb84d 100%)',
                        border: 'none',
                        cursor: micPermission === 'denied' ? 'not-allowed' : 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#fff',
                        fontSize: 14,
                        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                        opacity: micPermission === 'denied' ? 0.6 : 1,
                        transition: 'all 0.3s ease',
                        flexShrink: 0,
                      }}
                      aria-label={isListening ? "Sesli dinlemeyi durdur" : "Sesli dinlemeyi başlat"}
                    >
                      {isListening ? (
                        <motion.div
                          animate={{ scale: [1, 1.2, 1] }}
                          transition={{ duration: 1, repeat: Infinity }}
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <rect x="6" y="6" width="12" height="12" fill="currentColor"/>
                          </svg>
                        </motion.div>
                      ) : micPermission === 'denied' ? (
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M12 1C10.9 1 10 1.9 10 3V11C10 12.1 10.9 13 12 13C13.1 13 14 12.1 14 11V3C14 1.9 13.1 1 12 1Z" fill="currentColor"/>
                          <path d="M19 10V11C19 14.87 15.87 18 12 18C8.13 18 5 14.87 5 11V10C5 9.45 4.55 9 4 9C3.45 9 3 9.45 3 10V11C3 15.97 7.03 20 12 20C16.97 20 21 15.97 21 11V10C21 9.45 20.55 9 20 9C19.45 9 19 9.45 19 10Z" fill="currentColor"/>
                          <line x1="2" y1="22" x2="22" y2="2" stroke="currentColor" strokeWidth="2"/>
                        </svg>
                      ) : (
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M12 1C10.9 1 10 1.9 10 3V11C10 12.1 10.9 13 12 13C13.1 13 14 12.1 14 11V3C14 1.9 13.1 1 12 1Z" fill="currentColor"/>
                          <path d="M19 10V11C19 14.87 15.87 18 12 18C8.13 18 5 14.87 5 11V10C5 9.45 4.55 9 4 9C3.45 9 3 9.45 3 10V11C3 15.97 7.03 20 12 20C16.97 20 21 15.97 21 11V10C21 9.45 20.55 9 20 9C19.45 9 19 9.45 19 10Z" fill="currentColor"/>
                        </svg>
                      )}
                    </button>
                  </motion.div>
                )}

                {/* Send Button - Only show in text mode */}
                {mode === 'text' && (
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <button
                      onClick={() => handleSendMessage(inputText)}
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: '50%',
                        background: 'linear-gradient(135deg, #FF9900 0%, #ffb84d 100%)',
                        border: 'none',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#fff',
                        fontSize: 14,
                        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                        flexShrink: 0,
                      }}
                      aria-label="Mesaj gönder"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M22 2L11 13M22 2L15 22L11 13M22 2L2 9L11 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </button>
                  </motion.div>
                )}
              </div>
            )}

            {/* Accessibility Info */}
            <div style={{
              padding: '10px 20px',
              background: 'rgba(255, 153, 0, 0.08)',
              fontSize: 11,
              color: '#666',
              textAlign: 'center',
              borderTop: '1px solid rgba(0, 0, 0, 0.05)',
              fontWeight: 500,
              flexShrink: 0,
            }}>
              💡 Sesli komutlar için mikrofon butonunu kullanın
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default Chatbot;
