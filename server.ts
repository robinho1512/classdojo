import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";

const app = express();
const PORT = 3000;
const DB_PATH = path.join(process.cwd(), "db.json");

// Middleware to parse JSON
app.use(express.json());

// Lazy-initialized Gemini client
let aiClient: GoogleGenAI | null = null;
function getAI() {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey) {
      aiClient = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            "User-Agent": "aistudio-build",
          },
        },
      });
    }
  }
  return aiClient;
}

// Default Seed Data
const DEFAULT_DB = {
  students: [
    { id: "s1", name: "Artur Silva", avatar: "👾", points: 14, parentEmail: "artur.pais@email.com", parentName: "Marcos Silva" },
    { id: "s2", name: "Beatriz Costa", avatar: "🦄", points: 22, parentEmail: "beatriz.pais@email.com", parentName: "Helena Costa" },
    { id: "s3", name: "Caio Oliveira", avatar: "🐯", points: 8, parentEmail: "caio.pais@email.com", parentName: "Sofia Oliveira" },
    { id: "s4", name: "Davi Santos", avatar: "🤖", points: 15, parentEmail: "joaopedro.joaopedro12345678910@gmail.com", parentName: "João Santos" },
    { id: "s5", name: "Eduarda Pereira", avatar: "🦊", points: 3, parentEmail: "eduarda.pais@email.com", parentName: "Renato Pereira" }
  ],
  categories: [
    { id: "c1", name: "Trabalho em Equipe", points: 1, type: "positive", icon: "Users" },
    { id: "c2", name: "Participação Ativa", points: 1, type: "positive", icon: "Hand" },
    { id: "c3", name: "Ajudar Colegas", points: 2, type: "positive", icon: "Heart" },
    { id: "c4", name: "Lição de Casa Completa", points: 1, type: "positive", icon: "CheckCircle" },
    { id: "c5", name: "Persistência", points: 2, type: "positive", icon: "Award" },
    { id: "c6", name: "Sem Lição de Casa", points: -1, type: "negative", icon: "FileX" },
    { id: "c7", name: "Conversa Paralela", points: -1, type: "negative", icon: "MessageSquareOff" },
    { id: "c8", name: "Desrespeito em Sala", points: -2, type: "negative", icon: "ShieldAlert" },
    { id: "c9", name: "Fora da Cadeira / Distraído", points: -1, type: "negative", icon: "ZapOff" }
  ],
  point_logs: [
    { id: "pl1", studentId: "s1", categoryName: "Trabalho em Equipe", points: 1, description: "Colaborou muito bem no projeto de ciências.", timestamp: new Date(Date.now() - 3 * 3600000).toISOString(), type: "positive" },
    { id: "pl2", studentId: "s2", categoryName: "Participação Ativa", points: 1, description: "Respondeu perguntas difíceis na aula de matemática.", timestamp: new Date(Date.now() - 2 * 3600000).toISOString(), type: "positive" },
    { id: "pl3", studentId: "s5", categoryName: "Sem Lição de Casa", points: -1, description: "Não entregou a lição de casa de história.", timestamp: new Date(Date.now() - 1 * 3600000).toISOString(), type: "negative" }
  ],
  messages: [
    { id: "m1", senderId: "teacher_1", senderName: "Prof. Ricardo Silva", receiverId: "joaopedro.joaopedro12345678910@gmail.com", content: "Olá João! O Davi foi fantástico hoje na aula de artes, ajudou a organizar todos os materiais do grupo.", timestamp: new Date(Date.now() - 24 * 3600000).toISOString() },
    { id: "m2", senderId: "joaopedro.joaopedro12345678910@gmail.com", senderName: "João Santos", receiverId: "teacher_1", content: "Que excelente notícia, Professor! Ficamos muito orgulhosos dele aqui em casa. Obrigado pelo feedback!", timestamp: new Date(Date.now() - 22 * 3600000).toISOString() }
  ],
  calendar: [
    { id: "e1", title: "Feira de Ciências Anual", description: "Apresentação dos projetos de ciências de todas as turmas no ginásio escolar.", date: new Date(Date.now() + 3 * 24 * 3600000).toISOString().split('T')[0], category: "event" },
    { id: "e2", title: "Reunião de Pais e Mestres", description: "Entrega oficial dos boletins e conversa sobre comportamento.", date: new Date(Date.now() + 7 * 24 * 3600000).toISOString().split('T')[0], category: "meeting" },
    { id: "e3", title: "Feriado Escolar", description: "Não haverá aulas presenciais ou online.", date: new Date(Date.now() + 15 * 24 * 3600000).toISOString().split('T')[0], category: "holiday" }
  ],
  webhooks: [
    { id: "w1", url: "https://api.escola.com/webhooks/behavior", name: "Sincronizador Secretaria", events: ["points.add", "messages.sent"], active: true }
  ],
  payments: [
    { id: "p1", title: "Livro Didático de Geografia - 5º Ano", amount: 120.00, dueDate: new Date(Date.now() + 5 * 24 * 3600000).toISOString().split('T')[0], status: "pending", category: "material" },
    { id: "p2", title: "Excursão para o Planetário de Campinas", amount: 45.00, dueDate: new Date(Date.now() + 12 * 24 * 3600000).toISOString().split('T')[0], status: "pending", category: "trip" },
    { id: "p3", title: "Mensalidade Escolar - Junho", amount: 450.00, dueDate: new Date(Date.now() - 2 * 24 * 3600000).toISOString().split('T')[0], status: "paid", category: "tuition" }
  ],
  audit_logs: [
    { id: "l1", action: "Inicialização do Sistema", user: "Administrador", timestamp: new Date().toISOString(), details: "Banco de dados local seedado e online." }
  ],
  webhook_trigger_logs: [
    { id: "wt1", webhookName: "Sincronizador Secretaria", url: "https://api.escola.com/webhooks/behavior", eventType: "points.add", status: 200, timestamp: new Date().toISOString(), payload: "{\"studentId\":\"s1\",\"points\":1}" }
  ]
};

