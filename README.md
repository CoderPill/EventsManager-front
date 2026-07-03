# EventsManager Frontend

Frontend Angular 22 standalone para gestión de eventos y reservas. Consume `EventsManager-api` bajo contrato `ApiResponse<T>` con enums serializados como strings localizados y fechas en formato ISO 8601 sin Z. Tres vistas navegables: tabla pública de eventos con reserva, consulta de reserva por código único, y panel de administración de reservas.

---

## 1. Ejecución local

### 1.1 Prerrequisitos
- Node.js 24+
- Backend `EventsManager-api` corriendo

Angular CLI está declarado como dependencia del proyecto — no requiere instalación global. Los comandos usan `npx` para resolver la versión local.

### 1.2 Configuración

```typescript
// src/environments/environment.ts
export const environment = { production: false, apiUrl: 'https://localhost:7133/api' };
```

El backend debe permitir CORS desde `http://localhost:4200`.

### 1.3 Ejecutar

```bash
cd EventsManager-front
npm install
npx ng serve                  # http://localhost:4200
npx ng serve --ssl true       # https://localhost:4200 (certificado autofirmado)
npx ng build                  # build producción → dist/
```

---

## 2. Arquitectura

### 2.1 Capas

```
src/app/
├── core/         → infraestructura (HTTP, auth, guards, modelos, mappers, pipes, providers)
├── features/     → páginas por dominio (public/, admin/)
└── shared/       → componentes reutilizables (modales, navbar, loading-spinner, directivas, pipes)
```

Core no tiene dependencias de Features ni Shared. Features y Shared dependen de Core. Ninguna capa superior conoce detalles de implementación de una inferior.

### 2.2 Flujo de comunicación

```
Vista (página o modal)
  │
  ├── EventsApi / ReservationsApi / AuthApi / VenuesApi
  │     └── heredan de ApiClient
  │           └── HttpClient
  │                 └── interceptores (auth → error → loading)
  │                       ├── authInterceptor: JWT Bearer desde sessionStorage
  │                       ├── errorInterceptor: HttpErrorResponse → ApiError
  │                       └── loadingInterceptor: LoadingService.show/hide()
  │
  ├── ToastService.success/error/confirm()
  ├── LoadingService → LoadingSpinnerComponent
  └── Router (3 rutas)
```

### 2.3 Decisiones técnicas

| Decisión | Fundamento |
|----------|------------|
| **API services heredan de ApiClient** | Centraliza unwrap de ApiResponse, mapeo de enums y manejo de errores. Métodos `protected` fuerzan uso de servicios específicos. |
| **Interceptores funcionales (HttpInterceptorFn)** | Estándar Angular 22. Sin clases, sin providers extra. |
| **Computed signals para filtrado de tablas** | Recalcula solo cuando cambian `events()` o `filters()`. Sin suscripciones manuales. |
| **ViewChild setter para MatSort/MatPaginator** | El setter se ejecuta cuando el elemento aparece en el DOM (dentro de @if). No depende de ngAfterViewInit. |
| **Sin parseo de JWT ni isAdmin** | El backend autoriza por endpoint. El front solo necesita saber si hay sesión. |
| **ToastService como wrapper** | API unificada (success, error, confirm). Cambiar de librería modifica un archivo. |
| **LoadingService con contador** | Soportan requests concurrentes. X-Skip-Loading excluye requests del spinner. |
| **Mappers de enums string→number** | El backend serializa enums como strings via JsonStringEnumConverter. El front necesita numéricos para bindings. |
| **Validadores custom de fechas y capacidad** | Validan reglas de negocio (endDate > startDate, maxCapacity ≤ venue.capacity) antes de enviar al backend. |
| **Silent logout en 401** | Si el token expira, se limpia la sesión sin notificar al usuario. |
| **Debounce de 300ms en filtros de tabla** | Evita recalcular la lista filtrada en cada tecla. |

---

## 3. Mecanismos

### 3.1 ApiClient + API Services

`ApiClient` es la clase base del stack HTTP. Sus cuatro métodos (`get`, `post`, `put`, `delete`) son `protected` — solo las subclases pueden invocarlos. Cada método:

1. Tipa la respuesta como `ApiResponse<T>` (el envelope del backend: `{ isSuccess, value, errors }`)
2. Aplica `unwrapResult`: extrae `value` si la operación fue exitosa, o lanza `ApiError` con los errores del backend

La URL base se recibe por constructor (via `environment.apiUrl`). No hay token de inyección `@Inject` — las subclases pasan `environment.apiUrl` directamente.

