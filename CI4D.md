SPECIFICA TECNICA — NON IMPLEMENTATIVA
CI4D V1
Technical Architecture & Function Specification
Creative Intelligence for 3D — Backend V1

Documento di progettazione per lo sviluppo incrementale, file per file, del backend che collega il frontend Next.js esistente a un motore di slicing open source guidato da un modulo AI di suggerimento parametri.

Versione 1.1 — Agosto 2026 (revisione corretta)
Documento redatto per essere consegnato, in tutto o per sezioni, a un secondo agente AI incaricato dell'implementazione file per file.
Nota di revisione — Versione 1.1
Questa versione integra le correzioni emerse da una revisione tecnica della v1.0: correzione della licenza reale di CuraEngine (Sez. 5), chiarimento sullo stato VALIDATING nel ciclo di vita del job (Sez. 16.1), chiarimento sul polling per lo slicing sincrono (Sez. 8), esplicitazione della risoluzione profili nell'endpoint /slice (Sez. 8), e chiarimento sulla differenza tra manual_parameter_overrides e PUT /parameters (Sez. 10.1). Le modifiche sono segnalate con la nota [CORREZIONE v1.1] nei punti rilevanti.


Indice
1. Introduzione, Obiettivi e Perimetro della V1
2. Analisi Critica dell'Architettura (Executive Summary)
3. Frontend Esistente e Contratto di Integrazione
4. Flusso Principale — Panoramica
5. Scelta del Motore di Slicing
6. Struttura del Backend
7. Specifiche Dettagliate per File e Funzione
8. API REST — Specifica Completa degli Endpoint
9. Analisi del Modello 3D
10. Dati Richiesti all'Utente
11. Modulo AI
12. Validazione dei Parametri di Stampa
13. Pipeline di Slicing
14. Gestione e Validazione del G-code
15. Chat AI Contestuale
16. Gestione dei Job
17. File Temporanei e Ciclo di Vita dei Dati
18. Database — Valutazione e Decisione
19. Sicurezza
20. Logging
21. Test da Sviluppare
22. Dipendenze Python
23. Flusso Completo Dati End-to-End
24. Mappa delle Dipendenze tra Moduli
25. Ordine di Sviluppo Consigliato
26. Appendice — Schemi Dati di Riferimento

1. Introduzione, Obiettivi e Perimetro della V1
CI4D (Creative Intelligence for 3D) è un software che vuole semplificare il processo di stampa 3D affiancando un motore di slicing open source con un modulo di intelligenza artificiale che propone i parametri di stampa al posto dell'utente, riducendo la complessità tipica degli slicer tradizionali.
La V1 descritta in questo documento ha un obiettivo deliberatamente ristretto:
UTENTE CARICA MODELLO 3D
→ CI4D ANALIZZA IL MODELLO
→ RACCOGLIE INFORMAZIONI DALL'UTENTE
→ L'AI DETERMINA I PARAMETRI DI STAMPA
→ IL MOTORE SLICER GENERA IL G-CODE
→ L'UTENTE SCARICA IL G-CODE
Tutto ciò che non serve a completare questo flusso in modo affidabile è esplicitamente escluso dalla V1 (multi-slicer, orientamento automatico avanzato, gestione remota delle stampanti, marketplace, account complessi, agenti AI multipli). Queste esclusioni sono elencate puntualmente nelle sezioni corrispondenti insieme alla motivazione.
Principio guida
Ogni decisione architetturale in questo documento è stata presa applicando lo stesso criterio: la soluzione più semplice che permetta a un motore di slicing reale di produrre un G-code corretto, con un'AI che consiglia — non impone — i parametri.
Come leggere questo documento
Il documento è pensato per essere consegnato a un secondo agente AI (o a uno sviluppatore) incaricato di implementare un file alla volta. La Sezione 7 è il cuore del documento. Le sezioni 8-21 approfondiscono i sotto-sistemi trasversali. Le sezioni 22-26 forniscono le viste d'insieme.
2. Analisi Critica dell'Architettura (Executive Summary)
Questa sezione riporta i punti critici individuati nella richiesta originale e le decisioni prese per risolverli.
2.1 Punti di attenzione individuati e soluzioni adottate
Problema individuato
Rischio se non risolto
Decisione adottata
Ambito troppo ampio di core/ non distinto da services/
Confusione su dove mettere la logica di business
core/ ristretto a infrastruttura trasversale; logica di dominio in services/. Vedi Sez. 6.
Nessuna cartella per dati statici (profili)
Profili sparsi/hardcoded, impossibile aggiungere una stampante senza toccare il codice
Aggiunta backend/data/ con printers/ e materials/ in JSON, caricati da profile_service.py.
L'AI potrebbe decidere l'orientamento in modo completo
Auto-orientamento è un problema geometrico non banale
L'AI fornisce solo un suggerimento euristico testuale; nessun algoritmo di ottimizzazione in V1 (funzionalità futura, Sez. 11).
Rischio che l'AI produca G-code o override diretti
Perdita di controllo, superficie di attacco enorme
L'AI restituisce solo un JSON di parametri; il G-code è prodotto esclusivamente dal motore slicer. Vedi Sez. 11.4.
Necessità o meno di un database relazionale
Un DB aggiungerebbe complessità per un volume dati minimo
Nessun DB in V1. Stato job in memoria + snapshot JSON su disco. Vedi Sez. 18.
Scelta del motore di slicing non ovvia
Scelta sbagliata → problemi di licenza o integrazione fragile
Scelto CuraEngine. Analisi comparativa in Sez. 5 [CORREZIONE v1.1: motivazione di licenza rivista].
Chat AI che deve accedere a dati eterogenei
Dipendenze incrociate difficili da mantenere se interroga i service direttamente
La chat legge solo lo Job via job_manager, mai i service di dominio. Vedi Sez. 15.
Utente avanzato che modifica i parametri AI
Un override mal progettato bypasserebbe la validazione
Ogni modifica manuale passa da validation_service, senza percorsi alternativi. Vedi Sez. 8 e 12.

2.2 Modifiche rispetto allo schema di flusso indicativo fornito
Lo schema a 16 passi fornito nella richiesta è stato mantenuto nella sostanza. I passi "validazione parametri" e "passaggio al motore slicer" sono stati separati in due responsabilità distinte (validation_service.py e slicer_service.py) per garantire che nessun parametro raggiunga il motore senza un controllo esplicito e testabile.
2.3 Cosa NON è stato messo in discussione
La struttura a due livelli di utente (principiante/avanzato), il vincolo di un solo motore slicer, l'assenza di multi-agente AI e l'assenza di gestione remota delle stampanti sono confermati come richiesti.
3. Frontend Esistente e Contratto di Integrazione
Il frontend (Next.js / React / TypeScript, generato con v0.dev) non viene toccato in questa fase. Il backend deve esporre un'API REST stabile che copra esattamente le schermate già esistenti:
Elemento frontend esistente
Dati richiesti/inviati al backend
Area Drag & Drop / Slicer AI
Upload file 3D → riceve job_id e stato iniziale
Visualizzatore 3D
Riceve il file caricato e, se disponibile, il risultato dell'analisi geometrica
Sidebar impostazioni / stampante / materiale
GET /printers, GET /materials; invia dati utente via POST /jobs/{id}/user-data
Pulsante "Genera parametri"
POST /jobs/{id}/ai-suggest → parametri proposti + motivazione testuale
Pulsante "Avvia slicing"
POST /jobs/{id}/slice [CORREZIONE v1.1: risposta diretta e sincrona, senza polling necessario in V1 — vedi Sez. 8]
Pulsante "Scarica G-code"
GET /jobs/{id}/gcode
Chat AI
POST /jobs/{id}/chat e GET /jobs/{id}/chat/history
Create AI (Beta)
Fuori perimetro V1: nessun endpoint dedicato
Pagina Impostazioni
In V1 non richiede backend dedicato

