import React, { useState, useEffect, useMemo } from 'react';
import { 
  Users, MessageSquare, Calendar, TrendingUp, Shield, CreditCard, 
  Search, Plus, Filter, Send, Download, Sparkles, Wifi, WifiOff, 
  AlertTriangle, Check, Trash2, Globe, Moon, Sun, DollarSign, 
  Award, AlertCircle, FileText, Smartphone, Fingerprint, RefreshCw,
  Clock, ArrowRight, Layers, HelpCircle, CheckSquare, Square, Clipboard, Paperclip, CheckCircle
} from 'lucide-react';
import { translations } from './translations';
import { 
  Student, PointCategory, PointLog, Message, CalendarEvent, 
  WebhookConfig, AuditLog, PaymentItem, UserRole 
} from './types';
import LoginModal from './components/LoginModal';
import Sidebar from './components/Sidebar';

export default function App() {
  // Authentication & Session
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [role, setRole] = useState<UserRole>('teacher');
  const [userEmail, setUserEmail] = useState<string>('ricardo.silva@escola.com');

  // UI Navigation & Preferences
  const [activeTab, setActiveTab] = useState<string>('classroom');
  const [lang, setLang] = useState<'pt' | 'en' | 'es'>('pt');
  const [darkMode, setDarkMode] = useState<boolean>(true);

  // Core Database States (Hydrated from Server + Synchronized)
  const [students, setStudents] = useState<Student[]>([]);
  const [categories, setCategories] = useState<PointCategory[]>([]);
  const [pointLogs, setPointLogs] = useState<PointLog[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([]);
  const [payments, setPayments] = useState<PaymentItem[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [webhooks, setWebhooks] = useState<WebhookConfig[]>([]);
  const [webhookLogs, setWebhookLogs] = useState<any[]>([]);
  const [platformDiagnostics, setPlatformDiagnostics] = useState<any>({});
  
  // Advanced Filter states
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [pointsFilter, setPointsFilter] = useState<string>('all'); // 'all', 'positive', 'negative', 'low'
  const [avatarFilter, setAvatarFilter] = useState<string>('all');

  // Batch operations
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
  const [isBatchMode, setIsBatchMode] = useState<boolean>(false);

  // Active Modals & Popups
  const [activeStudentForPoints, setActiveStudentForPoints] = useState<Student | null>(null);
  const [showAddStudentModal, setShowAddStudentModal] = useState<boolean>(false);
  const [showAddEventModal, setShowAddEventModal] = useState<boolean>(false);
  const [showAddCategoryModal, setShowAddCategoryModal] = useState<boolean>(false);
  const [showPayModal, setShowPayModal] = useState<PaymentItem | null>(null);
  const [showEduAIChat, setShowEduAIChat] = useState<boolean>(false);
  const [showWebhookConfigModal, setShowWebhookConfigModal] = useState<boolean>(false);

  // Offline Synchronization States
  const [isOffline, setIsOffline] = useState<boolean>(false);
  const [offlineQueue, setOfflineQueue] = useState<Array<{ id: string; type: string; payload: any; timestamp: string }>>([]);

  // Form states
  const [newStudentName, setNewStudentName] = useState('');
  const [newStudentParentEmail, setNewStudentParentEmail] = useState('');
  const [newStudentParentName, setNewStudentParentName] = useState('');
  const [newStudentAvatar, setNewStudentAvatar] = useState('👾');

  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryPoints, setNewCategoryPoints] = useState<number>(1);
  const [newCategoryType, setNewCategoryType] = useState<'positive' | 'negative'>('positive');

  const [newEventTitle, setNewEventTitle] = useState('');
  const [newEventDesc, setNewEventDesc] = useState('');
  const [newEventDate, setNewEventDate] = useState('');
  const [newEventCategory, setNewEventCategory] = useState<'event' | 'holiday' | 'exam' | 'meeting'>('event');

  const [newMessageText, setNewMessageText] = useState('');
  const [messageRecipientEmail, setMessageRecipientEmail] = useState('');
  const [attachedFile, setAttachedFile] = useState<{ name: string; size: string; type: string } | null>(null);

  // Payments form
  const [cardName, setCardName] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvc, setCardCvc] = useState('');

  // AI Assistant Chat state
  const [aiPromptText, setAiPromptText] = useState('');
  const [aiChatHistory, setAiChatHistory] = useState<Array<{ sender: 'user' | 'ai'; text: string; timestamp: string }>>([
    { sender: 'ai', text: 'Olá! Sou o EduAI, seu assistente pedagógico. Como posso te apoiar hoje com insights de comportamento ou rascunhos para os responsáveis?', timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }
  ]);
  const [aiLoading, setAiLoading] = useState(false);
  
  // AI report card popup state
  const [activeAIReportCard, setActiveAIReportCard] = useState<{ student: Student; reportText: string } | null>(null);
  const [generatingReportForId, setGeneratingReportForId] = useState<string | null>(null);

  // Load translations shortcut
  const t = translations[lang];

  // Load full DB Dump on initiation
  useEffect(() => {
    fetchDBDump();
    // Load local offline state if exists
    const storedQueue = localStorage.getItem('educlass_offline_queue');
    if (storedQueue) {
      setOfflineQueue(JSON.parse(storedQueue));
    }
  }, []);

  // Sync state if connection changes from offline to online
  useEffect(() => {
    if (!isOffline && offlineQueue.length > 0) {
      processSyncQueue();
    }
  }, [isOffline]);

  const fetchDBDump = async () => {
    try {
      const response = await fetch('/api/db-dump');
      const data = await response.json();
      setStudents(data.students || []);
      setCategories(data.categories || []);
      setPointLogs(data.point_logs || []);
      setMessages(data.messages || []);
      setCalendarEvents(data.calendar || []);
      setPayments(data.payments || []);
      setAuditLogs(data.audit_logs || []);
      setWebhooks(data.webhooks || []);
      setWebhookLogs(data.webhook_trigger_logs || []);
    } catch (err) {
      console.error("Failed to load backend DB. Utilizing client-only safe state.", err);
    }
  };

  // Synchronize offline operations
  const processSyncQueue = async () => {
    if (offlineQueue.length === 0) return;
    
    // Show quick status log / loading
    console.log("Synchronizing offline queue with server...", offlineQueue);
    try {
      const response = await fetch('/api/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ actionQueue: offlineQueue })
      });
      const data = await response.json();
      if (data.success) {
        setOfflineQueue([]);
        localStorage.removeItem('educlass_offline_queue');
        // Reload fresh DB
        await fetchDBDump();
        alert(`🎉 Sincronização automática concluída! ${data.results.length} ações offline integradas com sucesso.`);
      }
    } catch (err) {
      console.error("Failed to post sync queue", err);
    }
  };

  const handleLogin = (selectedRole: UserRole, email: string) => {
    setRole(selectedRole);
    setUserEmail(email);
    setIsLoggedIn(true);

    // Set view based on role
    if (selectedRole === 'student') {
      setActiveTab('student_dashboard');
      setMessageRecipientEmail('ricardo.silva@escola.com');
    } else if (selectedRole === 'parent') {
      setActiveTab('classroom');
      setMessageRecipientEmail('ricardo.silva@escola.com');
    } else {
      setActiveTab('classroom');
      // Set recipient defaults for teacher
      setMessageRecipientEmail('joaopedro.joaopedro12345678910@gmail.com');
    }
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
  };

  // Helper to add actions to offline queue or execute directly online
  const registerAction = async (type: string, payload: any) => {
    const actionId = 'act_' + Math.random().toString(36).substr(2, 9);
    const newAction = { id: actionId, type, payload, timestamp: new Date().toISOString() };

    if (isOffline) {
      const updatedQueue = [...offlineQueue, newAction];
      setOfflineQueue(updatedQueue);
      localStorage.setItem('educlass_offline_queue', JSON.stringify(updatedQueue));
      
      // Simulate client changes instantly so teacher can see feedback immediately!
      applyMockActionLocally(type, payload);
    } else {
      // Execute via real backend endpoints
      try {
        let endpoint = '';
        if (type === 'points.add') endpoint = '/api/points';
        else if (type === 'points.batch') endpoint = '/api/points/batch';
        else if (type === 'messages.sent') endpoint = '/api/messages';
        else if (type === 'calendar.add') endpoint = '/api/calendar';
        else if (type === 'students.add') endpoint = '/api/students';

        const response = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        
        if (response.ok) {
          // Refresh dump to obtain updated backend state
          await fetchDBDump();
        } else {
          // Fallback to local apply in case of unexpected API errors
          applyMockActionLocally(type, payload);
        }
      } catch (err) {
        console.warn("Server unavailable, placing action in offline queue instead.", err);
        const updatedQueue = [...offlineQueue, newAction];
        setOfflineQueue(updatedQueue);
        localStorage.setItem('educlass_offline_queue', JSON.stringify(updatedQueue));
        applyMockActionLocally(type, payload);
      }
    }
  };

  // Fallback state engine for offline mode
  const applyMockActionLocally = (type: string, payload: any) => {
    if (type === 'points.add') {
      const { studentId, points, categoryName, description } = payload;
      setStudents(prev => prev.map(s => s.id === studentId ? { ...s, points: s.points + points } : s));
      setPointLogs(prev => [
        {
          id: 'log_' + Math.random().toString(36).substr(2, 9),
          studentId,
          categoryName,
          points,
          description: description || "Salvo em modo offline",
          timestamp: new Date().toISOString(),
          type: points >= 0 ? 'positive' : 'negative'
        },
        ...prev
      ]);
    } else if (type === 'points.batch') {
      const { studentIds, points, categoryName, description } = payload;
      setStudents(prev => prev.map(s => studentIds.includes(s.id) ? { ...s, points: s.points + points } : s));
      const batchLogs = studentIds.map((id: string) => ({
        id: 'log_' + Math.random().toString(36).substr(2, 9),
        studentId: id,
        categoryName,
        points,
        description: description || "Atribuição em grupo offline",
        timestamp: new Date().toISOString(),
        type: points >= 0 ? 'positive' : 'negative'
      }));
      setPointLogs(prev => [...batchLogs, ...prev]);
    } else if (type === 'messages.sent') {
      setMessages(prev => [
        ...prev,
        {
          id: 'msg_' + Math.random().toString(36).substr(2, 9),
          senderId: payload.senderId,
          senderName: payload.senderName,
          receiverId: payload.receiverId,
          content: payload.content,
          timestamp: new Date().toISOString(),
          attachment: payload.attachment
        }
      ]);
    } else if (type === 'calendar.add') {
      setCalendarEvents(prev => [
        ...prev,
        {
          id: 'evt_' + Math.random().toString(36).substr(2, 9),
          title: payload.title,
          description: payload.description,
          date: payload.date,
          category: payload.category,
          isLocalOnly: true
        }
      ]);
    } else if (type === 'students.add') {
      const newStudent: Student = {
        id: 'stud_' + Math.random().toString(36).substr(2, 9),
        name: payload.name,
        avatar: payload.avatar,
        points: 0,
        parentEmail: payload.parentEmail,
        parentName: payload.parentName
      };
      setStudents(prev => [...prev, newStudent]);
    }
  };

  // Add category handler
  const handleAddCategorySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategoryName) return;

    const newCat = {
      id: 'cat_' + Math.random().toString(36).substr(2, 9),
      name: newCategoryName,
      points: newCategoryType === 'positive' ? Math.abs(newCategoryPoints) : -Math.abs(newCategoryPoints),
      type: newCategoryType,
      icon: newCategoryType === 'positive' ? 'Award' : 'ShieldAlert'
    };

    setCategories(prev => [...prev, newCat]);
    setNewCategoryName('');
    setShowAddCategoryModal(false);
  };

  // Add school event calendar handler
  const handleAddEventSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEventTitle || !newEventDate) return;

    const payload = {
      title: newEventTitle,
      description: newEventDesc,
      date: newEventDate,
      category: newEventCategory
    };

    registerAction('calendar.add', payload);

    setNewEventTitle('');
    setNewEventDesc('');
    setNewEventDate('');
    setShowAddEventModal(false);
  };

  // Delete school calendar event helper
  const handleDeleteEvent = async (id: string) => {
    if (isOffline) {
      setCalendarEvents(prev => prev.filter(e => e.id !== id));
      return;
    }
    try {
      await fetch(`/api/calendar/${id}`, { method: 'DELETE' });
      fetchDBDump();
    } catch (err) {
      console.error(err);
    }
  };

  // Add students handler
  const handleAddStudentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStudentName) return;

    const payload = {
      name: newStudentName,
      avatar: newStudentAvatar,
      parentEmail: newStudentParentEmail || "responsavel@email.com",
      parentName: newStudentParentName || "Responsável"
    };

    registerAction('students.add', payload);

    setNewStudentName('');
    setNewStudentParentEmail('');
    setNewStudentParentName('');
    setNewStudentAvatar('👾');
    setShowAddStudentModal(false);
  };

  const handleDeleteStudent = async (id: string) => {
    if (isOffline) {
      setStudents(prev => prev.filter(s => s.id !== id));
      return;
    }
    if (confirm("Deseja realmente remover este estudante? Todos os históricos serão apagados.")) {
      try {
        await fetch(`/api/students/${id}`, { method: 'DELETE' });
        fetchDBDump();
      } catch (err) {
        console.error(err);
      }
    }
  };

  // Individual point giving trigger
  const handleGivePoints = (category: PointCategory) => {
    if (!activeStudentForPoints) return;
    
    const payload = {
      studentId: activeStudentForPoints.id,
      categoryName: category.name,
      points: category.points,
      description: `Comportamento em sala de aula: ${category.name}`,
      type: category.type
    };

    registerAction('points.add', payload);
    setActiveStudentForPoints(null);
  };

  // Batch points allocation trigger
  const handleGiveBatchPoints = (category: PointCategory) => {
    if (selectedStudentIds.length === 0) return;

    const payload = {
      studentIds: selectedStudentIds,
      categoryName: category.name,
      points: category.points,
      description: `Atribuição coletiva: ${category.name}`,
      type: category.type
    };

    registerAction('points.batch', payload);
    setSelectedStudentIds([]);
    setIsBatchMode(false);
  };

  // Private messages trigger
  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessageText.trim() && !attachedFile) return;

    const payload = {
      senderId: role === 'teacher' ? 'teacher_1' : userEmail,
      senderName: role === 'teacher' ? 'Prof. Ricardo Silva' : 'João Santos',
      receiverId: role === 'teacher' ? messageRecipientEmail : 'teacher_1',
      content: newMessageText,
      attachment: attachedFile ? attachedFile : undefined
    };

    registerAction('messages.sent', payload);
    setNewMessageText('');
    setAttachedFile(null);
  };

  // Handle artificial checkout payment simulation
  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!showPayModal || !cardName || !cardNumber) return;

    try {
      if (isOffline) {
        // Handle payment offline
        setPayments(prev => prev.map(p => p.id === showPayModal.id ? { ...p, status: 'paid' } : p));
        alert("Simulação de pagamento registrada offline. Será processada assim que a conexão retornar.");
        setShowPayModal(null);
        return;
      }

      const response = await fetch('/api/payments/pay', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          paymentId: showPayModal.id,
          cardName,
          cardNumber,
          expiry: cardExpiry,
          cvc: cardCvc
        })
      });

      if (response.ok) {
        await fetchDBDump();
        alert(`✅ Pagamento de R$ ${showPayModal.amount.toFixed(2)} processado com sucesso!`);
        setShowPayModal(null);
        setCardName('');
        setCardNumber('');
        setCardExpiry('');
        setCardCvc('');
      } else {
        alert("Erro no processamento da transação.");
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Ask EduAI pedagogical advisor
  const handleAskEduAI = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiPromptText.trim()) return;

    const userMsg = { sender: 'user' as const, text: aiPromptText, timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) };
    setAiChatHistory(prev => [...prev, userMsg]);
    setAiPromptText('');
    setAiLoading(true);

    try {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: aiPromptText,
          context: {
            role,
            totalStudents: students.length,
            recentLogs: pointLogs.slice(0, 10)
          }
        })
      });
      const data = await response.json();
      setAiChatHistory(prev => [...prev, {
        sender: 'ai',
        text: data.text,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }]);
    } catch (err) {
      console.error(err);
    } finally {
      setAiLoading(false);
    }
  };

  // Write Weekly behavioral report with AI
  const handleGenerateAIReport = async (student: Student) => {
    setGeneratingReportForId(student.id);
    try {
      const logs = pointLogs.filter(log => log.studentId === student.id).slice(0, 15);
      const response = await fetch('/api/ai/report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ student, logs })
      });
      const data = await response.json();
      setActiveAIReportCard({ student, reportText: data.text });
    } catch (err) {
      console.error(err);
    } finally {
      setGeneratingReportForId(null);
    }
  };

  // CSV/Excel generation
  const handleExportCSV = (studentId?: string) => {
    let logsToExport = pointLogs;
    let filename = 'educlass_report_all.csv';

    if (studentId) {
      const student = students.find(s => s.id === studentId);
      logsToExport = pointLogs.filter(log => log.studentId === studentId);
      filename = `educlass_report_${student?.name.toLowerCase().replace(/\s+/g, '_')}.csv`;
    }

    // Build standard CSV
    const headers = ['Estudante', 'Categoria', 'Pontos', 'Descricao', 'Data/Hora', 'Tipo'];
    const rows = logsToExport.map(log => {
      const student = students.find(s => s.id === log.studentId);
      return [
        student?.name || 'N/A',
        log.categoryName,
        log.points,
        log.description,
        new Date(log.timestamp).toLocaleString(),
        log.type
      ];
    });

    const csvContent = [headers, ...rows]
      .map(e => e.map(val => `"${String(val).replace(/"/g, '""')}"`).join(','))
      .join('\n');

    // Blob download
    const blob = new Blob(["\ufeff" + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // PDF simulator window print
  const handlePrintReport = () => {
    window.print();
  };

  // Simulated push notifications helper
  const triggerPushNotification = (title: string, body: string) => {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(title, { body, icon: '/favicon.ico' });
    } else {
      // In-app alert notification
      const toast = document.createElement('div');
      toast.className = 'fixed bottom-4 right-4 bg-slate-900 border border-[#c4a47c] text-white p-4 rounded-xl shadow-2xl z-50 flex items-center gap-3 animate-fade-in max-w-sm';
      toast.innerHTML = `
        <div class="w-8 h-8 rounded-full bg-[#c4a47c]/10 flex items-center justify-center text-[#c4a47c]">
          <span class="material-symbols-outlined">notifications</span>
        </div>
        <div>
          <div class="font-bold text-xs tracking-wider uppercase text-[#c4a47c]">${title}</div>
          <div class="text-xs text-slate-300 mt-0.5">${body}</div>
        </div>
      `;
      document.body.appendChild(toast);
      setTimeout(() => {
        toast.remove();
      }, 4000);
    }
  };

  // Filter logic
  const filteredStudents = useMemo(() => {
    return students.filter(student => {
      // Name match
      const nameMatch = student.name.toLowerCase().includes(searchQuery.toLowerCase());
      
      // Points filter Match
      let pointsMatch = true;
      if (pointsFilter === 'positive') pointsMatch = student.points > 10;
      else if (pointsFilter === 'negative') pointsMatch = student.points < 0;
      else if (pointsFilter === 'low') pointsMatch = student.points <= 5;

      // Avatar match
      const avatarMatch = avatarFilter === 'all' || student.avatar === avatarFilter;

      // Parents see only their own kids
      const parentMatch = role !== 'parent' || student.parentEmail === userEmail;

      return nameMatch && pointsMatch && avatarMatch && parentMatch;
    });
  }, [students, searchQuery, pointsFilter, avatarFilter, role, userEmail]);

  const loggedInStudent = useMemo(() => {
    return students.find(s => s.parentEmail === userEmail || s.name.toLowerCase().includes("davi")) || students[0] || {
      id: 'stud_davi',
      name: 'Davi Santos',
      avatar: '👾',
      points: 24,
      parentEmail: 'joaopedro.joaopedro12345678910@gmail.com',
      parentName: 'João Santos'
    };
  }, [students, userEmail]);

  // Messages filters
  const filteredMessages = useMemo(() => {
    return messages.filter(msg => {
      if (role === 'teacher') {
        // Show exchange between the current teacher and the selected recipient
        return (msg.senderId === 'teacher_1' && msg.receiverId === messageRecipientEmail) ||
               (msg.senderId === messageRecipientEmail && msg.receiverId === 'teacher_1');
      } else {
        // Parents see messages with teacher
        return (msg.senderId === userEmail && msg.receiverId === 'teacher_1') ||
               (msg.senderId === 'teacher_1' && msg.receiverId === userEmail);
      }
    });
  }, [messages, role, userEmail, messageRecipientEmail]);

  // Student specific point logs
  const getStudentLogs = (studentId: string) => {
    return pointLogs.filter(log => log.studentId === studentId);
  };

  // Simulate file drops for attachment
  const handleFileDropSimulator = () => {
    const mockFiles = [
      { name: 'boletim_comportamental_junho.pdf', size: '340 KB', type: 'application/pdf' },
      { name: 'atividades_classe.png', size: '1.2 MB', type: 'image/png' },
      { name: 'autorizacao_excursao.pdf', size: '180 KB', type: 'application/pdf' }
    ];
    const picked = mockFiles[Math.floor(Math.random() * mockFiles.length)];
    setAttachedFile(picked);
    triggerPushNotification("Anexo Adicionado", `O arquivo "${picked.name}" foi preparado para envio.`);
  };

  // Render Page Content
  if (!isLoggedIn) {
    return <LoginModal onLogin={handleLogin} userEmail={userEmail} />;
  }

  return (
    <div className="min-h-screen bg-[#0a0a0b] text-[#e4e4e7] flex flex-col lg:flex-row font-sans-inter">
      
      {/* Sidebar navigation */}
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        role={role} 
        userEmail={userEmail} 
        onLogout={handleLogout}
        isOffline={isOffline}
        setIsOffline={setIsOffline}
        lang={lang}
        setLang={setLang}
        darkMode={darkMode}
        setDarkMode={setDarkMode}
        t={t}
        onOpenEduAI={() => setShowEduAIChat(true)}
      />

      {/* Main Content Arena */}
      <main className="flex-1 flex flex-col min-w-0" id="main-content-wrapper">
        
        {/* Universal Application Top Bar Header */}
        <header className="h-16 border-b border-slate-900 bg-[#141416]/90 backdrop-blur px-6 flex items-center justify-between sticky top-0 z-20">
          <div className="flex items-center gap-3">
            <span className="font-serif-cormorant text-2xl font-semibold text-[#c4a47c] tracking-wide">
              {role === 'parent' ? 'Área do Responsável' : role === 'student' ? 'Área do Aluno' : 'Painel Docente'}
            </span>
            {isOffline ? (
              <span className="px-2.5 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-500 text-[10px] uppercase font-bold tracking-widest animate-pulse flex items-center gap-1.5">
                <WifiOff className="w-3 h-3" /> Offline
              </span>
            ) : (
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] uppercase font-bold tracking-widest flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span> Online
              </span>
            )}
          </div>

          <div className="flex items-center gap-4">
            {role !== 'parent' && role !== 'student' && (
              <button 
                onClick={() => {
                  setIsBatchMode(!isBatchMode);
                  setSelectedStudentIds([]);
                }}
                className={`text-xs px-3.5 py-2 rounded-xl border transition ${
                  isBatchMode 
                    ? 'bg-[#c4a47c] border-[#c4a47c] text-[#0a0a0b] font-semibold' 
                    : 'border-slate-800 text-slate-400 hover:text-white hover:bg-slate-900'
                }`}
              >
                {isBatchMode ? 'Sair Seleção Coletiva' : 'Seleção Coletiva'}
              </button>
            )}

            {role === 'teacher' && (
              <button 
                onClick={() => setShowAddStudentModal(true)}
                className="bg-[#c4a47c] hover:bg-[#b09069] text-[#0a0a0b] text-xs font-semibold px-4 py-2 rounded-xl transition flex items-center gap-1.5 shadow-gold-soft"
              >
                <Plus className="w-3.5 h-3.5" />
                {t.addStudent}
              </button>
            )}
          </div>
        </header>

        {/* Dynamic Workspace based on active tab */}
        <div className="flex-1 p-6 lg:p-8 overflow-y-auto max-w-7xl w-full mx-auto space-y-8 animate-fade-in">
          
          {/* OFFLINE INTERACTIVE BANNER WARNING */}
          {isOffline && (
            <div className="bg-gradient-to-r from-amber-500/10 to-amber-600/5 border border-amber-500/20 p-4 rounded-2xl flex gap-3.5 text-amber-400 text-sm">
              <WifiOff className="w-5 h-5 shrink-0 animate-bounce mt-0.5" />
              <div>
                <p className="font-semibold text-amber-300">Modo de Operação Offline Ativado</p>
                <p className="text-xs text-amber-400/80 mt-1">{t.offlineNotice}</p>
                {offlineQueue.length > 0 && (
                  <div className="mt-3 flex items-center gap-2">
                    <span className="bg-amber-400/10 text-amber-300 text-[10px] px-2 py-0.5 rounded font-mono font-bold">
                      {offlineQueue.length} {offlineQueue.length === 1 ? 'ação pendente' : 'ações pendentes'}
                    </span>
                    <button
                      onClick={() => setIsOffline(false)}
                      className="text-xs text-[#c4a47c] hover:underline flex items-center gap-1"
                    >
                      Forçar Sincronização <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* STUDENT DASHBOARD TAB */}
          {activeTab === 'student_dashboard' && (
            <div className="space-y-8">
              {/* Welcome banner */}
              <div className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-slate-900 to-[#141416] border border-slate-900 p-8 flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="space-y-2">
                  <span className="px-3 py-1 rounded-full bg-amber-400/10 border border-amber-400/20 text-amber-400 text-xs font-bold tracking-widest uppercase">
                    🥋 Bem-vindo ao Dojo, Guerreiro!
                  </span>
                  <h1 className="font-serif-cormorant text-4xl text-slate-100 font-light leading-tight">
                    Olá, <span className="text-[#c4a47c] font-normal">{loggedInStudent.name}</span>!
                  </h1>
                  <p className="text-slate-400 text-sm max-w-xl">
                    Acompanhe seus pontos, desbloqueie medalhas exclusivas e troque seus pontos no baú do tesouro. Continue se esforçando!
                  </p>
                </div>

                {/* Big Badge Card */}
                <div className="bg-[#1e1e21] border border-[#c4a47c]/20 p-6 rounded-2xl flex items-center gap-4 text-left shadow-lg shrink-0 w-full md:w-auto">
                  <div className="w-16 h-16 rounded-full bg-[#c4a47c]/10 flex items-center justify-center text-5xl">
                    {loggedInStudent.avatar}
                  </div>
                  <div>
                    <div className="text-[10px] font-bold text-[#c4a47c] tracking-widest uppercase">Graduação Atual</div>
                    <div className="text-lg font-bold text-slate-100">
                      {loggedInStudent.points >= 50 ? 'Cinturão Ouro 🥇' : loggedInStudent.points >= 30 ? 'Cinturão Prata 🥈' : 'Cinturão Bronze 🥉'}
                    </div>
                    <div className="text-xs text-slate-400 mt-0.5">
                      {loggedInStudent.points} pontos acumulados
                    </div>
                  </div>
                </div>
              </div>

              {/* Grid of details */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left col: Stats and Level progress */}
                <div className="space-y-6">
                  {/* XP Card */}
                  <div className="bg-[#141416] border border-slate-900 rounded-3xl p-6 space-y-6">
                    <h3 className="font-serif-cormorant text-2xl text-[#c4a47c]">Evolução de Nível</h3>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between text-xs font-semibold">
                        <span className="text-slate-400">Progresso para o Próximo Nível</span>
                        <span className="text-[#c4a47c]">{loggedInStudent.points % 20}/20 XP</span>
                      </div>
                      {/* Progress Bar */}
                      <div className="h-2.5 w-full bg-slate-900 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-[#c4a47c] to-amber-500 rounded-full transition-all duration-500"
                          style={{ width: `${Math.min(100, (((loggedInStudent.points % 20) || 0) / 20) * 100)}%` }}
                        ></div>
                      </div>
                      <p className="text-[10px] text-slate-500">Cada 20 pontos de comportamento te sobem de nível!</p>
                    </div>

                    <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-900 text-center">
                      <div className="bg-[#1e1e21] p-3 rounded-xl">
                        <div className="text-2xl font-bold text-slate-100">{Math.floor(loggedInStudent.points / 20) + 1}</div>
                        <div className="text-[10px] text-slate-400 uppercase tracking-wider mt-0.5">Nível Atual</div>
                      </div>
                      <div className="bg-[#1e1e21] p-3 rounded-xl">
                        <div className="text-2xl font-bold text-[#c4a47c]">{loggedInStudent.points}</div>
                        <div className="text-[10px] text-slate-400 uppercase tracking-wider mt-0.5">Pontos Totais</div>
                      </div>
                    </div>
                  </div>

                  {/* Daily Quests - Interactive */}
                  <div className="bg-[#141416] border border-slate-900 rounded-3xl p-6 space-y-4">
                    <h3 className="font-serif-cormorant text-2xl text-[#c4a47c]">Missões Diárias</h3>
                    <p className="text-xs text-slate-400">Complete as missões para ganhar reputação extra com o professor!</p>
                    
                    <div className="space-y-3 pt-2">
                      {[
                        { id: 'q1', text: 'Chegar no horário hoje', reward: '+1 Pt' },
                        { id: 'q2', text: 'Ajudar a organizar a sala', reward: '+2 Pts' },
                        { id: 'q3', text: 'Prestar atenção sem interrupções', reward: '+1 Pt' },
                        { id: 'q4', text: 'Concluir a lição de matemática', reward: '+3 Pts' }
                      ].map((quest) => (
                        <div key={quest.id} className="flex items-center justify-between p-3 rounded-xl bg-[#1e1e21] border border-slate-800 hover:border-slate-700 transition">
                          <div className="flex items-center gap-3">
                            <input 
                              type="checkbox" 
                              id={quest.id} 
                              className="w-4 h-4 rounded border-slate-800 bg-slate-900 text-[#c4a47c] focus:ring-0 focus:ring-offset-0 focus:outline-none"
                            />
                            <label htmlFor={quest.id} className="text-xs text-slate-200 cursor-pointer select-none">
                              {quest.text}
                            </label>
                          </div>
                          <span className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full font-semibold font-mono">
                            {quest.reward}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Middle col: Badges and Achievements */}
                <div className="space-y-6">
                  {/* Badges card */}
                  <div className="bg-[#141416] border border-slate-900 rounded-3xl p-6 space-y-4">
                    <h3 className="font-serif-cormorant text-2xl text-[#c4a47c]">Medalhas do Dojo</h3>
                    <p className="text-xs text-slate-400">Suas conquistas comportamentais registradas.</p>

                    <div className="grid grid-cols-2 gap-4 pt-2">
                      {[
                        { title: 'Iniciante do Dojo', icon: '🥋', desc: 'Acessou o portal pela primeira vez', unlocked: true },
                        { title: 'Super Focado', icon: '🎯', desc: 'Ficou em silêncio nas tarefas', unlocked: loggedInStudent.points >= 15 },
                        { title: 'Guerreiro Gentil', icon: '🤝', desc: 'Ajudou os colegas de classe', unlocked: loggedInStudent.points >= 25 },
                        { title: 'Lenda de Ouro', icon: '👑', desc: 'Chegou a 50 pontos!', unlocked: loggedInStudent.points >= 50 }
                      ].map((badge, idx) => (
                        <div 
                          key={idx} 
                          className={`p-4 rounded-2xl border text-center relative flex flex-col items-center justify-center space-y-2 transition ${
                            badge.unlocked 
                              ? 'bg-[#1e1e21] border-[#c4a47c]/30 text-slate-100' 
                              : 'bg-slate-950/40 border-slate-900 text-slate-600'
                          }`}
                        >
                          <div className={`text-4xl ${badge.unlocked ? 'grayscale-0' : 'grayscale'}`}>
                            {badge.icon}
                          </div>
                          <div>
                            <div className="text-[11px] font-bold truncate max-w-[120px]">{badge.title}</div>
                            <div className="text-[9px] text-slate-500 mt-0.5 leading-tight">{badge.desc}</div>
                          </div>
                          <div className="absolute top-2 right-2">
                            {badge.unlocked ? (
                              <span className="text-[9px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-1.5 py-0.5 rounded-full font-bold">✓ Conquistado</span>
                            ) : (
                              <span className="text-[9px] bg-slate-900 text-slate-500 border border-slate-800 px-1.5 py-0.5 rounded-full">Bloqueado</span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Recent point history for this student */}
                  <div className="bg-[#141416] border border-slate-900 rounded-3xl p-6 space-y-4">
                    <h3 className="font-serif-cormorant text-2xl text-[#c4a47c]">Histórico de Comportamentos</h3>
                    <p className="text-xs text-slate-400">Atividades lançadas pelos seus professores.</p>

                    <div className="space-y-3 pt-2 max-h-56 overflow-y-auto pr-1">
                      {getStudentLogs(loggedInStudent.id).length === 0 ? (
                        <p className="text-xs text-slate-500 text-center py-4">Nenhum feedback registrado ainda.</p>
                      ) : (
                        getStudentLogs(loggedInStudent.id).map((log) => (
                          <div key={log.id} className="p-3 rounded-xl bg-[#1e1e21] border border-slate-800 flex items-center justify-between gap-3">
                            <div>
                              <p className="text-xs font-semibold text-slate-200">{log.categoryName}</p>
                              <span className="text-[10px] text-slate-500">{new Date(log.timestamp).toLocaleDateString()}</span>
                            </div>
                            <span className={`text-xs font-bold font-mono px-2 py-0.5 rounded-full ${
                              log.points >= 0 
                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                                : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                            }`}>
                              {log.points >= 0 ? `+${log.points}` : log.points}
                            </span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>

                {/* Right col: Dojo Store (Baú do Tesouro) */}
                <div className="space-y-6">
                  <div className="bg-[#141416] border border-slate-900 rounded-3xl p-6 space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="font-serif-cormorant text-2xl text-[#c4a47c]">Baú do Tesouro</h3>
                      <span className="text-2xl animate-bounce">📦</span>
                    </div>
                    <p className="text-xs text-slate-400">Use seus pontos acumulados para resgatar recompensas especiais na sala de aula!</p>
                    
                    <div className="space-y-3 pt-2">
                      {[
                        { id: 'r1', title: 'Caneta colorida por um dia', cost: 10, icon: '✏️' },
                        { id: 'r2', title: 'Escolher lugar na sala', cost: 25, icon: '🪑' },
                        { id: 'r3', title: 'Ajudante do Professor', cost: 35, icon: '🙋' },
                        { id: 'r4', title: 'Passe Livre de Lição de Casa', cost: 50, icon: '📜' }
                      ].map((item) => {
                        const canAfford = loggedInStudent.points >= item.cost;
                        return (
                          <div key={item.id} className="p-4 rounded-xl bg-[#1e1e21] border border-slate-800 flex items-center justify-between gap-4">
                            <div className="flex items-center gap-3">
                              <span className="text-2xl">{item.icon}</span>
                              <div>
                                <p className="text-xs font-semibold text-slate-100">{item.title}</p>
                                <span className="text-[10px] text-[#c4a47c] font-semibold">{item.cost} pontos</span>
                              </div>
                            </div>
                            <button
                              onClick={() => {
                                if (!canAfford) {
                                  alert("Pontos insuficientes! Continue se esforçando no Dojo para acumular mais pontos.");
                                  return;
                                }
                                if (confirm(`Deseja resgatar "${item.title}" por ${item.cost} pontos?`)) {
                                  // Deduct points locally
                                  setStudents(prev => prev.map(s => s.id === loggedInStudent.id ? { ...s, points: s.points - item.cost } : s));
                                  // Add a log for point deduction
                                  setPointLogs(prev => [
                                    {
                                      id: 'log_' + Math.random().toString(36).substr(2, 9),
                                      studentId: loggedInStudent.id,
                                      categoryName: `Resgate: ${item.title}`,
                                      points: -item.cost,
                                      description: `Resgate de recompensa no baú de tesouro`,
                                      timestamp: new Date().toISOString(),
                                      type: 'negative'
                                    },
                                    ...prev
                                  ]);
                                  alert(`🎉 Parabéns! Você resgatou "${item.title}". Mostre este comprovante para o seu professor.`);
                                }
                              }}
                              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition duration-200 ${
                                canAfford 
                                  ? 'bg-[#c4a47c] hover:bg-[#b09069] text-[#0a0a0b]' 
                                  : 'bg-slate-900 border border-slate-800 text-slate-600 cursor-not-allowed'
                              }`}
                            >
                              Resgatar
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* CLASSROOM TAB */}
          {activeTab === 'classroom' && (
            <div className="space-y-6">
              {/* Dynamic Header */}
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                  <h1 className="font-serif-cormorant text-4xl text-slate-100 font-light leading-tight">
                    {role === 'parent' ? 'Comportamento de Davi Santos' : '4º Ano — Turma B'}
                  </h1>
                  <p className="text-slate-400 text-sm mt-1">
                    {role === 'parent' 
                      ? 'Histórico comportamental do seu filho atualizado em tempo real pelos docentes.' 
                      : `${students.length} estudantes ativos matriculados • Escola de Educação Criativa`}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button 
                    onClick={() => handleExportCSV()}
                    className="px-3.5 py-2 border border-slate-800 hover:border-slate-700 bg-[#141416] text-xs font-semibold rounded-xl text-slate-300 hover:text-white transition flex items-center gap-2"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Exportar Planilha (Excel)
                  </button>
                  <button 
                    onClick={handlePrintReport}
                    className="px-3.5 py-2 border border-slate-800 hover:border-slate-700 bg-[#141416] text-xs font-semibold rounded-xl text-slate-300 hover:text-white transition flex items-center gap-2"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    {t.exportPdf}
                  </button>
                </div>
              </div>

              {/* SEARCH & FILTERS BAR */}
              {role !== 'parent' && (
                <div className="bg-[#141416] border border-slate-900 rounded-2xl p-4 flex flex-col md:flex-row gap-4">
                  {/* Text Search */}
                  <div className="flex-1 relative">
                    <Search className="w-4 h-4 text-slate-500 absolute left-4 top-3.5" />
                    <input
                      type="text"
                      placeholder={t.searchPlaceholder}
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full bg-[#1e1e21] border border-slate-800/80 rounded-xl py-2.5 pl-11 pr-4 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-[#c4a47c] transition"
                    />
                  </div>

                  {/* Points Rating Filters */}
                  <div className="flex items-center gap-2">
                    <Filter className="w-4 h-4 text-slate-500 shrink-0" />
                    <select
                      value={pointsFilter}
                      onChange={(e) => setPointsFilter(e.target.value)}
                      className="bg-[#1e1e21] border border-slate-800 text-xs text-slate-300 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-[#c4a47c]"
                    >
                      <option value="all">Filtrar por Pontos (Todos)</option>
                      <option value="positive">Destaques (+10 pontos)</option>
                      <option value="negative">Em Alerta (&lt; 0 pontos)</option>
                      <option value="low">Abaixo da média (&le; 5 pontos)</option>
                    </select>
                  </div>

                  {/* Avatar Filters */}
                  <div className="flex items-center gap-2">
                    <select
                      value={avatarFilter}
                      onChange={(e) => setAvatarFilter(e.target.value)}
                      className="bg-[#1e1e21] border border-slate-800 text-xs text-slate-300 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-[#c4a47c]"
                    >
                      <option value="all">Monstro Avatar (Todos)</option>
                      <option value="👾">👾 Monstrinho Roxo</option>
                      <option value="🦄">🦄 Unicórnio Mágico</option>
                      <option value="🐯">🐯 Tigre Forte</option>
                      <option value="🤖">🤖 Robô do Futuro</option>
                      <option value="🦊">🦊 Raposa Esperta</option>
                    </select>
                  </div>
                </div>
              )}

              {/* BATCH SELECTION HEADER NOTIFIER */}
              {isBatchMode && selectedStudentIds.length > 0 && (
                <div className="bg-gradient-to-r from-teal-900/40 via-[#141416] to-[#141416] border border-teal-800/40 p-4 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 animate-pulse">
                  <div>
                    <span className="text-xs font-bold text-teal-400 uppercase tracking-widest block">Seleção de Alunos Ativa</span>
                    <p className="text-sm text-slate-200 mt-1">
                      Você selecionou <strong className="text-white">{selectedStudentIds.length}</strong> alunos. Escolha um comportamento abaixo para aplicar pontos a todos juntos:
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => {
                        const allIds = filteredStudents.map(s => s.id);
                        setSelectedStudentIds(allIds);
                      }}
                      className="px-3 py-1.5 border border-slate-800 text-xs rounded-lg text-slate-300 hover:text-white transition"
                    >
                      Selecionar Todos
                    </button>
                    <button
                      onClick={() => setSelectedStudentIds([])}
                      className="px-3 py-1.5 border border-slate-800 text-xs rounded-lg text-slate-300 hover:text-white transition"
                    >
                      Desmarcar
                    </button>
                  </div>
                </div>
              )}

              {/* BATCH POINT ALLOCATION BUTTONS */}
              {isBatchMode && selectedStudentIds.length > 0 && (
                <div className="bg-[#141416] border border-slate-900 p-6 rounded-2xl space-y-4">
                  <h3 className="text-xs font-bold text-[#c4a47c] uppercase tracking-wider">Atribuir Pontos em Lote</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                    {categories.map((cat) => (
                      <button
                        key={cat.id}
                        onClick={() => handleGiveBatchPoints(cat)}
                        className={`p-3 rounded-xl border text-left transition flex items-center justify-between group ${
                          cat.type === 'positive' 
                            ? 'bg-emerald-500/5 hover:bg-emerald-500/10 border-emerald-500/20 text-emerald-400' 
                            : 'bg-rose-500/5 hover:bg-rose-500/10 border-rose-500/20 text-rose-400'
                        }`}
                      >
                        <div>
                          <p className="text-xs font-semibold truncate text-slate-200 group-hover:text-white">{cat.name}</p>
                          <span className="text-[10px] font-mono opacity-80">{cat.points > 0 ? `+${cat.points}` : cat.points} pontos</span>
                        </div>
                        <span className="text-lg">{cat.type === 'positive' ? '👍' : '👎'}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* STUDENTS GRID LAYOUT */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {filteredStudents.map((student) => {
                  const isSelected = selectedStudentIds.includes(student.id);
                  const isParentUser = role === 'parent';
                  
                  return (
                    <div
                      key={student.id}
                      onClick={() => {
                        if (isBatchMode) {
                          if (isSelected) {
                            setSelectedStudentIds(prev => prev.filter(id => id !== student.id));
                          } else {
                            setSelectedStudentIds(prev => [...prev, student.id]);
                          }
                        } else if (!isParentUser) {
                          setActiveStudentForPoints(student);
                        }
                      }}
                      className={`relative rounded-2xl p-6 border text-center transition group cursor-pointer ${
                        isSelected 
                          ? 'bg-teal-950/20 border-teal-500/40 shadow-lg' 
                          : 'bg-[#141416] border-slate-900 hover:border-[#c4a47c]/30 hover:bg-[#1e1e21]/40'
                      }`}
                    >
                      {/* Checkbox badge for batch selection */}
                      {isBatchMode && (
                        <div className="absolute top-4 left-4 z-10">
                          {isSelected ? (
                            <div className="w-5 h-5 rounded-full bg-teal-500 flex items-center justify-center text-[#0a0a0b]">
                              <Check className="w-3 h-3 stroke-[3]" />
                            </div>
                          ) : (
                            <div className="w-5 h-5 rounded-full border-2 border-slate-700 bg-[#0a0a0b]" />
                          )}
                        </div>
                      )}

                      {/* Admin delete shortcut */}
                      {role === 'admin' && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteStudent(student.id);
                          }}
                          className="absolute top-4 right-4 p-1.5 text-slate-600 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition rounded-lg"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}

                      {/* Monstrinho Avatar */}
                      <div className="w-16 h-16 rounded-full bg-[#1e1e21] border border-slate-800/80 mx-auto flex items-center justify-center text-4xl shadow-inner mb-4 transition duration-300 group-hover:scale-110">
                        {student.avatar}
                      </div>

                      <h3 className="font-semibold text-slate-100 group-hover:text-white transition truncate">{student.name}</h3>
                      
                      {/* Parent info line */}
                      <p className="text-[11px] text-slate-500 mt-0.5 truncate">{student.parentName}</p>

                      {/* Points Tracker Badge */}
                      <div className="mt-4">
                        <span className={`inline-block text-xs font-semibold px-3 py-1 rounded-full ${
                          student.points >= 15 
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                            : student.points < 5 
                              ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' 
                              : 'bg-[#c4a47c]/10 text-[#c4a47c] border border-[#c4a47c]/20'
                        }`}>
                          {student.points >= 0 ? `+${student.points}` : student.points} {t.points}
                        </span>
                      </div>

                      {/* Quick AI Report and Point Controls for Teachers */}
                      {role === 'teacher' && !isBatchMode && (
                        <div className="mt-5 pt-4 border-t border-slate-900 flex justify-between gap-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleGenerateAIReport(student);
                            }}
                            className="flex-1 py-1 px-2.5 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 text-[10px] font-bold rounded-lg border border-indigo-500/20 transition flex items-center justify-center gap-1"
                            disabled={generatingReportForId === student.id}
                          >
                            <Sparkles className="w-3 h-3 animate-pulse" />
                            {generatingReportForId === student.id ? 'Gerando...' : 'AI Report'}
                          </button>
                          
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveStudentForPoints(student);
                            }}
                            className="py-1 px-2.5 bg-[#c4a47c]/10 hover:bg-[#c4a47c]/20 text-[#c4a47c] text-[10px] font-bold rounded-lg border border-[#c4a47c]/20 transition"
                          >
                            Lançar Pontos
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* EMPTY STATE */}
              {filteredStudents.length === 0 && (
                <div className="text-center py-16 bg-[#141416] rounded-3xl border border-slate-900">
                  <p className="text-slate-400 text-sm">Nenhum aluno localizado com estes filtros de busca.</p>
                  <button 
                    onClick={() => { setSearchQuery(''); setPointsFilter('all'); setAvatarFilter('all'); }}
                    className="text-xs text-[#c4a47c] hover:underline mt-2 font-medium"
                  >
                    Limpar Filtros de Busca
                  </button>
                </div>
              )}

              {/* TIMELINE OF RECENT BEHAVIORS */}
              <div className="pt-8 border-t border-slate-900">
                <h3 className="font-serif-cormorant text-2xl text-[#c4a47c] mb-6">Atividade de Sala Recente</h3>
                <div className="bg-[#141416] border border-slate-900 rounded-3xl p-6 divide-y divide-slate-900">
                  {pointLogs.slice(0, 5).map((log) => {
                    const student = students.find(s => s.id === log.studentId);
                    return (
                      <div key={log.id} className="py-4 first:pt-0 last:pb-0 flex items-start justify-between gap-4">
                        <div className="flex gap-3">
                          <span className="text-2xl mt-0.5">{student?.avatar || '👾'}</span>
                          <div>
                            <p className="text-xs text-slate-300">
                              <strong className="text-white">{student?.name || 'Aluno'}</strong> foi pontuado em <strong className="text-white">{log.categoryName}</strong>.
                            </p>
                            <p className="text-[11px] text-slate-500 mt-1">{log.description}</p>
                            <span className="text-[10px] text-slate-600 block mt-1 font-mono">{new Date(log.timestamp).toLocaleTimeString()}</span>
                          </div>
                        </div>

                        <span className={`text-xs font-bold px-2 py-0.5 rounded font-mono ${
                          log.points >= 0 ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'
                        }`}>
                          {log.points >= 0 ? `+${log.points}` : log.points}
                        </span>
                      </div>
                    );
                  })}
                  {pointLogs.length === 0 && (
                    <p className="text-slate-500 text-xs py-4">Nenhuma atividade comportamental registrada hoje.</p>
                  )}
                </div>
              </div>

            </div>
          )}

          {/* PRIVATE MESSAGING TAB */}
          {activeTab === 'messages' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 h-[650px] items-stretch">
              
              {/* Sidebar: Recipient selector for teachers */}
              {role === 'teacher' && (
                <div className="lg:col-span-1 bg-[#141416] border border-slate-900 rounded-3xl p-6 flex flex-col justify-between">
                  <div>
                    <h3 className="font-serif-cormorant text-2xl text-[#c4a47c] mb-4">Responsáveis Cadastrados</h3>
                    <div className="space-y-2 max-h-[450px] overflow-y-auto">
                      {students.map((st) => {
                        const isSelected = messageRecipientEmail === st.parentEmail;
                        return (
                          <button
                            key={st.id}
                            onClick={() => setMessageRecipientEmail(st.parentEmail)}
                            className={`w-full text-left p-3 rounded-xl border transition flex items-center gap-3 ${
                              isSelected 
                                ? 'bg-[#c4a47c]/10 border-[#c4a47c] text-white' 
                                : 'bg-[#1e1e21]/40 border-slate-900 hover:border-slate-800 text-slate-400 hover:text-slate-200'
                            }`}
                          >
                            <div className="w-8 h-8 rounded-full bg-[#1e1e21] flex items-center justify-center text-sm border border-slate-800">
                              {st.avatar}
                            </div>
                            <div className="overflow-hidden">
                              <p className="text-xs font-bold text-slate-100 leading-tight">{st.parentName}</p>
                              <p className="text-[10px] opacity-75 truncate mt-0.5">Responsável por: {st.name}</p>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="pt-4 border-t border-slate-900 text-[11px] text-slate-500">
                    Selecione um responsável para ver o histórico e enviar novas mensagens privadas.
                  </div>
                </div>
              )}

              {/* Chat Viewport */}
              <div className={`${role === 'teacher' ? 'lg:col-span-2' : 'lg:col-span-3'} bg-[#141416] border border-slate-900 rounded-3xl flex flex-col overflow-hidden`}>
                
                {/* Chat Header */}
                <div className="px-6 py-4 border-b border-slate-900 flex justify-between items-center bg-[#1e1e21]/40">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-teal-500 to-[#c4a47c] flex items-center justify-center text-white font-bold text-sm">
                      {role === 'teacher' ? 'R' : 'P'}
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                        {role === 'teacher' ? 'Conversa com Responsável' : 'Prof. Ricardo Silva'}
                      </h4>
                      <p className="text-[10px] text-slate-500 truncate mt-0.5">
                        {role === 'teacher' ? messageRecipientEmail : 'professor.ricardo@escola.com'}
                      </p>
                    </div>
                  </div>

                  {/* AI Writing assistant suggestion generator */}
                  <button
                    onClick={() => {
                      setAiPromptText(`Sugira um rascunho de mensagem carinhosa e profissional sobre o comportamento de Davi Santos hoje.`);
                      setShowEduAIChat(true);
                    }}
                    className="text-[10px] font-semibold text-[#c4a47c] border border-[#c4a47c]/30 hover:bg-[#c4a47c]/10 px-3 py-1.5 rounded-xl transition flex items-center gap-1.5"
                  >
                    <Sparkles className="w-3 h-3 animate-pulse" />
                    Rascunho Inteligente AI
                  </button>
                </div>

                {/* Messages Body */}
                <div className="flex-1 p-6 overflow-y-auto space-y-4" id="chat-messages-container">
                  {filteredMessages.map((msg) => {
                    const isCurrentUser = msg.senderId === userEmail || (role === 'teacher' && msg.senderId === 'teacher_1');
                    return (
                      <div 
                        key={msg.id}
                        className={`max-w-[75%] p-4 rounded-2xl text-xs space-y-2 ${
                          isCurrentUser 
                            ? 'bg-[#c4a47c] text-[#0a0a0b] font-medium ml-auto rounded-tr-none' 
                            : 'bg-[#1e1e21] text-slate-100 mr-auto rounded-tl-none border border-slate-800'
                        }`}
                      >
                        <div className="flex justify-between gap-4 text-[9px] opacity-75">
                          <span className="font-bold">{msg.senderName}</span>
                          <span>{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                        <p className="leading-relaxed whitespace-pre-wrap">{msg.content}</p>

                        {/* Render attachment icon if any */}
                        {msg.attachment && (
                          <div className={`mt-2 p-2 rounded-lg text-[10px] flex items-center justify-between gap-3 ${
                            isCurrentUser ? 'bg-amber-950/20 text-[#0a0a0b]' : 'bg-[#0a0a0b] text-slate-400'
                          }`}>
                            <div className="flex items-center gap-1.5 truncate">
                              <Paperclip className="w-3.5 h-3.5 shrink-0" />
                              <span className="truncate font-semibold">{msg.attachment.name}</span>
                            </div>
                            <span className="opacity-75 shrink-0">{msg.attachment.size}</span>
                          </div>
                        )}
                      </div>
                    );
                  })}

                  {filteredMessages.length === 0 && (
                    <div className="text-center py-12 text-slate-500 text-xs">
                      Envie sua primeira mensagem para iniciar a conversa privada com o docente responsável.
                    </div>
                  )}
                </div>

                {/* Attached File Notifier */}
                {attachedFile && (
                  <div className="px-6 py-2 bg-[#1e1e21] border-t border-slate-900 text-xs flex items-center justify-between text-slate-300">
                    <div className="flex items-center gap-2">
                      <Paperclip className="w-3.5 h-3.5 text-[#c4a47c]" />
                      <span>Anexo selecionado: <strong>{attachedFile.name}</strong> ({attachedFile.size})</span>
                    </div>
                    <button onClick={() => setAttachedFile(null)} className="text-rose-500 hover:underline text-[10px]">Remover</button>
                  </div>
                )}

                {/* Chat Input form */}
                <form onSubmit={handleSendMessage} className="p-4 border-t border-slate-900 flex gap-2.5 bg-[#141416]">
                  <button
                    type="button"
                    onClick={handleFileDropSimulator}
                    title="Simular Anexo de Arquivo"
                    className="p-3 bg-[#1e1e21] hover:bg-[#c4a47c]/10 text-slate-400 hover:text-[#c4a47c] rounded-xl border border-slate-800 transition flex items-center justify-center shrink-0"
                  >
                    <Paperclip className="w-4 h-4" />
                  </button>

                  <input
                    type="text"
                    placeholder="Digite sua mensagem privada para o responsável..."
                    value={newMessageText}
                    onChange={(e) => setNewMessageText(e.target.value)}
                    className="flex-1 bg-[#1e1e21] border border-slate-800 rounded-xl px-4 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-[#c4a47c]"
                  />

                  <button
                    type="submit"
                    className="px-5 bg-[#c4a47c] hover:bg-[#b09069] text-[#0a0a0b] font-bold rounded-xl transition flex items-center justify-center gap-1.5 shrink-0"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Enviar</span>
                  </button>
                </form>

              </div>
            </div>
          )}

          {/* SCHOOL CALENDAR TAB */}
          {activeTab === 'calendar' && (
            <div className="space-y-6">
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                  <h1 className="font-serif-cormorant text-4xl text-slate-100 font-light">Calendário de Atividades</h1>
                  <p className="text-slate-400 text-sm mt-1">Sincronização automática com calendários escolares tradicionais e agendamentos presenciais.</p>
                </div>

                {role !== 'parent' && (
                  <button
                    onClick={() => {
                      setNewEventDate(new Date().toISOString().split('T')[0]);
                      setShowAddEventModal(true);
                    }}
                    className="bg-[#c4a47c] hover:bg-[#b09069] text-[#0a0a0b] text-xs font-semibold px-4 py-2.5 rounded-xl transition flex items-center gap-1.5 self-start shadow-gold-soft"
                  >
                    <Plus className="w-4 h-4" />
                    Novo Evento Escolar
                  </button>
                )}
              </div>

              {/* Grid Layout: Agenda + Event list */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                
                {/* Event Cards Section */}
                <div className="lg:col-span-2 space-y-4">
                  <h3 className="font-serif-cormorant text-2xl text-[#c4a47c]">Eventos Confirmados</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {calendarEvents.map((evt) => {
                      const formattedDate = new Date(evt.date + 'T00:00:00').toLocaleDateString('pt-BR', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric'
                      });

                      const catStyles = {
                        event: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
                        meeting: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
                        holiday: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
                        exam: 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                      }[evt.category];

                      return (
                        <div key={evt.id} className="p-5 bg-[#141416] border border-slate-900 rounded-2xl space-y-3 hover:border-[#c4a47c]/30 transition duration-200">
                          <div className="flex justify-between items-start gap-4">
                            <span className={`text-[10px] font-bold uppercase tracking-widest px-2.5 py-0.5 rounded-full border ${catStyles}`}>
                              {evt.category}
                            </span>
                            
                            {role === 'admin' && (
                              <button
                                onClick={() => handleDeleteEvent(evt.id)}
                                className="text-slate-600 hover:text-rose-500 transition"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>

                          <div>
                            <h4 className="font-semibold text-slate-100 text-sm">{evt.title}</h4>
                            <p className="text-xs text-slate-400 mt-1">{evt.description}</p>
                          </div>

                          <div className="pt-3 border-t border-slate-900 flex items-center gap-2 text-[10px] text-slate-500 font-mono">
                            <Clock className="w-3.5 h-3.5" />
                            <span>{formattedDate}</span>
                            {evt.isLocalOnly && (
                              <span className="text-amber-500 ml-auto animate-pulse">[Offline]</span>
                            )}
                          </div>
                        </div>
                      );
                    })}

                    {calendarEvents.length === 0 && (
                      <p className="text-slate-500 text-xs py-4 col-span-2">Nenhum evento escolar cadastrado no momento.</p>
                    )}
                  </div>
                </div>

                {/* Calendar Side Panel: School holidays & integration instructions */}
                <div className="bg-[#141416] border border-slate-900 rounded-3xl p-6 space-y-6">
                  <h3 className="font-serif-cormorant text-2xl text-[#c4a47c]">Sincronização</h3>
                  
                  <div className="space-y-4 text-xs">
                    <p className="text-slate-300 leading-relaxed">
                      Sincronize automaticamente os compromissos, reuniões pedagógicas e exames escolares da escola com os seus calendários pessoais favoritos.
                    </p>

                    <div className="space-y-2 pt-2">
                      <button
                        onClick={() => alert("Sincronizando com Google Calendar... Autorização em andamento.")}
                        className="w-full py-2.5 px-4 bg-[#1e1e21] hover:bg-slate-800 border border-slate-800 rounded-xl font-medium text-slate-300 hover:text-white transition flex items-center justify-center gap-2"
                      >
                        Sincronizar com Google Calendar
                      </button>
                      <button
                        onClick={() => alert("Gerando link iCal/Outlook... Exportação pronta.")}
                        className="w-full py-2.5 px-4 bg-[#1e1e21] hover:bg-slate-800 border border-slate-800 rounded-xl font-medium text-slate-300 hover:text-white transition flex items-center justify-center gap-2"
                      >
                        Sincronizar Apple / Outlook (iCal)
                      </button>
                    </div>

                    <div className="p-4 bg-slate-900/40 rounded-2xl border border-slate-800 space-y-2 text-[11px] text-slate-400">
                      <h4 className="font-bold text-slate-200">ℹ️ Notas de Sincronização</h4>
                      <p>Qualquer evento cadastrado localmente no modo offline será propagado na nuvem e enviado aos pais instantaneamente assim que detectar rede.</p>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* REPORTS & WEEKLY PROGRESS TAB */}
          {activeTab === 'reports' && (
            <div className="space-y-6">
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                  <h1 className="font-serif-cormorant text-4xl text-slate-100 font-light">Estatísticas & Relatórios</h1>
                  <p className="text-slate-400 text-sm mt-1">Estatísticas detalhadas sobre o comportamento geral, engajamento e evolução pedagógica.</p>
                </div>
              </div>

              {/* Progress visualizer widgets */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                <div className="bg-[#141416] border border-slate-900 p-6 rounded-3xl space-y-2">
                  <span className="text-xs font-bold text-[#c4a47c] uppercase tracking-wider block">Total de Comportamentos</span>
                  <div className="flex items-baseline gap-2">
                    <span className="font-serif-cormorant text-4xl font-light text-slate-100">{pointLogs.length}</span>
                    <span className="text-xs text-emerald-400 font-semibold font-mono">↑ 12% semana</span>
                  </div>
                  <p className="text-[11px] text-slate-500">Registros de comportamentos individuais ou coletivos lançados em tempo real.</p>
                </div>

                <div className="bg-[#141416] border border-slate-900 p-6 rounded-3xl space-y-2">
                  <span className="text-xs font-bold text-[#c4a47c] uppercase tracking-wider block">Média da Turma</span>
                  <div className="flex items-baseline gap-2">
                    <span className="font-serif-cormorant text-4xl font-light text-slate-100">
                      {students.length > 0 ? (students.reduce((acc, s) => acc + s.points, 0) / students.length).toFixed(1) : '0'}
                    </span>
                    <span className="text-xs text-[#c4a47c] font-semibold">pontos / aluno</span>
                  </div>
                  <p className="text-[11px] text-slate-500">Média ponderada do score comportamental dos estudantes ativos.</p>
                </div>

                <div className="bg-[#141416] border border-slate-900 p-6 rounded-3xl space-y-2">
                  <span className="text-xs font-bold text-[#c4a47c] uppercase tracking-wider block">Reforço Positivo Ratio</span>
                  <div className="flex items-baseline gap-2">
                    <span className="font-serif-cormorant text-4xl font-light text-slate-100">
                      {pointLogs.length > 0 ? Math.round((pointLogs.filter(l => l.type === 'positive').length / pointLogs.length) * 100) : '85'}%
                    </span>
                    <span className="text-xs text-emerald-400 font-semibold">Alto nível</span>
                  </div>
                  <p className="text-[11px] text-slate-500">Porcentagem de pontos que são baseados em reforço positivo vs disciplinar.</p>
                </div>

              </div>

              {/* Graphical Analysis with pure styled CSS */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                
                {/* Score ranking list with stylish indicators */}
                <div className="bg-[#141416] border border-slate-900 rounded-3xl p-6 space-y-6">
                  <h3 className="font-serif-cormorant text-2xl text-[#c4a47c]">Desempenho por Aluno</h3>
                  
                  <div className="space-y-4">
                    {students.map((st) => {
                      const maxPoints = Math.max(...students.map(s => s.points), 30);
                      const barWidth = Math.max(10, Math.min(100, (st.points / maxPoints) * 100));
                      
                      return (
                        <div key={st.id} className="space-y-1.5">
                          <div className="flex justify-between text-xs">
                            <span className="font-medium text-slate-300">{st.name}</span>
                            <span className="font-bold text-[#c4a47c]">{st.points} pontos</span>
                          </div>
                          
                          <div className="w-full h-2 bg-[#1e1e21] rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-gradient-to-r from-[#c4a47c]/60 to-[#c4a47c] rounded-full" 
                              style={{ width: `${barWidth}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Categories behavior frequency count */}
                <div className="bg-[#141416] border border-slate-900 rounded-3xl p-6 space-y-6">
                  <h3 className="font-serif-cormorant text-2xl text-[#c4a47c]">Frequência por Categoria</h3>
                  
                  <div className="space-y-4">
                    {categories.map((cat) => {
                      const count = pointLogs.filter(log => log.categoryName === cat.name).length;
                      const totalLogs = pointLogs.length || 1;
                      const percentage = Math.round((count / totalLogs) * 100);

                      return (
                        <div key={cat.id} className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2">
                            <span className="text-sm">{cat.type === 'positive' ? '💚' : '💔'}</span>
                            <span className="text-slate-300">{cat.name}</span>
                          </div>
                          
                          <div className="flex items-center gap-3">
                            <span className="text-slate-500 font-mono">{count}x</span>
                            <span className="px-2 py-0.5 bg-slate-900 text-slate-400 rounded text-[10px] font-mono">{percentage}%</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

              </div>

            </div>
          )}

          {/* PAYMENT INTEGRATION TAB */}
          {activeTab === 'payment' && (
            <div className="space-y-6">
              <div>
                <h1 className="font-serif-cormorant text-4xl text-slate-100 font-light">Mensalidades, Taxas & Excursões</h1>
                <p className="text-slate-400 text-sm mt-1">Sessão para pagamento seguro das contribuições escolares pendentes.</p>
              </div>

              {/* Payment item lists */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {payments.map((p) => {
                  const isPaid = p.status === 'paid';
                  const formattedDate = new Date(p.dueDate + 'T00:00:00').toLocaleDateString('pt-BR', {
                    day: 'numeric',
                    month: 'short'
                  });

                  return (
                    <div 
                      key={p.id} 
                      className={`p-6 rounded-2xl border flex flex-col justify-between h-52 transition duration-200 ${
                        isPaid 
                          ? 'bg-emerald-950/5 border-emerald-500/20 text-emerald-400/80' 
                          : 'bg-[#141416] border-slate-900 hover:border-[#c4a47c]/30 text-slate-100'
                      }`}
                    >
                      <div className="space-y-2">
                        <div className="flex justify-between items-start gap-4">
                          <span className={`text-[10px] font-bold uppercase px-2.5 py-0.5 rounded ${
                            p.category === 'material' ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20' : 
                            p.category === 'trip' ? 'bg-[#c4a47c]/10 text-[#c4a47c] border border-[#c4a47c]/20' :
                            'bg-teal-500/10 text-teal-400 border border-teal-500/20'
                          }`}>
                            {p.category}
                          </span>

                          <span className={`text-[10px] font-bold uppercase px-2.5 py-0.5 rounded ${
                            isPaid ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-500'
                          }`}>
                            {isPaid ? 'Pago' : 'Pendente'}
                          </span>
                        </div>

                        <h4 className="font-semibold text-slate-100 text-sm leading-snug line-clamp-2">{p.title}</h4>
                      </div>

                      <div className="pt-4 border-t border-slate-900 flex justify-between items-center">
                        <div>
                          <p className="text-[10px] text-slate-500">Vence em: {formattedDate}</p>
                          <span className="text-lg font-bold text-white">R$ {p.amount.toFixed(2)}</span>
                        </div>

                        {!isPaid && (
                          <button
                            onClick={() => setShowPayModal(p)}
                            className="bg-[#c4a47c] hover:bg-[#b09069] text-[#0a0a0b] text-xs font-bold px-4 py-2 rounded-xl transition"
                          >
                            Pagar Agora
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* SYSTEM ADMINISTRATOR & WEBHOOK DIAGNOSTICS TAB */}
          {activeTab === 'admin' && (
            <div className="space-y-8">
              <div>
                <h1 className="font-serif-cormorant text-4xl text-slate-100 font-light">Painel de Diagnósticos Administrativos</h1>
                <p className="text-slate-400 text-sm mt-1">Status de barramento de eventos, webhook e logs de conformidade de privacidade de dados.</p>
              </div>

              {/* Webhooks configuration block */}
              <div className="bg-[#141416] border border-slate-900 rounded-3xl p-6 space-y-6">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="font-serif-cormorant text-2xl text-[#c4a47c]">Integração via Webhooks</h3>
                    <p className="text-xs text-slate-400">Notifique sistemas de secretaria externa instantaneamente em eventos específicos.</p>
                  </div>
                  <button
                    onClick={() => setShowWebhookConfigModal(true)}
                    className="py-1.5 px-3 border border-slate-800 text-xs font-medium rounded-xl hover:text-white hover:bg-slate-900 text-slate-300 transition"
                  >
                    Novo Endpoint Webhook
                  </button>
                </div>

                {/* Webhook lists */}
                <div className="space-y-3">
                  {webhooks.map((w) => (
                    <div key={w.id} className="p-4 bg-[#1e1e21]/40 border border-slate-900 rounded-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4 text-xs">
                      <div>
                        <div className="flex items-center gap-2">
                          <strong className="text-white text-sm">{w.name}</strong>
                          <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 text-[10px] uppercase font-bold">Ativo</span>
                        </div>
                        <p className="text-slate-500 font-mono text-[10px] mt-1 break-all">{w.url}</p>
                        <div className="flex gap-1.5 mt-2">
                          {w.events.map(ev => (
                            <span key={ev} className="px-2 py-0.5 bg-slate-900 text-slate-400 rounded text-[9px] font-mono">{ev}</span>
                          ))}
                        </div>
                      </div>

                      <button
                        onClick={async () => {
                          if (confirm("Remover este webhook?")) {
                            await fetch(`/api/webhooks/${w.id}`, { method: 'DELETE' });
                            fetchDBDump();
                          }
                        }}
                        className="text-rose-500 hover:underline text-[11px]"
                      >
                        Excluir
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Webhook trigger logs */}
              <div className="bg-[#141416] border border-slate-900 rounded-3xl p-6 space-y-4">
                <h3 className="font-serif-cormorant text-2xl text-[#c4a47c]">Logs de Tráfego Webhook</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs divide-y divide-slate-900">
                    <thead>
                      <tr className="text-slate-500">
                        <th className="pb-3">Webhook</th>
                        <th className="pb-3">Evento</th>
                        <th className="pb-3">Status</th>
                        <th className="pb-3">Data/Hora</th>
                        <th className="pb-3">Payload</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-900 text-slate-300">
                      {webhookLogs.map((log) => (
                        <tr key={log.id} className="hover:bg-slate-900/10 transition">
                          <td className="py-3 font-semibold text-white">{log.webhookName}</td>
                          <td className="py-3 font-mono text-[10px]">{log.eventType}</td>
                          <td className="py-3">
                            <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-bold font-mono">200 OK</span>
                          </td>
                          <td className="py-3 text-[10px] text-slate-500 font-mono">{new Date(log.timestamp).toLocaleTimeString()}</td>
                          <td className="py-3 font-mono text-[9px] text-slate-500 truncate max-w-xs">{log.payload}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {webhookLogs.length === 0 && (
                    <p className="text-slate-500 text-xs py-4 text-center">Nenhum log de disparo de webhook localizado.</p>
                  )}
                </div>
              </div>

              {/* Audit trail / Security logs */}
              <div className="bg-[#141416] border border-slate-900 rounded-3xl p-6 space-y-4">
                <h3 className="font-serif-cormorant text-2xl text-[#c4a47c]">Histórico de Auditoria & Segurança</h3>
                <div className="space-y-3.5 max-h-96 overflow-y-auto">
                  {auditLogs.map((log) => (
                    <div key={log.id} className="p-3 bg-slate-900/30 rounded-xl border border-slate-900 text-[11px] flex justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <strong className="text-slate-200">{log.action}</strong>
                          <span className="text-slate-500">• por {log.user}</span>
                        </div>
                        <p className="text-slate-400 mt-1">{log.details}</p>
                      </div>
                      <span className="text-slate-600 font-mono text-[9px] text-right shrink-0">{new Date(log.timestamp).toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          )}

        </div>

        {/* Global Footer */}
        <footer className="h-12 border-t border-slate-900 bg-[#0a0a0b] px-6 flex flex-col md:flex-row items-center justify-between text-[11px] text-slate-500 mt-auto">
          <div>
            © 2026 EduPoint Dojo Systems • Versão 3.5.0 Premium Enterprise
          </div>
          <div className="flex items-center gap-4">
            <span>Privacidade em conformidade com as diretrizes de proteção de menores</span>
            <span>•</span>
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-md"></span>
              Criptografia Ativa
            </span>
          </div>
        </footer>

      </main>

      {/* MODAL: POINT PICKER FOR TEACHERS */}
      {activeStudentForPoints && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-[#141416] border border-slate-800 rounded-3xl p-8 max-w-xl w-full space-y-6 shadow-2xl relative">
            <div className="flex justify-between items-start">
              <div className="flex items-center gap-3">
                <span className="text-4xl">{activeStudentForPoints.avatar}</span>
                <div>
                  <h3 className="font-serif-cormorant text-3xl font-light text-white">Lançar Ponto Comportamental</h3>
                  <p className="text-slate-400 text-xs">Atribuir avaliação instantânea para {activeStudentForPoints.name}</p>
                </div>
              </div>
              <button 
                onClick={() => setActiveStudentForPoints(null)} 
                className="text-slate-400 hover:text-white transition text-xs border border-slate-800 rounded-lg px-2 py-1"
              >
                Fechar
              </button>
            </div>

            {/* Positive categories */}
            <div className="space-y-3">
              <h4 className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest">👍 Positivos (Reforço)</h4>
              <div className="grid grid-cols-2 gap-2.5">
                {categories.filter(c => c.type === 'positive').map(cat => (
                  <button
                    key={cat.id}
                    onClick={() => handleGivePoints(cat)}
                    className="p-3 bg-emerald-500/5 hover:bg-emerald-500/10 border border-emerald-500/10 hover:border-emerald-500/30 rounded-xl text-left transition flex justify-between items-center text-xs group"
                  >
                    <span className="text-slate-300 group-hover:text-white font-medium">{cat.name}</span>
                    <span className="text-emerald-400 font-bold font-mono">+{cat.points}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Negative categories */}
            <div className="space-y-3">
              <h4 className="text-[10px] font-bold text-rose-400 uppercase tracking-widest">👎 Oportunidades de Melhoria</h4>
              <div className="grid grid-cols-2 gap-2.5">
                {categories.filter(c => c.type === 'negative').map(cat => (
                  <button
                    key={cat.id}
                    onClick={() => handleGivePoints(cat)}
                    className="p-3 bg-rose-500/5 hover:bg-rose-500/10 border border-rose-500/10 hover:border-rose-500/30 rounded-xl text-left transition flex justify-between items-center text-xs group"
                  >
                    <span className="text-slate-300 group-hover:text-white font-medium">{cat.name}</span>
                    <span className="text-rose-400 font-bold font-mono">{cat.points}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="pt-4 border-t border-slate-900 flex justify-between items-center text-[10px] text-slate-500">
              <span>Selecione a categoria para salvar automaticamente na nuvem</span>
              <button 
                onClick={() => setShowAddCategoryModal(true)}
                className="text-[#c4a47c] hover:underline"
              >
                + Personalizar categorias
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: ADD STUDENT */}
      {showAddStudentModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-[#141416] border border-slate-800 rounded-3xl p-8 max-w-md w-full space-y-6 shadow-2xl">
            <h3 className="font-serif-cormorant text-3xl font-light text-white border-b border-slate-900 pb-4">Adicionar Novo Estudante</h3>
            
            <form onSubmit={handleAddStudentSubmit} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">Nome do Estudante</label>
                <input
                  type="text"
                  placeholder="Nome Completo"
                  value={newStudentName}
                  onChange={(e) => setNewStudentName(e.target.value)}
                  className="w-full bg-[#1e1e21] border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-100 focus:outline-none focus:ring-1 focus:ring-[#c4a47c]"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">Nome do Responsável</label>
                  <input
                    type="text"
                    placeholder="Nome do Pai/Mãe"
                    value={newStudentParentName}
                    onChange={(e) => setNewStudentParentName(e.target.value)}
                    className="w-full bg-[#1e1e21] border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-100 focus:outline-none focus:ring-1 focus:ring-[#c4a47c]"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">E-mail do Responsável</label>
                  <input
                    type="email"
                    placeholder="email@responsavel.com"
                    value={newStudentParentEmail}
                    onChange={(e) => setNewStudentParentEmail(e.target.value)}
                    className="w-full bg-[#1e1e21] border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-100 focus:outline-none focus:ring-1 focus:ring-[#c4a47c]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">Selecionar Avatar</label>
                <div className="flex gap-2 justify-between">
                  {['👾', '🦄', '🐯', '🤖', '🦊', '🐨'].map((emoji) => (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => setNewStudentAvatar(emoji)}
                      className={`w-11 h-11 text-2xl rounded-xl border flex items-center justify-center transition ${
                        newStudentAvatar === emoji ? 'bg-[#c4a47c]/20 border-[#c4a47c]' : 'bg-slate-900 border-slate-950 hover:bg-[#1e1e21]'
                      }`}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-4 flex justify-end gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => setShowAddStudentModal(false)}
                  className="px-4 py-2 text-slate-400 hover:text-white transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-[#c4a47c] hover:bg-[#b09069] text-[#0a0a0b] font-bold rounded-xl transition"
                >
                  Adicionar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ADD CALENDAR EVENT */}
      {showAddEventModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-[#141416] border border-slate-800 rounded-3xl p-8 max-w-md w-full space-y-6 shadow-2xl">
            <h3 className="font-serif-cormorant text-3xl font-light text-white border-b border-slate-900 pb-4">Novo Evento Escolar</h3>
            
            <form onSubmit={handleAddEventSubmit} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">Título do Compromisso</label>
                <input
                  type="text"
                  placeholder="Reunião, Prova, Atividade..."
                  value={newEventTitle}
                  onChange={(e) => setNewEventTitle(e.target.value)}
                  className="w-full bg-[#1e1e21] border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-100 focus:outline-none focus:ring-1 focus:ring-[#c4a47c]"
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">Data</label>
                <input
                  type="date"
                  value={newEventDate}
                  onChange={(e) => setNewEventDate(e.target.value)}
                  className="w-full bg-[#1e1e21] border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-100 focus:outline-none focus:ring-1 focus:ring-[#c4a47c]"
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">Categoria</label>
                <select
                  value={newEventCategory}
                  onChange={(e) => setNewEventCategory(e.target.value as any)}
                  className="w-full bg-[#1e1e21] border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-slate-100 focus:outline-none"
                >
                  <option value="event">Atividade / Evento Geral</option>
                  <option value="meeting">Reunião de Pais</option>
                  <option value="holiday">Feriado Escolar</option>
                  <option value="exam">Avaliação / Exame</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">Descrição Curta</label>
                <textarea
                  rows={3}
                  placeholder="Instruções para os pais e materiais necessários..."
                  value={newEventDesc}
                  onChange={(e) => setNewEventDesc(e.target.value)}
                  className="w-full bg-[#1e1e21] border border-slate-800 rounded-xl p-4 text-xs text-slate-100 focus:outline-none focus:ring-1 focus:ring-[#c4a47c]"
                />
              </div>

              <div className="pt-4 flex justify-end gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => setShowAddEventModal(false)}
                  className="px-4 py-2 text-slate-400 hover:text-white transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-[#c4a47c] hover:bg-[#b09069] text-[#0a0a0b] font-bold rounded-xl transition"
                >
                  Sincronizar Evento
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: CUSTOM CATEGORY MODIFIER */}
      {showAddCategoryModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-[#141416] border border-slate-800 rounded-3xl p-8 max-w-md w-full space-y-6 shadow-2xl">
            <h3 className="font-serif-cormorant text-3xl font-light text-white border-b border-slate-900 pb-4">Personalizar Categoria</h3>
            
            <form onSubmit={handleAddCategorySubmit} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">Nome da Atitude / Categoria</label>
                <input
                  type="text"
                  placeholder="Ex: Trabalho em Equipe, Respeito..."
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  className="w-full bg-[#1e1e21] border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-100 focus:outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">Tipo</label>
                  <select
                    value={newCategoryType}
                    onChange={(e) => setNewCategoryType(e.target.value as any)}
                    className="w-full bg-[#1e1e21] border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-slate-100 focus:outline-none"
                  >
                    <option value="positive">Reforço Positivo</option>
                    <option value="negative">Melhoria / Alerta</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">Pontuação</label>
                  <input
                    type="number"
                    min={1}
                    max={5}
                    value={newCategoryPoints}
                    onChange={(e) => setNewCategoryPoints(Number(e.target.value))}
                    className="w-full bg-[#1e1e21] border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-100 focus:outline-none"
                  />
                </div>
              </div>

              <div className="pt-4 flex justify-end gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => setShowAddCategoryModal(false)}
                  className="px-4 py-2 text-slate-400 hover:text-white transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-[#c4a47c] hover:bg-[#b09069] text-[#0a0a0b] font-bold rounded-xl transition"
                >
                  Salvar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: PAYMENT CHECKOUT DETAILS */}
      {showPayModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-[#141416] border border-slate-800 rounded-3xl p-8 max-w-md w-full space-y-6 shadow-2xl relative">
            <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-emerald-500 to-teal-400"></div>

            <div className="flex justify-between items-start">
              <div>
                <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest block">Checkout de Pagamento Seguro</span>
                <h3 className="font-serif-cormorant text-2xl text-white mt-1">{showPayModal.title}</h3>
              </div>
              <button 
                onClick={() => setShowPayModal(null)}
                className="text-slate-400 hover:text-white transition text-xs border border-slate-800 rounded-lg px-2 py-1"
              >
                Voltar
              </button>
            </div>

            <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-800 flex justify-between items-center">
              <span className="text-xs text-slate-400">Total a Pagar:</span>
              <span className="text-xl font-extrabold text-white">R$ {showPayModal.amount.toFixed(2)}</span>
            </div>

            {/* Simulated Card Forms */}
            <form onSubmit={handlePaymentSubmit} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Nome no Cartão</label>
                <input
                  type="text"
                  placeholder="Nome Impresso no Cartão"
                  value={cardName}
                  onChange={(e) => setCardName(e.target.value)}
                  className="w-full bg-[#1e1e21] border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-100 focus:outline-none focus:ring-1 focus:ring-[#c4a47c]"
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Número do Cartão de Crédito</label>
                <input
                  type="text"
                  maxLength={19}
                  placeholder="4000 1234 5678 9010"
                  value={cardNumber}
                  onChange={(e) => setCardNumber(e.target.value.replace(/\s?/g, '').replace(/(\d{4})/g, '$1 ').trim())}
                  className="w-full bg-[#1e1e21] border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-100 focus:outline-none focus:ring-1 focus:ring-[#c4a47c]"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Validade</label>
                  <input
                    type="text"
                    maxLength={5}
                    placeholder="MM/AA"
                    value={cardExpiry}
                    onChange={(e) => setCardExpiry(e.target.value)}
                    className="w-full bg-[#1e1e21] border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-100 focus:outline-none focus:ring-1 focus:ring-[#c4a47c]"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">CVC</label>
                  <input
                    type="password"
                    maxLength={4}
                    placeholder="***"
                    value={cardCvc}
                    onChange={(e) => setCardCvc(e.target.value)}
                    className="w-full bg-[#1e1e21] border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-100 focus:outline-none focus:ring-1 focus:ring-[#c4a47c]"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-lg shadow-emerald-950 transition flex items-center justify-center gap-1.5"
              >
                <DollarSign className="w-4 h-4" />
                Pagar com Segurança
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ADD WEBHOOK ENDPOINT */}
      {showWebhookConfigModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-[#141416] border border-slate-800 rounded-3xl p-8 max-w-md w-full space-y-6 shadow-2xl">
            <h3 className="font-serif-cormorant text-3xl font-light text-white border-b border-slate-900 pb-4">Configurar Novo Webhook</h3>
            
            <form onSubmit={async (e) => {
              e.preventDefault();
              const urlVal = (e.currentTarget.elements.namedItem('webhookUrl') as HTMLInputElement).value;
              const nameVal = (e.currentTarget.elements.namedItem('webhookName') as HTMLInputElement).value;
              
              const res = await fetch('/api/webhooks', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  url: urlVal,
                  name: nameVal,
                  events: ["points.add", "messages.sent"]
                })
              });

              if (res.ok) {
                await fetchDBDump();
                setShowWebhookConfigModal(false);
              }
            }} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">Identificador do Sistema Receptor</label>
                <input
                  type="text"
                  name="webhookName"
                  placeholder="Ex: API Secretaria Central"
                  className="w-full bg-[#1e1e21] border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-100 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">Endpoint URL para Webhook</label>
                <input
                  type="url"
                  name="webhookUrl"
                  placeholder="https://api.sistemaexterno.com/webhooks"
                  className="w-full bg-[#1e1e21] border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-100 focus:outline-none"
                  required
                />
              </div>

              <div className="pt-4 flex justify-end gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => setShowWebhookConfigModal(false)}
                  className="px-4 py-2 text-slate-400 hover:text-white transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-[#c4a47c] hover:bg-[#b09069] text-[#0a0a0b] font-bold rounded-xl transition"
                >
                  Salvar Webhook
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* POPUP PANEL: PEDAGOGICAL AI CHAT ASSISTANT (GEMINI) */}
      {showEduAIChat && (
        <div className="fixed bottom-6 right-6 w-96 bg-[#141416] border border-slate-800 rounded-3xl shadow-2xl z-40 overflow-hidden flex flex-col h-[500px] animate-fade-in">
          
          {/* Header */}
          <div className="bg-gradient-to-r from-teal-600 to-indigo-700 p-4 flex justify-between items-center text-white">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 animate-pulse" />
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider">EduAI Advisor</h4>
                <p className="text-[9px] opacity-75">Habilidade pedagógica de comportamento ativa</p>
              </div>
            </div>
            <button 
              onClick={() => setShowEduAIChat(false)}
              className="text-white hover:text-slate-200 text-xs font-bold"
            >
              ✕
            </button>
          </div>

          {/* Messages block */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-[#0a0a0b]/40 text-xs" id="ai-chat-history">
            {aiChatHistory.map((item, index) => (
              <div 
                key={index} 
                className={`p-3 rounded-2xl ${
                  item.sender === 'user' 
                    ? 'bg-[#c4a47c] text-[#0a0a0b] font-semibold ml-auto max-w-[85%]' 
                    : 'bg-[#1e1e21] text-slate-300 mr-auto max-w-[85%] border border-slate-900 whitespace-pre-wrap'
                }`}
              >
                <p className="leading-relaxed">{item.text}</p>
                <span className="text-[8px] opacity-50 block mt-1 text-right">{item.timestamp}</span>
              </div>
            ))}

            {aiLoading && (
              <div className="p-3 bg-[#1e1e21] mr-auto rounded-2xl flex items-center gap-2 text-slate-500 max-w-[85%] border border-slate-900">
                <RefreshCw className="w-4.5 h-4.5 animate-spin text-[#c4a47c]" />
                <span>EduAI formulando parecer...</span>
              </div>
            )}
          </div>

          {/* Quick shortcuts */}
          <div className="p-2 border-t border-slate-900 bg-[#1e1e21]/40 flex gap-1 overflow-x-auto text-[9px]">
            <button
              onClick={() => setAiPromptText("Sugira dicas para motivar um aluno tímido que não interage na aula de ciências.")}
              className="px-2.5 py-1 bg-slate-900 text-[#c4a47c] hover:bg-slate-800 rounded-full border border-slate-800 shrink-0"
            >
              Aluno Tímido
            </button>
            <button
              onClick={() => setAiPromptText("Como sugerir gentilmente aos pais que estimulem a lição de casa em casa sem parecer ofensivo?")}
              className="px-2.5 py-1 bg-slate-900 text-[#c4a47c] hover:bg-slate-800 rounded-full border border-slate-800 shrink-0"
            >
              Comunicação Empática
            </button>
          </div>

          {/* Form input */}
          <form onSubmit={handleAskEduAI} className="p-2 border-t border-slate-900 flex gap-2 bg-[#141416]">
            <input
              type="text"
              placeholder="Digite sua dúvida pedagógica ou de comunicação..."
              value={aiPromptText}
              onChange={(e) => setAiPromptText(e.target.value)}
              className="flex-1 bg-[#1e1e21] border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-[#c4a47c]"
            />
            <button
              type="submit"
              className="bg-[#c4a47c] hover:bg-[#b09069] text-[#0a0a0b] p-2 rounded-xl transition flex items-center justify-center shrink-0"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>

        </div>
      )}

      {/* POPUP PANEL: DETAILED WEEKLY AI BEHAVIORAL REPORT */}
      {activeAIReportCard && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-[#141416] border border-[#c4a47c]/30 rounded-3xl p-8 max-w-2xl w-full space-y-6 shadow-2xl relative">
            <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-indigo-500 via-[#c4a47c] to-indigo-600"></div>

            <div className="flex justify-between items-start">
              <div className="flex items-center gap-3">
                <span className="text-4xl">{activeAIReportCard.student.avatar}</span>
                <div>
                  <h3 className="font-serif-cormorant text-2xl text-[#c4a47c]">Rascunho do Relatório de Desempenho</h3>
                  <p className="text-xs text-slate-400">Personalizado com base nos lançamentos comportamentais da semana de {activeAIReportCard.student.name}</p>
                </div>
              </div>
              <button 
                onClick={() => setActiveAIReportCard(null)}
                className="text-slate-400 hover:text-white transition text-xs border border-slate-800 rounded-lg px-2 py-1"
              >
                Fechar
              </button>
            </div>

            {/* AI Report Output */}
            <div className="bg-slate-900/60 p-6 rounded-2xl border border-slate-800/60 max-h-[350px] overflow-y-auto text-xs text-slate-300 leading-relaxed whitespace-pre-wrap font-sans">
              {activeAIReportCard.reportText}
            </div>

            {/* Form controls */}
            <div className="pt-4 border-t border-slate-900 flex flex-wrap justify-between items-center gap-4 text-xs">
              <span className="text-slate-500">Você pode copiar a mensagem sugerida acima para enviar diretamente no chat privado.</span>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(activeAIReportCard.reportText);
                    triggerPushNotification("Copiado!", "Relatório comportamental copiado para a área de transferência.");
                  }}
                  className="px-4 py-2 border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-900 rounded-xl transition"
                >
                  Copiar Texto
                </button>
                <button
                  onClick={() => {
                    const messagePayload = {
                      senderId: 'teacher_1',
                      senderName: 'Prof. Ricardo Silva',
                      receiverId: activeAIReportCard.student.parentEmail,
                      content: `Prezados pais, aqui está o parecer da coordenação sobre a semana do aluno:\n\n${activeAIReportCard.reportText}`
                    };
                    registerAction('messages.sent', messagePayload);
                    setActiveTab('messages');
                    setActiveAIReportCard(null);
                    triggerPushNotification("Parecer Enviado", `O relatório foi integrado ao chat com ${activeAIReportCard.student.parentName}.`);
                  }}
                  className="px-4 py-2 bg-[#c4a47c] hover:bg-[#b09069] text-[#0a0a0b] font-bold rounded-xl transition"
                >
                  Enviar para Pais via Chat
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