**Cuatro API services** heredan de `ApiClient`:

| Servicio | Métodos | Mapper asociado |
|----------|---------|-----------------|
| `AuthApi` | `login(request)` | — |
| `EventsApi` | `getAll()`, `getOccupationReport(eventId)`, `create(request)` | `mapApiEvent`, `mapOccupationReport` |
| `ReservationsApi` | `getAll()`, `getByCode(email, code)`, `create(request)`, `cancel(request)`, `confirm(request)` | `mapApiReservation` |
| `VenuesApi` | `getAll()` | — |

Cada método retorna `Observable<T>` con el tipo concreto del dominio, ya unwrapeado y mappeado. Los componentes nunca ven `ApiResponse` crudo.

### 3.2 Interceptores

Tres interceptores funcionales registrados secuencialmente via `provideHttpClient(withInterceptors([...]))`:

**authInterceptor**: Lee el JWT de `sessionStorage`. Si existe, agrega el header `Authorization: Bearer <token>` a cada request. Omite la ruta `/api/Auth/login` (no necesita token). No inyecta `AuthService` — leería de sessionStorage al mismo valor, y hacerlo crearía una dependencia circular (AuthService → AuthApi → HttpClient → authInterceptor).

**errorInterceptor**: Captura `HttpErrorResponse` en tres caminos:
- Si el body contiene `{ isSuccess: false, errors: [...] }` (envelope del backend), construye un `ApiError` con esos errores
- Si el body contiene un `message` plano, lo envuelve en un array
- Si no hay respuesta (error de red), usa un mensaje genérico

Si el status HTTP es 401 y hay una sesión activa, ejecuta `auth.logout()` silenciosamente — sin toast, sin notificación. La próxima interacción del usuario redirigirá a la página principal.

**loadingInterceptor**: Si la request no incluye el header `X-Skip-Loading`, llama a `LoadingService.show()` antes de enviarla y `LoadingService.hide()` al completar (éxito o error via `finalize`).

### 3.3 AuthService

`AuthService` mantiene dos señales: `token` (el JWT almacenado en `sessionStorage`) e `isLoggedIn` (derivada de `token` mediante `computed`). Cuando `_token` se actualiza, `isLoggedIn` se recalcula automáticamente — no requiere `.set()` manual.

`login()` recibe un `LoginRequest`, llama a `AuthApi.login()`, y en el `tap` del observable almacena el JWT en `sessionStorage` y actualiza `_token`. `logout()` limpia `sessionStorage` y resetea `_token`.

No se parsea el JWT para determinar roles porque el backend autoriza cada endpoint individualmente.

### 3.4 Mappers de enums

El backend serializa enums como strings localizados (`"Activo"`, `"Conferencia"`) via `JsonStringEnumConverter`. Los mappers convierten a número en el borde del sistema:

| Backend envía | mapper | Frontend usa |
|---------------|--------|--------------|
| `"Activo"` / `"Cancelado"` | `mapApiEvent` | `event.status` → `1` / `2` |
| `"Conferencia"` / `"Taller"` | `mapApiEvent` | `event.type` → `1` / `2` |
| `"PendientePago"` / `"Confirmada"` | `mapApiReservation` | `r.status` → `1` / `2` |

Los mappers tienen doble guarda: si el backend envía número directamente, lo pasan sin conversión. Si el string no está en el mapa, emiten `console.warn` y usan un valor por defecto.

`formatDateForApi` y `toApiDateString` normalizan fechas a ISO 8601 sin Z (`"2026-06-15T18:00:00"`), usando hora local en vez de UTC.

### 3.5 ToastService + LoadingService

**ToastService** es un wrapper sobre SweetAlert2 que expone tres métodos:

| Método | Comportamiento |
|--------|---------------|
| `success(message)` | Toast verde con timer de 3 segundos, auto-cierre |
| `error(message)` | Toast rojo, requiere clic del usuario para cerrar |
| `confirm(title, text)` | Diálogo modal de confirmación sí/no, retorna `Promise<boolean>` |

Ningún componente importa SweetAlert2 directamente. Cambiar la librería de notificaciones requiere modificar solo este archivo.

**LoadingService** usa un contador interno (`signal<number>(0)`) para soportar requests concurrentes. `show()` incrementa, `hide()` decrementa (nunca menor a 0). Un `computed` expone `isLoading` como booleano. El `loadingInterceptor` lo usa automáticamente. El `LoadingSpinnerComponent` es un overlay fixed (z-index 9999) que se renderiza en el componente raíz y se vincula a `isLoading`.

