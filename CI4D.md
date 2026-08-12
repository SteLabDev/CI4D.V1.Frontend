CI4D V1 — SPECIFICA TECNICA DEFINITIVA

Creative Intelligence for 3D
Versione: V1
Stato: Architettura preliminare definitiva
Obiettivo: realizzare uno slicer AI funzionante, inizialmente semplice ma tecnicamente solido, estendibile in futuro.

1. Obiettivo di CI4D

CI4D è un software che deve permettere anche a un utente non esperto di ottenere un G-code pronto per la stampa 3D partendo da un modello 3D.

L'utente non deve necessariamente conoscere:

layer height;
infill;
velocità;
supporti;
temperature;
accelerazioni;
orientamento;
parametri avanzati dello slicer.

Dovrà invece fornire principalmente:

modello 3D;
stampante;
materiale;
obiettivo di stampa;
eventuali preferenze.

CI4D analizzerà il modello, raccoglierà i dati della stampante e del materiale, determinerà una configurazione appropriata e utilizzerà un motore slicer open source già esistente per produrre il G-code.

Principio fondamentale

CI4D non deve diventare uno slicer scritto da zero.

Il motore geometrico e di slicing deve essere fornito principalmente da software open source già maturo.

CI4D deve costruire sopra questo motore un livello di:

analisi;
automazione;
decisione;
validazione;
interazione con l'utente.
2. Frontend

Il frontend esiste già ed è stato sviluppato con v0.dev / Next.js.

Non deve essere riscritto.

La struttura concettuale è:

CI4D
│
├── Home
│
├── Slicer AI
│
└── Create AI (Beta)
Slicer AI

Interfaccia destinata sia a principianti sia a utenti esperti.

Elementi principali:

┌──────────────────────────────────────────────┐
│ LOGO                    NAVBAR               │
├───────────────┬──────────────────────────────┤
│               │                              │
│   SIDEBAR     │       3D VIEWER              │
│               │                              │
│ Printer       │                              │
│ Material      │       DRAG & DROP            │
│ Objective     │       MODEL                  │
│               │                              │
│               │                              │
├───────────────┴──────────────────────────────┤
│                 AI CHAT                      │
└──────────────────────────────────────────────┘

La UI deve rimanere semplice.

La complessità deve essere principalmente nel backend, non scaricata sull'utente.

3. Create AI

Create AI sarà inizialmente una funzione Beta.

Non è il focus della V1 dello slicer.

Il frontend sarà predisposto per collegarsi successivamente a servizi Text-to-3D, inizialmente tramite API di Tripo.

In futuro potranno essere aggiunti altri provider.

Il Create AI è quindi separato dal core dello slicer.

4. Architettura generale

L'architettura definitiva del sistema è:

                    FRONTEND
                       │
                       ▼
                 ┌───────────┐
                 │ FastAPI   │
                 │ API       │
                 └─────┬─────┘
                       │
                       ▼
                 ┌───────────┐
                 │ Job       │
                 │ Manager   │
                 └─────┬─────┘
                       │
          ┌────────────┼────────────┐
          ▼            ▼            ▼
   Mesh Analyzer      AI       Profile Manager
          │            │            │
          └────────────┼────────────┘
                       ▼
                Parameter Mapper
                       │
                       ▼
                Parameter Validator
                       │
                       ▼
                 Slicer Engine
                       │
                       ▼
                 PrusaSlicer
                       │
                       ▼
                    G-CODE
                       │
                       ▼
                   FRONTEND
5. Motore di slicing

Per la V1 viene scelto PrusaSlicer come motore principale.

CI4D non deve incorporare il codice completo di PrusaSlicer nel proprio backend.

Il motore viene utilizzato come componente esterno attraverso la sua modalità CLI/headless.

Concettualmente:

CI4D
 ↓
genera configurazione
 ↓
PrusaSlicer CLI
 ↓
G-code

Questo permette di mantenere CI4D relativamente leggero e di delegare al motore esistente il lavoro complesso dello slicing.

Importante

Prima dell'implementazione definitiva del wrapper dovranno essere verificate concretamente:

modalità CLI;
parametri supportati;
gestione dei profili;
formato delle configurazioni;
output;
errori;
statistiche;
compatibilità con il deployment previsto.

La scelta del motore non deve basarsi soltanto su informazioni fornite da un LLM.

6. Analisi del modello 3D

CI4D non deve implementare da zero la matematica necessaria per analizzare una mesh.

Il primo componente sarà basato principalmente su trimesh.

