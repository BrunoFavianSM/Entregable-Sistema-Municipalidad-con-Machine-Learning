# 📦 GUÍA DE INSTALACIÓN COMPLETA

## Sistema Municipal de Trámites - YAU

---

## 📋 REQUISITOS PREVIOS

Antes de empezar, asegúrate de tener instalado:

### 1. Python 3.8 o superior
```bash
python --version
# Debe mostrar: Python 3.8.x o superior
```

**Descargar:** https://www.python.org/downloads/

### 2. Node.js 16 o superior
```bash
node --version
# Debe mostrar: v16.x.x o superior

npm --version
# Debe mostrar: 8.x.x o superior
```

**Descargar:** https://nodejs.org/

### 3. MySQL 8.0 o superior
```bash
mysql --version
# Debe mostrar: mysql Ver 8.0.x
```

**Descargar:** https://dev.mysql.com/downloads/mysql/

### 4. Git (Opcional, para control de versiones)
```bash
git --version
```

**Descargar:** https://git-scm.com/downloads

---

## 🗄️ PASO 1: CONFIGURAR BASE DE DATOS

### 1.1 Iniciar MySQL
```bash
# Windows (como Administrador):
net start MySQL80

# O desde MySQL Workbench o phpMyAdmin
```

### 1.2 Crear Base de Datos
```sql
-- Abrir MySQL:
mysql -u root -p

-- Crear base de datos:
CREATE DATABASE sistema_municipal_yau CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Verificar:
SHOW DATABASES;

-- Salir:
EXIT;
```

### 1.3 Importar Schema
```bash
cd C:\Users\Admin\Desktop\sistema_municipalidad\database

# Importar estructura:
mysql -u root -p sistema_municipal_yau < schema_completo_nuevo.sql

# Verificar:
mysql -u root -p
USE sistema_municipal_yau;
SHOW TABLES;
# Debe mostrar: usuarios, tramites, tipos_tramite, notificaciones, etc.
EXIT;
```

---

## 🐍 PASO 2: INSTALAR BACKEND (Python/Flask)

### 2.1 Navegar a carpeta backend
```bash
cd C:\Users\Admin\Desktop\sistema_municipalidad\backend
```

### 2.2 Crear entorno virtual (Recomendado)
```bash
# Crear entorno virtual:
python -m venv venv

# Activar (Windows):
venv\Scripts\activate

# Deberías ver (venv) al inicio de la línea
```

### 2.3 Instalar dependencias de Python
```bash
# Con requirements.txt:
pip install -r requirements.txt

# O manualmente:
pip install flask
pip install flask-cors
pip install flask-jwt-extended
pip install pymysql
pip install cryptography
pip install python-dotenv
pip install opencv-python
pip install numpy
pip install face-recognition
pip install pillow
pip install google-generativeai
pip install python-docx
pip install reportlab
```

### 2.4 Lista completa de dependencias backend:
```
flask==2.3.0
flask-cors==4.0.0
flask-jwt-extended==4.5.2
pymysql==1.1.0
cryptography==41.0.0
python-dotenv==1.0.0
opencv-python==4.8.0
numpy==1.24.3
face-recognition==1.3.0
pillow==10.0.0
google-generativeai==0.3.0
python-docx==0.8.11
reportlab==4.0.4
```

### 2.5 Configurar variables de entorno
```bash
# Crear archivo .env en la carpeta backend:
# backend/.env

DB_HOST=localhost
DB_USER=root
DB_PASSWORD=tu_password_mysql
DB_NAME=sistema_municipal_yau
JWT_SECRET_KEY=tu_clave_secreta_super_segura_123456
GEMINI_API_KEY=tu_api_key_de_google_gemini
```

**IMPORTANTE:** 
- Reemplaza `tu_password_mysql` con tu contraseña de MySQL
- Obtén una API Key de Gemini en: https://makersuite.google.com/app/apikey

### 2.6 Ejecutar migraciones adicionales
```bash
python ejecutar_migracion.py
# Debe mostrar: ✅ Columna agregada exitosamente
```

### 2.7 Iniciar servidor backend
```bash
python app.py
```

**Debe mostrar:**
```
 * Running on http://127.0.0.1:5000
 * Running on http://localhost:5000
```

✅ **Backend listo!** Mantén esta terminal abierta.

---

## ⚛️ PASO 3: INSTALAR FRONTEND (React/Vite)

