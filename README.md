# 🎮 LG TV Remote - Application de Contrôle à Distance

Application web complète pour contrôler votre TV LG avec interface moderne et API REST pour l'automatisation.

## ✨ Fonctionnalités

### 🎯 Contrôles Complets
- **Alimentation** : Extinction de la TV
- **Volume** : Augmentation/diminution, slider, mute/unmute
- **Chaînes** : Navigation, changement direct par numéro
- **Navigation** : Télécommande virtuelle (flèches, OK, retour, accueil)
- **Applications** : Lancement rapide (Netflix, YouTube, Prime Video, Disney+, Spotify, Navigateur)
- **Entrées** : Changement d'input (HDMI, USB)
- **Messages** : Affichage de notifications sur l'écran TV

### 🔌 API REST Complète
- **Automatisation iOS** : Endpoints pour Raccourcis/Siri
- **Intégration tierce** : Compatible avec tous les systèmes d'automatisation
- **Réponses JSON** : Format standard pour tous les endpoints

## 🚀 Installation

### Méthode 1 : Installation locale

#### 1. Cloner et installer les dépendances
```bash
git clone https://github.com/v-dh/lg-tv-remote.git
cd lg-tv-remote
npm install
```

#### 2. Configuration de l'IP TV
```bash
# Méthode 1 : Variable d'environnement
export TV_IP=192.168.1.100
npm start

# Méthode 2 : Directement au démarrage
TV_IP=192.168.1.100 npm start
```

#### 3. Démarrage
```bash
npm start
# ou pour le développement
npm run dev
```

#### 4. Accès
- **Interface Web** : http://localhost:3001
- **API** : http://localhost:3001/api/
- **Accès réseau** : http://[votre-ip]:3001

### Méthode 2 : Docker (Recommandée)

#### 🐳 Déploiement Docker Multi-Architecture

Cette application est disponible sous forme d'image Docker multi-architecture, compatible avec :
- **x86_64** (Intel/AMD) - Serveurs classiques, TrueNAS, Synology
- **ARM64** (Apple Silicon) - Mac M1/M2, Raspberry Pi 4
- **ARM32** - Raspberry Pi plus anciens

#### Installation Docker simple

```bash
# Avec docker run
docker run -d \
  --name lg-tv-remote \
  -p 3001:3001 \
  -e TV_IP=192.168.1.100 \
  -e PORT=3001 \
  -e HOST=0.0.0.0 \
  --restart unless-stopped \
  v-dh/lg-tv-remote:latest

# Avec docker-compose
curl -O https://raw.githubusercontent.com/v-dh/lg-tv-remote/main/docker-compose.yml
# Modifier TV_IP dans le fichier
docker-compose up -d
```

#### Portainer / TrueNAS / Synology

1. **Créer une stack** dans Portainer
2. **Copier le docker-compose** :
   ```yaml
   version: '3.8'
   services:
     lg-tv-remote:
       image: v-dh/lg-tv-remote:latest
       container_name: lg-tv-remote
       restart: unless-stopped
       ports:
         - "3001:3001"
       environment:
         - TV_IP=192.168.1.100  # ⚠️ Modifier avec l'IP de votre TV
         - PORT=3001
         - HOST=0.0.0.0
         - NODE_ENV=production
       networks:
         - lg-tv-network
   
   networks:
     lg-tv-network:
       driver: bridge
   ```
3. **Modifier `TV_IP`** avec l'IP de votre TV
4. **Déployer la stack**

#### Variables d'environnement Docker

| Variable | Défaut | Description |
|----------|--------|-------------|
| `TV_IP` | `192.168.1.100` | IP de votre TV LG |
| `TV_PORT` | `3000` | Port WebSocket TV |
| `PORT` | `3001` | Port du serveur web |
| `HOST` | `0.0.0.0` | Adresse d'écoute |
| `MESSAGE_DURATION` | `3000` | Durée des messages (ms) |
| `SHUTDOWN_DELAY_FINAL` | `125000` | Délai d'arrêt automatique (ms) |

#### Accès après déploiement Docker
- **Interface Web** : http://[IP-SERVEUR]:3001
- **API** : http://[IP-SERVEUR]:3001/api/
- **Logs** : `docker logs lg-tv-remote`

## 🔧 Configuration TV

### 1. Activer le mode développeur
1. Allez dans **Paramètres** > **Général** > **À propos de cette TV**
2. Cliquez 5 fois sur **Version logicielle**
3. Activez **Mode développeur**

### 2. Autoriser les connexions
1. Allez dans **Paramètres** > **Réseau** > **Connexion TV**
2. Activez **LG Connect Apps**

### 3. Première connexion
- L'application affichera un code PIN sur la TV
- Entrez ce code dans l'interface web
- L'appairage sera mémorisé

## 📡 API REST

### Endpoints Principaux

#### Status et Connexion
```bash
# Vérifier le statut
GET /api/status

# Se connecter à la TV
POST /api/connect
```

#### Contrôles Audio
```bash
# Volume
POST /api/volume
{
  "action": "up|down|set|mute|unmute",
  "level": 50  // Pour action: "set"
}
```

#### Contrôles Chaînes
```bash
# Chaînes
POST /api/channel
{
  "action": "up|down|set",
  "number": 25  // Pour action: "set"
}
```

#### Navigation
```bash
# Télécommande
POST /api/navigate
{
  "direction": "up|down|left|right|ok|back|home"
}
```

