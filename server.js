const express = require('express');
const cors = require('cors');
const lgtv = require('lgtv2');
const path = require('path');

const app = express();

// Configuration via variables d'environnement
const config = {
  PORT: process.env.PORT || 3001,
  TV_IP: process.env.TV_IP || '192.168.1.100',
  TV_PORT: process.env.TV_PORT || 3000,
  TV_TIMEOUT: parseInt(process.env.TV_TIMEOUT) || 5000,
  TV_RECONNECT: parseInt(process.env.TV_RECONNECT) || 3000,
  MESSAGE_DURATION: parseInt(process.env.MESSAGE_DURATION) || 3000,
  SHUTDOWN_DELAY_1: parseInt(process.env.SHUTDOWN_DELAY_1) || 0,
  SHUTDOWN_DELAY_2: parseInt(process.env.SHUTDOWN_DELAY_2) || 60000,
  SHUTDOWN_DELAY_3: parseInt(process.env.SHUTDOWN_DELAY_3) || 120000,
  SHUTDOWN_DELAY_FINAL: parseInt(process.env.SHUTDOWN_DELAY_FINAL) || 125000,
  SHUTDOWN_TEST_DELAY_1: parseInt(process.env.SHUTDOWN_TEST_DELAY_1) || 0,
  SHUTDOWN_TEST_DELAY_2: parseInt(process.env.SHUTDOWN_TEST_DELAY_2) || 10000,
  SHUTDOWN_TEST_DELAY_3: parseInt(process.env.SHUTDOWN_TEST_DELAY_3) || 20000,
  SHUTDOWN_TEST_DELAY_FINAL: parseInt(process.env.SHUTDOWN_TEST_DELAY_FINAL) || 30000,
  HOST: process.env.HOST || '0.0.0.0'
};

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// État de la connexion TV
let tvConnection = null;
let isConnected = false;

// Connexion à la TV
function connectToTV() {
  console.log(`Tentative de connexion à la TV: ${config.TV_IP}:${config.TV_PORT}`);
  
  const tv = lgtv({
    url: `ws://${config.TV_IP}:${config.TV_PORT}`,
    timeout: config.TV_TIMEOUT,
    reconnect: config.TV_RECONNECT
  });

  tv.on('connect', () => {
    console.log('✅ Connecté à la TV LG');
    tvConnection = tv;
    isConnected = true;
  });

  tv.on('close', () => {
    console.log('❌ Connexion TV fermée');
    isConnected = false;
    tvConnection = null;
  });

  tv.on('error', (err) => {
    console.error('❌ Erreur TV:', err.message);
    isConnected = false;
    tvConnection = null;
  });

  return tv;
}

// Fonction utilitaire pour envoyer des commandes
function sendCommand(command, payload = {}) {
  return new Promise((resolve, reject) => {
    if (!tvConnection || !isConnected) {
      reject(new Error('TV non connectée'));
      return;
    }

    tvConnection.request(command, payload, (err, res) => {
      if (err) {
        reject(err);
      } else {
        resolve(res);
      }
    });
  });
}

// Routes API

// Status de la connexion
app.get('/api/status', (req, res) => {
  res.json({
    connected: isConnected,
    tv_ip: config.TV_IP,
    tv_port: config.TV_PORT,
    timestamp: new Date().toISOString()
  });
});

