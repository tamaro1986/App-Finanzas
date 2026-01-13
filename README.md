# 💰 App de Finanzas - Edición Cloud

## 🎉 ¡Bienvenido!

Tu aplicación de finanzas personales ahora incluye **sincronización en la nube** con Supabase.

---

## 🚀 Inicio Rápido

### ¿Primera vez?

👉 **Lee esto primero:** [`QUICK_START.md`](QUICK_START.md)

Configuración completa en **10 minutos** siguiendo 5 pasos simples.

---

## 📚 Documentación

### Para Usuarios

| Documento | Descripción | Tiempo de lectura |
|-----------|-------------|-------------------|
| **[QUICK_START.md](QUICK_START.md)** | Configuración rápida en 5 pasos | 5 min |
| **[README_CLOUD.md](README_CLOUD.md)** | Guía completa de usuario | 15 min |
| **[SUPABASE_SETUP.md](SUPABASE_SETUP.md)** | Configuración detallada de Supabase | 20 min |

### Para Desarrolladores

| Documento | Descripción |
|-----------|-------------|
| **[IMPLEMENTATION_SUMMARY.md](IMPLEMENTATION_SUMMARY.md)** | Resumen técnico de la implementación |

---

## ✨ Características

### 💾 Gestión de Finanzas
- ✅ Múltiples cuentas bancarias
- ✅ Categorías personalizables
- ✅ Transacciones (ingresos, gastos, transferencias)
- ✅ Presupuestos mensuales y anuales
- ✅ Importación desde Excel
- ✅ Dashboard con métricas

### ☁️ Sincronización en la Nube (NUEVO)
- ✅ Autenticación de usuarios
- ✅ Guardado automático en la nube
- ✅ Acceso desde cualquier dispositivo
- ✅ Modo offline con sincronización automática
- ✅ Seguridad a nivel empresarial

---

## 🎯 ¿Qué Necesitas?

### Opción 1: Solo Local (Gratis)
- ✅ Funciona sin configuración adicional
- ✅ Datos guardados en tu navegador
- ❌ No sincroniza entre dispositivos
- ❌ Datos se pierden si borras el navegador

**Acción:** Abre `index.html` y haz clic en "Continuar sin cuenta"

### Opción 2: Con Nube (Gratis)
- ✅ Sincronización automática
- ✅ Acceso desde cualquier dispositivo
- ✅ Respaldo en la nube
- ✅ Datos seguros

**Acción:** Sigue la guía [`QUICK_START.md`](QUICK_START.md)

---

## 📁 Estructura del Proyecto

```
App-Finanzas/
│
├── 📄 index.html              # Página principal
├── 📄 script.js               # Lógica principal
├── 📄 style.css               # Estilos principales
│
├── 🔐 Autenticación y Nube
│   ├── supabase-client.js     # Cliente de Supabase
│   ├── auth-ui.js             # Interfaz de login/registro
│   └── auth-styles.css        # Estilos de autenticación
│
├── 💼 Módulos de Negocio
│   ├── accounts.js            # Gestión de cuentas
│   └── categories.js          # Gestión de categorías
│
├── ⚙️ Configuración
│   └── config.json            # Configuración de la app
│
└── 📚 Documentación
    ├── README.md              # Este archivo
    ├── QUICK_START.md         # Inicio rápido
    ├── README_CLOUD.md        # Guía de usuario
    ├── SUPABASE_SETUP.md      # Configuración de Supabase
    └── IMPLEMENTATION_SUMMARY.md  # Resumen técnico
```

---

## 🔧 Configuración

### Sin Nube (Modo Local)

1. Abre `index.html` en tu navegador
2. Haz clic en "Continuar sin cuenta"
3. ¡Listo!

### Con Nube (Recomendado)

1. **Configura Supabase** (10 min)
   - Sigue [`QUICK_START.md`](QUICK_START.md)

2. **Actualiza `config.json`**
   ```json
   "supabase": {
     "url": "TU_URL_AQUI",
     "anonKey": "TU_CLAVE_AQUI"
   }
   ```

3. **Abre la app**
   - Abre `index.html`
   - Crea tu cuenta
   - ¡Listo!

---