### 3.1 Abrir NUEVA terminal
```bash
# No cierres la terminal del backend
# Abre otra terminal nueva
```

### 3.2 Navegar a carpeta frontend
```bash
cd C:\Users\Admin\Desktop\sistema_municipalidad\frontend
```

### 3.3 Instalar dependencias de Node.js
```bash
npm install
```

**Esto instalará:**
```json
{
  "react": "^18.2.0",
  "react-dom": "^18.2.0",
  "react-router-dom": "^6.16.0",
  "axios": "^1.5.0",
  "lucide-react": "^0.284.0",
  "react-hot-toast": "^2.4.1",
  "react-markdown": "^9.0.0"
}
```

### 3.4 Verificar instalación
```bash
# Ver dependencias instaladas:
npm list --depth=0
```

### 3.5 Iniciar servidor de desarrollo
```bash
npm run dev
```

**Debe mostrar:**
```
VITE v5.4.21  ready in XXX ms

➜  Local:   http://localhost:3000/
➜  Network: use --host to expose
```

✅ **Frontend listo!** Mantén esta terminal abierta.

---

## 🌐 PASO 4: VERIFICAR INSTALACIÓN

### 4.1 Verificar Backend
```bash
# En navegador:
http://localhost:5000

# Debe mostrar mensaje del backend
```

### 4.2 Verificar Frontend
```bash
# En navegador:
http://localhost:3000

# Debe mostrar página de login
```

### 4.3 Probar login (Usuario por defecto)
```
DNI: 12345678
Password: Admin2024!

# Si no existe, créalo desde la BD o la app
```

---

## 🔧 SOLUCIÓN DE PROBLEMAS COMUNES

### Problema 1: Error de MySQL Connection
```
Error: Can't connect to MySQL server

Solución:
1. Verificar que MySQL esté corriendo:
   net start MySQL80

2. Verificar credenciales en .env:
   DB_HOST=localhost
   DB_USER=root
   DB_PASSWORD=tu_password_correcta
   DB_NAME=sistema_municipal_yau
```

### Problema 2: ModuleNotFoundError en Python
```
Error: No module named 'flask'

Solución:
1. Activar entorno virtual:
   venv\Scripts\activate

2. Reinstalar dependencias:
   pip install -r requirements.txt
```

### Problema 3: npm ERR! en Frontend
```
Error: Cannot find module

Solución:
1. Eliminar node_modules:
   rmdir /s node_modules
   del package-lock.json

2. Reinstalar:
   npm install
```

### Problema 4: Puerto en uso
```
Error: Port 5000 is already in use

Solución:
1. Cerrar proceso en puerto 5000:
   taskkill /F /IM python.exe

2. O cambiar puerto en app.py:
   app.run(debug=True, port=5001)
```

### Problema 5: CORS Error
```
Error: CORS policy blocked

Solución:
1. Verificar que flask-cors esté instalado:
   pip install flask-cors

2. Verificar en app.py:
   CORS(app, origins=['http://localhost:3000'])
```

---

## 📦 INSTALACIÓN RÁPIDA (Resumen)

### Backend:
```bash
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
python app.py
```

### Frontend:
```bash
cd frontend
npm install
npm run dev
```

### Base de Datos:
```sql
CREATE DATABASE sistema_municipal_yau;
mysql -u root -p sistema_municipal_yau < database/schema_completo_nuevo.sql
```

---

## 📁 ESTRUCTURA DEL PROYECTO

```
sistema_municipalidad/
├── backend/
│   ├── app.py                  # Servidor Flask principal
│   ├── database.py             # Conexión MySQL
│   ├── auth.py                 # Autenticación
│   ├── face_recognition.py     # Reconocimiento facial
│   ├── gemini_service.py       # IA Gemini
│   ├── exportar_tramites.py    # Exportar PDF/DOCX
│   ├── requirements.txt        # Dependencias Python
│   ├── .env                    # Variables de entorno
│   └── venv/                   # Entorno virtual
│
├── frontend/
│   ├── src/
│   │   ├── pages/             # Páginas React
│   │   │   ├── Login.jsx
│   │   │   ├── Dashboard.jsx
│   │   │   ├── MisTramites.jsx
│   │   │   └── admin/
│   │   │       ├── AdminDashboard.jsx
│   │   │       ├── AdminTramites.jsx
│   │   │       └── AdminIA.jsx
│   │   ├── components/        # Componentes reutilizables
│   │   ├── context/          # Context API
│   │   └── App.jsx           # Componente principal
│   ├── package.json          # Dependencias Node
│   └── node_modules/         # Módulos instalados
│
├── database/
│   ├── schema_completo_nuevo.sql
│   └── agregar_documentos_admin.sql
│
└── README.md
```