3.1 Formato di comunicazione
Tutte le API restituiscono JSON. Gli upload usano multipart/form-data. Il download del G-code restituisce un file binario/testuale. Non è richiesta autenticazione in V1 (vedi Sez. 8 e 19): il frontend è considerato client fidato in fase di sviluppo locale/demo.
4. Flusso Principale — Panoramica
#
Fase
Modulo responsabile
1
Upload del file 3D
api/routes_upload.py → services/file_service.py
2
Creazione job
core/job_manager.py
3
Validazione file
services/file_service.py + core/security.py
4
Analisi geometrica del modello
services/model_analysis_service.py
5
Raccolta dati utente
api/routes_jobs.py → services/profile_service.py
6
Costruzione contesto per l'AI
ai/prompt_builder.py
7
Suggerimento parametri AI
ai/ai_client.py + ai/ai_parser.py
8
Validazione parametri
services/validation_service.py
9
Invocazione motore slicer
services/slicer_service.py
10
Produzione e validazione G-code
services/gcode_service.py
11
Notifica risultato al frontend
api/routes_jobs.py / api/routes_slicing.py
12
Download G-code
api/routes_slicing.py
13
Chat AI contestuale
ai/chat_service.py → api/routes_chat.py

5. Scelta del Motore di Slicing
[CORREZIONE v1.1]
La versione 1.0 di questo documento riportava CuraEngine come "licenza LGPL 3.0", presentandolo come l'unico dei tre candidati privo di implicazioni AGPL. È un errore fattuale: CuraEngine, il motore vero e proprio (repository Ultimaker/CuraEngine), è distribuito sotto AGPLv3 — esattamente come PrusaSlicer e OrcaSlicer. È solo l'applicazione Cura (l'interfaccia grafica, repository separato) ad essere passata a LGPL nel 2018; il motore di slicing invocato via CLI resta AGPL. La tabella e la motivazione sottostanti sono state corrette di conseguenza.

La V1 deve usare un solo motore. Vengono confrontati i tre candidati indicati nella richiesta sui criteri rilevanti per un'integrazione backend headless (nessuna GUI, invocazione programmatica).
Criterio
CuraEngine
PrusaSlicer (CLI)
OrcaSlicer (CLI)
Licenza
AGPL 3.0 — stessa famiglia di licenza copyleft forte degli altri due candidati; nessun vantaggio legale specifico rispetto agli altri
AGPL 3.0 — copyleft forte; se il backend interagisce con l'utente su rete (SaaS) può richiedere di rendere disponibile il codice sorgente collegato
AGPL 3.0 (fork di Bambu Studio/PrusaSlicer) — stesse implicazioni di PrusaSlicer
Invocazione CLI/headless
Nativamente pensato per essere headless: CuraEngine slice -j printer.def.json -l model.stl -o output.gcode
CLI presente ma storicamente meno stabile tra versioni, alcune build richiedono librerie grafiche installate
CLI meno documentata e meno matura; orientato principalmente all'uso desktop con GUI
Gestione profili
Definizioni JSON gerarchiche, facilmente componibili e versionabili a runtime senza GUI
Profili INI, pensati per essere editati/esportati dalla GUI; meno naturali da generare a runtime
Eredita il sistema di profili di Bambu/Prusa, stessa complessità di integrazione headless
Qualità dello slicing
Ottima e ampiamente validata (motore dietro Ultimaker Cura)
Ottima, spesso considerata leggermente superiore su geometrie complesse
Molto buona, ottimizzazioni per stampanti Bambu Lab
Difficoltà tecnica di integrazione
Bassa: eseguibile singolo, parametri via CLI/JSON
Media: build più pesante, comportamento CLI meno uniforme
Medio-alta: CLI meno stabile, community più piccola

5.1 Decisione
Il motore scelto per la V1 resta CuraEngine.
Motivazione (corretta, senza il presunto vantaggio di licenza): è l'unico dei tre progettato fin dall'origine per l'uso headless via CLI, senza dipendenze grafiche residue; il suo sistema di profili JSON è il più adatto a essere generato/mergiato a runtime da codice Python, esattamente ciò che serve a slicer_service.py (Sez. 7.4 e Sez. 13); qualità di slicing più che sufficiente per l'obiettivo V1; documentazione e community più ampie per uso da riga di comando rispetto agli altri due candidati.
5.2 Come il backend comunica con CuraEngine (solo interfaccia, nessuna implementazione)
CuraEngine viene invocato come processo esterno tramite subprocess da services/slicer_service.py, mai importato come libreria Python.
Input: il file del modello (STL), uno stack di definizioni JSON (stampante + estrusore) e un insieme di override di settaggio (materiale + parametri AI, già validati).
Output atteso: un file G-code su percorso noto, più stdout/stderr catturati per diagnosticare eventuali errori.
Il backend non modifica né builda CuraEngine: si presuppone un eseguibile precompilato disponibile nel sistema (percorso configurabile in config.py).
5.3 Implicazioni AGPL — trattamento esplicito [CORREZIONE v1.1]
A differenza della versione 1.0 (che dichiarava la questione "evitata del tutto"), l'implicazione AGPL va gestita esplicitamente, con questa logica:
Fase attuale (uso locale/demo, codice CI4D privato, nessun accesso di terzi via rete): l'AGPL non impone alcun obbligo pratico. La clausola di rete si attiva quando il software è reso disponibile a utenti terzi tramite un servizio in rete gestito da chi lo distribuisce — condizione non soddisfatta con CI4D eseguito localmente. Il codice del backend CI4D resta quindi privato senza violare l'AGPL, finché resta in questo scenario d'uso.
Invocazione tramite subprocess, mai linking/import: slicer_service.py invoca CuraEngine esclusivamente come processo esterno (Sez. 7.4, 13), mai come libreria importata. Questo riduce, senza azzerare, il rischio di essere considerati un'opera "combinata" con CuraEngine ai fini AGPL.
Prima di un eventuale passaggio a servizio SaaS multi-utente: la decisione va rivalutata con un parere legale reale. Le opzioni saranno: (a) rilasciare il codice CI4D come open source compatibile, (b) sostituire il motore con una soluzione a licenza commerciale, o (c) isolare l'invocazione del motore in un microservizio separato con interfaccia netta. Questo è un rischio noto e monitorato, non un problema risolto, e va portato avanti in ogni versione futura del documento.
6. Struttura del Backend
Rispetto alla struttura indicativa fornita nella richiesta, sono state introdotte due modifiche motivate in Sez. 2.1: separazione più netta tra core/ (infrastruttura) e services/ (dominio), e aggiunta di data/ per i profili statici.
backend/
├── main.py                    # entrypoint FastAPI, registra i router
├── config.py                  # impostazioni centralizzate (env-based)
│
├── api/                       # HTTP layer — nessuna logica di dominio
│   ├── __init__.py
│   ├── deps.py
│   ├── routes_upload.py
│   ├── routes_jobs.py
│   ├── routes_printers.py
│   ├── routes_materials.py
│   ├── routes_ai.py
│   ├── routes_slicing.py
│   └── routes_chat.py
│
├── core/                      # infrastruttura trasversale, non di dominio
│   ├── __init__.py
│   ├── job_manager.py
│   ├── exceptions.py
│   ├── logging_config.py
│   └── security.py
│
├── models/                    # schemi dati (Pydantic), nessuna logica
│   ├── __init__.py
│   ├── job.py
│   ├── model_analysis.py
│   ├── print_parameters.py
│   ├── printer_profile.py
│   ├── material_profile.py
│   ├── gcode_result.py
│   └── chat.py
│
├── services/                  # logica di dominio
│   ├── __init__.py
│   ├── file_service.py
│   ├── model_analysis_service.py
│   ├── profile_service.py
│   ├── validation_service.py
│   ├── slicer_service.py
│   └── gcode_service.py
│
├── ai/                         # tutto ciò che parla con l'LLM
│   ├── __init__.py
│   ├── prompt_builder.py
│   ├── ai_client.py
│   ├── ai_parser.py
│   └── chat_service.py
│
├── utils/                      # funzioni pure, senza stato
│   ├── __init__.py
│   ├── id_generator.py
│   └── file_utils.py
│
├── data/                       # profili statici versionabili
│   ├── printers/
│   │   ├── generic_small_fdm.json
│   │   └── generic_large_fdm.json
│   └── materials/
│       ├── pla.json
│       ├── petg.json
│       └── abs.json
│
├── uploads/                    # runtime — file 3D caricati
├── output/                     # runtime — config generate e G-code
├── logs/                       # runtime — file di log
├── jobs_state/                 # runtime — snapshot JSON dei job
│
└── requirements.txt
6.1 Motivazione delle scelte principali
Cartella
Perché esiste
core/
Ristretta a infrastruttura riusabile (job manager, eccezioni, logging, sicurezza). Non conosce il dominio.
services/
Contiene tutta la logica specifica del dominio "stampa 3D". Orchestrata dall'API.
ai/
Isolato da services/ per ciclo di vita e dipendenze diverse (chiamate esterne, prompt, parsing non deterministico).
data/ (AGGIUNTA)
Profili stampante/materiale come dati versionabili (JSON), non codice.
jobs_state/ (AGGIUNTA)
Sostituisce l'esigenza di un database (Sez. 18): job serializzati come JSON su disco.
utils/
Limitata a generazione ID e utility di file system generiche. Logica di dominio va in services/.

7. Specifiche Dettagliate per File e Funzione
Questa è la sezione di riferimento per l'implementazione. Ogni scheda file riporta: scopo, classi/funzioni con firma logica, input/output tipizzati, errori possibili, moduli chiamabili/vietati, dipendenze esterne, dati letti/modificati e stato mantenuto.
7.1 config.py e main.py
backend/config.py
Scopo: punto unico di lettura delle variabili di configurazione. Nessun altro file deve leggere os.environ direttamente.
Classe: Settings — contenitore immutabile delle impostazioni.
Campo
Tipo
Descrizione
APP_ENV
str
"development" / "production"
UPLOAD_DIR, OUTPUT_DIR, LOGS_DIR, JOBS_STATE_DIR, DATA_DIR
str (path)
Cartelle runtime, vedi Sez. 6
MAX_UPLOAD_SIZE_MB
int
Default consigliato: 200
ALLOWED_EXTENSIONS
list[str]
Default: [".stl", ".obj"]
CURA_ENGINE_PATH
str (path eseguibile)
Percorso al binario CuraEngine
CURA_DEFINITIONS_DIR
str (path)
Cartella con definizioni JSON base di CuraEngine
SLICING_TIMEOUT_SECONDS
int
Default consigliato: 180
AI_PROVIDER, AI_API_KEY, AI_MODEL
str
Configurazione del provider LLM esterno
AI_TIMEOUT_SECONDS, AI_MAX_RETRIES
int
Default consigliati: 30, 2
LOG_LEVEL
str
"INFO" default
CORS_ORIGINS
list[str]
Origini frontend consentite

Funzione: get_settings() → Settings — singleton cachato. Errori: variabile obbligatoria mancante → ConfigurationError fail-fast all'avvio. Moduli che NON deve chiamare: qualsiasi modulo applicativo. Dipendenze esterne: pydantic-settings.
backend/main.py
Scopo: entrypoint dell'applicazione. Crea l'app FastAPI, registra i router, configura CORS e logging, prepara le cartelle runtime.
Funzione
Output
Errori & gestione
create_app()
istanza FastAPI
—
on_startup()
None
Cartella non creabile → log critico + uscita. Profilo malformato → warning, escluso.
on_shutdown()
None
Flush dei log; nessun errore bloccante previsto.

Moduli che può chiamare: config, core.logging_config, core.exceptions, tutti i router in api/, services.profile_service (solo precaricamento cache a startup). NON deve chiamare: ai/*, services.slicer_service, services.model_analysis_service direttamente.
7.2 core/
backend/core/job_manager.py
Scopo: unica fonte di verità sullo stato dei job. Classe: JobManager (singleton via dependency injection FastAPI).
Metodo
Input
Output
Errori & gestione
create_job(original_filename, stored_file_path)
str, str
Job (status=CREATED)
Fallimento scrittura snapshot → warning non bloccante
get_job(job_id)
str
Job
JobNotFoundError → HTTP 404
update_job(job_id, **fields)
str, campi
Job aggiornato
JobNotFoundError se assente
set_status(job_id, status, error=None)
str, JobStatus, str|None
Job aggiornato
Transizione non valida → warning, non bloccante
list_jobs()
—
list[JobSummary]
uso interno/debug
delete_job(job_id)
str
None
JobNotFoundError; invoca file_service.delete_job_files

Moduli che può chiamare: models.job, services.file_service (solo delete_job_files), core.exceptions, core.logging_config, utils.id_generator. NON deve chiamare: ai/*, services.slicer_service, services.model_analysis_service, services.validation_service — gestisce solo stato, mai logica di dominio.
Stato mantenuto: dizionario in memoria {job_id: Job}, ricostruito a startup da jobs_state/.
backend/core/exceptions.py
Scopo: gerarchia unica delle eccezioni applicative. Nessuna logica, solo definizioni di classi.
Eccezione
Sottoclasse di
Mappatura HTTP
CI4DException
Exception
500 (default)
FileValidationError
CI4DException
400
FileTooLargeError
FileValidationError
413
UnsupportedFormatError
FileValidationError
415
PathTraversalError
FileValidationError
400
ModelAnalysisError
CI4DException
422
JobNotFoundError
CI4DException
404
ProfileNotFoundError
CI4DException
404
ParameterValidationError
CI4DException
422
AIResponseError
CI4DException
502
AIProviderUnavailableError
CI4DException
503
EngineNotFoundError
CI4DException
500
SlicingError
CI4DException
422
SlicingTimeoutError
SlicingError
504
GCodeValidationError
CI4DException
422
ConfigurationError
CI4DException
fatale a startup

backend/core/logging_config.py
setup_logging(level, log_dir) → None. Cartella non scrivibile → fallback su stdout con warning. get_logger(name) → Logger. Moduli che può chiamare: config. Cosa NON deve mai loggare: vedi Sez. 20.
backend/core/security.py
Funzione
Input
Output
Errori & gestione
sanitize_filename(filename)
str
str
Rimuove separatori/caratteri di controllo/".."; non solleva eccezioni
validate_extension(filename, allowed)
str, list[str]
bool
—
safe_join(base_dir, filename)
str, str
str (path assoluto)
PathTraversalError se esce da base_dir
validate_file_size(size_bytes, max_mb)
int, int
bool
—

Moduli che NON deve chiamare: services/* (relazione a senso unico).
7.3 models/
Tutti i file in models/ contengono esclusivamente schemi Pydantic. Nessuna logica di business, I/O o chiamate ad altri service. Possono importare solo altri models/* e pydantic.
backend/models/job.py
Enum JobStatus: CREATED, UPLOADED, ANALYZING, ANALYZED, AWAITING_USER_DATA, READY_FOR_AI, AI_SUGGESTING, AI_SUGGESTED, SLICING, COMPLETED, FAILED.
[CORREZIONE v1.1]
Lo stato VALIDATING presente nella v1.0 è stato rimosso dall'enum. Motivazione completa in Sez. 16.1.

Classe Job — campi: job_id (str), created_at/updated_at (datetime), status (JobStatus), original_filename/stored_file_path/model_format (str), analysis (ModelAnalysisResult | None), user_data (UserPrintRequest | None), ai_parameters (PrintParameters | None), ai_reasoning (str | None), validated_parameters (PrintParameters | None), gcode_result (GCodeResult | None), error (str | None), chat_history (list[ChatMessage]).
Metodo: to_summary() → JobSummary (riduzione campi per le liste).
backend/models/model_analysis.py
Classe ModelAnalysisResult: format, file_size_bytes, bounding_box (x,y,z mm), volume_mm3, surface_area_mm2, triangle_count, is_manifold, manifold_issues, center_of_mass, footprint_area_mm2, max_dimension_mm, warnings.
backend/models/print_parameters.py
Enum: InfillPattern (grid, honeycomb, triangles, lines), SupportType (none, tree, normal), ParameterSource (ai, ai_fallback, user_override).
Classe PrintParameters: layer_height_mm, wall_count, infill_density_percent, infill_pattern, print_speed_mm_s, supports_enabled, support_type, nozzle_temperature_c, bed_temperature_c, orientation_note, source.
backend/models/printer_profile.py
Classe PrinterProfile: printer_id, name, build_volume_x_mm/y_mm/z_mm, nozzle_diameter_mm, max_print_speed_mm_s, max_nozzle_temp_c, max_bed_temp_c, has_heated_bed, cura_definition_file.
backend/models/material_profile.py
Classe MaterialProfile: material_id, name, type, nozzle_temp_min_c/max_c, bed_temp_min_c/max_c, max_print_speed_mm_s, requires_enclosure.
backend/models/gcode_result.py
Classe GCodeResult: gcode_file_path, file_size_bytes, estimated_print_time_s, estimated_filament_used_mm, layer_count, generated_at, engine_stdout_summary, warnings.
backend/models/chat.py
Classe ChatMessage: role, content, timestamp. Classe ChatRequest: message. Classe ChatResponse: reply, timestamp.
7.4 services/
backend/services/file_service.py
Scopo: gestisce l'intero ciclo di vita fisico dei file caricati.
Funzione
Output
Errori & gestione
save_uploaded_file(upload, job_id)
str (path salvato)
Superamento MAX_UPLOAD_SIZE_MB → FileTooLargeError, file parziale cancellato
validate_uploaded_file(file_path)
None
UnsupportedFormatError; FileValidationError se vuoto/non plausibile
delete_job_files(job_id)
None
Idempotente; errori permessi loggati come warning

Moduli che può chiamare: core.security, core.exceptions, utils.file_utils, config. NON deve chiamare: services.model_analysis_service, ai/*, core.job_manager (riceve job_id solo come nome cartella).
backend/services/model_analysis_service.py
Scopo: analizzare geometricamente il modello 3D e produrre un report strutturato.
Funzione
Output
Errori & gestione
analyze_model(file_path, model_format, job_id)
ModelAnalysisResult
UnsupportedFormatError; ModelAnalysisError se corrotto/0 triangoli
_load_mesh(file_path, format)
oggetto mesh (trimesh)
Eccezione trimesh incapsulata in ModelAnalysisError
_compute_geometry(mesh)
dict geometrico
Volume negativo/infinito → warning, non blocca
_check_manifold(mesh)
(bool, list[str])
Non solleva: dato legittimo del report

Dipendenze esterne: trimesh, numpy. NON deve chiamare: ai/*, services.slicer_service, services.file_service.
backend/services/profile_service.py
Scopo: unico punto di accesso ai profili stampante/materiale definiti in data/.
Funzione
Output
Errori & gestione
load_all_printers()
list[PrinterProfile]
JSON malformato → warning, profilo escluso
load_all_materials()
list[MaterialProfile]
Idem
get_printer(printer_id)
PrinterProfile
ProfileNotFoundError se assente
get_material(material_id)
MaterialProfile
ProfileNotFoundError se assente

Stato mantenuto: cache in memoria popolata al primo accesso o a startup; invalidabile solo riavviando il processo.
backend/services/validation_service.py
Scopo: unico punto in cui un insieme di PrintParameters — proposto dall'AI o modificato manualmente — viene verificato contro i limiti fisici di stampante e materiale. Regole complete in Sez. 12.
Funzione principale: validate_print_parameters(parameters, printer, material) → ValidationResult (ok: bool, errors: list[str], warnings: list[str]). Non solleva eccezione per violazioni normali: il chiamante decide se sollevare ParameterValidationError in base a ok.
Funzioni interne: _check_temperature_ranges, _check_layer_height_vs_nozzle, _check_speed_limits, _check_required_fields_present, _check_no_negative_values.
NON deve chiamare: ai/*, services.slicer_service. Stato mantenuto: nessuno — funzione pura.
backend/services/slicer_service.py
Scopo: unico modulo autorizzato a invocare il motore CuraEngine. Riceve sempre e solo parametri già validati.
Funzione
Output
Errori & gestione
slice_model(job_id, model_file_path, printer, material, parameters)
GCodeResult (grezzo)
EngineNotFoundError; SlicingError se returncode≠0; SlicingTimeoutError
_build_definition_stack(printer, material, parameters)
str (path config.json)
Merge: definizione stampante + override materiale + parametri validati
_run_cura_engine(definition_path, model_path, output_path)
(stdout, stderr, returncode)
Cattura sempre stdout/stderr anche in successo
_locate_output_gcode(output_path)
str (path)
SlicingError se il file atteso non viene prodotto

Moduli che può chiamare: core.security, core.exceptions, utils.file_utils, config; subprocess (stdlib). NON deve chiamare: ai/*, services.validation_service (non rivalida), services.model_analysis_service.
backend/services/gcode_service.py
Scopo: controllare che il G-code prodotto sia strutturalmente sensato e produrne un riassunto leggibile. Volutamente semplice in V1 (Sez. 14).
Funzione
Output
Errori & gestione
validate_and_summarize(gcode_path)
GCodeResult (completo)
GCodeValidationError se vuoto o senza G0/G1
_check_file_exists_and_not_empty(path)
bool
—
_check_minimum_gcode_structure(path)
(bool, warnings)
File sospettosamente piccolo → warning
_extract_summary_from_header(path)
dict
Header assente → campi None, warning aggiunto

7.5 ai/
backend/ai/prompt_builder.py
Funzione
Input
Output
build_parameter_prompt(analysis, user_data, printer, material)
ModelAnalysisResult, UserPrintRequest, PrinterProfile, MaterialProfile
str (prompt strutturato, istruisce l'LLM a rispondere solo con JSON)
build_chat_prompt(job, user_message, chat_history)
Job, str, list[ChatMessage]
str (tronca cronologia oltre N messaggi)

Moduli che NON deve chiamare: qualunque modulo con I/O di rete o file — funzione pura di formattazione stringhe.
backend/ai/ai_client.py
Scopo: unico modulo che parla in rete con il provider LLM esterno. Non conosce il dominio "stampa 3D": riceve e restituisce solo testo. Classe: AIClient.
Metodo
Output
Errori & gestione
request_parameters(prompt)
str (risposta grezza)
Timeout → retry con backoff fino a AI_MAX_RETRIES; esauriti → AIProviderUnavailableError. Chiave non valida → nessun retry.
request_chat_reply(prompt)
str
Stessa gestione errori

NON deve chiamare: services/*, models/* (il parsing è compito di ai_parser).
backend/ai/ai_parser.py
Funzione
Output
Errori & gestione
parse_parameters_response(raw_text)
PrintParameters (source="ai")
AIResponseError se JSON non valido/campi mancanti/tipi errati. Mai correzione silenziosa.
is_valid_json_schema(raw_text)
bool
Controllo rapido pre-parsing

NON deve chiamare: services.validation_service — parsing e validazione semantica restano passi distinti (Sez. 11.3).
backend/ai/chat_service.py
Funzione: answer(job, user_message) → ChatResponse. AIProviderUnavailableError → non propagata come 500: restituisce ChatResponse con fallback statico. Passi interni: costruisce prompt, chiama ai_client, aggiunge messaggio e risposta a job.chat_history via job_manager.update_job.
NON deve chiamare: services/* — la chat legge solo dati già presenti nel Job.
7.6 api/
I file in api/ contengono solo: parsing della richiesta HTTP, chiamata ai service/moduli AI pertinenti, mappatura delle eccezioni in risposte HTTP. Nessuna logica di dominio.
backend/api/deps.py
get_job_manager() → JobManager. get_job_or_404(job_id, job_manager) → Job o HTTPException 404. get_settings_dep() → Settings.
backend/api/routes_upload.py
Endpoint: POST /api/upload. Sequenza: job_manager.create_job → file_service.save_uploaded_file → file_service.validate_uploaded_file → job_manager.set_status(UPLOADED). NON deve chiamare: services.model_analysis_service (passo separato, avviato esplicitamente).
backend/api/routes_jobs.py
Endpoint: GET/DELETE /api/jobs/{job_id}, POST /api/jobs/{job_id}/analyze, POST /api/jobs/{job_id}/user-data, PUT /api/jobs/{job_id}/parameters. NON deve chiamare: ai/*, services.slicer_service.
backend/api/routes_printers.py & routes_materials.py
Endpoint: GET /api/printers[/{id}], GET /api/materials[/{id}]. Moduli che può chiamare: solo services.profile_service.
backend/api/routes_ai.py
Endpoint: POST /api/jobs/{job_id}/ai-suggest. Sequenza: prompt_builder.build_parameter_prompt → ai_client.request_parameters → ai_parser.parse_parameters_response → validation_service.validate_print_parameters → retry se non valido → fallback su preset conservativo (Sez. 11.5) → job_manager.update_job. NON deve chiamare: services.slicer_service, services.model_analysis_service.
backend/api/routes_slicing.py
[CORREZIONE v1.1] Sequenza operativa completata
La v1.0 elencava solo slicer_service.slice_model → gcode_service.validate_and_summarize, omettendo la risoluzione dei profili. Sequenza corretta per POST /api/jobs/{job_id}/slice:
1. job_manager.get_job(job_id)
2. profile_service.get_printer(job.user_data.printer_id)
3. profile_service.get_material(job.user_data.material_id)
4. slicer_service.slice_model(job_id, model_path, printer, material, job.validated_parameters)
5. gcode_service.validate_and_summarize(gcode_path)
6. job_manager.update_job(job_id, gcode_result=..., status=COMPLETED)

Endpoint: POST /api/jobs/{job_id}/slice, GET /api/jobs/{job_id}/gcode, GET /api/jobs/{job_id}/gcode/summary. Moduli che può chiamare: services.slicer_service, services.gcode_service, services.profile_service, core.job_manager. NON deve chiamare: ai/*.
backend/api/routes_chat.py
Endpoint: POST /api/jobs/{job_id}/chat, GET /api/jobs/{job_id}/chat/history. Moduli che può chiamare: ai.chat_service, core.job_manager. NON deve chiamare: nessun altro services/* direttamente.
7.7 utils/
backend/utils/id_generator.py
generate_job_id() → str (es. "job_" + uuid4().hex[:12]).
backend/utils/file_utils.py
Funzione
Output
Errori & gestione
get_file_size(path)
int (bytes)
FileNotFoundError propagata as-is
ensure_directory_exists(path)
None
Crea ricorsivamente; errore permessi propagato
safe_delete(path)
None
Non solleva se il file non esiste
compute_extension(filename)
str (es. ".stl")
—

Moduli che può chiamare: nessuno applicativo (solo stdlib). Non deve mai contenere logica di dominio o sicurezza.
8. API REST — Specifica Completa degli Endpoint
Autenticazione in V1: nessuna. Il backend è pensato per essere consumato dal frontend Next.js in ambiente di sviluppo/demo fidato. Ogni endpoint è comunque protetto dai controlli di sicurezza descritti in Sez. 19, indipendenti dall'autenticazione utente.
Metodo / Percorso
Scopo
Codici HTTP
Funzioni interne
POST /api/upload
Carica modello, crea job
201,400,413,415,500
job_manager.create_job, file_service.save/validate_uploaded_file
GET /api/jobs/{job_id}
Stato completo del job
200,404
job_manager.get_job
DELETE /api/jobs/{job_id}
Cancella job e file
200,404
job_manager.delete_job → file_service.delete_job_files
POST /api/jobs/{job_id}/analyze
Avvia analisi geometrica
200,404,422
model_analysis_service.analyze_model → job_manager.update_job
GET /api/printers
Elenco stampanti
200
profile_service.load_all_printers
GET /api/materials
Elenco materiali
200
profile_service.load_all_materials
POST /api/jobs/{job_id}/user-data
Registra dati utente (Sez. 10)
200,404,422
profile_service.get_printer/get_material → job_manager.update_job
POST /api/jobs/{job_id}/ai-suggest
Suggerimento parametri AI
200,404,422,503
Vedi sequenza Sez. 7.6
PUT /api/jobs/{job_id}/parameters
Override manuale (Avanzata)
200,404,422
validation_service.validate_print_parameters → job_manager.update_job
POST /api/jobs/{job_id}/slice
Avvia lo slicing (sincrono)
200,404,422,500,504
Vedi sequenza corretta Sez. 7.6
GET /api/jobs/{job_id}/gcode
Download G-code
200,404
lettura diretta da gcode_result.gcode_file_path
GET /api/jobs/{job_id}/gcode/summary
Riassunto stampabile
200,404
lettura dal Job
POST /api/jobs/{job_id}/chat
Messaggio alla chat AI
200,404
chat_service.answer
GET /api/jobs/{job_id}/chat/history
Cronologia chat
200,404
lettura da job.chat_history
[CORREZIONE v1.1] Nota su endpoint di slicing e polling
La v1.0 indicava per lo slicing un output "{status: 'slicing'} (asincrono) oppure GCodeResult se sincrono" e affermava che il frontend farebbe comunque "polling dello stato job fino a completamento". Per la V1, con implementazione sincrona (raccomandata, come già indicato nella nota originale), questo va chiarito:
— Il frontend invia POST /api/jobs/{id}/slice e riceve direttamente il GCodeResult (o un errore) nella risposta HTTP, senza bisogno di polling.
— Il polling su GET /api/jobs/{id} resta utile per altri passaggi percepiti come lunghi dall'utente (es. attesa durante ai-suggest), ma non è richiesto per lo step di slicing in V1.
— Se in una versione futura lo slicing diventerà asincrono, il polling tornerà necessario anche per questo step, senza cambiare il contratto degli altri endpoint.
409 rimosso dai codici HTTP originali dell'endpoint /slice: non essendoci più lo stato VALIDATING (Sez. 16.1), il caso "parametri non ancora validati" è gestito a monte, prima che l'endpoint /slice venga chiamabile con successo (il job deve avere validated_parameters valorizzato).

9. Analisi del Modello 3D
Formati supportati in V1: STL (primario) e OBJ (secondario). Il formato 3MF è volutamente escluso: introdurrebbe complessità di parsing e interfaccia non necessaria per l'obiettivo "carica → stampa" della V1.
9.1 Classificazione dei dati
Categoria
Dati
Come vengono ottenuti
A. Calcolabili matematicamente
Formato, dimensione, bounding box, volume, area superficie, triangoli, manifold, centro di massa, footprint, dimensione massima
model_analysis_service.py tramite trimesh — proprietà geometriche oggettive
B. Da interpretare/suggerire dall'AI
Layer height, pareti, infill, velocità, supporti, temperature, nota su orientamento
ai/ — a partire da categoria A + C, dipende da un compromesso qualità/tempo/resistenza
C. Da fornire dall'utente
Stampante, materiale, obiettivo, livello esperienza, preferenze
Form frontend → POST /api/jobs/{id}/user-data

Nota su "orientamento": in V1 la categoria A calcola solo l'orientamento as-is; l'eventuale suggerimento di modifica è categoria B, fornito come nota testuale euristica, non come rotazione applicata automaticamente. Un vero motore di auto-orientamento è rimandato a una versione successiva.
10. Dati Richiesti all'Utente
La V1 richiede all'utente il minimo indispensabile, distinguendo due modalità.
10.1 Schema UserPrintRequest
Campo
Obbligatorio
Modalità
Note
printer_id
Sì
entrambe
Riferimento a un profilo in data/printers/
material_id
Sì
entrambe
Riferimento a un profilo in data/materials/
experience_level
Sì
entrambe
"beginner" | "advanced"
print_goal
Sì
entrambe
"prototype" | "standard" | "quality" | "strength"
nozzle_diameter_override_mm
No
advanced
Se assente, default del profilo stampante
manual_parameter_overrides
No
advanced
Vedi chiarimento sotto [CORREZIONE v1.1]
[CORREZIONE v1.1] manual_parameter_overrides vs PUT /parameters
I due meccanismi non sono ridondanti; coprono momenti diversi del flusso:
— manual_parameter_overrides (in UserPrintRequest): usato PRIMA della chiamata AI. Se l'utente avanzato ha già preferenze note, questi valori vengono passati al prompt AI (ai/prompt_builder.py) come vincoli da rispettare nella proposta, non come parametri già finali. Il risultato dell'AI passa comunque da ai_parser e validation_service come qualunque altra proposta.
— PUT /api/jobs/{id}/parameters: usato DOPO aver visto la proposta AI (ai_parameters + reasoning), per correggere puntualmente uno o più valori prima dello slicing. Passa sempre da validation_service.validate_print_parameters, senza percorsi alternativi (Sez. 2.1).

Comportamento per livello — Principiante: fornisce solo stampante, materiale, obiettivo di stampa; tutti i parametri tecnici sono decisi dall'AI. Avanzato: può, dopo aver visto la proposta dell'AI, modificare uno o più campi tramite PUT /api/jobs/{id}/parameters prima di avviare lo slicing; non può bypassare la validazione (Sez. 12).
Non viene richiesto il diametro ugello come campo obbligatorio: è già parte del profilo stampante selezionato.
11. Modulo AI
11.1 Dati ricevuti dall'AI
L'AI riceve, tramite prompt_builder.build_parameter_prompt: i dati geometrici oggettivi (categoria A), i dati forniti dall'utente (categoria C), il profilo tecnico completo di stampante e materiale. Non riceve mai il file 3D grezzo: solo il report di analisi già calcolato.
11.2 Servizio/modello utilizzabile
Un LLM esterno raggiungibile via API (es. Anthropic API, modello configurabile in config.py). ai_client.py espone un'interfaccia stabile dietro la quale il provider è intercambiabile.
11.3 Prompt strutturato — contenuto richiesto
Ruolo e vincolo: risposta esclusivamente in JSON conforme allo schema, senza testo aggiuntivo.
Schema atteso (PrintParameters, Sez. 26) incluso esplicitamente nel prompt.
Dati geometrici, dati utente, profilo stampante, profilo materiale.
Vincoli espliciti di temperatura/velocità da rispettare già in fase di proposta.
Richiesta di una breve motivazione testuale separata (campo reasoning).
11.4 Decisioni che l'AI PUÒ prendere
Parametro
Note
layer_height_mm
Entro i limiti fisici del diametro ugello (Sez. 12)
wall_count
—
infill_density_percent, infill_pattern
Coerente con print_goal
print_speed_mm_s
Entro max_print_speed_mm_s di stampante e materiale
supports_enabled, support_type
Basato su geometria e preferenza utente se fornita
nozzle_temperature_c, bed_temperature_c
Entro il range del materiale
orientation_note
Suggerimento testuale qualitativo, non rotazione applicata

11.5 Decisioni che l'AI NON deve prendere
Non genera G-code né alcun comando macchina diretto.
Non sceglie la stampante o il materiale al posto dell'utente.
Non può proporre valori fuori dai limiti fisici; se lo fa, la proposta viene respinta dalla validazione, mai "corretta silenziosamente".
Non decide impostazioni non legate al profilo di stampa.
11.6 Formato di output e validazione
L'AI deve restituire un JSON conforme allo schema PrintParameters più un campo reasoning: str. ai_parser verifica la conformità di forma; validation_service verifica poi la conformità semantica — due passi distinti e sequenziali.
11.7 Comportamento in caso di risposta errata
Risposta AI
→ parsing forma (ai_parser)
  → OK? → validazione semantica (validation_service)
    → OK? → parametri salvati sul Job, source="ai"
    → NO? → 1 retry con prompt arricchito dagli errori
      → OK? → salvati, source="ai"
      → NO? → FALLBACK
  → NO (JSON non parsabile)? → 1 retry con prompt più esplicito
    → OK? → validazione semantica come sopra
    → NO? → FALLBACK
11.8 Comportamento in caso di API non disponibile
Se ai_client solleva AIProviderUnavailableError dopo i retry, o si raggiunge il fallback di 11.7, il sistema applica un preset conservativo derivato dal profilo materiale/stampante (temperature centrali, layer height = 50% del diametro ugello, infill 15%, nessun supporto). Il job è marcato con ai_parameters.source = "ai_fallback" e l'utente viene informato in interfaccia.
12. Validazione dei Parametri di Stampa
Eseguita sempre da validation_service.validate_print_parameters, sia sull'output dell'AI sia su qualunque override manuale — nessun percorso alternativo raggiunge lo slicer senza passare da qui.
Controllo
Regola
Errore prodotto
Temperatura ugello
material.nozzle_temp_min_c ≤ T ≤ material.nozzle_temp_max_c e ≤ printer.max_nozzle_temp_c
"Temperatura ugello fuori dai limiti"
Temperatura piatto
material.bed_temp_min_c ≤ T ≤ material.bed_temp_max_c e ≤ printer.max_bed_temp_c; 0 se no heated bed
"Temperatura piatto incompatibile"
Layer height vs ugello
0 < layer_height_mm ≤ 0.8 × nozzle_diameter_mm
"Layer height incompatibile"
Velocità di stampa
0 < speed ≤ min(printer.max, material.max)
"Velocità di stampa non compatibile"
Infill
0 ≤ infill_density_percent ≤ 100
"Percentuale di riempimento non valida"
Numero pareti
wall_count ≥ 1
"Numero di pareti non valido"
Campi obbligatori
Tutti presenti e non null
"Parametro mancante: {campo}"
Valori negativi
Nessun campo numerico < 0
"Valore negativo non ammesso: {campo}"

Tutti i controlli vengono eseguiti (non ci si ferma al primo errore): ValidationResult.errors contiene l'elenco completo.
13. Pipeline di Slicing
modello (STL/OBJ)
+ profilo stampante (JSON CuraEngine)
+ profilo materiale (override JSON)
+ parametri AI validati (override JSON)
↓
_build_definition_stack() → output/{job_id}/config.json
↓
_run_cura_engine() → subprocess.run([CURA_ENGINE_PATH, "slice",
    "-j", config.json, "-l", model.stl,
    "-o", output/{job_id}/result.gcode],
    timeout=SLICING_TIMEOUT_SECONDS,
    capture_output=True)
↓
stdout, stderr, returncode
↓
_locate_output_gcode() → verifica esistenza result.gcode
↓
GCodeResult (grezzo) → passato a gcode_service
13.1 Costruzione dei parametri
I parametri finali sono il merge, in ordine di precedenza crescente, di: (1) definizione base della stampante, (2) override derivati dal profilo materiale, (3) PrintParameters già validati (ultima parola). Il merge produce un file JSON scritto su disco prima dell'invocazione, ispezionabile in caso di debug.
13.2 Avvio del motore ed errori
Il motore viene avviato come processo esterno con timeout esplicito. Un errore è rilevato quando: returncode != 0, il processo supera il timeout, oppure il file di output atteso non esiste nonostante returncode == 0.
13.3 Restituzione del risultato
slicer_service restituisce un GCodeResult con solo i campi che può conoscere direttamente; gcode_service.validate_and_summarize lo arricchisce con tempo stimato, filamento e warning, leggendo l'header del G-code.
14. Gestione e Validazione del G-code
Deliberatamente semplice in V1 (nessun parser G-code completo). I controlli sono:
Il file esiste e non è vuoto.
La dimensione supera una soglia minima plausibile (es. 1 KB) — altrimenti warning.
Sono presenti comandi di movimento (G0/G1) — la loro assenza fa fallire la validazione.
Tempo stimato, filamento stimato e layer letti dai commenti header generati da CuraEngine, non ricalcolati.
15. Chat AI Contestuale
La chat risponde a domande come "Perché hai scelto questo layer height?" facendo riferimento al lavoro corrente. Contesto (tutto già presente nel Job, mai ricalcolato):
Risultato dell'analisi del modello (job.analysis)
Stampante e materiale selezionati (risolti tramite profile_service solo per arricchire il prompt)
Parametri proposti dall'AI e motivazione (job.ai_parameters, job.ai_reasoning)
Eventuali errori registrati (job.error)
Risultato dello slicing, se disponibile (job.gcode_result)
Per V1, la chat spiega le decisioni ma non le modifica: l'eventuale modifica effettiva avviene sempre tramite PUT /api/jobs/{id}/parameters, mai come effetto collaterale di un messaggio in chat.
16. Gestione dei Job
Ogni operazione di slicing è identificata da un job_id univoco, generato alla creazione e mai riutilizzato. Il ciclo di vita è gestito interamente da core/job_manager.py.
16.1 Stati del job
[CORREZIONE v1.1]
Nella v1.0 la sequenza includeva uno stato VALIDATING privo di un modulo che lo impostasse esplicitamente: la validazione avviene infatti DENTRO routes_ai.py (dopo ai-suggest) e DENTRO PUT /parameters, non come step autonomo del flusso. Lo stato è stato quindi rimosso dalla state machine persistita.

CREATED → UPLOADED → ANALYZING → ANALYZED → AWAITING_USER_DATA
→ READY_FOR_AI → AI_SUGGESTING → AI_SUGGESTED
→ SLICING → COMPLETED
(qualsiasi stato → FAILED, con job.error valorizzato)
La validazione (Sez. 12) resta un passo obbligatorio e sincrono eseguito internamente da routes_ai.py (subito dopo il parsing della risposta AI) e da PUT /api/jobs/{id}/parameters — un controllo interno alla chiamata, non una fase visibile nel ciclo di vita del job. Lo stato passa direttamente da AI_SUGGESTED (parametri già validati con successo) a SLICING all'avvio dello slicing. Se in futuro la validazione diventerà un passo asincrono separato, lo stato VALIDATING potrà essere reintrodotto con un modulo esplicitamente responsabile di impostarlo.
16.2 Cosa contiene un job
File associati, analisi geometrica, dati utente, parametri AI e motivazione, parametri validati, risultato dello slicing, eventuale errore, cronologia chat. Schema completo in Sez. 7.3 e Sez. 26.
16.3 Creazione, completamento, cancellazione
Creazione: all'upload (POST /api/upload). Completamento: stato COMPLETED dopo che gcode_service.validate_and_summarize ha confermato un G-code valido. Cancellazione: esplicita via DELETE /api/jobs/{id}, che rimuove sia lo stato sia i file fisici.
Per la V1 non è previsto alcun sistema di coda distribuita né worker separati: ogni richiesta HTTP che avanza il job esegue il lavoro sincronamente. L'introduzione di una coda (es. Celery/RQ) è rimandata a una versione successiva.
17. File Temporanei e Ciclo di Vita dei Dati
Tipo di file
Percorso
Quando creato
Quando eliminato
File 3D caricato
uploads/{job_id}/original.{ext}
Alla ricezione dell'upload
Alla cancellazione esplicita del job
Config slicer generato
output/{job_id}/config.json
All'avvio dello slicing
Stessa policy
G-code prodotto
output/{job_id}/result.gcode
A slicing riuscito
Stessa policy
Snapshot stato job
jobs_state/{job_id}.json
A ogni aggiornamento
Alla cancellazione esplicita
File di log
logs/
Continuo, rotazione giornaliera
Mai automaticamente in V1

Non essendoci autenticazione né multi-tenancy in V1, la cancellazione dei file è sempre un'azione esplicita dell'utente sul proprio job.
18. Database — Valutazione e Decisione
Decisione: nessun database relazionale/documentale in V1.
Volume di dati ridotto: pochi job attivi contemporaneamente, nessun requisito di query complesse.
Non c'è multi-tenancy né autenticazione: non serve una tabella utenti.
Il backend gira come singolo processo: uno stato in memoria è sufficiente.
La sola esigenza reale (sopravvivere a un riavvio) è coperta dallo snapshot JSON per-job.
Se in futuro sarà necessario supportare più utenti o query più sofisticate, si raccomanda un database leggero (es. SQLite) con una singola tabella jobs — la struttura attuale rende questa migrazione incrementale.
19. Sicurezza
Area
Misura
Dove implementata
Validazione file
Estensione consentita, controllo byte iniziali, file non vuoto
core.security, services.file_service
Dimensione massima upload
Verificata in streaming, limite configurabile
services.file_service.save_uploaded_file
Nomi file
Sanitizzazione (sanitize_filename)
core.security
Path traversal
safe_join verifica che il path resti dentro la directory base
core.security, file_service, slicer_service
File temporanei
Sempre sotto job_id generato dal server
utils.id_generator
Esecuzione motore slicer
Lista di argomenti esplicita, timeout obbligatorio
services.slicer_service
Input all'AI
Solo dati strutturati già validati/tipizzati
ai.prompt_builder
API key
Mai loggate, mai restituite in risposta, lette solo da variabili d'ambiente
config, ai.ai_client
Variabili d'ambiente
Nessun default hardcoded per segreti; fail-fast a startup
config

20. Logging
Livello
Cosa viene registrato
INFO
Creazione job, cambi di stato, avvio/fine analisi e slicing, richieste chat, download G-code
WARNING
Fallback AI attivato, profilo escluso per JSON malformato, G-code sospetto, mesh non manifold
ERROR
Eccezioni non gestite, fallimento slicing, errore parsing AI dopo tutti i retry

Eventi dedicati allo slicing: ogni invocazione di CuraEngine logga job_id, parametri chiave, durata, returncode. Non deve mai comparire nei log: API key o segreti, contenuto completo di prompt sensibili, token di future integrazioni.
21. Test da Sviluppare
Nessun test viene scritto in questa fase; questa sezione definisce cosa dovrà essere coperto in implementazione.
Modulo
Cosa testare
core.security
sanitize_filename, safe_join, validate_extension; nomi con ../, unicode, estensioni miste
services.file_service
Upload valido/oltre limite/formato non supportato/vuoto
services.model_analysis_service
STL binario/ASCII, OBJ, mesh non manifold, file corrotto
services.profile_service
Profili validi, esclusione malformato, get su id inesistente
services.validation_service
Parametri validi, ogni regola violata singolarmente e in combinazione
services.slicer_service
Esito positivo (mock subprocess), returncode≠0, timeout, eseguibile assente
services.gcode_service
G-code valido, vuoto, senza comandi di movimento, header non standard
ai.ai_parser
JSON conforme, campo mancante, testo non JSON, tipi errati
ai.ai_client
Successo, timeout con retry, errore autenticazione
ai.chat_service
Risposta normale, fallback quando AI non disponibile
core.job_manager
Creazione, lettura, aggiornamento, cancellazione, ripristino da snapshot
API end-to-end
Flusso completo upload → analisi → user-data → ai-suggest → slice → download

22. Dipendenze Python
Libreria
Perché serve
Indispensabile/Opzionale
fastapi
Framework API REST
Indispensabile
uvicorn
Server ASGI
Indispensabile
pydantic
Definizione/validazione schemi dati
Indispensabile
pydantic-settings
Configurazione da variabili d'ambiente
Indispensabile
python-multipart
Upload multipart/form-data
Indispensabile
trimesh
Analisi geometrica mesh STL/OBJ
Indispensabile
numpy
Calcoli numerici (dipendenza di trimesh)
Indispensabile
httpx
Client HTTP asincrono per LLM esterno
Indispensabile
anthropic
SDK ufficiale, se Anthropic come provider AI
Opzionale
python-json-logger
Log in JSON strutturato
Opzionale
tenacity
Retry/backoff dichiarativo per chiamate AI
Opzionale
pytest, pytest-asyncio
Framework di test
Indispensabile per sviluppo

Non vengono aggiunte librerie ORM/database (Sez. 18) né librerie di code/task asincroni (Sez. 16.3), coerentemente con le decisioni prese.
23. Flusso Completo Dati End-to-End
UPLOAD → VALIDAZIONE → ANALISI MODELLO → DATI UTENTE → AI
→ VALIDAZIONE PARAMETRI → SLICER → G-CODE → VALIDAZIONE → FRONTEND → DOWNLOAD
Passo
Dati in ingresso
Dati in uscita
UPLOAD
File binario, nome originale
job_id, path salvato, status=UPLOADED
VALIDAZIONE FILE
Path file salvato
Conferma o errore (400/413/415)
ANALISI MODELLO
Path file, formato
ModelAnalysisResult, status=ANALYZED
DATI UTENTE
printer_id, material_id, experience_level, print_goal
UserPrintRequest salvato, status=READY_FOR_AI
AI
Analisi + dati utente + profili (via prompt)
PrintParameters grezzi + reasoning, status=AI_SUGGESTED
VALIDAZIONE PARAMETRI
PrintParameters grezzi + profili
PrintParameters validati [CORREZIONE v1.1: passo interno a AI_SUGGESTED, non uno stato separato]
SLICER
Path modello + profili + parametri validati
G-code grezzo, stdout/stderr, status=SLICING → COMPLETED/FAILED
VALIDAZIONE GCODE
Path G-code prodotto
GCodeResult completo
FRONTEND
Polling su GET /api/jobs/{id}
Stato job aggiornato, GCodeResult visualizzabile
DOWNLOAD
job_id
File G-code scaricato

24. Mappa delle Dipendenze tra Moduli
Regola generale: le frecce indicano "può chiamare". Non esistono frecce nella direzione opposta: questo garantisce l'assenza di dipendenze circolari.
api/ (routes_*.py)
│
├──→ core/ (job_manager, security, exceptions, logging_config)
│
├──→ services/ (file_service, model_analysis_service, profile_service,
│     validation_service, slicer_service, gcode_service)
│     └──→ core/ (security, exceptions)
│     └──→ models/
│     └──→ utils/
│
└──→ ai/ (prompt_builder, ai_client, ai_parser, chat_service)
      └──→ core/ (job_manager — solo chat_service, exceptions, logging_config)
      └──→ models/

models/  → (solo altri models/, nessuna dipendenza da core/services/ai/api)
utils/   → (nessuna dipendenza applicativa, solo stdlib)
config/  → (nessuna dipendenza applicativa; tutti gli altri dipendono da config)
24.1 Regole esplicite "chi NON può chiamare chi"
Modulo
Non può chiamare
Perché
models/*
core/*, services/*, ai/*, api/*
I modelli sono dati puri
core/*
services/*, ai/*, api/*
Infrastruttura generica, non conosce il dominio
services/*
ai/*, api/*
Orchestrati dall'API, non dipendono dall'AI
ai/*
services/* (eccetto core.job_manager via chat_service)
Riceve dati già pronti tramite prompt_builder
utils/*
qualsiasi modulo applicativo
Deve restare un insieme di funzioni pure

25. Ordine di Sviluppo Consigliato
#
Fase
File coinvolti
1
Configurazione e infrastruttura base
config.py, core/exceptions.py, core/logging_config.py, core/security.py
2
Modelli dati
models/*
3
Utility
utils/*
4
Gestione job
core/job_manager.py
5
Upload e file
services/file_service.py, api/routes_upload.py
6
Analisi del modello
services/model_analysis_service.py, endpoint /analyze
7
Profili stampante/materiale
data/*.json, services/profile_service.py, routes_printers/materials.py
8
Dati utente
endpoint /user-data in routes_jobs.py
9
Validazione parametri
services/validation_service.py
10
Modulo AI
ai/prompt_builder.py, ai_client.py, ai_parser.py, routes_ai.py
11
Slicing
services/slicer_service.py, routes_slicing.py (parte slice)
12
G-code
services/gcode_service.py, routes_slicing.py (parte gcode/summary)
13
Chat AI
ai/chat_service.py, api/routes_chat.py
14
main.py e integrazione finale
main.py, api/deps.py
15
Test
test/* (Sez. 21)

26. Appendice — Schemi Dati di Riferimento
26.1 PrintParameters
{
  "layer_height_mm": 0.2,
  "wall_count": 3,
  "infill_density_percent": 20,
  "infill_pattern": "grid",
  "print_speed_mm_s": 50,
  "supports_enabled": false,
  "support_type": "none",
  "nozzle_temperature_c": 200,
  "bed_temperature_c": 60,
  "orientation_note": "Mantieni l'orientamento caricato: la base ha già una buona superficie di appoggio.",
  "source": "ai",
  "reasoning": "Layer height di 0.2mm e velocita' moderata per un buon compromesso qualita'/tempo."
}
26.2 ModelAnalysisResult
{
  "format": "stl",
  "file_size_bytes": 452000,
  "bounding_box": {"x_mm": 80.0, "y_mm": 60.0, "z_mm": 45.0},
  "volume_mm3": 38500.2,
  "surface_area_mm2": 15230.7,
  "triangle_count": 18432,
  "is_manifold": true,
  "manifold_issues": [],
  "center_of_mass": {"x_mm": 40.1, "y_mm": 30.0, "z_mm": 21.8},
  "footprint_area_mm2": 4800.0,
  "max_dimension_mm": 80.0,
  "warnings": []
}
26.3 Job (estratto semplificato)
{
  "job_id": "job_9f3a1c2e0b4d",
  "status": "AI_SUGGESTED",
  "created_at": "2026-08-13T10:15:00Z",
  "original_filename": "vaso.stl",
  "model_format": "stl",
  "analysis": { "...": "ModelAnalysisResult" },
  "user_data": {
    "printer_id": "generic_small_fdm",
    "material_id": "pla",
    "experience_level": "beginner",
    "print_goal": "standard"
  },
  "ai_parameters": { "...": "PrintParameters" },
  "ai_reasoning": "...",
  "validated_parameters": null,
  "gcode_result": null,
  "error": null,
  "chat_history": []
}
26.4 Esempio profilo materiale (data/materials/pla.json)
{
  "material_id": "pla",
  "name": "PLA generico",
  "type": "PLA",
  "nozzle_temp_min_c": 190,
  "nozzle_temp_max_c": 220,
  "bed_temp_min_c": 45,
  "bed_temp_max_c": 65,
  "max_print_speed_mm_s": 80,
  "requires_enclosure": false
}
26.5 Esempio profilo stampante (data/printers/generic_small_fdm.json)
{
  "printer_id": "generic_small_fdm",
  "name": "Generic Small FDM 220x220x250",
  "build_volume_x_mm": 220,
  "build_volume_y_mm": 220,
  "build_volume_z_mm": 250,
  "nozzle_diameter_mm": 0.4,
  "max_print_speed_mm_s": 100,
  "max_nozzle_temp_c": 260,
  "max_bed_temp_c": 100,
  "has_heated_bed": true,
  "cura_definition_file": "generic_small_fdm.def.json"
}

Fine del documento. Questa specifica è pensata per essere consegnata, per intero o per singola sezione, a un implementatore (umano o AI) che sviluppi un file alla volta seguendo l'ordine di Sez. 25, rispettando in ogni file le dipendenze consentite/vietate elencate in Sez. 7 e Sez. 24.
