# 📊 Projektzusammenfassung: Umfrage-Tool als Webkomponente

http://141.72.13.151:8500

## 🎯 Projektziel
Entwicklung eines einfachen, kollaborativen **Umfrage-Tools**, das:
- Ohne Benutzerkonten funktioniert
- Über einen **Beitrittslink oder Code** zugänglich ist
- Admins Umfragen erstellen und verwalten lässt
- Teilnehmer Umfragen ausfüllen können
- Wiederverwendbare **Webkomponenten** nutzt

---

## 🧩 Geplante Funktionen

### 🛠️ Admin-Funktionen
- Umfragen erstellen und verwalten
- Admin-Zugang über Button + Passwort
- Übersicht über Teilnehmer (z. B. Anzahl)
- Umfragen manuell beenden (kein Timeout nötig)
- IP-Adressen temporär sperren (z. B. über einfache Liste)

### ✅ Teilnehmer-Funktionen
- Beitritt per Link oder Code
- Teilnahme an einer oder mehreren Umfragen
- Keine Registrierung oder Anmeldung
- Einfache UI mit zB:
  - **Runde Buttons** für Einfachauswahl
  - **Eckige Buttons** für Mehrfachauswahl

### 📋 Umfrage-Funktionen
- Unterstützung für:
  - Einfach- und Mehrfachauswahl etc.
  - "Anonyme" Abstimmungen (Pseudonym optional)
- **Jeder Umfrage gehört ein eigener Admin**

---

## 🧱 Technischer Rahmen

### 🧰 Architektur und Technologien
- **Frontend**: HTML, CSS
- **Backend**: js
- **Datenbank**: Optional
- **Webkomponenten**: Wiederverwendbar und eigenständig

### 🔐 Zugang & Sicherheit
- Kein Login-System nötig
- Adminzugang per Button & Passwort
- Umfragen über eindeutige URLs (z. B. `domain.com/s/abc123`)

### 🚀 Deployment / CI/CD
- **CI mit GitHub Actions**:
  - Linting
  - Tests
  - Docker Build
- **CD manuell via Pull auf Server**:
  - Server zieht neue Versionen selbst (Watchtower, GitHub Pull über Jobrunner)
- **Docker auf Server vorhanden** - könnten wir also nutzen wenn wir wollen

---

## ✅ Bewertungskriterien (max. 100 Punkte)

| Kategorie                            | Punkte |
|-------------------------------------|--------|
| Code Reviews                        | 10     |
| Abschlusspräsentation               | 5      |
| Vorführung                          | 10     |
| Funktionsumfang                     | 15     |
| Dokumentation (Dev + Benutzer)      | 5      |
| Code- und Testqualität (HTML/CSS/JS)| 40     |
| Build-Prozess                       | 5      |
| **Gesamt**                          | **90 + 10 (Code Review)** |

### ➕ Weitere Anforderungen
- **Kurzes Einführungsvideo (10–15 min)** zur Code-Struktur
- Dokument mit:
  - Eingesetzten **KI-Tools** (auch „Fehlanzeige“ möglich)
  - **Mitwirkenden** pro Projektteil

---

## 🧠 Nächste Schritte für die Gruppe

### 1. 📌 Rollenverteilung
- Wer übernimmt: Frontend, Backend, Admin-UI, CI, Doku, Präsentation?

### 2. 📐 Planung & Architektur
- Welche Komponenten sind notwendig?
  - Umfrage-Komponente (Teilnehmer)
  - Admin-Komponente
  - Ergebnisanzeige

### 3. 🧑‍💻 Technologiewahl
- Datenbank: ja/nein?

### 4. 🧪 CI / Buildprozess
- GitHub Actions:
  - Linting
  - Unit Tests
  - Docker Build
- Erstellung von Dockerfile und docker-compose.yml

### 5. 🚀 Deployment-Konzept
- Docker-Container → GitHub → Pull durch Server (z. B. Watchtower)

---

## 🌟 Erweiterungsideen (optional)
- Live-Ergebnisanzeige für Teilnehmer
- Exportfunktion für Ergebnisse (CSV)
- QR-Code-Generierung für Umfragelinks
- Dark-Mode
- Zeitgesteuerte Umfragen



 