# Auditoría de Código y Posibles Vulnerabilidades / Errores

A continuación se detalla el análisis de la base de código para identificar vulnerabilidades de seguridad, errores lógicos, posibles puntos de pérdida de datos y problemas arquitectónicos en el proyecto "The Core".

## 1. Vulnerabilidades de Seguridad

**1.1. Almacenamiento Inseguro de Datos Sensibles (LocalStorage)**
*   **Ubicación:** `src/services/contactService.ts` (uso de `localStorage.getItem` / `setItem`)
*   **Descripción:** Los datos del CRM (información de contactos, interacciones, anotaciones ejecutivas y analíticas de IA) se guardan en caché y en colas de sincronización utilizando `localStorage` en texto plano. Si la aplicación sufre una vulnerabilidad de *Cross-Site Scripting (XSS)*, un atacante podría extraer todos estos datos con facilidad, comprometiendo información altamente sensible.

**1.2. Falta de Autenticación en Servicios Externos (n8n Webhooks)**
*   **Ubicación:** `src/services/n8nService.ts`
*   **Descripción:** Las llamadas a la API hacia `SCAN_URL` y `INVESTIGATE_URL` se realizan mediante `fetch` sin incluir cabeceras de autorización (como un *Bearer token* o *API key*). Esto implica que si la URL del webhook de n8n es descubierta o está expuesta, cualquier tercero podría consumirla libremente, provocando abusos, aumento de costes y potencial exfiltración de información.

**1.3. Generación de Identificadores Débil (Posibles Colisiones)**
*   **Ubicación:** `src/services/contactService.ts` (`generateId`) y `src/App.tsx` (`handleSubmit`)
*   **Descripción:** Se utiliza código como `Math.random().toString(36).substr(2, 9)` (combinado a veces con `Date.now()`) para generar identificadores. Este enfoque no es criptográficamente seguro y es propenso a generar colisiones de ID, especialmente en entornos concurrentes. Se recomienda utilizar el estándar `crypto.randomUUID()`.

**1.4. Ausencia de Cabeceras de Seguridad en el Servidor Web**
*   **Ubicación:** `nginx.conf`
*   **Descripción:** La configuración del servidor web carece de cabeceras de seguridad HTTP básicas, tales como `Content-Security-Policy` (CSP), `X-Content-Type-Options`, `X-Frame-Options` y `Strict-Transport-Security` (HSTS). Al ser una aplicación CRM, la ausencia de CSP agrava significativamente cualquier potencial vulnerabilidad de XSS.

## 2. Errores Lógicos y Riesgos de Estabilidad (Pérdida de Datos)

**2.1. Límite de Cuota Excedida en LocalStorage (Data Loss Risk)**
*   **Ubicación:** `src/services/contactService.ts`
*   **Descripción:** La aplicación almacena imágenes en base64 (avatares y resultados de escaneo de tarjetas) dentro del caché de `localStorage`. Los navegadores limitan `localStorage` a unos ~5MB por dominio. Al guardar apenas unos pocos perfiles con imágenes grandes, este límite se superará, causando una excepción `QuotaExceededError`. Aunque el error es capturado (`try/catch`), la aplicación silenciosamente fallará al encolar nuevos datos fuera de línea (offline mode), lo que resulta en pérdida de información.

**2.2. Riesgo de Duplicidad de Entidades (Retries en Operaciones no Idempotentes)**
*   **Ubicación:** `src/services/contactService.ts` (`fetchWithRetry`)
*   **Descripción:** La función de reintento aborta llamadas HTTP que superan el tiempo de espera (timeout) configurado y las reintenta automáticamente. Sin embargo, abortar en el cliente no detiene la ejecución en el backend. Si un POST (creación) es demorado, el cliente enviará múltiples peticiones POST que terminarán creando contactos/interacciones duplicadas en el servidor, a menos que el backend implemente idempotencia robusta validando el ID.

**2.3. Gestión del Ciclo de Vida de Grabación de Audio (Posibles Fugas de Memoria)**
*   **Ubicación:** `src/App.tsx` (`startRecording` y `stopRecording`)
*   **Descripción:** Si un usuario interactúa de forma errática con el botón de micrófono o si el componente se desmonta durante una grabación, los "tracks" del hardware (`mediaRecorder.stream.getTracks()`) pueden quedar sin liberar. No existe un bloque de "cleanup" (`useEffect`) adecuado para garantizar que la cámara/micrófono se apaguen si se cierra el modal inesperadamente, lo que provoca la retención de hardware.

## 3. Problemas de Configuración y Compilación (Build)

**3.1. Fallo en el Proceso de Construcción (`npm run build`)**
*   **Ubicación:** Consola / `package.json`
*   **Descripción:** El comando `tsc -b && vite build` reporta `tsc: not found`. Esto indica que TypeScript no está instalado local o globalmente en el contenedor/ambiente, o que hay un problema con la instalación de las `devDependencies` que impide que el pipeline CI/CD compile satisfactoriamente el código.

**3.2. Configuración Defectuosa de ESLint**
*   **Ubicación:** `eslint.config.js` y `npm run lint`
*   **Descripción:** El linter arroja el error `ERR_MODULE_NOT_FOUND: Cannot find package '@eslint/js'`. Esto apunta a una inconsistencia de versiones en los paquetes de configuración de eslint y en la resolución de módulos ESM.

**3.3. Configuración en `Dockerfile` con TypeScript Bypassed**
*   **Ubicación:** `Dockerfile`
*   **Descripción:** El Dockerfile utiliza directamente `npx vite build` en lugar de `npm run build`, saltándose la verificación de tipos de TypeScript durante el despliegue. Esto puede permitir que el código llegue a producción con errores de tipado fatales que de otra forma hubieran sido detectados.
