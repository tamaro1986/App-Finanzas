# ============================================================================
# SCRIPT PARA SUBIR CAMBIOS A GIT
# ============================================================================
# Este script te ayuda a subir todos los cambios a Git de forma segura
# ============================================================================

# IMPORTANTE: Ejecuta estos comandos UNO POR UNO, no todos a la vez

# ============================================================================
# PASO 1: Verificar el estado actual
# ============================================================================
git status

# Esto te mostrará todos los archivos modificados y nuevos

# ============================================================================
# PASO 2: Agregar TODOS los archivos (excepto .env que está en .gitignore)
# ============================================================================
git add .

# Esto agregará todos los archivos modificados al staging area
# El archivo .env NO se agregará porque está en .gitignore

# ============================================================================
# PASO 3: Verificar qué se va a subir
# ============================================================================
git status

# Verifica que .env NO aparezca en la lista
# Si aparece .env, NO CONTINÚES y avísame

# ============================================================================
# PASO 4: Crear un commit con un mensaje descriptivo
# ============================================================================
git commit -m "feat: Implementar configuración automática de Supabase y mejorar sincronización

- Agregar sistema de configuración automática desde .env
- Mejorar manejo de errores en sincronización con Supabase
- Implementar sistema de notificaciones elegante
- Agregar indicador de estado de sincronización
- Crear documentación completa (INICIO_RAPIDO.md, CONFIGURACION_AUTOMATICA.md, etc.)
- Actualizar .gitignore para proteger credenciales
- Mejorar componente Settings con banner informativo"

# ============================================================================
# PASO 5: Subir los cambios a GitHub
# ============================================================================
git push origin main

# Si tu rama principal se llama 'master' en lugar de 'main', usa:
# git push origin master

# Si es la primera vez que subes este repositorio, usa:
# git push -u origin main

# ============================================================================
# VERIFICACIÓN DE SEGURIDAD
# ============================================================================
# ANTES de hacer push, verifica que:
# 1. El archivo .env NO esté en la lista de archivos a subir
# 2. El archivo .gitignore SÍ incluya .env
# 3. No haya credenciales sensibles en otros archivos

# Para verificar que .env no se subirá:
git ls-files | grep .env

# Si este comando NO muestra nada, es seguro continuar
# Si muestra .env, NO HAGAS PUSH y avísame

# ============================================================================
# COMANDOS ÚTILES ADICIONALES
# ============================================================================

# Ver el historial de commits:
git log --oneline -5

# Ver qué archivos están en staging:
git diff --cached --name-only

# Ver los cambios en un archivo específico:
git diff src/lib/supabase.js

# Deshacer el último commit (si te equivocaste):
git reset --soft HEAD~1

# ============================================================================
# NOTAS IMPORTANTES
# ============================================================================
# 1. El archivo .env NUNCA debe subirse a Git
# 2. Solo sube la anon/public key, NUNCA la service_role key
# 3. Si accidentalmente subiste .env, avísame inmediatamente
# 4. Siempre verifica con 'git status' antes de hacer commit
