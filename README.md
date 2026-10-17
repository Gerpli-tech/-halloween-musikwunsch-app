# 🎃 Halloween Musikwunsch-App

Die Gäste suchen ihren Song, geben einen Namen ein und der Wunsch wird **direkt** in deine private Spotify-Playlist eingetragen. Alle Gäste sehen dieselbe Wunschliste. Der Veranstalter verbindet Spotify nur einmal, Gäste brauchen **kein Spotify-Konto**.

## Einmalige Einrichtung

1. Lade alle Dateien dieses Projekts in ein **privates** GitHub-Repository hoch (alle Dateien und Unterordner, nicht nur index.html).
2. Öffne [vercel.com](https://vercel.com/), melde dich mit GitHub an, wähle `Add New > Project`, importiere das Repository. Framework: `Other`, Build Command leer lassen, Output Directory leer lassen.
3. Erstelle im Vercel-Projekt unter **Storage** / **Marketplace** eine **Upstash Redis**-Datenbank und verbinde sie mit dem Projekt. Falls die Variablen `UPSTASH_REDIS_REST_URL` und `UPSTASH_REDIS_REST_TOKEN` nicht automatisch angelegt werden, setze sie mit den REST-Werten von Upstash. Achte darauf, dass das Redis-REST-Interface für `@upstash/redis` verfügbar ist.
4. Öffne [developer.spotify.com/dashboard](https://developer.spotify.com/dashboard), lege eine App an und hinterlege als Redirect URI genau `https://DEINE-APP.vercel.app/api/auth?action=callback`. In der Spotify-Entwickler-App die korrekte Web API-Integration auswählen und eventuelle Spotify-Entwicklermodus-Beschränkungen beachten.
5. Setze in Vercel unter **Settings > Environment Variables**: `SPOTIFY_CLIENT_ID`, `SPOTIFY_CLIENT_SECRET`, `APP_URL` (ohne Slash am Ende), `ADMIN_PASSWORD` und `SESSION_SECRET` (mindestens 32 zufällige Zeichen). Die Beispielwerte aus `.env.example` nicht unverändert verwenden. **Nie Spotify Secret oder Passwort in GitHub hochladen.**
6. Das Projekt auf Vercel erneut bereitstellen (`Deployments > Redeploy`). Öffne die Vercel-Webadresse, melde dich unten als Veranstalter an und tippe auf **Spotify-Konto verbinden**. Spotify-Login bestätigen.
7. Jetzt kannst du den Vercel-Link an alle Gäste schicken, gerne bereits Tage vor der Party.

## Hinweise

- Spotify Premium ist vorhanden, aber nicht für die Eingabe von Gästewünschen erforderlich.
- Spotify kann bei neuen Apps Testnutzer-Beschränkungen haben. Wenn die Playlist-Verbindung nicht klappt, füge den verwendeten Spotify-Account in den Spotify-App-Einstellungen zu den berechtigten Testnutzern hinzu.
- Ein gespeicherter Wunsch wird erst nach erfolgreichem Spotify-Playlist-Update angezeigt.
- Um die Playlist zu öffnen, unten als Veranstalter anmelden. Gäste bekommen keinen Zugriff auf das Passwort.
- Serverloses Hosting erfordert die Redis-Datenbank: GitHub Pages allein genügt **nicht**.

## Sicherheit

Die Website nutzt HttpOnly-Admin-Cookies und hält Spotify-Tokens serverseitig in Redis. Keine Zugangsdaten ins Repository hochladen. Die Seite hat ein einfaches IP-Ratenlimit und überprüft Songs serverseitig. Für einen großen öffentlichen Einsatz wären zusätzlich Captcha und Transaktionssperren gegen zeitgleiche Doppeleinträge sinnvoll.
