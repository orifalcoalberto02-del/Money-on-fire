# Cassa: spese, ricorrenti e debiti su iPhone e Mac

App web installabile (PWA) fatta su misura per te. Funziona su iPhone e Mac, anche offline, e sincronizza i dati in tempo reale.

**Cosa fa**
- Spese ed entrate con **titolo** (cosa hai comprato) e **categoria** (serve a raggrupparle), ambito **Personale / Lavoro** e filtro globale in alto
- **Scansione dello scontrino**: dal "Nuovo movimento" tocca *Scansiona scontrino*; l'app legge importo, data, negozio e propone una categoria. I campi compilati sono evidenziati e li controlli tu prima di salvare. La foto viene letta in memoria sul tuo dispositivo e poi scartata: non viene salvata né inviata a nessun servizio
- Icone coerenti per ogni categoria, nell'elenco e nell'**Analisi rapida** della Home (i riquadri con le categorie dove spendi di più nel mese)
- Pagamenti ricorrenti (affitto, abbonamenti, rate) con elenco "Da pagare questo mese" e tasto *Fatto*
- Debiti e crediti con persone terze, con pagamenti parziali e saldo per persona
- Analisi: spese per categoria, budget mensili, ultimi 6 mesi, totale annuo del lavoro
- Esporta CSV (per Excel/Numbers) e backup JSON

---

## 1. Provala subito (modalità locale)

Dalla cartella dell'app, nel Terminale del Mac:

```
python3 -m http.server 8000
```

Poi apri http://localhost:8000. Senza configurazione i dati restano solo su quel dispositivo.
(Aprendo `index.html` con doppio clic non funziona: servono i moduli web.)

## 2. Attiva la sincronizzazione (Firebase, gratis)

1. Vai su https://console.firebase.google.com e crea un progetto (puoi disattivare Google Analytics).
2. **Aggiungi app → Web** (icona `</>`). Dai un nome, non serve Firebase Hosting. Copia i valori `apiKey`, `authDomain`, `projectId`, `appId` dentro **`config.js`**.
3. **Build → Authentication → Inizia → Email/Password → Abilita.**
4. **Build → Firestore Database → Crea database.** Scegli una regione europea (es. `eur3` o `europe-west`) e modalità produzione.
5. Nella scheda **Regole** di Firestore incolla il contenuto di **`firestore.rules`** e premi *Pubblica*. Ogni utente vede solo i propri dati.

La chiave `apiKey` di Firebase non è un segreto: a proteggere i dati sono le regole del punto 5.

## 3. Pubblicala (GitHub Pages)

1. Crea un repository su GitHub e carica **tutti** i file di questa cartella (incluse `icons/`).
2. **Settings → Pages → Deploy from a branch → main / (root).** Dopo un minuto l'app è su `https://TUONOME.github.io/NOMEREPO/`.
3. In Firebase: **Authentication → Impostazioni → Domini autorizzati → Aggiungi dominio** e inserisci `TUONOME.github.io`. Senza questo passaggio l'accesso non funziona.

## 4. Installala

- **iPhone:** apri l'indirizzo in **Safari** → Condividi → **Aggiungi alla schermata Home**.
- **Mac:** apri l'indirizzo in Safari → File → **Aggiungi al Dock** (macOS Sonoma o successivi), oppure in Chrome → Installa.

Al primo avvio premi **Crea account** con email e password (minimo 6 caratteri), poi accedi con le stesse credenziali sull'altro dispositivo.

## Passare dai dati locali al cloud

Se hai già provato l'app in modalità locale: Impostazioni → *Backup completo (JSON)*. Dopo aver attivato Firebase e fatto l'accesso: Impostazioni → *Ripristina da backup*.

## Aggiornare l'app

Dopo aver modificato i file, cambia il numero in `const VER = 'cassa-v2'` dentro `sw.js` (es. `cassa-v3`) e ricarica il sito su GitHub Pages.

## Nota sulla lettura degli scontrini

- Il lettore (Tesseract, in italiano) è nella cartella `ocr/` (circa 9 MB). **Non pesa finché non lo usi**: si scarica la prima volta che scansioni uno scontrino (circa 6 MB), poi resta sul dispositivo e funziona anche offline.
- Funziona meglio con scontrino piatto, ben illuminato e inquadrato da vicino. Dopo la scansione controlla sempre importo e data: la lettura di un OCR non è infallibile.
- Quando chiudi il foglio "Nuovo movimento" il lettore viene spento per liberare memoria.
- Caratteri: Playfair Display e Montserrat (licenza SIL OFL) sono inclusi in `fonts/`, quindi l'app non dipende da Google Fonts.

## File

| File | A cosa serve |
|---|---|
| `index.html`, `style.css`, `app.js` | l'app |
| `config.js` | i tuoi dati Firebase |
| `sw.js`, `manifest.webmanifest`, `icons/` | installazione e uso offline |
| `fonts/` | Playfair Display e Montserrat |
| `ocr/` | lettore degli scontrini (si scarica solo al primo utilizzo) |
| `firestore.rules` | regole di sicurezza del database |
