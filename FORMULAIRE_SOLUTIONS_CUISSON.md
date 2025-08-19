# 📝 Formulaire Solutions de Cuisson Propre

## 🎯 Objectif

Formulaire d'enquête sur l'adoption des solutions de cuisson propre en RDC, sans gestion d'établissements.

## 📋 Sections du Formulaire

### **1. Identification du Ménage**
- **Nom/Code du ménage** : Identifiant unique du ménage
- **Âge** : Tranche d'âge du répondant
- **Sexe** : Homme ou Femme
- **Taille du ménage** : Nombre de personnes
- **Commune/Quartier** : Localisation administrative
- **Géolocalisation GPS** : Coordonnées précises (obligatoire)

### **2. Mode de Cuisson Actuelle**
- **Combustibles utilisés** : Sélection multiple (Bois, Charbon, Gaz, Électricité, Briquettes)
- **Équipements de cuisson** : Sélection multiple (Foyers traditionnels, améliorés, GPL, électrique)
- **Autres** : Champs de saisie libre pour précisions

### **3. Connaissance des Solutions Propres**
- **Connaissance** : Oui/Non
- **Solutions connues** : Description libre
- **Avantages perçus** : Sélection multiple
- **Autres avantages** : Saisie libre

### **4. Perceptions et Contraintes**
- **Obstacles identifiés** : Sélection multiple
- **Autres obstacles** : Saisie libre
- **Disposition à changer** : Oui/Non/Peut-être

### **5. Intention d'Adoption**
- **Prêt à acheter un foyer amélioré** : Oui/Non
- **Prêt à utiliser un réchaud GPL** : Oui/Non

## 🔐 Fonctionnalités

### **Géolocalisation GPS Automatique**
- ✅ **Capture automatique** via l'API du navigateur
- ✅ **Validation obligatoire** avant soumission
- ✅ **Précision affichée** en mètres
- ✅ **Timestamp** de capture
- ✅ **Fallback manuel** si GPS impossible

### **Validation des Données**
- ✅ **Champs obligatoires** vérifiés
- ✅ **Format GPS** validé automatiquement
- ✅ **Sélections multiples** contrôlées
- ✅ **Messages d'erreur** explicites

### **Gestion Hors Ligne**
- ✅ **Sauvegarde locale** IndexedDB
- ✅ **Synchronisation** automatique avec le serveur
- ✅ **Gestion des conflits** et erreurs réseau

## 🚀 Utilisation

### **1. Remplir le Formulaire**
- Saisir les informations du ménage
- Capturer la position GPS automatiquement
- Sélectionner les options appropriées
- Valider et soumettre

### **2. Capture GPS**
- Cliquer sur "📍 Capturer ma position GPS"
- Autoriser l'accès à la position
- Vérifier les coordonnées affichées
- Le formulaire ne peut être soumis sans GPS valide

### **3. Soumission**
- Validation automatique de tous les champs
- Sauvegarde locale immédiate
- Synchronisation avec le serveur si possible
- Message de confirmation

## 📱 Compatibilité

- **Navigateurs** : Chrome, Firefox, Safari, Edge (versions récentes)
- **Appareils** : Desktop, tablette, mobile
- **GPS** : Intégré (mobile) ou WiFi triangulation (desktop)
- **Hors ligne** : IndexedDB + synchronisation différée

## 🔧 Développement

### **Structure des Données**
```typescript
interface FormState {
  formData: {
    household: HouseholdData;      // Identification du ménage
    cooking: CookingData;          // Mode de cuisson actuelle
    knowledge: KnowledgeData;      // Connaissance des solutions
    constraints: ConstraintsData;  // Perceptions et contraintes
    adoption: AdoptionData;        // Intention d'adoption
  };
}
```

### **Validation**
- GPS obligatoire avec format vérifié
- Champs d'identification requis
- Sélections multiples non vides
- Messages d'erreur contextuels

### **Sauvegarde**
- IndexedDB pour le stockage local
- API REST pour la synchronisation
- Gestion des erreurs réseau
- Statuts de synchronisation

## 📊 Données Collectées

Le formulaire collecte des données structurées pour :
- **Analyse géographique** des tendances d'adoption
- **Études de marché** des solutions de cuisson
- **Planification** des interventions et subventions
- **Suivi** de l'évolution des comportements
- **Évaluation** des programmes de sensibilisation 