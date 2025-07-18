// Configuration
const API_BASE = window.location.origin;
let isConnected = false;

// Éléments DOM
const statusIndicator = document.getElementById('status-indicator');
const statusText = document.getElementById('status-text');
const connectBtn = document.getElementById('connect-btn');

// Fonction utilitaire pour les requêtes API
async function apiRequest(endpoint, method = 'GET', data = null) {
    const options = {
        method,
        headers: {
            'Content-Type': 'application/json',
        },
    };

    if (data) {
        options.body = JSON.stringify(data);
    }

    try {
        const response = await fetch(`${API_BASE}/api${endpoint}`, options);
        const result = await response.json();
        
        if (!response.ok) {
            throw new Error(result.error || 'Erreur API');
        }
        
        return result;
    } catch (error) {
        console.error('Erreur API:', error);
        showNotification(`Erreur: ${error.message}`, 'error');
        throw error;
    }
}

// Système de notifications
function showNotification(message, type = 'info') {
    // Supprimer les anciennes notifications
    const existingNotification = document.querySelector('.notification');
    if (existingNotification) {
        existingNotification.remove();
    }

    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 25px;
        border-radius: 8px;
        color: white;
        font-weight: 600;
        z-index: 1000;
        animation: slideIn 0.3s ease;
        max-width: 300px;
    `;

    switch (type) {
        case 'success':
            notification.style.background = 'linear-gradient(135deg, #00d2d3 0%, #00a8cc 100%)';
            break;
        case 'error':
            notification.style.background = 'linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%)';
            break;
        default:
            notification.style.background = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
    }

    document.body.appendChild(notification);

    // Supprimer automatiquement après 3 secondes
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// Vérification du statut de connexion
async function checkStatus() {
    try {
        const status = await apiRequest('/status');
        updateConnectionStatus(status.connected);
    } catch (error) {
        updateConnectionStatus(false);
    }
}

// Mise à jour du statut de connexion
function updateConnectionStatus(connected) {
    isConnected = connected;
    
    if (connected) {
        statusIndicator.className = 'status-dot online';
        statusText.textContent = 'Connecté';
        connectBtn.textContent = 'Connecté';
        connectBtn.disabled = true;
    } else {
        statusIndicator.className = 'status-dot offline';
        statusText.textContent = 'Hors ligne';
        connectBtn.textContent = 'Se connecter';
        connectBtn.disabled = false;
    }
}

// Fonction pour ajouter l'état de loading
function setButtonLoading(button, loading) {
    if (loading) {
        button.classList.add('loading');
        button.disabled = true;
    } else {
        button.classList.remove('loading');
        button.disabled = false;
    }
}

// Gestionnaires d'événements

// Connexion
connectBtn.addEventListener('click', async () => {
    setButtonLoading(connectBtn, true);
    try {
        await apiRequest('/connect', 'POST');
        showNotification('Connexion en cours...', 'info');
        setTimeout(checkStatus, 2000);
    } catch (error) {
        showNotification('Erreur de connexion', 'error');
    } finally {
        setButtonLoading(connectBtn, false);
    }
});

// Contrôles d'alimentation
document.getElementById('power-off').addEventListener('click', async () => {
    const btn = document.getElementById('power-off');
    setButtonLoading(btn, true);
    try {
        await apiRequest('/power', 'POST', { action: 'off' });
        showNotification('TV éteinte', 'success');
    } catch (error) {
        showNotification('Erreur lors de l\'extinction', 'error');
    } finally {
        setButtonLoading(btn, false);
    }
});

// Contrôles de volume
document.getElementById('volume-up').addEventListener('click', async () => {
    try {
        await apiRequest('/volume', 'POST', { action: 'up' });
        showNotification('Volume augmenté', 'success');
    } catch (error) {
        showNotification('Erreur volume', 'error');
    }
});

document.getElementById('volume-down').addEventListener('click', async () => {
    try {
        await apiRequest('/volume', 'POST', { action: 'down' });
        showNotification('Volume diminué', 'success');
    } catch (error) {
        showNotification('Erreur volume', 'error');
    }
});

document.getElementById('mute').addEventListener('click', async () => {
    try {
        await apiRequest('/volume', 'POST', { action: 'mute' });
        showNotification('TV mise en sourdine', 'success');
    } catch (error) {
        showNotification('Erreur sourdine', 'error');
    }
});

document.getElementById('unmute').addEventListener('click', async () => {
    try {
        await apiRequest('/volume', 'POST', { action: 'unmute' });
        showNotification('Sourdine désactivée', 'success');
    } catch (error) {
        showNotification('Erreur sourdine', 'error');
    }
});

// Slider de volume
document.getElementById('volume-slider').addEventListener('change', async (e) => {
    const level = parseInt(e.target.value);
    try {
        await apiRequest('/volume', 'POST', { action: 'set', level });
        showNotification(`Volume réglé à ${level}`, 'success');
    } catch (error) {
        showNotification('Erreur réglage volume', 'error');
    }
});

// Contrôles de chaînes
document.getElementById('channel-up').addEventListener('click', async () => {
    try {
        await apiRequest('/channel', 'POST', { action: 'up' });
        showNotification('Chaîne suivante', 'success');
    } catch (error) {
        showNotification('Erreur chaîne', 'error');
    }
});

document.getElementById('channel-down').addEventListener('click', async () => {
    try {
        await apiRequest('/channel', 'POST', { action: 'down' });
        showNotification('Chaîne précédente', 'success');
    } catch (error) {
        showNotification('Erreur chaîne', 'error');
    }
});

document.getElementById('channel-set').addEventListener('click', async () => {
    const channelInput = document.getElementById('channel-input');
    const number = parseInt(channelInput.value);
    
    if (!number || number < 1) {
        showNotification('Numéro de chaîne invalide', 'error');
        return;
    }
    
    try {
        await apiRequest('/channel', 'POST', { action: 'set', number });
        showNotification(`Chaîne ${number} sélectionnée`, 'success');
        channelInput.value = '';
    } catch (error) {
        showNotification('Erreur changement chaîne', 'error');
    }
});

// Navigation
const navButtons = {
    'nav-up': 'up',
    'nav-down': 'down',
    'nav-left': 'left',
    'nav-right': 'right',
    'nav-ok': 'ok',
    'nav-back': 'back',
    'nav-home': 'home'
};

Object.keys(navButtons).forEach(buttonId => {
    document.getElementById(buttonId).addEventListener('click', async () => {
        const direction = navButtons[buttonId];
        try {
            await apiRequest('/navigate', 'POST', { direction });
            showNotification(`Navigation: ${direction}`, 'success');
        } catch (error) {
            showNotification('Erreur navigation', 'error');
        }
    });
});

// Applications
document.querySelectorAll('.app-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
        const appId = btn.dataset.app;
        setButtonLoading(btn, true);
        try {
            await apiRequest('/app', 'POST', { appId });
            showNotification(`${btn.textContent} lancé`, 'success');
        } catch (error) {
            showNotification(`Erreur lancement ${btn.textContent}`, 'error');
        } finally {
            setButtonLoading(btn, false);
        }
    });
});

// Changement d'input
document.getElementById('input-set').addEventListener('click', async () => {
    const inputSelect = document.getElementById('input-select');
    const inputId = inputSelect.value;
    
    if (!inputId) {
        showNotification('Veuillez sélectionner une entrée', 'error');
        return;
    }
    
    try {
        await apiRequest('/input', 'POST', { inputId });
        showNotification(`Entrée ${inputId} sélectionnée`, 'success');
    } catch (error) {
        showNotification('Erreur changement entrée', 'error');
    }
});

// Messages
document.getElementById('send-message').addEventListener('click', async () => {
    const messageInput = document.getElementById('message-input');
    const durationInput = document.getElementById('message-duration');
    
    const message = messageInput.value.trim();
    const duration = parseInt(durationInput.value) || 3000;
    
    if (!message) {
        showNotification('Veuillez saisir un message', 'error');
        return;
    }
    
    const btn = document.getElementById('send-message');
    setButtonLoading(btn, true);
    
    try {
        await apiRequest('/message', 'POST', { message, duration });
        showNotification('Message envoyé à la TV', 'success');
        messageInput.value = '';
    } catch (error) {
        showNotification('Erreur envoi message', 'error');
    } finally {
        setButtonLoading(btn, false);
    }
});

// Permettre l'envoi de message avec Entrée
document.getElementById('message-input').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        document.getElementById('send-message').click();
    }
});

// Permettre le changement de chaîne avec Entrée
document.getElementById('channel-input').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        document.getElementById('channel-set').click();
    }
});

// Message + Mute combiné
document.getElementById('send-message-mute').addEventListener('click', async () => {
    const messageInput = document.getElementById('message-mute-input');
    const muteSelect = document.getElementById('mute-action-select');
    const durationInput = document.getElementById('message-duration');
    
    const message = messageInput.value.trim();
    const muteAction = muteSelect.value;
    const duration = parseInt(durationInput.value) || 3000;
    
    if (!message) {
        showNotification('Veuillez saisir un message', 'error');
        return;
    }
    
    const btn = document.getElementById('send-message-mute');
    setButtonLoading(btn, true);
    
    try {
        await apiRequest('/message-mute', 'POST', { message, muteAction, duration });
        showNotification(`Message envoyé avec ${muteAction}`, 'success');
        messageInput.value = '';
    } catch (error) {
        showNotification('Erreur envoi combo', 'error');
    } finally {
        setButtonLoading(btn, false);
    }
});

// Actions combinées prédéfinies
document.getElementById('urgent-message').addEventListener('click', async () => {
    const btn = document.getElementById('urgent-message');
    setButtonLoading(btn, true);
    
    try {
        await apiRequest('/combo', 'POST', {
            actions: [
                { type: 'volume', data: { action: 'mute' } },
                { type: 'message', data: { message: '🚨 MESSAGE URGENT 🚨', duration: 8000 } }
            ]
        });
        showNotification('Message urgent envoyé', 'success');
    } catch (error) {
        showNotification('Erreur message urgent', 'error');
    } finally {
        setButtonLoading(btn, false);
    }
});

document.getElementById('netflix-mute').addEventListener('click', async () => {
    const btn = document.getElementById('netflix-mute');
    setButtonLoading(btn, true);
    
    try {
        await apiRequest('/combo', 'POST', {
            actions: [
                { type: 'volume', data: { action: 'mute' } },
                { type: 'app', data: { appId: 'netflix' } },
                { type: 'message', data: { message: '🎬 Netflix lancé en mode silencieux', duration: 4000 } }
            ]
        });
        showNotification('Netflix lancé en mode silencieux', 'success');
    } catch (error) {
        showNotification('Erreur Netflix combo', 'error');
    } finally {
        setButtonLoading(btn, false);
    }
});

document.getElementById('dinner-ready').addEventListener('click', async () => {
    const btn = document.getElementById('dinner-ready');
    setButtonLoading(btn, true);
    
    try {
        await apiRequest('/combo', 'POST', {
            actions: [
                { type: 'volume', data: { action: 'mute' } },
                { type: 'message', data: { message: '🍽️ Le dîner est prêt !', duration: 10000 } },
                { type: 'volume', data: { action: 'set', level: 15 } }
            ]
        });
        showNotification('Message dîner envoyé', 'success');
    } catch (error) {
        showNotification('Erreur message dîner', 'error');
    } finally {
        setButtonLoading(btn, false);
    }
});

document.getElementById('custom-combo').addEventListener('click', async () => {
    const btn = document.getElementById('custom-combo');
    setButtonLoading(btn, true);
    
    try {
        // Exemple de combo personnalisé
        await apiRequest('/combo', 'POST', {
            actions: [
                { type: 'volume', data: { action: 'mute' } },
                { type: 'channel', data: { action: 'set', number: 1 } },
                { type: 'message', data: { message: '📺 Chaîne 1 sélectionnée', duration: 3000 } },
                { type: 'volume', data: { action: 'set', level: 20 } }
            ]
        });
        showNotification('Combo personnalisé exécuté', 'success');
    } catch (error) {
        showNotification('Erreur combo personnalisé', 'error');
    } finally {
        setButtonLoading(btn, false);
    }
});

// Permettre l'envoi de message + mute avec Entrée
document.getElementById('message-mute-input').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        document.getElementById('send-message-mute').click();
    }
});

// Séquence d'arrêt automatique
document.getElementById('shutdown-sequence').addEventListener('click', async () => {
    const btn = document.getElementById('shutdown-sequence');
    
    // Confirmation
    if (!confirm('Démarrer la séquence d\'arrêt automatique ?\n\n• 0s : Message "2 minutes"\n• 60s : Message "1 minute"\n• 120s : Message "Bonne nuit"\n• 125s : Arrêt de la TV')) {
        return;
    }
    
    setButtonLoading(btn, true);
    
    try {
        const result = await apiRequest('/shutdown-sequence', 'POST');
        showNotification('Séquence d\'arrêt programmée !', 'success');
        
        // Désactiver le bouton pendant 3 minutes
        btn.disabled = true;
        btn.textContent = 'Séquence en cours...';
        
        setTimeout(() => {
            btn.disabled = false;
            btn.textContent = 'Séquence d\'Arrêt (3 min)';
            setButtonLoading(btn, false);
        }, 125000); // 2 minutes + 5 secondes
        
    } catch (error) {
        showNotification('Erreur séquence d\'arrêt', 'error');
        setButtonLoading(btn, false);
    }
});

// Séquence d'arrêt rapide (test)
document.getElementById('shutdown-sequence-fast').addEventListener('click', async () => {
    const btn = document.getElementById('shutdown-sequence-fast');
    
    // Confirmation
    if (!confirm('Démarrer le test rapide ?\n\n• 0s : Message test\n• 10s : Message test\n• 20s : Message "Bonne nuit"\n• 30s : Arrêt de la TV')) {
        return;
    }
    
    setButtonLoading(btn, true);
    
    try {
        const result = await apiRequest('/shutdown-sequence-fast', 'POST');
        showNotification('Test rapide programmé !', 'success');
        
        // Désactiver le bouton pendant 30 secondes
        btn.disabled = true;
        btn.textContent = 'Test en cours...';
        
        setTimeout(() => {
            btn.disabled = false;
            btn.textContent = 'Test Rapide (30s)';
            setButtonLoading(btn, false);
        }, 30000); // 30 secondes
        
    } catch (error) {
        showNotification('Erreur test rapide', 'error');
        setButtonLoading(btn, false);
    }
});

// Annuler la séquence d'arrêt
document.getElementById('cancel-shutdown').addEventListener('click', async () => {
    const btn = document.getElementById('cancel-shutdown');
    setButtonLoading(btn, true);
    
    try {
        await apiRequest('/cancel-shutdown', 'POST');
        showNotification('Message d\'annulation envoyé', 'info');
        
        // Réactiver les boutons de séquence
        const shutdownBtn = document.getElementById('shutdown-sequence');
        const fastBtn = document.getElementById('shutdown-sequence-fast');
        
        shutdownBtn.disabled = false;
        shutdownBtn.textContent = 'Séquence d\'Arrêt (3 min)';
        fastBtn.disabled = false;
        fastBtn.textContent = 'Test Rapide (30s)';
        
    } catch (error) {
        showNotification('Erreur annulation', 'error');
    } finally {
        setButtonLoading(btn, false);
    }
});

// Vérification périodique du statut
setInterval(checkStatus, 10000);

// Vérification initiale
checkStatus();

// Ajout des styles CSS pour les animations
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    
    @keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
    }
`;
document.head.appendChild(style);

console.log('🎮 LG TV Remote - Interface initialisée');
console.log('📡 API Base:', API_BASE);