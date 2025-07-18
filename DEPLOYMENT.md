# 🐳 Déploiement Docker avec Portainer

Guide complet pour déployer l'application LG TV Remote sur un serveur distant via Portainer.

## 📋 Prérequis

- Docker et Docker Compose installés sur le serveur
- Portainer configuré et accessible
- Accès réseau entre le serveur et votre TV LG
- TV LG avec webOS et mode développeur activé

## 🚀 Déploiement via Portainer

### Méthode 1 : Stack Portainer (Recommandée)

1. **Connexion à Portainer**
   - Accédez à votre interface Portainer
   - Sélectionnez votre environnement Docker

2. **Créer une nouvelle Stack**
   - Allez dans "Stacks" → "Add stack"
   - Nom : `lg-tv-remote`
   - Méthode : "Web editor"

3. **Copier le docker-compose**
   ```yaml
   version: '3.8'

   services:
     lg-tv-remote:
       image: lg-tv-remote:latest
       container_name: lg-tv-remote
       restart: unless-stopped
       ports:
         - "3001:3001"
       environment:
         - NODE_ENV=production
         - PORT=3001
         - TV_IP=192.168.2.41  # ⚠️ MODIFIE CETTE IP
       networks:
         - lg-tv-network
       volumes:
         - /etc/localtime:/etc/localtime:ro
       labels:
         - "description=LG TV Remote Control Application"
       healthcheck:
         test: ["CMD", "wget", "--no-verbose", "--tries=1", "--spider", "http://localhost:3001/api/status"]
         interval: 30s
         timeout: 10s
         retries: 3
         start_period: 30s
       logging:
         driver: "json-file"
         options:
           max-size: "10m"
           max-file: "3"

   networks:
     lg-tv-network:
       driver: bridge
   ```

4. **Variables d'environnement (optionnel)**
   - Cliquez sur "Add environment variable"
   - Variables importantes à modifier :
     - `TV_IP` = `192.168.2.41` (IP de votre TV)
     - `TV_PORT` = `3000` (si différent)
     - `SHUTDOWN_DELAY_FINAL` = `125000` (pour personnaliser le timing)

5. **Déployer la stack**
   - Cliquez sur "Deploy the stack"
   - Attendez le déploiement

### Méthode 2 : Container individuel

1. **Créer un container**
   - Allez dans "Containers" → "Add container"
   - Nom : `lg-tv-remote`
   - Image : `lg-tv-remote:latest`

2. **Configuration réseau**
   - Ports : `3001:3001`
   - Réseau : Bridge ou personnalisé

3. **Variables d'environnement**
   ```
   NODE_ENV=production
   PORT=3001
   TV_IP=192.168.2.41
   ```

4. **Options avancées**
   - Restart policy : "Unless stopped"
   - Logging : JSON-file, max 10MB, 3 fichiers

## 🔧 Construction de l'image

### Sur le serveur local

```bash
# Cloner le projet
git clone <your-repo-url>
cd lg-tv-remote

# Construire l'image
docker build -t lg-tv-remote .

# Ou avec npm
npm run docker:build
```

### Via Docker Hub (optionnel)

```bash
# Tag pour Docker Hub
docker tag lg-tv-remote:latest votre-username/lg-tv-remote:latest

# Push vers Docker Hub
docker push votre-username/lg-tv-remote:latest
```

## 📝 Configuration

### Variables d'environnement

| Variable | Défaut | Description |
|----------|--------|-------------|
| **Serveur** | | |
| `PORT` | `3001` | Port d'écoute du serveur |
| `HOST` | `0.0.0.0` | Adresse d'écoute (0.0.0.0 = toutes interfaces) |
| `NODE_ENV` | `production` | Mode Node.js |
| **TV LG** | | |
| `TV_IP` | `192.168.1.100` | IP de votre TV LG |
| `TV_PORT` | `3000` | Port WebSocket TV (généralement 3000) |
| `TV_TIMEOUT` | `5000` | Timeout connexion TV (ms) |
| `TV_RECONNECT` | `3000` | Délai reconnexion TV (ms) |
| **Messages** | | |
| `MESSAGE_DURATION` | `3000` | Durée par défaut des messages (ms) |
| **Séquence d'arrêt** | | |
| `SHUTDOWN_DELAY_1` | `0` | Premier message (immédiat) |
| `SHUTDOWN_DELAY_2` | `60000` | Deuxième message (1 minute) |
| `SHUTDOWN_DELAY_3` | `120000` | Troisième message (2 minutes) |
| `SHUTDOWN_DELAY_FINAL` | `125000` | Arrêt TV (2 min 5s) |
| **Test rapide** | | |
| `SHUTDOWN_TEST_DELAY_1` | `0` | Premier message test |
| `SHUTDOWN_TEST_DELAY_2` | `10000` | Deuxième message test (10s) |
| `SHUTDOWN_TEST_DELAY_3` | `20000` | Troisième message test (20s) |
| `SHUTDOWN_TEST_DELAY_FINAL` | `30000` | Arrêt TV test (30s) |

