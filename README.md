# App Finanzas (React + Vite)

Esta es la versión moderna de la aplicación de finanzas personales, construida con React, Vite y Tailwind CSS. Utiliza Supabase para el backend y la sincronización de datos.

## 🚀 Inicio Rápido

### Requisitos Previos

- Node.js (versión 16 o superior recomendada)
- npm o yarn

### Instalación

1.  Clona el repositorio (si no lo has hecho aún).
2.  Instala las dependencias:

    ```bash
    npm install
    ```

### Configuración

Copia el archivo de ejemplo de variables de entorno y configura tus credenciales de Supabase:

```bash
cp .env.example .env
```

Edita el archivo `.env` con tus propias credenciales:

```env
VITE_SUPABASE_URL=tu_url_de_supabase
VITE_SUPABASE_ANON_KEY=tu_clave_anonima_de_supabase
```

### Ejecución

Para iniciar el servidor de desarrollo:

```bash
npm run dev
```

La aplicación estará disponible en `http://localhost:5173` (o el puerto que indique la consola).

### Construcción para Producción

Para construir la aplicación para producción:

```bash
npm run build
```

Para previsualizar la construcción:

```bash
npm run preview
```

## 📁 Estructura del Proyecto

- `src/`: Código fuente de la aplicación React.
    - `components/`: Componentes de la UI (Dashboard, Budget, Accounts, etc.).
    - `lib/`: Utilidades y configuración (cliente de Supabase).
    - `services/`: Servicios externos (Market Data).
- `vanilla-v1/`: Versión anterior de la aplicación (HTML/JS/CSS puro). **Legado**.

## 🛠 Tecnologías

- **Framework:** React 19
- **Build Tool:** Vite
- **Estilos:** Tailwind CSS
- **Iconos:** Lucide React, React Icons
- **Backend:** Supabase (Auth, Database)
- **Utilidades:** date-fns, xlsx

## 📝 Notas Adicionales

La carpeta `vanilla-v1` contiene la implementación original sin frameworks. Puede consultarse para referencia histórica o comparativa de funcionalidades.