// Connexion/Reconnexion
app.post('/api/connect', (req, res) => {
  try {
    connectToTV();
    res.json({ message: 'Tentative de connexion initiée' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Contrôle du volume
app.post('/api/volume', async (req, res) => {
  try {
    const { action, level } = req.body;
    
    if (action === 'up') {
      await sendCommand('ssap://audio/volumeUp');
    } else if (action === 'down') {
      await sendCommand('ssap://audio/volumeDown');
    } else if (action === 'set' && level !== undefined) {
      await sendCommand('ssap://audio/setVolume', { volume: level });
    } else if (action === 'mute') {
      await sendCommand('ssap://audio/setMute', { mute: true });
    } else if (action === 'unmute') {
      await sendCommand('ssap://audio/setMute', { mute: false });
    }
    
    res.json({ success: true, action, level });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Contrôle des chaînes
app.post('/api/channel', async (req, res) => {
  try {
    const { action, number } = req.body;
    
    if (action === 'up') {
      await sendCommand('ssap://tv/channelUp');
    } else if (action === 'down') {
      await sendCommand('ssap://tv/channelDown');
    } else if (action === 'set' && number !== undefined) {
      await sendCommand('ssap://tv/openChannel', { channelNumber: number });
    }
    
    res.json({ success: true, action, number });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Contrôle de l'alimentation
app.post('/api/power', async (req, res) => {
  try {
    const { action } = req.body;
    
    if (action === 'off') {
      await sendCommand('ssap://system/turnOff');
    }
    // Note: Power on nécessite Wake-on-LAN
    
    res.json({ success: true, action });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Navigation (télécommande)
app.post('/api/navigate', async (req, res) => {
  try {
    const { direction } = req.body;
    const commands = {
      'up': 'ssap://com.webos.service.ime/sendKeyEvent',
      'down': 'ssap://com.webos.service.ime/sendKeyEvent',
      'left': 'ssap://com.webos.service.ime/sendKeyEvent',
      'right': 'ssap://com.webos.service.ime/sendKeyEvent',
      'ok': 'ssap://com.webos.service.ime/sendKeyEvent',
      'back': 'ssap://com.webos.service.ime/sendKeyEvent',
      'home': 'ssap://system/launcher'
    };
    
    if (direction === 'home') {
      await sendCommand('ssap://system/launcher');
    } else {
      await sendCommand('ssap://com.webos.service.ime/sendKeyEvent', {
        keyCode: direction.toUpperCase()
      });
    }
    
    res.json({ success: true, direction });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Lancement d'applications
app.post('/api/app', async (req, res) => {
  try {
    const { appId } = req.body;
    
    // Apps populaires
    const apps = {
      'netflix': 'netflix',
      'youtube': 'youtube.leanback.v4',
      'prime': 'amazon',
      'disney': 'com.disney.disneyplus-prod',
      'spotify': 'spotify-beehive',
      'browser': 'com.webos.app.browser'
    };
    
    const targetApp = apps[appId] || appId;
    await sendCommand('ssap://system.launcher/launch', { id: targetApp });
    
    res.json({ success: true, appId: targetApp });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Changement d'input
app.post('/api/input', async (req, res) => {
  try {
    const { inputId } = req.body;
    await sendCommand('ssap://tv/switchInput', { inputId });
    
    res.json({ success: true, inputId });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Affichage de messages (toast)
app.post('/api/message', async (req, res) => {
  try {
    const { message, duration = config.MESSAGE_DURATION } = req.body;
    
    await sendCommand('ssap://system.notifications/createToast', {
      message,
      duration
    });
    
    res.json({ success: true, message, duration });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Actions combinées (message + mute)
app.post('/api/message-mute', async (req, res) => {
  try {
    const { message, duration = config.MESSAGE_DURATION, muteAction = 'mute' } = req.body;
    
    // Tableau pour stocker les résultats
    const results = [];
    
    // 1. Mute/unmute d'abord
    try {
      await sendCommand('ssap://audio/setMute', { mute: muteAction === 'mute' });
      results.push({ action: 'mute', success: true, value: muteAction });
    } catch (muteError) {
      results.push({ action: 'mute', success: false, error: muteError.message });
    }
    
    // 2. Afficher le message (avec un léger délai pour s'assurer que le mute est pris en compte)
    setTimeout(async () => {
      try {
        await sendCommand('ssap://system.notifications/createToast', {
          message,
          duration
        });
        results.push({ action: 'message', success: true, message, duration });
      } catch (messageError) {
        results.push({ action: 'message', success: false, error: messageError.message });
      }
    }, 100);
    
    res.json({ 
      success: true, 
      message, 
      duration, 
      muteAction,
      results: results.length > 0 ? results : 'Actions en cours...'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Actions combinées génériques
app.post('/api/combo', async (req, res) => {
  try {
    const { actions } = req.body;
    
    if (!Array.isArray(actions) || actions.length === 0) {
      return res.status(400).json({ error: 'Le paramètre actions doit être un tableau non vide' });
    }
    
    const results = [];
    
    // Exécuter chaque action avec un délai entre elles
    for (let i = 0; i < actions.length; i++) {
      const action = actions[i];
      
      try {
        let result;
        
        switch (action.type) {
          case 'volume':
            if (action.data.action === 'mute') {
              result = await sendCommand('ssap://audio/setMute', { mute: true });
            } else if (action.data.action === 'unmute') {
              result = await sendCommand('ssap://audio/setMute', { mute: false });
            } else if (action.data.action === 'set') {
              result = await sendCommand('ssap://audio/setVolume', { volume: action.data.level });
            }
            break;
            
          case 'message':
            result = await sendCommand('ssap://system.notifications/createToast', {
              message: action.data.message,
              duration: action.data.duration || config.MESSAGE_DURATION
            });
            break;
            
          case 'app':
            const apps = {
              'netflix': 'netflix',
              'youtube': 'youtube.leanback.v4',
              'prime': 'amazon',
              'disney': 'com.disney.disneyplus-prod',
              'spotify': 'spotify-beehive',
              'browser': 'com.webos.app.browser'
            };
            const appId = apps[action.data.appId] || action.data.appId;
            result = await sendCommand('ssap://system.launcher/launch', { id: appId });
            break;
            
          case 'channel':
            if (action.data.action === 'set') {
              result = await sendCommand('ssap://tv/openChannel', { channelNumber: action.data.number });
            }
            break;
            
          default:
            throw new Error(`Type d'action non supporté: ${action.type}`);
        }
        
        results.push({ 
          action: action.type, 
          success: true, 
          data: action.data,
          result 
        });
        
      } catch (actionError) {
        results.push({ 
          action: action.type, 
          success: false, 
          data: action.data,
          error: actionError.message 
        });
      }
      
      // Délai entre les actions (sauf pour la dernière)
      if (i < actions.length - 1) {
        await new Promise(resolve => setTimeout(resolve, action.delay || 200));
      }
    }
    
    res.json({ 
      success: true, 
      totalActions: actions.length,
      results
    });
    
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Liste des applications installées
app.get('/api/apps', async (req, res) => {
  try {
    const result = await sendCommand('ssap://com.webos.applicationManager/listApps');
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Liste des inputs
app.get('/api/inputs', async (req, res) => {
  try {
    const result = await sendCommand('ssap://tv/getExternalInputList');
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Informations système
app.get('/api/system', async (req, res) => {
  try {
    const result = await sendCommand('ssap://system/getSystemInfo');
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Séquence d'arrêt automatique
app.post('/api/shutdown-sequence', async (req, res) => {
  try {
    const { customMessages = false } = req.body;
    
    // Messages par défaut ou personnalisés
    const messages = customMessages ? [
      { message: customMessages.first || "Le téléviseur s'arrêtera dans 2 minutes", delay: config.SHUTDOWN_DELAY_1 },
      { message: customMessages.second || "Le téléviseur s'arrêtera dans 1 minute", delay: config.SHUTDOWN_DELAY_2 },
      { message: customMessages.third || "Bonne nuit 😴", delay: config.SHUTDOWN_DELAY_3 }
    ] : [
      { message: "Le téléviseur s'arrêtera dans 2 minutes", delay: config.SHUTDOWN_DELAY_1 },
      { message: "Le téléviseur s'arrêtera dans 1 minute", delay: config.SHUTDOWN_DELAY_2 },
      { message: "Bonne nuit 😴", delay: config.SHUTDOWN_DELAY_3 }
    ];
    
    console.log('🌙 Séquence d\'arrêt démarrée');
    
    // Programmer les messages
    messages.forEach((msg, index) => {
      setTimeout(async () => {
        try {
          await sendCommand('ssap://system.notifications/createToast', {
            message: msg.message,
            duration: 8000
          });
          console.log(`📢 Message ${index + 1}/3 envoyé: ${msg.message}`);
        } catch (error) {
          console.error(`❌ Erreur message ${index + 1}:`, error.message);
        }
      }, msg.delay);
    });
    
    // Programmer l'arrêt de la TV
    setTimeout(async () => {
      try {
        await sendCommand('ssap://system/turnOff');
        console.log('📺 TV éteinte automatiquement');
      } catch (error) {
        console.error('❌ Erreur arrêt TV:', error.message);
      }
    }, config.SHUTDOWN_DELAY_FINAL);
    
    res.json({ 
      success: true, 
      message: 'Séquence d\'arrêt programmée',
      schedule: [
        { time: `${config.SHUTDOWN_DELAY_1/1000}s`, action: 'Message: Le téléviseur s\'arrêtera dans 2 minutes' },
        { time: `${config.SHUTDOWN_DELAY_2/1000}s`, action: 'Message: Le téléviseur s\'arrêtera dans 1 minute' },
        { time: `${config.SHUTDOWN_DELAY_3/1000}s`, action: 'Message: Bonne nuit 😴' },
        { time: `${config.SHUTDOWN_DELAY_FINAL/1000}s`, action: 'Arrêt de la TV' }
      ]
    });
    
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Séquence d'arrêt rapide (délais réduits pour test)
app.post('/api/shutdown-sequence-fast', async (req, res) => {
  try {
    console.log('⚡ Séquence d\'arrêt rapide démarrée');
    
    const messages = [
      { message: "Test: TV s'arrêtera dans 20 secondes", delay: config.SHUTDOWN_TEST_DELAY_1 },
      { message: "Test: TV s'arrêtera dans 10 secondes", delay: config.SHUTDOWN_TEST_DELAY_2 },
      { message: "Test: Bonne nuit 😴", delay: config.SHUTDOWN_TEST_DELAY_3 }
    ];
    
    // Programmer les messages
    messages.forEach((msg, index) => {
      setTimeout(async () => {
        try {
          await sendCommand('ssap://system.notifications/createToast', {
            message: msg.message,
            duration: 5000
          });
          console.log(`📢 Message test ${index + 1}/3: ${msg.message}`);
        } catch (error) {
          console.error(`❌ Erreur message test ${index + 1}:`, error.message);
        }
      }, msg.delay);
    });
    
    // Programmer l'arrêt de la TV
    setTimeout(async () => {
      try {
        await sendCommand('ssap://system/turnOff');
        console.log('📺 TV éteinte automatiquement (test)');
      } catch (error) {
        console.error('❌ Erreur arrêt TV (test):', error.message);
      }
    }, config.SHUTDOWN_TEST_DELAY_FINAL);
    
    res.json({ 
      success: true, 
      message: 'Séquence d\'arrêt rapide programmée (test)',
      schedule: [
        { time: `${config.SHUTDOWN_TEST_DELAY_1/1000}s`, action: 'Message: Test arrêt dans 20s' },
        { time: `${config.SHUTDOWN_TEST_DELAY_2/1000}s`, action: 'Message: Test arrêt dans 10s' },
        { time: `${config.SHUTDOWN_TEST_DELAY_3/1000}s`, action: 'Message: Bonne nuit 😴' },
        { time: `${config.SHUTDOWN_TEST_DELAY_FINAL/1000}s`, action: 'Arrêt de la TV' }
      ]
    });
    
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Annuler la séquence d'arrêt (note: les timeouts sont déjà programmés, cette fonction est informative)
app.post('/api/cancel-shutdown', async (req, res) => {
  try {
    // Envoyer un message d'annulation
    await sendCommand('ssap://system.notifications/createToast', {
      message: '✅ Séquence d\'arrêt annulée',
      duration: 5000
    });
    
    res.json({ 
      success: true, 
      message: 'Message d\'annulation envoyé',
      note: 'Les timeouts déjà programmés ne peuvent pas être annulés. Redémarrez le serveur si nécessaire.'
    });
    
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Route pour servir l'interface web
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Démarrage du serveur
app.listen(config.PORT, config.HOST, () => {
  console.log(`🚀 Serveur démarré sur http://localhost:${config.PORT}`);
  console.log(`🌐 Accessible depuis le réseau sur http://[votre-ip]:${config.PORT}`);
  console.log(`📺 IP TV configurée: ${config.TV_IP}:${config.TV_PORT}`);
  console.log('🔧 Configuration via variables d\'environnement:');
  console.log(`   TV_IP=${config.TV_IP}`);
  console.log(`   TV_PORT=${config.TV_PORT}`);
  console.log(`   PORT=${config.PORT}`);
  console.log(`   HOST=${config.HOST}`);
  
  // Connexion automatique au démarrage
  setTimeout(() => {
    connectToTV();
  }, 1000);
});

// Gestion propre de l'arrêt
process.on('SIGINT', () => {
  console.log('\n👋 Arrêt du serveur...');
  if (tvConnection) {
    tvConnection.disconnect();
  }
  process.exit(0);
});