### Ports

- **3001** : Interface web et API REST
- Assure-toi que le port est ouvert dans le firewall

### Réseau

- Le container doit être sur le même réseau que ta TV
- Utilise le mode `bridge` ou `host` selon ta configuration

## 🔍 Vérification

### Vérifier le déploiement

```bash
# Via Portainer : Logs du container
# Ou en ligne de commande :
docker logs lg-tv-remote

# Test de l'API
curl -X GET "http://server-ip:3001/api/status"
```

### Accès à l'application

- **Interface web** : `http://server-ip:3001`
- **API** : `http://server-ip:3001/api/`

### Tests rapides

```bash
# Test de connexion
curl -X GET "http://server-ip:3001/api/status"

# Test message
curl -X POST "http://server-ip:3001/api/message" \
  -H "Content-Type: application/json" \
  -d '{"message": "Test depuis Docker!", "duration": 5000}'

# Test séquence d'arrêt
curl -X POST "http://server-ip:3001/api/shutdown-sequence-fast"
```

## 📊 Monitoring

### Healthcheck

Le container inclut un healthcheck automatique :
- Vérifie `/api/status` toutes les 30 secondes
- Timeout : 10 secondes
- 3 tentatives avant échec

### Logs

```bash
# Voir les logs en temps réel
docker logs -f lg-tv-remote

# Logs avec horodatage
docker logs -t lg-tv-remote
```

### Métriques Portainer

- CPU et mémoire usage
- Statistiques réseau
- Statut du healthcheck

## 🛠️ Dépannage

### Problèmes courants

1. **Container ne démarre pas**
   ```bash
   # Vérifier les logs
   docker logs lg-tv-remote
   
   # Vérifier la configuration
   docker inspect lg-tv-remote
   ```

2. **Impossible de se connecter à la TV**
   - Vérifier que `TV_IP` est correct
   - Vérifier que la TV est sur le même réseau
   - Vérifier que le mode développeur est activé

3. **Port déjà utilisé**
   ```bash
   # Changer le port dans docker-compose
   ports:
     - "3002:3001"  # Utilise le port 3002
   ```

### Redémarrage

```bash
# Via Portainer : Restart container
# Ou en ligne de commande :
docker restart lg-tv-remote
```

### Mise à jour

```bash
# Reconstruire l'image
docker build -t lg-tv-remote .

# Redéployer via Portainer
# Ou en ligne de commande :
docker-compose down
docker-compose up -d
```

## 🔒 Sécurité

### Bonnes pratiques

- Utilisateur non-root dans le container
- Limites de logging (10MB max)
- Pas de privilèges élevés requis
- Ports minimaux exposés

### Réseau

- Utilise un réseau Docker personnalisé
- Pas d'accès direct aux ports privilégiés
- Isolation des containers

## 🎯 Automatisation iOS

Une fois déployé, utilise l'IP de ton serveur :

```bash
# Depuis iOS Shortcuts
curl -X POST "http://server-ip:3001/api/shutdown-sequence" \
  -H "Content-Type: application/json"
```

## 📄 Fichiers de configuration

- `Dockerfile` : Image Docker
- `docker-compose.yml` : Configuration locale
- `docker-compose.portainer.yml` : Configuration Portainer
- `.dockerignore` : Exclusions Docker
- `.env.example` : Variables d'environnement exemple

---

**✅ Ton application est maintenant prête pour le déploiement Docker !**