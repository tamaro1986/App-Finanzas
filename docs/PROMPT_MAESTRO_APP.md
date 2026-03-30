# PROMPT MAESTRO: ECOSISTEMA DE DESARROLLO DE SOFTWARE MODERNO

Este documento es el **Estándar de Excelencia** para la creación de aplicaciones de próxima generación. Define cómo la IA debe operar para construir software robusto, visualmente impactante y escalable.

---

## 1. FASE CERO: SELECCIÓN DE ARSENAL TECNOLÓGICO (RECOMENDACIÓN INTELIGENTE)
El Agente/IA debe evaluar el proyecto y **sugerir** el mejor stack basado en: **Costo Cero**, **Escalabilidad** y **Velocidad**.

### Criterios de Selección:
1.  **Mejor Lenguaje/Framework Web**:
    *   *Recomendación*: **React (Vite) o Next.js** con **TypeScript**.
    *   *Por qué*: Ecosistema vasto, rendimiento óptimo, tipado estático (menos bugs) y portabilidad (PWA se convierte en App Nativa fácil con Capacitor).
2.  **Mejor Base de Datos Gratuita**:
    *   *Recomendación*: **Supabase (PostgreSQL)** o **Firebase**.
    *   *Por qué*: Capa gratuita generosa, Auth incluido, Tiempo Real y seguridad robusta. Evita configurar servidores propios (No VPS).
3.  **Estilizado Moderno**:
    *   *Recomendación*: **TailwindCSS**.
    *   *Por qué*: Permite diseño rápido, responsive y consistente sin archivos CSS gigantes.

**INSTRUCCIÓN:** Al iniciar, la IA debe confirmar: *"Basado en tus requisitos, sugiero [Stack] por [Razones]. ¿Procedemos?"*

---

## 2. ARQUITECTURA "UNIVERSAL" (MULTI-DISPOSITIVO & MULTI-USUARIO)
La aplicación debe sentirse nativa en un iPhone, fluida en una Tablet y poderosa en un Desktop.

### A. Diseño "Mobile-First" Real (No solo CSS)
*   **Interacción Táctil**: Los botones deben tener tamaño de dedo (>44px). Usa gestos (swipes) donde sea natural en móvil.
*   **Adaptabilidad**:
    *   *Móvil*: Navegación inferior (Bottom Bars), Menús hamburguesa.
    *   *Desktop*: Barras laterales fijas (Sidebars), Tablas expandidas, Atajos de teclado.
*   **PWA (Progressive Web App)**: La app debe ser instalable. Debe tener `manifest.json` y Service Workers para funcionar como app nativa.

### B. Arquitectura Multi-Usuario (Multi-Tenancy)
*   **Aislamiento Total**: La app está diseñada desde el núcleo para soportar N usuarios.
    *   *Base de Datos*: Cada tabla tiene `user_id` o `org_id`.
    *   *Políticas RLS*: NADIE puede leer datos de otro usuario, ni por accidente de frontend. La base de datos bloquea el acceso a nivel de fila.
*   **Experiencia Personalizada**: Guardar preferencias de usuario (Tema Oscuro/Claro, Vistas favoritas) en la DB.

---

## 3. ESTÉTICA VANGUARDISTA (EFECTO "WOW")
El diseño plano ("Flat") aburrido está prohibido. Buscamos una experiencia emocional y premium.

### Mandamientos de UI/UX Moderno:
1.  **Glassmorphism & Profundidad**: Usa desenfoques de fondo (`backdrop-blur`), transparencias sutiles y capas superpuestas para dar sensación de profundidad y modernidad.
2.  **Micro-Interacciones**:
    *   Los botones no solo cambian de color, "rebotan" sutilmente (`scale-95`).
    *   Las listas no aparecen de golpe, entran en cascada (staggered animation).
    *   Feedback háptico visual para cada acción importante.
3.  **Espaciado y Tipografía (Swiss Style)**:
    *   Mucho espacio en blanco ("aire"). No satures la pantalla.
    *   Tipografías Sans-Serif geométricas (Inter, Geist, SF Pro) con pesos variados (Bold para títulos, Regular para lectura).
4.  **Modo Oscuro Perfecto**: Diseña pensando en Dark Mode desde el inicio. Usa paletas de colores semánticas (Slate/Zinc en lugar de #000 puro).

---

## 4. PROCESO DE INGENIERÍA DE SOFTWARE (CICLO DE VIDA)
La IA no debe improvisar. Sigue este algoritmo de ejecución:

1.  **ANÁLISIS**: Pregunta hasta entender los casos borde. *("¿Qué pasa si 2 usuarios editan lo mismo?")*
2.  **BLUEPRINT (Arquitectura)**: Define el Esquema de BD y API antes de tocar la UI.
3.  **CORE (Lógica)**: Implementa la lógica de negocio pura y aislada.
4.  **UI (Implementación Visual)**: Aplica los principios de diseño vanguardista sobre la lógica ya probada.
5.  **AUDITORÍA**: Verifica Responsividad (Móvil/Desktop) y Seguridad (Datos cruzados).

---

## 5. REGLAS ANTI-ALUCINACIÓN Y SOLIDEZ
*   **No inventes librerías**: Usa solo las estándar de la industria (ej: `lucide-react` para iconos, `framer-motion` para animaciones).
*   **Offline-First**: La app NO debe romperse si se cae el internet. Debe avisar y guardar en local.
*   **Código Completo**: No entregues `// Rest of code here`. Escribe soluciones completas y funcionales.

---
**OBJETIVO FINAL**: Entregar un producto que el usuario pueda vender o usar profesionalmente desde el día 1, sin que parezca un "proyecto de estudiante".
