import express from 'express';
import cors from 'cors';
import http from 'http'; // Neu: Wird für WebSockets benötigt
import { WebSocketServer } from 'ws'; // Neu: Das ws-Paket
import seedData from './seedData.js';

const app = express();
app.use(express.json());
app.use(cors());
const PORT = 3000;

// Erstelle einen HTTP-Server aus der Express-App
const server = http.createServer(app);

// Erstelle den WebSocket-Server auf dem Pfad '/live'
const wss = new WebSocketServer({ noServer: true });

// Variablen aus den Seed-Daten laden mit Sicherheits-Fallbacks
let personnel = seedData.personnel ? [...seedData.personnel] : [];
let equipment = seedData.equipment ? [...seedData.equipment] : [];

// Sicherheits-Fallback für die in seedData fehlenden Arrays (verhindert den "not iterable" Fehler):
let incidents = seedData.incidents ? [...seedData.incidents] : [];
let pressureLogs = seedData.pressureLogs ? [...seedData.pressureLogs] : [];
let alerts = seedData.alerts ? [...seedData.alerts] : [];
let settings = seedData.settings ? { ...seedData.settings } : {
  stationName: "Hauptwache",
  maxMissionDurationMin: 30,
  warningPressureBar: 60
};

// Spezial-Mapping für die Teams, damit die IDs einheitlich sind:
let teams = seedData.teams ? seedData.teams.map(t => {
  // Falls im Seed-Team 'memberIds' statt 'members' steht, mappen wir das für dein Frontend zu Klarnamen
  const idsToMap = t.memberIds || t.members || [];
  const memberNames = idsToMap.map(id => {
    const person = personnel.find(p => p.id === id);
    return person ? person.name : `Unbekannt (${id})`;
  });

  return {
    id: parseInt(t.id),
    name: t.name,
    members: memberNames, // Dein Svelte-Frontend bekommt so saubere Strings geliefert
    startPressure: parseInt(t.startPressure) || 300,
    currentPressure: parseInt(t.currentPressure) || 300,
    startTime: t.startedAt ? Date.parse(t.startedAt) : Date.now(),
    lastCheckTime: Date.now(),
    status: t.status || 'active'
  };
}) : [];
// --- WEBSOCKET LOGIK ---
const clients = new Set();

wss.on('connection', (ws) => {
  clients.add(ws);
  console.log(`Client verbunden. Aktive Verbindungen: ${clients.size}`);

  // Sende dem neu verbundenen Client sofort die aktuellen Trupps
  const activeTeams = teams.filter(t => t.status !== 'ended');
  ws.send(JSON.stringify(activeTeams));

  ws.on('close', () => {
    clients.delete(ws);
    console.log(`Client getrennt. Aktive Verbindungen: ${clients.size}`);
  });
});

// Hilfsfunktion: Schickt die aktuellen Trupps an ALLE angemeldeten Frontends
function broadcastTeams() {
  const activeTeams = teams.filter(t => t.status !== 'ended');
  const data = JSON.stringify(activeTeams);

  for (const client of clients) {
    if (client.readyState === 1) { // 1 = OPEN
      client.send(data);
    }
  }
}

server.on('upgrade', (request, socket, head) => {
  const pathname = new URL(request.url, `http://${request.headers.host}`).pathname;

  if (pathname === '/live') {
    wss.handleUpgrade(request, socket, head, (ws) => {
      wss.emit('connection', ws, request);
    });
  } else {
    socket.destroy();
  }
});


// --- 1. Live-Cockpit Routen ---

app.get('/api/live/trupps', (req, res) => {
  const activeTeams = teams.filter(t => t.status !== 'ended');
  res.json(activeTeams);
});

app.post('/api/live/trupps', (req, res) => {
  const { name, members, startPressure } = req.body;

  if (!members || members.length < 2) {
    return res.status(400).json({ error: "Ein Trupp muss aus mindestens 2 Personen bestehen." });
  }

  const memberNames = members.map(id => {
    const person = personnel.find(p => p.id === id);
    return person ? person.name : `Unbekannt (${id})`;
  });

  const newTrupp = {
    id: teams.length > 0 ? Math.max(...teams.map(t => parseInt(t.id))) + 1 : 1,
    name: name || `Trupp ${teams.length + 1}`,
    members: memberNames,
    startPressure: parseInt(startPressure) || 300,
    currentPressure: parseInt(startPressure) || 300,
    startTime: Date.now(),
    lastCheckTime: Date.now(),
    status: 'active'
  };

  teams.push(newTrupp);

  broadcastTeams();

  res.status(201).json(newTrupp);
});