---

## 🔐 CONFIGURACIÓN ADICIONAL

### Configurar Gemini AI (Opcional pero recomendado)

1. **Obtener API Key:**
   - Ir a: https://makersuite.google.com/app/apikey
   - Crear proyecto
   - Generar API Key

2. **Agregar a .env:**
   ```
   GEMINI_API_KEY=tu_api_key_aqui
   ```

3. **Probar IA:**
   - Login como ciudadano
   - Ir a "Asistente IA"
   - Hacer consulta

### Configurar Reconocimiento Facial (Opcional)

**Dependencias adicionales:**
```bash
pip install cmake
pip install dlib
pip install face-recognition
```

**Nota:** En Windows, puede requerir Visual Studio Build Tools.

---

## ✅ CHECKLIST DE INSTALACIÓN

- [ ] Python 3.8+ instalado
- [ ] Node.js 16+ instalado
- [ ] MySQL 8.0+ instalado y corriendo
- [ ] Base de datos creada e importada
- [ ] Backend: requirements.txt instalado
- [ ] Backend: .env configurado
- [ ] Backend: servidor corriendo en :5000
- [ ] Frontend: npm install completado
- [ ] Frontend: servidor corriendo en :3000
- [ ] Login funciona correctamente
- [ ] Dashboard carga sin errores

---

## 🚀 INICIAR EL SISTEMA (Uso diario)

### Terminal 1 - Backend:
```bash
cd C:\Users\Admin\Desktop\sistema_municipalidad\backend
venv\Scripts\activate
python app.py
```

### Terminal 2 - Frontend:
```bash
cd C:\Users\Admin\Desktop\sistema_municipalidad\frontend
npm run dev
```

### Acceder:
```
http://localhost:3000
```

---

## 📞 COMANDOS ÚTILES

### Backend:
```bash
# Ver dependencias instaladas:
pip list

# Actualizar pip:
python -m pip install --upgrade pip

# Generar requirements.txt:
pip freeze > requirements.txt

# Desactivar entorno virtual:
deactivate
```

### Frontend:
```bash
# Ver dependencias instaladas:
npm list

# Actualizar dependencias:
npm update

# Limpiar cache:
npm cache clean --force

# Build para producción:
npm run build
```

### Base de Datos:
```bash
# Backup:
mysqldump -u root -p sistema_municipal_yau > backup.sql

# Restaurar:
mysql -u root -p sistema_municipal_yau < backup.sql

# Ver estructura de tabla:
mysql -u root -p
USE sistema_municipal_yau;
DESCRIBE tramites;
```

---

## 🎯 CREDENCIALES POR DEFECTO

### Admin:
```
DNI: 12345678
Password: Admin2024!
Tipo: Administrador
```

### Crear nuevo usuario:
```sql
USE sistema_municipal_yau;

INSERT INTO usuarios (dni, password_hash, nombres, apellidos, email, tipo_usuario)
VALUES ('87654321', '$2b$12$...hash...', 'Ciudadano', 'Prueba', 'test@test.com', 'ciudadano');
```

---

## 📚 DOCUMENTACIÓN ADICIONAL

- **Backend API:** Ver `backend/app.py` - Todos los endpoints
- **Frontend Routes:** Ver `frontend/src/App.jsx` - Todas las rutas
- **Base de Datos:** Ver `database/schema_completo_nuevo.sql` - Estructura

---

## 🎉 ¡INSTALACIÓN COMPLETA!

Si todos los pasos anteriores fueron exitosos, tu sistema está listo para usar.

### URLs importantes:
- **Frontend:** http://localhost:3000
- **Backend:** http://localhost:5000
- **Admin Dashboard:** http://localhost:3000/admin
- **Admin IA:** http://localhost:3000/admin/ia

---

**¿Problemas?** Revisa la sección "Solución de Problemas Comunes" arriba.

**Fecha:** 5 de noviembre, 2025
**Versión:** 1.0
**Sistema:** Windows 10/11
