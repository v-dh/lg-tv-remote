# 📋 Configuration de l'application LG TV Remote

Guide complet des variables d'environnement et de configuration.

## 🎯 Variables d'environnement

### Serveur Web

```bash
# Port d'écoute du serveur
PORT=3001

# Adresse d'écoute (0.0.0.0 = toutes interfaces)
HOST=0.0.0.0

# Mode Node.js (production/development)
NODE_ENV=production
```

### Configuration TV LG

```bash
# IP de votre TV LG
TV_IP=192.168.1.100

# Port WebSocket de la TV (généralement 3000)
TV_PORT=3000

# Timeout de connexion en millisecondes
TV_TIMEOUT=5000

# Délai de reconnexion automatique en millisecondes
TV_RECONNECT=3000
```

### Messages et Notifications

```bash
# Durée par défaut des messages sur la TV (en ms)
MESSAGE_DURATION=3000
```

### Séquence d'arrêt normale

```bash
# Premier message (immédiat)
SHUTDOWN_DELAY_1=0

# Deuxième message (après 1 minute)
SHUTDOWN_DELAY_2=60000

# Troisième message "Bonne nuit" (après 2 minutes)
SHUTDOWN_DELAY_3=120000

# Arrêt automatique de la TV (après 2 min 5s)
SHUTDOWN_DELAY_FINAL=125000
```

### Séquence d'arrêt test (rapide)

```bash
# Premier message test (immédiat)
SHUTDOWN_TEST_DELAY_1=0

# Deuxième message test (après 10 secondes)
SHUTDOWN_TEST_DELAY_2=10000

# Troisième message test (après 20 secondes)
SHUTDOWN_TEST_DELAY_3=20000

# Arrêt automatique test (après 30 secondes)
SHUTDOWN_TEST_DELAY_FINAL=30000
```

## 🔧 Exemples de configuration

### Configuration par défaut

```bash
# Copier le fichier exemple
cp .env.example .env

# Modifier selon vos besoins
TV_IP=192.168.2.41
```

### Configuration Docker

```bash
# Variables d'environnement Docker
docker run -e TV_IP=192.168.2.41 -e PORT=3001 lg-tv-remote
```

### Configuration Portainer

Dans Portainer, ajouter ces variables d'environnement :

```
TV_IP=192.168.2.41
TV_PORT=3000
MESSAGE_DURATION=5000
SHUTDOWN_DELAY_FINAL=180000
```

## 📚 Cas d'usage

### Arrêt personnalisé (3 minutes au lieu de 2m5s)

```bash
SHUTDOWN_DELAY_FINAL=180000  # 3 minutes
```

### Messages plus longs

```bash
MESSAGE_DURATION=8000  # 8 secondes
```

### TV sur port personnalisé

```bash
TV_PORT=3001  # Si votre TV utilise un port différent
```

### Séquence d'arrêt plus rapide

```bash
SHUTDOWN_DELAY_2=30000   # 30 secondes
SHUTDOWN_DELAY_3=60000   # 1 minute
SHUTDOWN_DELAY_FINAL=65000  # 1 minute 5 secondes
```

### Test ultra-rapide

```bash
SHUTDOWN_TEST_DELAY_2=3000   # 3 secondes
SHUTDOWN_TEST_DELAY_3=6000   # 6 secondes
SHUTDOWN_TEST_DELAY_FINAL=10000  # 10 secondes
```

## 🎮 Automatisation iOS

### Exemples avec timing personnalisé

```bash
# Arrêt normal avec timing personnalisé
curl -X POST "http://192.168.2.41:3001/api/shutdown-sequence" \
  -H "Content-Type: application/json" \
  -d '{
    "customMessages": {
      "first": "La TV s'\''éteindra dans 5 minutes",
      "second": "La TV s'\''éteindra dans 2 minutes",
      "third": "Bonne nuit ! 🌙"
    }
  }'
```

### Test avec messages personnalisés

```bash
# Test rapide avec messages personnalisés
curl -X POST "http://192.168.2.41:3001/api/shutdown-sequence-fast" \
  -H "Content-Type: application/json"
```

## 🏠 Intégration Home Assistant

### Configuration YAML

```yaml
# configuration.yaml
rest_command:
  tv_shutdown:
    url: "http://192.168.2.41:3001/api/shutdown-sequence"
    method: POST
    headers:
      Content-Type: application/json

  tv_message:
    url: "http://192.168.2.41:3001/api/message"
    method: POST
    headers:
      Content-Type: application/json
    payload: '{"message": "{{ message }}", "duration": {{ duration | default(3000) }}}'
```

### Automatisation

```yaml
# automations.yaml
- alias: "TV Bedtime Sequence"
  trigger:
    platform: time
    at: "22:30:00"
  action:
    service: rest_command.tv_shutdown
```

## 🔍 Validation de la configuration

### Vérifier la connexion

```bash
# Test de status
curl -X GET "http://192.168.2.41:3001/api/status"
```

### Vérifier les délais

```bash
# Lancer la séquence de test
curl -X POST "http://192.168.2.41:3001/api/shutdown-sequence-fast"
```

### Logs de débogage

```bash
# Voir les logs Docker
docker logs lg-tv-remote

# Ou dans Portainer : Container > Logs
```

## 🛠️ Résolution de problèmes

### TV non trouvée

```bash
# Vérifier l'IP
TV_IP=192.168.2.41

# Vérifier le port
TV_PORT=3000

# Augmenter le timeout
TV_TIMEOUT=10000
```

### Messages trop rapides

```bash
# Augmenter la durée
MESSAGE_DURATION=8000
```

### Séquence trop longue

```bash
# Réduire les délais
SHUTDOWN_DELAY_2=30000
SHUTDOWN_DELAY_3=60000
SHUTDOWN_DELAY_FINAL=65000
```

---

**✅ Configuration terminée !**

Ton application est maintenant entièrement configurable via les variables d'environnement.