Il modulo:

mesh_analyzer.py

dovrà estrarre almeno:

dimensioni X/Y/Z
bounding box
volume
numero triangoli
watertight
validità della mesh
centro
area superficiale

Quando possibile potranno essere aggiunte ulteriori metriche.

7. Separazione tra dati geometrici e interpretazione AI

Questo principio è fondamentale.

Il codice calcola

Esempio:

volume = 24.3 cm³
height = 52 mm
triangle_count = 12450
watertight = true
L'AI interpreta

Esempio:

Il modello è relativamente alto.
L'obiettivo è qualità.
Sono probabilmente necessari supporti.

L'AI non deve inventare dati geometrici.

La geometria viene misurata deterministicamente dal software.

8. Printer Profiles

CI4D deve possedere un sistema strutturato per rappresentare le caratteristiche delle stampanti.

Un profilo dovrà contenere, almeno:

printer_id
manufacturer
model
bed_size
build_volume
nozzle_diameter
max_temperature
heated_bed
max_speed
max_acceleration
extruder_type

e gli ulteriori parametri necessari al motore slicer.

Il sistema non deve assumere che tutte le stampanti siano uguali.

9. Material Profiles

Analogamente devono esistere profili dei materiali.

Esempio:

material_id
material_type
manufacturer
density
nozzle_temperature_range
bed_temperature_range
recommended_speed
max_speed
cooling

I valori devono rappresentare vincoli e caratteristiche del materiale, non semplicemente suggerimenti dell'AI.

10. User Intent

L'utente non deve essere costretto a scegliere centinaia di parametri.

La V1 deve partire da pochi obiettivi:

SPEED
STANDARD
QUALITY
STRENGTH

Questi valori rappresentano l'intenzione dell'utente.

L'AI e il sistema di configurazione traducono l'intenzione nei parametri effettivi.

11. CI4D Parameter Schema

Questo è uno dei componenti più importanti dell'architettura.

CI4D deve possedere un modello interno standardizzato dei parametri.

Esempio:

PrintParameters

layer_height
first_layer_height
infill_density
infill_pattern
perimeters
top_layers
bottom_layers
support_enabled
support_style
support_threshold
print_speed
travel_speed
extruder_temperature
bed_temperature
cooling

Il modello dovrà contenere solo parametri realmente gestibili dal motore slicer.

L'AI non deve poter restituire parametri arbitrari.

12. Parameter Mapper

Tra CI4D e PrusaSlicer deve esistere un modulo dedicato:

parameter_mapper.py

Il suo compito è trasformare:

CI4D PrintParameters

in:

PrusaSlicer configuration

Questa separazione è obbligatoria.

Non vogliamo:

AI → stringa CLI

ma:

AI
 ↓
PrintParameters
 ↓
Validator
 ↓
Parameter Mapper
 ↓
PrusaSlicer

Questo rende il sistema sostituibile in futuro.

Se un giorno il motore diventasse CuraEngine:

CI4D Parameters
       ↓
Cura Mapper
       ↓
CuraEngine

senza riscrivere tutta l'architettura.

13. AI Parameter Agent

L'AI deve ricevere un contesto strutturato.

Input:

MODEL ANALYSIS
+
PRINTER PROFILE
+
MATERIAL PROFILE
+
USER INTENT
+
SLICER CAPABILITIES
+
HARD CONSTRAINTS

L'AI deve produrre esclusivamente un output strutturato compatibile con:

PrintParameters

Esempio concettuale:

{
  "layer_height": 0.2,
  "infill_density": 15,
  "infill_pattern": "gyroid",
  "perimeters": 3,
  "support_enabled": true,
  "support_style": "organic",
  "print_speed": 60,
  "extruder_temperature": 210,
  "bed_temperature": 60,
  "reasoning": "..."
}

L'AI non produce G-code.

14. AI ≠ autorità finale

L'AI può proporre.

Non può imporre.

Il flusso deve essere:

AI
 ↓
proposta
 ↓
VALIDATOR
 ↓
configurazione accettata
 ↓
SLICER

Se l'AI produce un valore impossibile, il sistema deve:

correggerlo se esiste una correzione deterministica;
oppure rifiutarlo;
mai passare direttamente un valore evidentemente invalido al motore.
15. Validator

Il validator è deterministico.

Non utilizza un LLM.

Controlla:

valori negativi;
limiti del nozzle;
temperature;
velocità;
dimensioni;
compatibilità materiale;
compatibilità stampante;
parametri supportati dal motore;
combinazioni impossibili.

