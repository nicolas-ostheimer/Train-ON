# Trial Training Planner

Persönliche Trainingsplanungs-App für Fahrradtrial. Läuft komplett lokal im Browser,
speichert alle Daten auf dem Gerät (IndexedDB) und ist als PWA offline nutzbar.

**Technik:** React + TypeScript + Vite + Tailwind CSS + Dexie.js (IndexedDB) + vite-plugin-pwa.

## App starten (zum Entwickeln/Testen)

Voraussetzung: Node.js ist installiert (geprüft mit v26).

Falls `node`/`npm` im Terminal nicht erkannt werden, Terminal einmal neu öffnen
oder die vollen Pfade verwenden (siehe unten).

### Variante A: normal (wenn npm im PATH ist)

```
npm install
npm run dev
```

Dann im Browser öffnen: http://localhost:5173/

### Variante B: wenn npm NICHT im PATH ist (volle Pfade)

```
& "C:\Program Files\nodejs\node.exe" "node_modules\vite\bin\vite.js" --host
```

Der Parameter `--host` macht die App auch im lokalen WLAN erreichbar
(z. B. http://192.168.0.139:5173/), damit du sie direkt auf dem Handy öffnen kannst.

## Produktions-Build

```
npm run build
```

Erzeugt den Ordner `dist/` mit der fertigen, offline-fähigen App inklusive Service Worker.
Vorschau des Builds: `npm run preview`.

## Auf dem Android-Handy installieren (PWA)

Wichtig: Für die Installation als App muss die Seite über die **gebaute Version** geöffnet
werden (Service Worker läuft im Dev-Modus bewusst nicht).

1. Build erstellen: `npm run build`
2. Vorschau-Server starten: `npm run preview -- --host`
   (oder: `& "C:\Program Files\nodejs\node.exe" "node_modules\vite\bin\vite.js" preview --host`)
3. Handy und PC müssen im **gleichen WLAN** sein.
4. Auf dem Handy in **Chrome** die angezeigte Netzwerk-Adresse öffnen,
   z. B. `http://192.168.0.139:4173/`.
5. Chrome-Menü (drei Punkte) → **"App installieren"** bzw. **"Zum Startbildschirm hinzufügen"**.
6. Die App erscheint als Icon auf dem Startbildschirm und startet im Vollbild.

Nach dem ersten erfolgreichen Laden funktioniert die App auch **offline**.

Hinweis: Dauerhaft ohne laufenden PC geht es, wenn du die App einmal auf einen Webhost
(z. B. Netlify, Vercel, GitHub Pages) lädst. Für den Start reicht aber der PC im WLAN.

## Daten sichern (Backup) und wiederherstellen

Alle Daten liegen **nur auf dem Gerät**. Darum regelmäßig ein Backup machen:

- **Export:** In der App oben rechts auf das Zahnrad → **"Daten exportieren (JSON)"**.
  Es wird eine Datei `trial-planner-backup-JJJJ-MM-TT.json` heruntergeladen.
  Diese Datei an einem sicheren Ort aufbewahren (Cloud, PC, E-Mail an dich selbst).
- **Import:** Zahnrad → **"Daten importieren"** → JSON-Datei wählen.
  - **Zusammenführen:** ergänzt vorhandene Daten.
  - **Ersetzen:** löscht alle aktuellen Daten und setzt den Backup-Stand ein (mit Rückfrage).

Tipp: Vor größeren Änderungen und vor einem Gerätewechsel immer zuerst exportieren.

## Was die App kann

- **Dashboard:** Begrüßung, heutiges Datum, Trainings von heute als Karten, erledigte markiert.
- **Wochenplan:** Mo–So, Wochen wechseln, Einheiten einplanen, verschieben (Drag & Drop oder Verschieben-Knopf), löschen.
- **Übungen:** erstellen, bearbeiten, löschen, suchen, nach Kategorie filtern (Trial, Gym, Ausdauer, Sonstiges).
  Jede Übung hat **frei definierbare Parameter** (Zahl, Text, Auswahl) – du bestimmst selbst, was erfasst wird.
- **Trainingseinheiten (Vorlagen):** aus Übungen zusammenstellen, Reihenfolge ändern, Zielwerte setzen,
  speichern, kopieren und beliebig oft in den Wochenplan übernehmen.
- **Training abschließen:** als erledigt oder nicht absolviert markieren, Ist-Werte und Notiz erfassen.
  Geplante Werte und gespeicherte Protokolle bleiben unverändert, auch wenn die Vorlage später geändert wird.
- **Backup:** vollständiger JSON-Export/-Import mit Gültigkeitsprüfung.

## Datenmodell (kurz)

Saubere Trennung in vier Tabellen (IndexedDB über Dexie):

- `exercises` – Übungsvorlagen inkl. Parameter-Definitionen
- `templates` – Trainingseinheit-Vorlagen (mit kopierten Übungsdaten)
- `scheduled` – geplante Einheiten im Kalender (eigene Datenkopie)
- `logs` – Protokolle abgeschlossener Trainings (unabhängiger Snapshot)

So verändert eine Planung oder ein Protokoll nie die ursprüngliche Vorlage.