## 🎨 Capturas de Pantalla

### Interfaz de Login

![Login Interface](C:/Users/Enrique/.gemini/antigravity/brain/a1996974-08cf-4368-a062-78852ea27871/auth_interface_demo_1768187746202.png)

*Modal de autenticación moderno con diseño profesional*

---

## 🆘 Ayuda

### Problemas Comunes

| Problema | Solución |
|----------|----------|
| No veo el modal de login | Verifica `config.json` o usa modo local |
| Error al crear cuenta | Verifica email y contraseña (mín. 6 caracteres) |
| No sincroniza | Verifica conexión a internet |
| Olvidé mi contraseña | Usa "¿Olvidaste tu contraseña?" en el login |

### Más Ayuda

- 📖 Lee [`README_CLOUD.md`](README_CLOUD.md) - Sección "Solución de Problemas"
- 🔍 Abre la consola del navegador (F12) para ver errores
- 📧 Revisa la documentación de [Supabase](https://supabase.com/docs)

---

## 🔐 Seguridad

- ✅ Contraseñas encriptadas
- ✅ Conexión HTTPS segura
- ✅ Row Level Security (cada usuario solo ve sus datos)
- ✅ Autenticación con tokens JWT
- ✅ Datos locales como respaldo

---

## 📱 Compatibilidad

### Navegadores
- ✅ Chrome/Edge (Recomendado)
- ✅ Firefox
- ✅ Safari
- ✅ Opera

### Dispositivos
- ✅ PC/Laptop
- ✅ Tablet
- ✅ Móvil (navegador)

---

## 🚀 Próximos Pasos

Una vez que tengas la app funcionando:

1. **Explora las funcionalidades**
   - Crea cuentas
   - Agrega transacciones
   - Configura presupuestos

2. **Prueba la sincronización**
   - Abre en otro dispositivo
   - Verifica que los datos se sincronizan

3. **Lee la documentación completa**
   - [`README_CLOUD.md`](README_CLOUD.md) para todas las características

---

## 💡 Consejos

### Para Mejores Resultados

1. **Usa el modo nube** para acceso multi-dispositivo
2. **Confirma tu email** para mayor seguridad
3. **Revisa regularmente** tus presupuestos
4. **Exporta a Excel** periódicamente como respaldo adicional

### Optimización

- La app funciona mejor en Chrome/Edge
- Usa modo oscuro para ahorrar batería
- La sincronización es automática, no necesitas hacer nada

---

## 📊 Estadísticas del Proyecto

- **Líneas de código:** ~2,000
- **Archivos:** 13
- **Tablas de BD:** 6
- **Funcionalidades:** 20+
- **Tiempo de configuración:** 10 min
- **Costo:** $0 (plan gratuito)

---

## 🎓 Tecnologías

- **Frontend:** HTML5, CSS3, JavaScript ES6+
- **Backend:** Supabase (PostgreSQL)
- **Autenticación:** Supabase Auth
- **Almacenamiento:** localStorage + Supabase
- **Seguridad:** Row Level Security (RLS)

---

## 📞 Soporte

### Recursos

- 📖 [Documentación de Supabase](https://supabase.com/docs)
- 💬 [Discord de Supabase](https://discord.supabase.com)
- 🎥 [Tutoriales en YouTube](https://www.youtube.com/c/Supabase)

### Archivos de Ayuda

- [`QUICK_START.md`](QUICK_START.md) - Inicio rápido
- [`README_CLOUD.md`](README_CLOUD.md) - Guía completa
- [`SUPABASE_SETUP.md`](SUPABASE_SETUP.md) - Configuración detallada

---

## 📝 Licencia

Este proyecto es de uso personal. Puedes modificarlo y adaptarlo a tus necesidades.

---

## 🎉 ¡Gracias por Usar la App!

Si tienes sugerencias o encuentras problemas, no dudes en:
- Revisar la documentación
- Consultar la consola del navegador (F12)
- Verificar la configuración de Supabase

**¡Disfruta gestionando tus finanzas!** 💰📊🚀

---

**Versión:** 2.0.0 (Cloud Edition)  
**Última actualización:** Enero 2026  
**Estado:** ✅ Producción