### 3.6 Tablas con filtros

Ambas tablas siguen el mismo patrón:

```
events: signal<Dto[]>
  + filters: signal<{ ... }>
  → filteredEvents: computed (aplica filtros)
    → effect: escribe en MatTableDataSource.data
      → MatTable + MatPaginator + MatSort
```

Los filtros se conectan a un `FormGroup` via `valueChanges` con `debounceTime(300)` para evitar recalcular en cada tecla.

Las columnas que muestran datos de objetos anidados (venue con `name` y `city`, evento con `title`) requieren un `sortingDataAccessor` que extraiga el valor correcto, ya que el algoritmo de ordenamiento por defecto intentaría ordenar por el objeto completo (`[object Object]`).

### 3.7 Guards y rutas

Tres rutas lazy + un guard funcional:

| Ruta | Componente | Guard |
|------|-----------|-------|
| `/` | EventsListPageComponent | — |
| `/MyReservations` | MyReservationsPageComponent | — |
| `/AllReservations` | AllReservationsComponent | `authGuard` |

`authGuard` es un `CanActivateFn` que inyecta `AuthService` y `Router`. Si `isLoggedIn()` es falso, redirige a `/`.

### 3.8 Modales

Todos los modales son componentes standalone abiertos via `MatDialog.open()`. Reciben datos via `MAT_DIALOG_DATA` y emiten resultados via `@Output()` o `dialogRef.close(valor)`.

| Modal | Gatillo | Datos que recibe | Acción principal |
|-------|---------|------------------|------------------|
| `LoginModal` | Navbar | — | AuthService.login() → toast + cierra |
| `CreateEventModal` | Events list (admin) | — | Carga venues via VenuesApi, valida fechas y capacidad, EventsApi.create() |
| `ReservationModal` | Events list | `event: EventDto` | Consulta capacidad real via EventsApi, valida con MaxCapacityValidator, ReservationsApi.create() |
| `OccupationReportModal` | Events list (admin) | `eventId: number` | EventsApi.getOccupationReport() → KPIs |

### 3.9 Directiva de validación de capacidad

`MaxCapacityValidatorDirective` es una directiva standalone registrada en `NG_VALIDATORS`. Recibe la capacidad máxima via `@Input('appMaxCapacity')` y valida que el valor del control no la supere. Si la capacidad máxima cambia dinámicamente (por ejemplo, al consultar la ocupación real del evento), la directiva se actualiza via `OnChanges`.

### 3.10 DateProvider

Abstracción de fecha/hora local con dos métodos: `getNow()` (devuelve la hora actual del navegador) y `toApiString()` (formatea a ISO 8601 sin Z). `SystemDateProvider` es la implementación concreta. Registrado como provider en `app.config.ts` para permitir inyección de una implementación falsa en tests.

---

## 4. Contrato con el backend

### 4.1 Envelope

Toda respuesta sigue `ApiResponse<T>`: `{ isSuccess, value, errors }`. `ApiClient.unwrapResult` extrae `value` o lanza `ApiError`.

### 4.2 Endpoints

| Método | Ruta | Servicio | Auth |
|--------|------|----------|------|
| POST | `/Auth/login` | AuthApi | No |
| GET | `/Events` | EventsApi | No |
| GET | `/Events/occupationReport` | EventsApi | JWT |
| POST | `/Events` | EventsApi | JWT |
| GET | `/Reservations` | ReservationsApi | JWT |
| GET | `/Reservations/getByReservationCode` | ReservationsApi | No |
| POST | `/Reservations` | ReservationsApi | No |
| PUT | `/Reservations/cancel` | ReservationsApi | No |
| PUT | `/Reservations/confirm` | ReservationsApi | JWT |
| GET | `/Venues` | VenuesApi | No |

### 4.3 Enums y fechas

Los enums viajan como strings localizados y se normalizan a número en los mappers. Las fechas viajan como ISO 8601 sin Z (`"2026-06-15T18:00:00"`), hora local.

---

## 5. Manejo de errores

| Origen | Captura | Mensaje visible | Efecto secundario |
|--------|---------|----------------|-------------------|
| HTTP 4xx/5xx | errorInterceptor | `ToastService.error(errors.join('\n'))` | — |
| HTTP 401 | errorInterceptor | No visible | `auth.logout()` silencioso |
| Error de red | errorInterceptor | Mensaje genérico | — |
| Error JS inesperado | GlobalErrorHandler → console.error | No visible | — |

Los errores del backend pueden tener múltiples mensajes. Se concatenan con `\n` para mantener legibilidad en SweetAlert2.
