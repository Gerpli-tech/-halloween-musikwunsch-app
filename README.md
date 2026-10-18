# 🎃 Halloween-Musikwunsch-App

Öffentliche Gästeseite mit Spotify-Suche und direktem Hinzufügen zur Playlist. Gäste brauchen keinen Spotify-Account; der Veranstalter meldet sich einmalig bei Spotify an. Speicherung und Missbrauchsschutz über Upstash Redis.

## Einrichtung mit GitHub, Vercel und Spotify

1. Den **Inhalt** dieses ZIP-Pakets in ein GitHub-Repository hochladen, sodass `api`, `lib`, `public`, `package.json`, `vercel.json` direkt im Stammverzeichnis liegen. Alte Dateien gleichen Namens ersetzen. Keine Geheimnisse hochladen.
2. Das Repository unter https://vercel.com/new importieren. Vercel erkennt die Funktionen im Ordner `api`. Framework Preset: `Other`; keine eigene Build- oder Output-Directory-Einstellung setzen.
3. Über Vercel Storage / Marketplace eine Upstash-Redis-Datenbank verbinden. Benötigte Variablen sind `UPSTASH_REDIS_REST_URL` und `UPSTASH_REDIS_REST_TOKEN`.
4. In https://developer.spotify.com/dashboard eine Web-API-App anlegen. In deren Redirect-URI-Einstellungen exakt `https://DEINE-APP.vercel.app/api/auth?action=callback` eintragen. Die App-URL muss schon bekannt sein; Vercel-Deployment ggf. zuerst ausführen.
5. Unter Vercel → Project → Settings → Environment Variables diese Werte ergänzen: `SPOTIFY_CLIENT_ID`, `SPOTIFY_CLIENT_SECRET`, `APP_URL` (exakte HTTPS-Adresse **ohne Slash**), `ADMIN_PASSWORD` (eigenes starkes Passwort), `SESSION_SECRET` (mindestens 32 zufällige Zeichen). Die Redis-Werte aus Schritt 3 müssen ebenfalls vorhanden sein. Für Production auswählen.
6. Vercel → Deployments → Redeploy. `/api/health` zeigt mit `{"ready":true}`, dass die Variablen vorhanden sind; dies garantiert noch keine Spotify-Anmeldung.
7. App öffnen → Veranstalter-Bereich → Passwort → Spotify-Konto verbinden → im Spotify-Dialog bestätigen. Wieder in der App im Veranstalter-Bereich die **richtige Playlist-URL** einfügen und speichern.
8. Song selbst testen. Dann den Vercel-Link an Gäste verschicken.

## Hinweise

- Spotify ändert gelegentlich Limits und Voraussetzungen seiner Entwickler-API. Für neue Apps können Premium und Testnutzer-Beschränkungen gelten. Die API-Zugriffsrechte müssen für den Betreiber verfügbar sein.
- Bestehende Playlist wird nicht ersetzt. Neue gewünschte Songs werden hinzugefügt; doppelte App-Wünsche werden blockiert.
- Die Liste kann bis zu 200 Wünsche in der App anzeigen; die Spotify-Playlist enthält mehr, falls vorhanden.
- Für das Deployment werden GitHub, Vercel, Upstash Redis und eine Spotify Developer App benötigt. **Spotify Premium allein genügt nicht.**
- App-Zugangsdaten bleiben ausschließlich in Vercel-Umgebungsvariablen. Das Repository muss keine Geheimnisse enthalten.
- Bei Änderungen der Spotify-Playlist außerhalb der App erkennt die Duplikatsperre diese externen Lieder nicht automatisch.