// Database helper functions
function readDB() {
  try {
    if (!fs.existsSync(DB_PATH)) {
      fs.writeFileSync(DB_PATH, JSON.stringify(DEFAULT_DB, null, 2), "utf8");
      return DEFAULT_DB;
    }
    const data = fs.readFileSync(DB_PATH, "utf8");
    return JSON.parse(data);
  } catch (err) {
    console.error("Error reading db file, using in-memory state", err);
    return DEFAULT_DB;
  }
}

function writeDB(data: any) {
  try {
    fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), "utf8");
  } catch (err) {
    console.error("Error writing db file", err);
  }
}

// Trigger simulation of webhooks
function triggerWebhooks(eventType: string, payload: any) {
  const db = readDB();
  const activeWebhooks = db.webhooks.filter((w: any) => w.active && w.events.includes(eventType));
  
  activeWebhooks.forEach((webhook: any) => {
    const triggerLog = {
      id: "wt_" + Math.random().toString(36).substr(2, 9),
      webhookName: webhook.name,
      url: webhook.url,
      eventType: eventType,
      status: 200, // Simulated success
      timestamp: new Date().toISOString(),
      payload: JSON.stringify(payload)
    };
    db.webhook_trigger_logs = db.webhook_trigger_logs || [];
    db.webhook_trigger_logs.unshift(triggerLog);
    // limit to 30 logs
    if (db.webhook_trigger_logs.length > 30) db.webhook_trigger_logs.pop();
  });
  
  writeDB(db);
}

// API Routes

// 1. Get database backup (for fast client state loads and offline hydration)
app.get("/api/db-dump", (req, res) => {
  res.json(readDB());
});

// 2. Students endpoints
app.get("/api/students", (req, res) => {
  const db = readDB();
  res.json(db.students);
});

app.post("/api/students", (req, res) => {
  const db = readDB();
  const newStudent = {
    id: "s_" + Math.random().toString(36).substr(2, 9),
    name: req.body.name,
    avatar: req.body.avatar || "👾",
    points: 0,
    parentEmail: req.body.parentEmail || "responsavel@email.com",
    parentName: req.body.parentName || "Responsável"
  };
  db.students.push(newStudent);
  
  // audit log
  db.audit_logs.unshift({
    id: "l_" + Math.random().toString(36).substr(2, 9),
    action: "Adicionar Aluno",
    user: "Professor Ricardo Silva",
    timestamp: new Date().toISOString(),
    details: `Aluno ${newStudent.name} cadastrado com sucesso.`
  });

  writeDB(db);
  res.status(201).json(newStudent);
});

app.delete("/api/students/:id", (req, res) => {
  const db = readDB();
  const studentIndex = db.students.findIndex((s: any) => s.id === req.params.id);
  if (studentIndex !== -1) {
    const deleted = db.students.splice(studentIndex, 1);
    db.point_logs = db.point_logs.filter((log: any) => log.studentId !== req.params.id);
    
    db.audit_logs.unshift({
      id: "l_" + Math.random().toString(36).substr(2, 9),
      action: "Remover Aluno",
      user: "Professor Ricardo Silva",
      timestamp: new Date().toISOString(),
      details: `Aluno ${deleted[0].name} removido do sistema.`
    });
    
    writeDB(db);
    res.json({ success: true });
  } else {
    res.status(404).json({ error: "Student not found" });
  }
});

