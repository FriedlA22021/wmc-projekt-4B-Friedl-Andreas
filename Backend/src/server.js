import express from 'express';
import cors from 'cors';
import seedData from './seedData.js';
const app = express();
app.use(express.json());
app.use(cors());
const PORT = 3000;

/*
1. Live-Cockpit
  - GET /api/live/cockpit
  - GET /api/live/trupps
  - POST /api/live/trupps
  - PUT /api/live/trupps/:id/druck
  - DELETE /api/live/trupps/:id
  - GET /api/live/warnungen

2. Personal
  - GET /api/personal
  - POST /api/personal
  - GET /api/personal/:id
  - PUT /api/personal/:id
  - DELETE /api/personal/:id

3. Geräte-Management
  - GET /api/gerate
  - POST /api/gerate
  - PUT /api/gerate/:id
  - DELETE /api/gerate/:id

4. Admin-Zentrale
  - GET /api/admin/stats
  - GET /api/admin/einsatzstunden-chart
  - GET /api/admin/letzte-einsatze
  - PUT /api/admin/einstellungen
*/

let personnel = [...seedData.personnel];
let equipment = [...seedData.equipment];
let incidents = [...seedData.incidents];
let teams = [...seedData.teams];
let pressureLogs = [...seedData.pressureLogs];
let alerts = [...seedData.alerts];
let settings = { ...seedData.settings };

//1. Live-Cockpit
app.get('/api/live/cockpit', (req, res) => {
  const activeTeamsCount = teams.filter(t => t.status === 'active' || t.status === 'warning').length;
  const criticalAlertsCount = alerts.filter(a => a.type === 'warning' && !a.acknowledged).length;

  res.json({
    activeTeams: activeTeamsCount,
    warningsCount: criticalAlertsCount,
    currentIncident: incidents.find(i => i.status === 'active') || null
  });
});

app.get('/api/live/trupps', (req, res) => {
  const activeTeams = teams.filter(t => t.status !== 'ended');
  res.json(activeTeams);
});

app.post('/api/live/trupps', (req, res) => {
  const { name, memberIds, equipmentIds, startPressure } = req.body;

  if (!memberIds || memberIds.length !== 3) {
    return res.status(400).json({ error: "Ein Trupp muss genau aus 3 Atemschutzträgern bestehen." });
  }

  const newTeam = {
    id: teams.length > 0 ? Math.max(...teams.map(t => t.id)) + 1 : 1,
    incidentId: incidents.find(i => i.status === 'active')?.id || 1,
    name: name || `Trupp ${teams.length + 1}`,
    status: 'active',
    memberIds: memberIds,
    equipmentIds: equipmentIds || [],
    startPressure: startPressure || settings.defaultStartPressure,
    currentPressure: startPressure || settings.defaultStartPressure,
    reservePressure: settings.defaultReservePressure,
    startedAt: new Date().toISOString(),
    endedAt: null
  };

  teams.push(newTeam);
  res.status(201).json(newTeam);
});

app.put('/api/live/trupps/:id/druck', (req, res) => {
  const teamId = parseInt(req.params.id);
  const { pressure } = req.body;

  if (pressure === undefined) {
    return res.status(400).json({ error: "Druck-Wert 'pressure' fehlt im Body." });
  }

  const team = teams.find(t => t.id === teamId);
  if (!team) {
    return res.status(404).json({ error: "Trupp nicht gefunden." });
  }

  team.currentPressure = pressure;

  if (pressure <= team.reservePressure) {
    team.status = 'warning';
  }

  const newLog = {
    id: pressureLogs.length > 0 ? Math.max(...pressureLogs.map(p => p.id)) + 1 : 1,
    teamId: teamId,
    pressure: pressure,
    recordedAt: new Date().toISOString()
  };
  pressureLogs.push(newLog);

  res.json(team);
});

app.delete('/api/live/trupps/:id', (req, res) => {
  const teamId = parseInt(req.params.id);
  const team = teams.find(t => t.id === teamId);

  if (!team) {
    return res.status(404).json({ error: "Trupp nicht gefunden." });
  }

  team.status = 'ended';
  team.endedAt = new Date().toISOString();

  res.json({ message: `Einsatz für ${team.name} erfolgreich beendet.`, team });
});

app.get('/api/live/warnungen', (req, res) => {
  res.json(alerts);
});


// 2. Personal & Tauglichkeit
app.get('/api/personal', (req, res) => {
  res.json(personnel);
});

app.post('/api/personal', (req, res) => {
  const { name, role, radioName, g26ValidUntil } = req.body;

  if (!name) {
    return res.status(400).json({ error: "Name ist ein Pflichtfeld." });
  }

  const newPerson = {
    id: personnel.length > 0 ? Math.max(...personnel.map(p => p.id)) + 1 : 1,
    name,
    role: role || 'Truppmann',
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


// 3. Geräte-Management
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


// 4. Admin-Zentrale
app.get('/api/admin/stats', (req, res) => {
  res.json({
    totalHours: 248,
    totalEquipment: equipment.length,
    totalPersonnel: personnel.length
  });
});

app.get('/api/admin/einsatzstunden-chart', (req, res) => {
  res.json([
    { month: 'Jan', hours: 18 },
    { month: 'Feb', hours: 44 },
    { month: 'Mär', hours: 22 },
    { month: 'Apr', hours: 35 },
    { month: 'Mai', hours: 25 }
  ]);
});

app.get('/api/admin/letzte-einsatze', (req, res) => {
  res.json(incidents);
});

app.put('/api/admin/einstellungen', (req, res) => {
  settings = { ...settings, ...req.body };
  res.json({ message: "Einstellungen erfolgreich gespeichert.", settings });
});


app.listen(PORT, () => {
  console.log(`Server laeuft auf http://localhost:${PORT}`);
});