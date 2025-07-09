# Projektzusammenfassung: Umfrage-Tool als Webkomponente

## Funktionsumfang

- **Umfragen erstellen und verwalten**  
  Über die Webkomponente können Umfragen mit Einzel- und Mehrfachauswahl-Fragen erstellt werden.
- **Admin-Bereich**  
  Zugriff auf Verwaltungsfunktionen per Passwort (im initial-poll-JSON).
- **Teilnahme ohne Registrierung**  
  Nutzer können direkt per Link oder Code teilnehmen, ohne Anmeldung.
- **Auswertung**  
  Ergebnisse werden direkt nach der Abstimmung angezeigt.
- **Flexible Einbindung**  
  Die Komponente kann einfach per `<script>`-Tag und Custom Element auf beliebigen Webseiten genutzt werden.
- **Anonyme Teilnahme**  
  Es werden keine personenbezogenen Daten gespeichert, Pseudonyme sind optional.
- **QR-Code-Unterstützung**  
  Optional kann ein QR-Code zur Umfrage eingebunden werden.
- **Responsives Design**  
  Die Oberfläche ist für Desktop und mobile Geräte optimiert.

---

## Technischer Rahmen

### Architektur und Technologien
- Frontend: HTML, CSS
- Backend: JavaScript (Node.js)
- Datenbank: Optional
- Webkomponenten: Wiederverwendbar und eigenständig

### Zugang & Sicherheit
- Kein Login-System nötig
- Adminzugang per Passwort
- Umfragen über eindeutige URLs (z. B. `domain.com/htmlseite?code=abc123`)

---

# Umfrage-Webkomponente – Einbindung & Nutzung

## Schnellstart: So bindest du die Umfrage-Komponente ein

### 1. Backend-Server starten

1. **Backend-Code herunterladen oder klonen**  
   Stelle sicher, dass du den Backend-Server (z. B. Node.js) lokal oder auf einem Server verfügbar hast.

2. **Abhängigkeiten installieren**  
   Wechsle ins Backend-Verzeichnis und installiere die benötigten Pakete:
   ```bash
   npm install
   ```

3. **Server starten**  
   Starte den Server, z. B.:
   ```bash
   npm start
   ```
   oder (je nach Setup)
   ```bash
   node server.js
   ```
   Der Server sollte nun unter einer URL wie `http://localhost:8500` oder deiner Server-IP erreichbar sein.

---

### 2. Frontend/Komponente einbinden

1. **Dateien einbinden**

   Füge folgende Zeile in den `<head>`-Bereich deiner HTML-Datei ein, um die Komponente zu laden:
   ```html
   <script src="PFAD_ZUR/poll-component.js" type="module"></script>
   ```

2. **Komponente verwenden**

   Füge das Custom Element `<poll-component>` an der gewünschten Stelle im `<body>` deiner Seite ein. Beispiel:
   ```html
   <poll-component
     api-url="http://localhost:8500"
     initial-poll='{
       "title":"Feedback zur heutigen Vorlesung",
       "adminPassword":"DEIN_ADMIN_PASSWORT",
       "questions":[
         {"question":"Wie beurteilen Sie die Verständlichkeit?","type":"single","options":["Sehr verständlich","Verständlich","Eher verständlich"]},
         {"question":"Welches Thema wünschen Sie sich?","type":"multiple","options":["Praxis","Theorie","Übungen"]}
       ]
     }'
   ></poll-component>
   ```

   **Parameter:**
   - `api-url`: URL zu deinem gestarteten Backend-Server
   - `initial-poll`: JSON-String mit Titel, Admin-Passwort und Fragen

3. **Optional: QR-Code-Unterstützung**

   Für QR-Code-Generierung kannst du zusätzlich diese Zeile einbinden:
   ```html
   <script src="https://cdn.jsdelivr.net/npm/qrcode/build/qrcode.min.js"></script>
   ```

---

## Komplettes Beispiel

```html
<!DOCTYPE html>
<html lang="de">
  <head>
    <meta charset="UTF-8" />
    <title>Umfrage Beispiel</title>
    <script src="PFAD_ZUR/poll-component.js" type="module"></script>
    <script src="https://cdn.jsdelivr.net/npm/qrcode/build/qrcode.min.js"></script>
  </head>
  <body>
    <h1>Umfrage</h1>
    <poll-component
      api-url="http://localhost:8500"
      initial-poll='{
        "title":"Beispielumfrage",
        "adminPassword":"geheim",
        "questions":[
          {"question":"Gefällt dir das Projekt?","type":"single","options":["Ja","Nein"]}
        ]
      }'
    ></poll-component>
  </body>
</html>
```

---

## Hinweise

- Ersetze `PFAD_ZUR/poll-component.js` durch den tatsächlichen Pfad zur Komponente.
- Passe `api-url`, `title`, `adminPassword` und die Fragen nach deinen Anforderungen an.
- Die Einbindung des QR-Code-Skripts ist optional und nur nötig, wenn du QR-Codes nutzen möchtest.
- Die Komponente funktioniert ohne Benutzerkonten.
- Für die Admin-Funktionen ist das im JSON angegebene Passwort nötig.