// 3. Points endpoints (real-time point update)
app.post("/api/points", (req, res) => {
  const { studentId, categoryName, points, description, type } = req.body;
  const db = readDB();
  
  const student = db.students.find((s: any) => s.id === studentId);
  if (!student) {
    return res.status(404).json({ error: "Student not found" });
  }
  
  // Adjust student's overall score
  student.points = (student.points || 0) + points;
  
  // Create Log entry
  const logEntry = {
    id: "pl_" + Math.random().toString(36).substr(2, 9),
    studentId,
    categoryName,
    points,
    description: description || "",
    timestamp: new Date().toISOString(),
    type: type || (points >= 0 ? "positive" : "negative")
  };
  
  db.point_logs.unshift(logEntry);
  
  // Audit log
  db.audit_logs.unshift({
    id: "l_" + Math.random().toString(36).substr(2, 9),
    action: "Atribuição de Pontos",
    user: "Professor Ricardo Silva",
    timestamp: new Date().toISOString(),
    details: `Atribuiu ${points} pontos para ${student.name} na categoria '${categoryName}'.`
  });

  writeDB(db);
  
  // Trigger Webhooks
  triggerWebhooks("points.add", logEntry);
  
  res.status(201).json({ success: true, logEntry, student });
});

// 4. Batch points endpoints (give points to multiple students at once!)
app.post("/api/points/batch", (req, res) => {
  const { studentIds, categoryName, points, description, type } = req.body;
  const db = readDB();
  const updatedStudents: any[] = [];
  const logEntries: any[] = [];

  studentIds.forEach((id: string) => {
    const student = db.students.find((s: any) => s.id === id);
    if (student) {
      student.points = (student.points || 0) + points;
      updatedStudents.push(student);

      const logEntry = {
        id: "pl_" + Math.random().toString(36).substr(2, 9),
        studentId: id,
        categoryName,
        points,
        description: description || "",
        timestamp: new Date().toISOString(),
        type: type || (points >= 0 ? "positive" : "negative")
      };
      db.point_logs.unshift(logEntry);
      logEntries.push(logEntry);
      
      triggerWebhooks("points.add", logEntry);
    }
  });

  db.audit_logs.unshift({
    id: "l_" + Math.random().toString(36).substr(2, 9),
    action: "Atribuição de Pontos em Grupo",
    user: "Professor Ricardo Silva",
    timestamp: new Date().toISOString(),
    details: `Atribuiu ${points} pontos para ${studentIds.length} alunos na categoria '${categoryName}'.`
  });

  writeDB(db);
  res.status(201).json({ success: true, updatedStudents, logEntries });
});

// 5. Messages Endpoints
app.get("/api/messages", (req, res) => {
  const db = readDB();
  res.json(db.messages);
});

app.post("/api/messages", (req, res) => {
  const db = readDB();
  const { senderId, senderName, receiverId, content, attachment } = req.body;
  
  const newMessage = {
    id: "m_" + Math.random().toString(36).substr(2, 9),
    senderId,
    senderName,
    receiverId,
    content,
    timestamp: new Date().toISOString(),
    attachment: attachment || undefined
  };
  
  db.messages.push(newMessage);
  
  // Trigger webhooks for messaging
  triggerWebhooks("messages.sent", newMessage);
  
  writeDB(db);
  res.status(201).json(newMessage);
});

// 6. Calendar Endpoints
app.get("/api/calendar", (req, res) => {
  const db = readDB();
  res.json(db.calendar);
});

app.post("/api/calendar", (req, res) => {
  const db = readDB();
  const newEvent = {
    id: "e_" + Math.random().toString(36).substr(2, 9),
    title: req.body.title,
    description: req.body.description || "",
    date: req.body.date,
    category: req.body.category || "event"
  };
  
  db.calendar.push(newEvent);
  
  db.audit_logs.unshift({
    id: "l_" + Math.random().toString(36).substr(2, 9),
    action: "Criar Evento de Calendário",
    user: "Professor Ricardo Silva",
    timestamp: new Date().toISOString(),
    details: `Evento '${newEvent.title}' agendado para ${newEvent.date}.`
  });

  writeDB(db);
  res.status(201).json(newEvent);
});

