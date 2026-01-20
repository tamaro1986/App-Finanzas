# 🚀 App de Finanzas con Base de Datos en la Nube

## ✨ Características Nuevas

Tu aplicación de finanzas ahora incluye:

- ☁️ **Sincronización en la nube** con Supabase
- 🔐 **Autenticación de usuarios** (registro, login, recuperación de contraseña)
- 📱 **Acceso desde cualquier dispositivo** con los mismos datos
- 🔄 **Sincronización automática** cuando hay conexión
- 💾 **Respaldo automático** en la nube
- 📴 **Modo offline** - funciona sin internet y sincroniza cuando vuelve la conexión

---

## 📋 Pasos para Configurar

### 1. Configurar Supabase

Sigue la guía completa en el archivo **`SUPABASE_SETUP.md`** que se encuentra en este mismo directorio.

**Resumen rápido:**
1. Crea una cuenta gratuita en [supabase.com](https://supabase.com)
2. Crea un nuevo proyecto
3. Ejecuta el script SQL para crear las tablas
4. Copia tus credenciales (URL y API Key)

### 2. Configurar la Aplicación

Una vez que tengas tus credenciales de Supabase:

1. Abre el archivo **`config.json`**
2. Busca la sección `"supabase"`:
   ```json
   "supabase": {
     "url": "",
     "anonKey": ""
   }
   ```
3. Pega tus credenciales:
   ```json
   "supabase": {
     "url": "https://tu-proyecto.supabase.co",
     "anonKey": "tu-clave-anon-aqui"
   }
   ```
4. Guarda el archivo

### 3. Ejecutar la Aplicación

1. Abre `index.html` en tu navegador
2. Verás un modal de inicio de sesión
3. Opciones:
   - **Crear cuenta nueva** - Regístrate con tu email
   - **Iniciar sesión** - Si ya tienes cuenta
   - **Continuar sin cuenta** - Usar solo localmente (sin sincronización)

---

## 🎯 Cómo Funciona

### Primera Vez

Cuando abres la aplicación por primera vez:

1. **Si NO configuras Supabase**: La app funciona 100% local como antes
2. **Si configuras Supabase**: Verás el modal de login:
   - Puedes crear una cuenta nueva
   - O continuar sin cuenta (modo local)

### Con Cuenta

Una vez que inicias sesión:

- ✅ Todos tus datos se guardan automáticamente en la nube
- ✅ Los datos también se guardan localmente (funciona offline)
- ✅ Cuando vuelves a abrir la app, tus datos se sincronizan
- ✅ Puedes acceder desde otro dispositivo con la misma cuenta

### Sin Conexión

Si pierdes la conexión a internet:

- ✅ La app sigue funcionando normalmente
- ✅ Los cambios se guardan localmente
- ✅ Cuando vuelve la conexión, todo se sincroniza automáticamente

---

## 🔧 Archivos Nuevos

Se han agregado estos archivos a tu proyecto:

| Archivo | Descripción |
|---------|-------------|
| `supabase-client.js` | Cliente para comunicarse con Supabase |
| `auth-ui.js` | Interfaz de usuario para login/registro |
| `auth-styles.css` | Estilos para la autenticación |
| `SUPABASE_SETUP.md` | Guía detallada de configuración |
| `README_CLOUD.md` | Este archivo |

### Archivos Modificados

| Archivo | Cambios |
|---------|---------|
| `script.js` | Agregada integración con Supabase y métodos de sincronización |
| `index.html` | Agregado link al CSS de autenticación y toolbar |
| `config.json` | Agregada sección de configuración de Supabase |

---

## 🎨 Interfaz de Usuario

### Botón de Perfil

Cuando inicias sesión, verás un botón con tu email en la esquina superior derecha:

- **Sincronizar Ahora**: Fuerza una sincronización manual
- **Cerrar Sesión**: Cierra tu sesión (los datos locales se mantienen)

### Indicador de Sincronización

En la esquina inferior derecha verás el estado:

- 🔄 **Sincronizando...** - Guardando datos en la nube
- ✅ **Sincronizado** - Todo está actualizado
- ❌ **Error** - Hubo un problema
- 📴 **Sin conexión** - Trabajando offline

---

## 🔐 Seguridad

- ✅ Cada usuario solo ve sus propios datos
- ✅ Las contraseñas están encriptadas
- ✅ Conexión segura (HTTPS)
- ✅ Row Level Security (RLS) habilitado en Supabase

---

## 💡 Consejos

### Migrar Datos Existentes

Si ya tienes datos locales y creas una cuenta:

1. Al iniciar sesión por primera vez, la app te preguntará:
   - **OK** = Usar datos de la nube (sobrescribe local)
   - **Cancelar** = Subir datos locales a la nube

2. Recomendación: Si es tu primera vez, selecciona **Cancelar** para subir tus datos

### Usar en Múltiples Dispositivos

1. Configura Supabase con las **mismas credenciales** en todos los dispositivos
2. Inicia sesión con la **misma cuenta** en todos
3. Los datos se sincronizarán automáticamente

### Trabajar Sin Internet

- La app funciona 100% offline
- Los cambios se guardan localmente
- Al reconectar, todo se sincroniza automáticamente

---

## 🆘 Solución de Problemas

### No veo el modal de login

**Causa**: Supabase no está configurado o hay un error en las credenciales

**Solución**:
1. Verifica que `config.json` tenga las credenciales correctas
2. Abre la consola del navegador (F12) para ver errores
3. Si no quieres usar Supabase, deja las credenciales vacías

### Error al iniciar sesión

**Causa**: Credenciales incorrectas o email no confirmado

**Solución**:
1. Verifica tu email y contraseña
2. Si es cuenta nueva, revisa tu correo para confirmar
3. Usa "¿Olvidaste tu contraseña?" si es necesario

### Los datos no se sincronizan

**Causa**: No hay conexión o error en Supabase

**Solución**:
1. Verifica tu conexión a internet
2. Revisa la consola del navegador (F12)
3. Haz clic en "Sincronizar Ahora" en el menú de usuario

### Quiero volver a modo local

**Solución**:
1. Cierra sesión desde el menú de usuario
2. O deja las credenciales de Supabase vacías en `config.json`

---

## 📱 Próximos Pasos

Con esta base, puedes:

1. **Crear una app móvil** usando frameworks como:
   - React Native
   - Flutter
   - Ionic
   
2. **Agregar más funcionalidades**:
   - Compartir presupuestos con otros usuarios
   - Notificaciones push
   - Reportes avanzados
   - Exportación automática

3. **Mejorar la sincronización**:
   - Sincronización en tiempo real
   - Resolución de conflictos más avanzada
   - Historial de cambios

---

## 📞 Soporte

Si tienes problemas:

1. Revisa la guía `SUPABASE_SETUP.md`
2. Verifica la consola del navegador (F12)
3. Asegúrate de que las credenciales sean correctas
4. Verifica que las tablas estén creadas en Supabase

---

## 🎉 ¡Disfruta tu App de Finanzas en la Nube!

Ahora tienes una aplicación completa con:
- ✅ Gestión de cuentas y transacciones
- ✅ Presupuestos mensuales y anuales
- ✅ Sincronización en la nube
- ✅ Acceso desde cualquier dispositivo
- ✅ Modo offline
- ✅ Seguridad y privacidad

**¡Tus finanzas, siempre contigo!** 💰📊🚀