#### Applications
```bash
# Lancer une app
POST /api/app
{
  "appId": "netflix|youtube|prime|disney|spotify|browser"
}
```

#### Messages
```bash
# Afficher un message
POST /api/message
{
  "message": "Bonjour !",
  "duration": 5000  // Durée en ms
}
```

#### Entrées
```bash
# Changer d'entrée
POST /api/input
{
  "inputId": "HDMI_1|HDMI_2|HDMI_3|HDMI_4|USB"
}
```

### Exemples d'Automatisation iOS

#### Raccourcis iOS
```bash
# Monter le volume
curl -X POST "http://192.168.1.200:3001/api/volume" \
  -H "Content-Type: application/json" \
  -d '{"action": "up"}'

# Lancer Netflix
curl -X POST "http://192.168.1.200:3001/api/app" \
  -H "Content-Type: application/json" \
  -d '{"appId": "netflix"}'

# Afficher un message
curl -X POST "http://192.168.1.200:3001/api/message" \
  -H "Content-Type: application/json" \
  -d '{"message": "Dîner prêt !", "duration": 10000}'
```

## 🎯 Utilisation

### Interface Web
1. Ouvrez http://localhost:3001
2. Cliquez sur "Se connecter" si nécessaire
3. Utilisez les contrôles intuitifs
4. Le statut de connexion est affiché en temps réel

### Automatisation
1. Utilisez les endpoints API avec n'importe quel client HTTP
2. Intégrez avec les Raccourcis iOS
3. Compatible avec Home Assistant, IFTTT, etc.

## 🛠️ Développement

### Structure du projet
```
lg-tv-remote/
├── server.js                      # Serveur Express + logique TV
├── package.json                   # Dépendances Node.js
├── Dockerfile                     # Image Docker multi-architecture
├── docker-compose.yml             # Déploiement Docker local
├── docker-compose.portainer.yml   # Déploiement Portainer/TrueNAS
├── .env.example                   # Variables d'environnement exemple
├── public/
│   ├── index.html                 # Interface web responsive
│   ├── styles.css                 # Styles modernes
│   └── script.js                  # Logic frontend
├── CONFIG.md                      # Configuration détaillée
├── DEPLOYMENT.md                  # Guide de déploiement
└── README.md
```

### Commandes utiles
```bash
# Démarrage développement
npm run dev

# Démarrage production
npm start

# Avec IP TV personnalisée
TV_IP=192.168.1.100 npm start

# Build Docker multi-architecture
docker buildx build --platform linux/amd64,linux/arm64 -t v-dh/lg-tv-remote:latest --push .

# Test Docker local
docker run -d --name lg-tv-remote -p 3001:3001 -e TV_IP=192.168.1.100 v-dh/lg-tv-remote:latest
```

### 🏗️ Build Multi-Architecture

Pour contribuer ou créer votre propre image Docker :

```bash
# Créer un builder multi-architecture
docker buildx create --name multiarch --use
docker buildx inspect --bootstrap

# Build et push pour toutes les architectures
docker buildx build --platform linux/amd64,linux/arm64,linux/arm/v7 \
  -t votre-username/lg-tv-remote:latest \
  --push \
  .
```

### 🧪 Tests

```bash
# Test API endpoints
curl -X GET "http://localhost:3001/api/status"
curl -X POST "http://localhost:3001/api/message" \
  -H "Content-Type: application/json" \
  -d '{"message": "Test!", "duration": 3000}'

# Test Docker
docker run --rm -p 3001:3001 -e TV_IP=192.168.1.100 v-dh/lg-tv-remote:latest
```

## 🔍 Dépannage

### Problèmes de connexion
1. **Vérifiez l'IP** : Assurez-vous que l'IP est correcte
2. **Réseau** : TV et serveur sur le même réseau
3. **Firewall** : Autorisez le port 3001
4. **TV** : Mode développeur activé

### Erreurs communes
- **"TV non connectée"** : Vérifiez l'IP et le réseau
- **"Connexion refusée"** : Activez LG Connect Apps
- **"Timeout"** : Vérifiez la stabilité réseau
- **"exec format error"** : Problème d'architecture → Utilisez l'image multi-architecture

### Logs
```bash
# Installation locale
npm start
# Les logs s'affichent dans le terminal

# Docker
docker logs lg-tv-remote
docker logs -f lg-tv-remote  # Temps réel

# Portainer
# Aller dans Containers → lg-tv-remote → Logs
```

### Problèmes Docker spécifiques

#### Architecture incompatible
```bash
# Vérifier l'architecture du serveur
uname -m

# Forcer l'architecture (si nécessaire)
docker run --platform linux/amd64 -d --name lg-tv-remote \
  -p 3001:3001 -e TV_IP=192.168.1.100 \
  v-dh/lg-tv-remote:latest
```

#### Container ne démarre pas
```bash
# Vérifier les logs
docker logs lg-tv-remote

# Vérifier la configuration
docker inspect lg-tv-remote

# Redémarrer
docker restart lg-tv-remote
```

## 📝 Licence

MIT - Utilisez librement pour vos projets personnels et commerciaux.

## 🤝 Contribution

Les contributions sont les bienvenues ! N'hésitez pas à :
- Signaler des bugs
- Proposer des améliorations
- Ajouter des fonctionnalités

---

**Note** : Cette application nécessite une TV LG avec webOS et une connexion réseau stable.