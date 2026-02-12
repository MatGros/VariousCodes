# VariousCodes - Projets Personnels

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

> **Note**: Ce dépôt est un projet personnel sous licence MIT. Il contient une collection de projets divers développés dans le cadre d'apprentissage et d'expérimentation.

## 📋 Table des matières

- [Description](#description)
- [Projets](#projets)
  - [AI - Intelligence Artificielle](#ai---intelligence-artificielle)
  - [Python](#python)
  - [TC3 - TwinCAT 3](#tc3---twincat-3)
  - [TIA](#tia)
- [Installation](#installation)
- [⚠️ Sécurité](#️-sécurité)
- [Licence](#licence)
- [Contact](#contact)

## Description

**VariousCodes** est un dépôt regroupant plusieurs projets personnels dans différents langages et technologies. Il s'agit d'un espace de travail personnel pour l'expérimentation, l'apprentissage et le développement de petits projets.

## Projets

### AI - Intelligence Artificielle

#### 📐 DimCable MGS-05
**Outil de Dimensionnement de Câbles Électriques**

Application web pure HTML/CSS/JavaScript pour le calcul et le dimensionnement de câbles électriques conformément aux normes NF C 15-100 et IEC 60364.

**Fonctionnalités principales :**
- 3 modes de calcul (section recommandée, distance maximale, courant maximal)
- Support des câbles U-1000 R2V (1.5 à 240 mm²) et HO7RNF (1.5 à 16 mm²)
- Calculs pour installations monophasées et triphasées
- Prise en compte des coefficients de correction (température, groupement, pose)
- Visualisations graphiques interactives
- Export des résultats en CSV et PDF
- Sauvegarde automatique des paramètres

**Utilisation :**
```bash
cd AI/dimcable
# Windows : double-clic sur LANCER_DIMCABLE.bat
# Ou ouvrir dimcable.html dans un navigateur
```

**Technologies :** HTML5, CSS3, JavaScript (vanilla), Chart.js, jsPDF

### Python

#### 🏠 MG_HomeSecurity
**Système de sécurité domestique avec détection vidéo**

Application de surveillance vidéo multi-caméras avec serveur socket et interfaces utilisateur (Tkinter et Qt).

**Fonctionnalités :**
- Support multi-caméras via RTSP
- Architecture client-serveur avec sockets
- Détection d'objets et enregistrement vidéo
- Interfaces graphiques multiples (Tkinter, Qt)
- Communication inter-processus pour gestion des caméras

**Composants :**
- `MG_HomeSecurity.py` : Serveur principal
- `MG_HomeSecurity_Cam1.py` / `MG_HomeSecurity_Cam2.py` : Clients caméras
- `MG_HomeSecurity_HMI.py` / `MG_HomeSecurity_HMI_Tkinter.py` / `MG_HomeSecurity_HMI_QT.py` : Interfaces utilisateur
- Bibliothèques de support pour capture vidéo, sockets et gestion caméras

**Dépendances :**
```bash
pip install opencv-python
pip install PyQt5  # Pour l'interface Qt
```

**⚠️ AVERTISSEMENT DE SÉCURITÉ :**
> Ce projet contient des exemples de connexions RTSP avec des identifiants codés en dur dans les commentaires. **NE JAMAIS** utiliser de vrais identifiants dans le code source. Utiliser des variables d'environnement ou des fichiers de configuration sécurisés.

#### 💬 Messagerie
**Système de messagerie socket simple**

Application de chat client-serveur basique utilisant des sockets TCP/IP.

**Fichiers :**
- `Ecoute.py` : Serveur d'écoute
- `Discussion.py` : Client de discussion

**Utilisation :**
```bash
# Terminal 1
python Messagerie/Ecoute.py

# Terminal 2
python Messagerie/Discussion.py
```

#### 👨‍👩‍👧 Elia
**Projets d'apprentissage Python**

Collection de petits programmes Python pour l'apprentissage, incluant :
- Introduction à Python
- Tests de comparaison
- Programmation orientée objet (OOP)
- Exemple avec des classes (Poney)

#### 🎓 OOP
**Exemples de programmation orientée objet**

Tests et démonstrations de concepts de POO en Python.

### TC3 - TwinCAT 3

**Blocs fonctionnels pour automates Beckhoff**

Collection de blocs fonctionnels (Function Blocks) en langage IEC 61131-3 pour TwinCAT 3.

**Blocs disponibles :**
- `FB_Bool_To_Word.xml` : Conversion d'un tableau de 16 booléens en WORD
- `FB_Word_To_Bool.xml` : Conversion d'un WORD en tableau de 16 booléens

**Utilisation :**
Importer les fichiers XML dans votre projet TwinCAT 3 (XAE).

**Technologies :** TwinCAT 3, IEC 61131-3, Beckhoff PLC

### TIA

**Fichiers de test TIA Portal**

Espace réservé pour des projets Siemens TIA Portal.

## Installation

### Prérequis généraux

- **Python 3.x** pour les projets Python
- **Navigateur web moderne** pour DimCable (Chrome, Firefox, Edge, Safari)
- **TwinCAT 3** pour les blocs fonctionnels TC3
- **TIA Portal** pour les projets Siemens

### Installation Python

```bash
# Cloner le dépôt
git clone https://github.com/MatGros/VariousCodes.git
cd VariousCodes

# Installer les dépendances Python (si nécessaire)
pip install opencv-python PyQt5
```

### Projets web

Aucune installation requise pour les projets HTML/JS. Ouvrir simplement les fichiers HTML dans un navigateur.

## ⚠️ Sécurité

### Rapport de sécurité

Une analyse de sécurité a été effectuée sur ce dépôt. Voici les observations :

#### ⚠️ Identifiants codés en dur (commentaires)

**Fichiers concernés :**
- `Python/MG_HomeSecurity/MG_HomeSecurity_Cam1.py`
- `Python/MG_HomeSecurity/MG_HomeSecurity_Cam2.py`
- `Python/MG_HomeSecurity/MG_HomeSecurity_Lib_VideoCapture.py`

**Détails :**
Des URL RTSP avec identifiants sont présentes dans les commentaires du code :
```python
# Exemple : "rtsp://username:password@192.168.x.x:554/..."
```

**Recommandations :**
1. ✅ Ne jamais commiter de vrais identifiants dans le code source
2. ✅ Utiliser des variables d'environnement ou des fichiers de configuration (exclus du contrôle de version)
3. ✅ Utiliser un gestionnaire de secrets pour les environnements de production
4. ✅ Changer immédiatement tout identifiant qui aurait été exposé publiquement

**Exemple de bonne pratique :**
```python
import os
from dotenv import load_dotenv

load_dotenv()
RTSP_URL = os.getenv('CAMERA_RTSP_URL')  # Stocker dans .env (non versionné)
```

#### 🛡️ Fichier .gitignore

Un fichier `.gitignore` a été ajouté pour éviter le commit accidentel de fichiers sensibles :
- Variables d'environnement (.env)
- Fichiers de configuration locaux
- Identifiants et certificats
- Caches et fichiers temporaires Python

## Licence

Ce projet est sous licence MIT - voir ci-dessous pour plus de détails.

```
MIT License

Copyright (c) 2024 MatGros

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

## Contact

Pour toute question ou suggestion concernant ces projets personnels, n'hésitez pas à ouvrir une issue sur GitHub.

---

**Note :** Ces projets sont fournis "tels quels" à des fins éducatives et personnelles. Certains projets peuvent être incomplets ou en cours de développement.