Esempio:

layer_height > nozzle_diameter × limite
→ INVALID

Il validator rappresenta il guardrail fisico e tecnico di CI4D.

16. Orientamento

La V1 iniziale può utilizzare un orientamento semplice e affidabile.

Non dobbiamo costruire immediatamente un sistema matematico estremamente complesso.

L'architettura però deve essere predisposta per una futura ottimizzazione.

In futuro:

STL
 ↓
Candidate Orientations
 ↓
Geometry Analysis
 ↓
Support / Bed Contact Analysis
 ↓
Candidate Scoring
 ↓
Best Orientation

L'AI non deve inventare arbitrariamente matrici di trasformazione.

Dovrà eventualmente scegliere tra candidati generati dal software.

17. Supporti e overhang

La V1 deve avere una gestione iniziale degli overhang.

L'analisi geometrica può fornire dati quali:

facce inclinate
angoli
area
altezza
distribuzione

L'AI può utilizzarli per decidere se attivare o meno i supporti.

Tuttavia l'AI non deve sostituire il calcolo effettivo del motore slicer.

La generazione dei supporti resta responsabilità di PrusaSlicer.

18. Peso

CI4D deve distinguere:

Peso teorico

Derivato dalla geometria:

volume × densità materiale
Peso effettivo

Derivato dopo lo slicing, utilizzando le informazioni del G-code/statistiche del motore quando disponibili.

Quindi:

PRE-SLICING
→ stima

POST-SLICING
→ valore effettivo/stimato dal motore
19. Job Manager

Ogni elaborazione deve essere identificata da un:

job_id

Il job deve avere uno stato.

Esempio:

CREATED
↓
VALIDATING
↓
ANALYZING
↓
AI_PROCESSING
↓
VALIDATING_PARAMETERS
↓
SLICING
↓
PROCESSING_RESULT
↓
COMPLETED

In caso di errore:

FAILED

e deve essere possibile prevedere:

CANCELLED
CLEANED
20. Storage V1

Non è necessario introdurre immediatamente PostgreSQL o MongoDB.

Per la V1 si può utilizzare storage locale basato su filesystem.

Struttura:

storage/
└── jobs/
    └── {job_id}/
        ├── model.stl
        ├── state.json
        ├── config.json
        ├── analysis.json
        ├── gcode.gcode
        └── logs/

Il sistema deve poter essere convertito successivamente verso storage/database differenti.

21. API

Il backend FastAPI deve esporre almeno:

POST /api/v1/jobs

creazione job/upload modello.

GET /api/v1/jobs/{job_id}

stato del job.

GET /api/v1/jobs/{job_id}/gcode

download G-code.

POST /api/v1/jobs/{job_id}/chat

chat contestuale.

Eventuali endpoint aggiuntivi verranno definiti solo quando realmente necessari.

22. Chat AI

La chat deve avere accesso al contesto del job.

Quando l'utente chiede:

Perché hai scelto questo infill?

l'AI deve poter conoscere:

modello
stampante
materiale
obiettivo
analisi geometrica
parametri scelti
correzioni del validator
risultati dello slicing

La chat della V1 sarà inizialmente read-only.

Non modifica direttamente il G-code o i parametri già utilizzati.

23. G-code Validation

Dopo lo slicing il sistema deve verificare che il risultato sia effettivamente utilizzabile.

Controlli minimi:

file esistente
file > 0 bytes
slicing terminato correttamente
output leggibile

Non dobbiamo basarci esclusivamente sulla presenza di una determinata stringa nel G-code perché il formato può variare.

I controlli devono essere il più possibile basati sull'output reale del motore.

24. Sicurezza

Il backend deve prevedere almeno:

limite dimensione upload;
controllo formato;
nomi file sanitizzati;
directory isolate per job;
nessun shell=True;
subprocess con argomenti separati;
timeout del processo slicer;
gestione degli errori;
cleanup dei job vecchi.
25. Test

Prima di considerare funzionante la V1 devono essere presenti modelli di test.

Esempio:

tests/
└── fixtures/
    ├── cube.stl
    ├── cylinder.stl
    ├── overhang.stl
    ├── complex_model.stl
    └── invalid_model.stl

Il sistema dovrà essere verificato attraverso:

STL
 ↓
ANALYSIS
 ↓
AI
 ↓
VALIDATION
 ↓
SLICING
 ↓
G-CODE

Non basta che ogni singolo modulo funzioni isolatamente.

Deve funzionare l'intera pipeline.