app.put('/api/live/trupps/:id/druck', (req, res) => {
  const teamId = parseInt(req.params.id);
  const { currentPressure } = req.body;
  const trupp = teams.find(t => parseInt(t.id) === teamId);

  if (!trupp) return res.status(404).json({ error: "Trupp nicht gefunden." });

  trupp.currentPressure = parseInt(currentPressure);
  trupp.lastCheckTime = Date.now();
  trupp.status = trupp.currentPressure < 100 ? 'warning' : 'active';

  broadcastTeams();

  res.json(trupp);
});

app.delete('/api/live/trupps/:id', (req, res) => {
  const teamId = parseInt(req.params.id);
  const index = teams.findIndex(t => parseInt(t.id) === teamId);

  if (index === -1) {
    return res.status(404).json({ error: "Trupp nicht gefunden." });
  }

  teams.splice(index, 1);

  broadcastTeams();

  res.json({ message: `Trupp erfolgreich gelöscht.`, id: teamId });
});

app.post('/api/live/warnungen', (req, res) => {
  const { teamId, message, type } = req.body;

  const newAlert = {
    id: alerts.length > 0 ? Math.max(...alerts.map(a => a.id)) + 1 : 1,
    teamId: teamId,
    message: message || "Druck überprüfen!",
    type: type || "warning",
    timestamp: new Date().toISOString(),
    acknowledged: false
  };

  alerts.push(newAlert);
  res.status(201).json(newAlert);
});


// --- 2. Personal & Tauglichkeit ---
app.get('/api/personal', (req, res) => {
  res.json(personnel);
});

app.post('/api/personal', (req, res) => {
  const { name, radioName, g26ValidUntil } = req.body;

  if (!name) {
    return res.status(400).json({ error: "Name ist ein Pflichtfeld." });
  }

  const newPerson = {
    id: personnel.length > 0 ? Math.max(...personnel.map(p => p.id)) + 1 : 1,
    name,
    radioName: radioName || '',
    g26ValidUntil: g26ValidUntil || '',
    lastExerciseAt: null,
    exerciseCount: 0,
    active: true
  };

  personnel.push(newPerson);
  res.status(201).json(newPerson);
});

app.get('/api/personal/:id', (req, res) => {
  const person = personnel.find(p => p.id === parseInt(req.params.id));
  if (!person) return res.status(404).json({ error: "Person nicht gefunden." });
  res.json(person);
});

app.put('/api/personal/:id', (req, res) => {
  const personId = parseInt(req.params.id);
  const index = personnel.findIndex(p => p.id === personId);

  if (index === -1) return res.status(404).json({ error: "Person nicht gefunden." });

  personnel[index] = { ...personnel[index], ...req.body, id: personId };
  res.json(personnel[index]);
});

app.delete('/api/personal/:id', (req, res) => {
  const personId = parseInt(req.params.id);
  const exists = personnel.some(p => p.id === personId);

  if (!exists) return res.status(404).json({ error: "Person nicht gefunden." });

  personnel = personnel.filter(p => p.id !== personId);
  res.json({ message: "Person erfolgreich gelöscht." });
});


// --- 3. Geräte-Management ---
app.get('/api/gerate', (req, res) => {
  res.json(equipment);
});

app.post('/api/gerate', (req, res) => {
  const { inventoryNumber, category, type, pressure, status } = req.body;

  if (!inventoryNumber || !category) {
    return res.status(400).json({ error: "Inventarnummer und Kategorie werden benötigt." });
  }

  const newEquipment = {
    id: equipment.length > 0 ? Math.max(...equipment.map(e => e.id)) + 1 : 1,
    inventoryNumber,
    category,
    type: type || '',
    pressure: pressure || null,
    status: status || 'ready',
    lastCheck: new Date().toISOString().split('T')[0],
    nextCheck: '',
    assignedPersonId: null
  };

  equipment.push(newEquipment);
  res.status(201).json(newEquipment);
});

app.put('/api/gerate/:id', (req, res) => {
  const itemId = parseInt(req.params.id);
  const index = equipment.findIndex(e => e.id === itemId);

  if (index === -1) return res.status(404).json({ error: "Gerät nicht gefunden." });

  equipment[index] = { ...equipment[index], ...req.body, id: itemId };
  res.json(equipment[index]);
});

app.delete('/api/gerate/:id', (req, res) => {
  const itemId = parseInt(req.params.id);
  const exists = equipment.some(e => e.id === itemId);

  if (!exists) return res.status(404).json({ error: "Gerät nicht gefunden." });

  equipment = equipment.filter(e => e.id !== itemId);
  res.json({ message: "Gerät erfolgreich aus Inventar entfernt." });
});

server.listen(PORT, () => {
  console.log(`Server läuft auf http://localhost:${PORT}`);
  console.log(`WebSocket-Server bereit unter ws://localhost:${PORT}/live`);
});