# 🏛️ Sistema de Gestión de Trámites Municipales

## Municipalidad Provincial de Yau

Sistema completo de gestión de trámites con **Machine Learning**, **Reconocimiento Facial** e **Inteligencia Artificial**.

---

## 👥 Participantes del Proyecto

- **JARIB JOSUE NOLE ANCAJIMA**
- **BRUNO FAVIAN SALDARRIAGA MEJIAS**
- **LUIS FRANCISCO SOLANO CAMPOS**


---

## 🚀 Inicio Rápido

### 1. Instalar Dependencias
```bash
# Ejecutar script de instalación
INSTALAR_SISTEMA.bat
```

### 2. Configurar Base de Datos
1. Abrir XAMPP → Iniciar MySQL
2. Abrir phpMyAdmin: http://localhost/phpmyadmin
3. Ejecutar script: `database/schema.sql`

### 3. Configurar API de Gemini ⚠️ IMPORTANTE
**Es obligatorio configurar la API Key de Gemini para que funcionen todas las funciones de IA del sistema.**

1. Obtener clave en: https://makersuite.google.com/app/apikey
2. Editar `backend/.env`
3. Configurar: `GEMINI_API_KEY=tu_clave_aqui`

> **Nota:** Sin esta configuración, el asistente virtual y otras funciones de inteligencia artificial no funcionarán correctamente.

### 4. Iniciar Sistema
```bash
# Ejecutar script de inicio
INICIAR_SISTEMA.bat
```

El sistema se abrirá automáticamente en: http://localhost:5173

---

## 📚 Documentación

- **[LEEME_PRIMERO.txt](LEEME_PRIMERO.txt)** - Introducción y guía visual
- **[INICIO_RAPIDO.txt](INICIO_RAPIDO.txt)** - Guía de instalación detallada
- **[CONFIGURACION_IMPORTANTE.txt](CONFIGURACION_IMPORTANTE.txt)** - Configuración del sistema
- **[README_SISTEMA_MUNICIPAL.md](README_SISTEMA_MUNICIPAL.md)** - Documentación técnica completa
- **[RESUMEN_PROYECTO.md](RESUMEN_PROYECTO.md)** - Resumen ejecutivo del proyecto

---

## ✨ Características

- ✅ **Autenticación con DNI y Reconocimiento Facial**
- ✅ **Gestión completa de trámites**
- ✅ **Priorización inteligente con Machine Learning**
- ✅ **Asistente virtual con Gemini AI**
- ✅ **Base de datos MySQL con XAMPP**
- ✅ **Notificaciones en tiempo real**
- ✅ **Dashboard con estadísticas**
- ✅ **Interfaz moderna con React**

---

## 🛠️ Tecnologías

### Backend
- Flask (API REST)
- MySQL (Base de datos)
- scikit-learn (Machine Learning)
- face_recognition (Reconocimiento facial)
- Google Gemini (IA)

### Frontend
- React 18
- TailwindCSS
- Vite
- React Router

---

## 📋 Requisitos

- Python 3.9+
- Node.js 18+
- XAMPP (MySQL)
- Visual Studio Build Tools
- Google Gemini API Key

---

## 🌐 URLs del Sistema

- **Frontend:** http://localhost:5173
- **Backend API:** http://localhost:5000
- **phpMyAdmin:** http://localhost/phpmyadmin

---

## 📞 Soporte

Para más información, consulta la documentación completa en los archivos mencionados arriba.

---



**Desarrollado con ❤️ usando Machine Learning e Inteligencia Artificial**

© 2025 Municipalidad Provincial de Yau
