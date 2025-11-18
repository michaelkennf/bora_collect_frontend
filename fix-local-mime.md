# Solution pour l'erreur MIME type en local

## Problème
```
Failed to load module script: Expected a JavaScript-or-Wasm module script but the server responded with a MIME type of "text/html"
```

## Solutions

### Solution 1 : Nettoyer le cache du navigateur (RECOMMANDÉ)

1. **Chrome/Edge** :
   - Appuyez sur `Ctrl + Shift + Delete` (Windows) ou `Cmd + Shift + Delete` (Mac)
   - Sélectionnez "Images et fichiers en cache"
   - Cliquez sur "Effacer les données"
   - Ou utilisez `Ctrl + F5` pour forcer le rechargement

2. **Firefox** :
   - Appuyez sur `Ctrl + Shift + Delete`
   - Sélectionnez "Cache"
   - Cliquez sur "Effacer maintenant"
   - Ou utilisez `Ctrl + F5`

3. **Safari** :
   - `Cmd + Option + E` pour vider le cache
   - Ou `Cmd + Shift + R` pour recharger

### Solution 2 : Redémarrer le serveur de développement

```bash
# Arrêter le serveur (Ctrl + C)
# Puis redémarrer
cd frontend
npm run dev
```

### Solution 3 : Supprimer le dossier node_modules/.vite

```bash
cd frontend
rm -rf node_modules/.vite
npm run dev
```

### Solution 4 : Vérifier que vous utilisez le bon port

Vite utilise par défaut le port `5173`. Assurez-vous d'accéder à :
- `http://localhost:5173` (et non un autre port)

### Solution 5 : Mode navigation privée

Testez dans une fenêtre de navigation privée pour éviter les problèmes de cache.

## Vérification

Après avoir appliqué une solution, vérifiez dans la console du navigateur (F12) :
- Les fichiers JS doivent se charger avec le type `application/javascript`
- Aucune erreur MIME type ne doit apparaître