app.delete("/api/calendar/:id", (req, res) => {
  const db = readDB();
  const eventIndex = db.calendar.findIndex((e: any) => e.id === req.params.id);
  if (eventIndex !== -1) {
    const deleted = db.calendar.splice(eventIndex, 1);
    writeDB(db);
    res.json({ success: true, deleted: deleted[0] });
  } else {
    res.status(404).json({ error: "Event not found" });
  }
});

// 7. Webhooks Endpoints
app.get("/api/webhooks", (req, res) => {
  const db = readDB();
  res.json({ webhooks: db.webhooks || [], logs: db.webhook_trigger_logs || [] });
});

app.post("/api/webhooks", (req, res) => {
  const db = readDB();
  const newWebhook = {
    id: "w_" + Math.random().toString(36).substr(2, 9),
    url: req.body.url,
    name: req.body.name,
    events: req.body.events || ["points.add"],
    active: req.body.active ?? true
  };
  
  db.webhooks = db.webhooks || [];
  db.webhooks.push(newWebhook);
  writeDB(db);
  res.status(201).json(newWebhook);
});

app.delete("/api/webhooks/:id", (req, res) => {
  const db = readDB();
  if (db.webhooks) {
    db.webhooks = db.webhooks.filter((w: any) => w.id !== req.params.id);
    writeDB(db);
    res.json({ success: true });
  } else {
    res.status(404).json({ error: "Webhook not found" });
  }
});

// 8. Payments Endpoints (Mock Checkout Integration)
app.get("/api/payments", (req, res) => {
  const db = readDB();
  res.json(db.payments);
});

app.post("/api/payments/pay", (req, res) => {
  const { paymentId, cardName, cardNumber, expiry, cvc } = req.body;
  
  if (!cardName || !cardNumber || !expiry || !cvc) {
    return res.status(400).json({ error: "Dados do cartão incompletos" });
  }
  
  const db = readDB();
  const payment = db.payments.find((p: any) => p.id === paymentId);
  if (!payment) {
    return res.status(404).json({ error: "Pagamento não localizado" });
  }
  
  payment.status = "paid";
  
  db.audit_logs.unshift({
    id: "l_" + Math.random().toString(36).substr(2, 9),
    action: "Pagamento Concluído",
    user: cardName,
    timestamp: new Date().toISOString(),
    details: `Pagamento da taxa '${payment.title}' no valor de R$ ${payment.amount.toFixed(2)} processado com sucesso.`
  });
  
  writeDB(db);
  res.json({ success: true, payment });
});

// 9. Admin Platform Diagnostics
app.get("/api/admin/diagnostics", (req, res) => {
  const db = readDB();
  res.json({
    totalStudents: db.students.length,
    totalPointsGiven: db.point_logs.reduce((acc: number, log: any) => acc + Math.abs(log.points), 0),
    positiveRatio: db.point_logs.filter((log: any) => log.type === "positive").length / (db.point_logs.length || 1),
    activeMessages: db.messages.length,
    auditLogs: db.audit_logs || [],
    webhookLogs: db.webhook_trigger_logs || [],
    dbSizeKB: Math.round(JSON.stringify(db).length / 1024)
  });
});

// 10. Sync Offline Queue (Receives a batch of local updates and merges them)
app.post("/api/sync", (req, res) => {
  const { actionQueue } = req.body;
  if (!Array.isArray(actionQueue)) {
    return res.status(400).json({ error: "Queue of actions expected" });
  }
  
  const db = readDB();
  const results: any[] = [];
  
  actionQueue.forEach((actionItem: any) => {
    try {
      const { type, payload } = actionItem;
      if (type === "points.add") {
        const student = db.students.find((s: any) => s.id === payload.studentId);
        if (student) {
          student.points = (student.points || 0) + payload.points;
          const logEntry = {
            id: payload.id || "pl_" + Math.random().toString(36).substr(2, 9),
            studentId: payload.studentId,
            categoryName: payload.categoryName,
            points: payload.points,
            description: payload.description || "Sincronizado offline",
            timestamp: payload.timestamp || new Date().toISOString(),
            type: payload.type || (payload.points >= 0 ? "positive" : "negative")
          };
          db.point_logs.unshift(logEntry);
          triggerWebhooks("points.add", logEntry);
          results.push({ actionId: actionItem.id, status: "synced", payload: logEntry });
        }
      } else if (type === "messages.sent") {
        const newMessage = {
          id: payload.id || "m_" + Math.random().toString(36).substr(2, 9),
          senderId: payload.senderId,
          senderName: payload.senderName,
          receiverId: payload.receiverId,
          content: payload.content,
          timestamp: payload.timestamp || new Date().toISOString(),
          attachment: payload.attachment || undefined
        };
        db.messages.push(newMessage);
        triggerWebhooks("messages.sent", newMessage);
        results.push({ actionId: actionItem.id, status: "synced", payload: newMessage });
      } else if (type === "calendar.add") {
        const newEvent = {
          id: payload.id || "e_" + Math.random().toString(36).substr(2, 9),
          title: payload.title,
          description: payload.description || "",
          date: payload.date,
          category: payload.category || "event"
        };
        db.calendar.push(newEvent);
        results.push({ actionId: actionItem.id, status: "synced", payload: newEvent });
      }
    } catch (err) {
      console.error("Failed to sync queue item", actionItem, err);
      results.push({ actionId: actionItem.id, status: "error", error: String(err) });
    }
  });

  if (actionQueue.length > 0) {
    db.audit_logs.unshift({
      id: "l_" + Math.random().toString(36).substr(2, 9),
      action: "Sincronização Offline",
      user: "Vários Usuários",
      timestamp: new Date().toISOString(),
      details: `Sincronizou com sucesso ${actionQueue.length} ações salvas localmente offline.`
    });
    writeDB(db);
  }

  res.json({ success: true, results, currentDB: db });
});

// 11. AI Classroom Assistant (Gemini)
app.post("/api/ai/chat", async (req, res) => {
  const { prompt, context } = req.body;
  const ai = getAI();
  if (!ai) {
    return res.json({
      text: "🤖 Olá! Estou no modo de demonstração. Configure a chave `GEMINI_API_KEY` na barra de segredos do AI Studio para habilitar minhas habilidades pedagógicas completas baseadas em IA!"
    });
  }

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: `Você é o EduAI, um assistente pedagógico virtual especializado em comportamento escolar, psicologia infantil e comunicação com os pais (estilo ClassDojo).
Sua missão é dar dicas construtivas para professores sobre como motivar alunos ou acalmar indisciplinas, e sugerir mensagens acolhedoras e profissionais para enviar aos pais.

Contexto da turma atual para referência:
${JSON.stringify(context || {})}

Mensagem do usuário:
${prompt}

Responda em português (ou no idioma da mensagem), de forma clara, acolhedora, amigável e profissional. Use markdown para formatação.`,
    });

    res.json({ text: response.text });
  } catch (error: any) {
    console.error("Gemini AI API Error:", error);
    res.json({
      text: "⚠️ Ocorreu um erro ao comunicar com a inteligência do Gemini. Mas aqui vai uma dica de ouro: mantenha o reforço positivo com seus alunos sempre que possível!",
    });
  }
});

// 12. AI Report Writer (writes custom behavioral reports with suggestions)
app.post("/api/ai/report", async (req, res) => {
  const { student, logs } = req.body;
  const ai = getAI();
  if (!ai) {
    return res.json({
      text: `### Relatório Comportamental Semanal (Rascunho de Demonstração)
**Aluno:** ${student.name}
**Total de Pontos:** ${student.points} pontos

**Histórico de Comportamento:**
${logs.map((l: any) => `- [${l.type === "positive" ? "V" : "X"}] ${l.categoryName}: ${l.description}`).join("\n")}

**Dica Pedagógica Geral:** Estimule sempre os pontos positivos do aluno para reverter comportamentos difíceis. Para habilitar o rascunho inteligente e insights preditivos personalizados gerados pela IA do Gemini, ative a chave \`GEMINI_API_KEY\` no menu Secrets.`
    });
  }

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: `Gere um relatório comportamental escolar semanal extremamente detalhado e pedagógico para o seguinte aluno, incluindo uma mensagem formatada que o professor possa enviar aos pais via chat privado.

Aluno: ${student.name}
Total de Pontos: ${student.points}
Logs Comportamentais recentes:
${JSON.stringify(logs)}

Estruture o relatório com:
1. **Análise de Comportamento**: Avaliação dos pontos positivos e negativos mostrados nos logs.
2. **Plano de Ação Pedagógico**: 2 ou 3 passos práticos para o professor aplicar em sala de aula para ajudar o aluno a progredir ou celebrar seu sucesso.
3. **Sugestão de Mensagem para os Pais**: Um rascunho de mensagem privado em tom empático, profissional e colaborativo, focado no desenvolvimento conjunto do estudante.

Responda em português, com um tom altamente construtivo e motivador. Use markdown.`,
    });

    res.json({ text: response.text });
  } catch (error: any) {
    console.error("Gemini Report Generation Error:", error);
    res.json({
      text: "⚠️ Não foi possível obter o rascunho da IA do Gemini. Por favor, tente novamente mais tarde."
    });
  }
});

// Vite Setup for Development vs Production
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`EduClass Dojo Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
