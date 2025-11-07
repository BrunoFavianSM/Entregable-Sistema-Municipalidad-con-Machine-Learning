-- ============================================
-- SISTEMA MUNICIPAL - BASE DE DATOS COMPLETA
-- ============================================

DROP DATABASE IF EXISTS municipalidad_yau;
CREATE DATABASE municipalidad_yau CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE municipalidad_yau;

-- ============================================
-- TABLA: usuarios
-- ============================================
CREATE TABLE usuarios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    dni VARCHAR(8) UNIQUE NOT NULL,
    nombres VARCHAR(100) NOT NULL,
    apellidos VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    telefono VARCHAR(15),
    direccion TEXT,
    fecha_nacimiento DATE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    tipo_usuario ENUM('ciudadano', 'administrador') DEFAULT 'ciudadano',
    face_encoding BLOB,
    activo BOOLEAN DEFAULT TRUE,
    fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ultimo_acceso TIMESTAMP NULL,
    intentos_fallidos INT DEFAULT 0,
    cuenta_bloqueada BOOLEAN DEFAULT FALSE,
    INDEX idx_dni (dni),
    INDEX idx_email (email),
    INDEX idx_tipo (tipo_usuario)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- TABLA: preguntas_seguridad
-- ============================================
CREATE TABLE preguntas_seguridad (
    id INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT NOT NULL,
    pregunta VARCHAR(200) NOT NULL,
    respuesta_hash VARCHAR(255) NOT NULL,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_question (usuario_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- TABLA: tipos_tramite
-- ============================================
CREATE TABLE tipos_tramite (
    id INT AUTO_INCREMENT PRIMARY KEY,
    codigo VARCHAR(20) UNIQUE NOT NULL,
    nombre VARCHAR(200) NOT NULL,
    descripcion TEXT,
    categoria ENUM(
        'impuestos_pagos',
        'catastro_propiedad',
        'licencias',
        'obras_construccion',
        'quejas_denuncias',
        'registro_civil',
        'transporte_transito',
        'servicios_municipales',
        'atencion_ciudadano'
    ) NOT NULL,
    requisitos TEXT,
    costo DECIMAL(10,2) DEFAULT 0.00,
    tiempo_estimado_dias INT DEFAULT 15,
    prioridad_base INT DEFAULT 5,
    requiere_documentos BOOLEAN DEFAULT FALSE,
    activo BOOLEAN DEFAULT TRUE,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_categoria (categoria),
    INDEX idx_activo (activo)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- TABLA: tramites
-- ============================================
CREATE TABLE tramites (
    id INT AUTO_INCREMENT PRIMARY KEY,
    codigo_tramite VARCHAR(50) UNIQUE NOT NULL,
    usuario_id INT NOT NULL,
    tipo_tramite_id INT NOT NULL,
    estado ENUM('pendiente', 'en_revision', 'observado', 'aprobado', 'rechazado', 'completado') DEFAULT 'pendiente',
    prioridad INT DEFAULT 5,
    score_ml FLOAT DEFAULT 5.0,
    descripcion TEXT,
    respuesta_admin TEXT,
    documentos_adjuntos JSON,
    archivos_respuesta JSON,
    fecha_solicitud TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    fecha_completado TIMESTAMP NULL,
    tiempo_atencion_dias INT,
    atendido_por INT,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    FOREIGN KEY (tipo_tramite_id) REFERENCES tipos_tramite(id),
    FOREIGN KEY (atendido_por) REFERENCES usuarios(id),
    INDEX idx_codigo (codigo_tramite),
    INDEX idx_usuario (usuario_id),
    INDEX idx_estado (estado),
    INDEX idx_fecha (fecha_solicitud)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- TABLA: archivos_adjuntos
-- ============================================
CREATE TABLE archivos_adjuntos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    tramite_id INT NOT NULL,
    nombre_archivo VARCHAR(255) NOT NULL,
    nombre_original VARCHAR(255) NOT NULL,
    ruta_archivo VARCHAR(500) NOT NULL,
    tipo_archivo VARCHAR(100),
    tamano_bytes BIGINT,
    tipo_documento ENUM('requisito', 'adicional', 'respuesta_admin') DEFAULT 'requisito',
    subido_por INT NOT NULL,
    fecha_subida TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (tramite_id) REFERENCES tramites(id) ON DELETE CASCADE,
    FOREIGN KEY (subido_por) REFERENCES usuarios(id),
    INDEX idx_tramite (tramite_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- TABLA: notificaciones
-- ============================================
CREATE TABLE notificaciones (
    id INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT NOT NULL,
    tramite_id INT,
    tipo ENUM('info', 'exito', 'advertencia', 'error') DEFAULT 'info',
    titulo VARCHAR(200) NOT NULL,
    mensaje TEXT NOT NULL,
    leida BOOLEAN DEFAULT FALSE,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_lectura TIMESTAMP NULL,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    FOREIGN KEY (tramite_id) REFERENCES tramites(id) ON DELETE SET NULL,
    INDEX idx_usuario_leida (usuario_id, leida),
    INDEX idx_fecha (fecha_creacion)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- TABLA: consultas_gemini
-- ============================================
CREATE TABLE consultas_gemini (
    id INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT,
    tramite_id INT,
    pregunta TEXT NOT NULL,
    respuesta TEXT NOT NULL,
    contexto_usado JSON,
    tiempo_respuesta_ms INT,
    fecha_consulta TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE SET NULL,
    FOREIGN KEY (tramite_id) REFERENCES tramites(id) ON DELETE SET NULL,
    INDEX idx_usuario (usuario_id),
    INDEX idx_fecha (fecha_consulta)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- TABLA: configuracion
-- ============================================
CREATE TABLE configuracion (
    id INT AUTO_INCREMENT PRIMARY KEY,
    clave VARCHAR(100) UNIQUE NOT NULL,
    valor TEXT,
    tipo ENUM('string', 'number', 'boolean', 'json') DEFAULT 'string',
    descripcion TEXT,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- INSERTAR DATOS INICIALES
-- ============================================

-- Administrador (Alcalde)
INSERT INTO usuarios (dni, nombres, apellidos, email, telefono, fecha_nacimiento, password_hash, tipo_usuario) VALUES
('12345678', 'Alcalde', 'Municipal', 'alcalde@municipalidad-yau.gob.pe', '987654321', '1980-01-01', 
'$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5ux5wdLAM4WiW', 'administrador');
-- Contraseña: Admin2024!

-- ============================================
-- TIPOS DE TRÁMITE - CATEGORÍA 1: IMPUESTOS Y PAGOS
-- ============================================
INSERT INTO tipos_tramite (codigo, nombre, descripcion, categoria, requisitos, costo, tiempo_estimado_dias, prioridad_base, requiere_documentos) VALUES
('IP-001', 'Pagar Impuesto Predial', 'Pago del impuesto predial anual o fraccionado', 'impuestos_pagos', 'DNI del propietario, Código de predio', 0.00, 1, 8, FALSE),
('IP-002', 'Pagar Arbitrios Municipales', 'Pago de arbitrios (limpieza, serenazgo, parques)', 'impuestos_pagos', 'DNI, Código de predio o dirección', 0.00, 1, 8, FALSE),
('IP-003', 'Consultar Deuda Tributaria', 'Consulta de estado de cuenta y deudas pendientes', 'impuestos_pagos', 'DNI, Código de predio', 0.00, 1, 6, FALSE),
('IP-004', 'Constancia de No Adeudo', 'Certificado que acredita no tener deudas municipales', 'impuestos_pagos', 'DNI, Estar al día en pagos', 25.00, 3, 7, FALSE);

-- ============================================
-- TIPOS DE TRÁMITE - CATEGORÍA 2: CATASTRO Y PROPIEDAD
-- ============================================
INSERT INTO tipos_tramite (codigo, nombre, descripcion, categoria, requisitos, costo, tiempo_estimado_dias, prioridad_base, requiere_documentos) VALUES
('CP-001', 'Certificado Catastral', 'Documento que certifica características del predio', 'catastro_propiedad', 'DNI, Código de predio, Pago de tasa', 35.00, 5, 6, FALSE),
('CP-002', 'Plano Catastral', 'Plano oficial del predio registrado', 'catastro_propiedad', 'DNI, Código de predio, Pago de tasa', 45.00, 7, 6, FALSE),
('CP-003', 'Actualización de Datos de Predio', 'Actualizar información del predio o propietario', 'catastro_propiedad', 'DNI, Documento de propiedad, Nuevos datos', 30.00, 10, 5, TRUE),
('CP-004', 'Numeración Municipal', 'Asignación de número oficial a inmueble', 'catastro_propiedad', 'DNI, Documento de propiedad, Croquis de ubicación', 40.00, 15, 7, TRUE),
('CP-005', 'Cambio de Dirección', 'Modificación de dirección registrada', 'catastro_propiedad', 'DNI, Justificación del cambio', 25.00, 10, 5, TRUE);

-- ============================================
-- TIPOS DE TRÁMITE - CATEGORÍA 3: LICENCIAS Y AUTORIZACIONES
-- ============================================
INSERT INTO tipos_tramite (codigo, nombre, descripcion, categoria, requisitos, costo, tiempo_estimado_dias, prioridad_base, requiere_documentos) VALUES
('LIC-001', 'Licencia de Funcionamiento', 'Autorización para apertura de negocio', 'licencias', 'DNI/RUC, Declaración jurada, Certificado de INDECI, Pago de tasa', 150.00, 20, 8, TRUE),
('LIC-002', 'Renovación de Licencia', 'Renovación de licencia de funcionamiento vigente', 'licencias', 'DNI/RUC, Licencia anterior, Pago de tasa', 80.00, 10, 6, TRUE),
('LIC-003', 'Modificación de Licencia', 'Cambio de giro, ampliación o reducción de actividades', 'licencias', 'DNI/RUC, Licencia vigente, Declaración de cambios', 100.00, 15, 6, TRUE),
('LIC-004', 'Autorización para Evento', 'Permiso para eventos públicos, ferias, actividades', 'licencias', 'DNI, Plan del evento, Certificado de seguridad', 120.00, 10, 7, TRUE),
('LIC-005', 'Autorización de Aviso Publicitario', 'Permiso para colocación de anuncios o publicidad', 'licencias', 'DNI/RUC, Diseño del aviso, Ubicación propuesta', 90.00, 12, 5, TRUE);

-- ============================================
-- TIPOS DE TRÁMITE - CATEGORÍA 4: OBRAS Y CONSTRUCCIÓN
-- ============================================
INSERT INTO tipos_tramite (codigo, nombre, descripcion, categoria, requisitos, costo, tiempo_estimado_dias, prioridad_base, requiere_documentos) VALUES
('OB-001', 'Licencia de Obra Nueva', 'Permiso para construcción de edificación nueva', 'obras_construccion', 'DNI, Planos aprobados, Estudio de suelos, Pago de tasa', 500.00, 30, 9, TRUE),
('OB-002', 'Licencia de Ampliación', 'Permiso para ampliar construcción existente', 'obras_construccion', 'DNI, Planos de ampliación, Licencia original', 350.00, 25, 8, TRUE),
('OB-003', 'Licencia de Remodelación', 'Permiso para remodelar edificación existente', 'obras_construccion', 'DNI, Planos de remodelación, Fotos del estado actual', 300.00, 20, 7, TRUE),
('OB-004', 'Regularización de Construcción', 'Legalizar construcción existente sin permiso', 'obras_construccion', 'DNI, Planos de lo construido, Declaración jurada', 600.00, 45, 6, TRUE),
('OB-005', 'Inspección de Obra', 'Solicitud de inspección técnica municipal', 'obras_construccion', 'DNI, Código de obra, Avance de construcción', 80.00, 7, 8, FALSE),
('OB-006', 'Visado de Planos', 'Aprobación de planos arquitectónicos', 'obras_construccion', 'DNI, Planos firmados por arquitecto, Memoria descriptiva', 200.00, 15, 7, TRUE);

-- ============================================
-- TIPOS DE TRÁMITE - CATEGORÍA 5: QUEJAS, RECLAMOS Y DENUNCIAS
-- ============================================
INSERT INTO tipos_tramite (codigo, nombre, descripcion, categoria, requisitos, costo, tiempo_estimado_dias, prioridad_base, requiere_documentos) VALUES
('QD-001', 'Queja por Servicio Municipal', 'Reclamo sobre servicios municipales deficientes', 'quejas_denuncias', 'DNI, Descripción detallada', 0.00, 10, 7, FALSE),
('QD-002', 'Denuncia de Obra Ilegal', 'Reportar construcción sin licencia o irregular', 'quejas_denuncias', 'Ubicación exacta, Evidencias (fotos/videos)', 0.00, 15, 9, TRUE),
('QD-003', 'Denuncia por Ruido', 'Queja por contaminación sonora', 'quejas_denuncias', 'DNI, Dirección del origen, Horarios', 0.00, 7, 8, FALSE),
('QD-004', 'Denuncia por Basura', 'Reportar acumulación de residuos o basura', 'quejas_denuncias', 'Ubicación, Fotos del problema', 0.00, 5, 8, TRUE),
('QD-005', 'Problemas Vecinales', 'Mediación de conflictos entre vecinos', 'quejas_denuncias', 'DNI de ambas partes, Descripción del conflicto', 0.00, 20, 6, FALSE);

-- ============================================
-- TIPOS DE TRÁMITE - CATEGORÍA 6: REGISTRO CIVIL
-- ============================================
INSERT INTO tipos_tramite (codigo, nombre, descripcion, categoria, requisitos, costo, tiempo_estimado_dias, prioridad_base, requiere_documentos) VALUES
('RC-001', 'Copia Certificada de Nacimiento', 'Copia oficial de partida de nacimiento', 'registro_civil', 'DNI del solicitante, Datos del titular', 15.00, 2, 7, FALSE),
('RC-002', 'Copia Certificada de Matrimonio', 'Copia oficial de partida de matrimonio', 'registro_civil', 'DNI de solicitante, Datos de los cónyuges', 15.00, 2, 7, FALSE),
('RC-003', 'Copia Certificada de Defunción', 'Copia oficial de partida de defunción', 'registro_civil', 'DNI del solicitante, Datos del fallecido', 15.00, 2, 7, FALSE),
('RC-004', 'Rectificación de Acta', 'Corrección de errores en actas de registro civil', 'registro_civil', 'DNI, Acta original, Documentos que sustenten la corrección', 80.00, 30, 6, TRUE),
('RC-005', 'Agendar Cita Registro Civil', 'Reserva de cita para atención presencial', 'registro_civil', 'DNI, Motivo de la cita', 0.00, 1, 5, FALSE);

-- ============================================
-- TIPOS DE TRÁMITE - CATEGORÍA 7: TRANSPORTE Y TRÁNSITO
-- ============================================
INSERT INTO tipos_tramite (codigo, nombre, descripcion, categoria, requisitos, costo, tiempo_estimado_dias, prioridad_base, requiere_documentos) VALUES
('TT-001', 'Pago de Multa de Tránsito', 'Pago de papeleta de infracción vehicular', 'transporte_transito', 'DNI, Número de papeleta', 0.00, 1, 7, FALSE),
('TT-002', 'Apelación de Multa', 'Recurso de reconsideración de papeleta', 'transporte_transito', 'DNI, Papeleta, Sustento de la apelación', 30.00, 15, 7, TRUE),
('TT-003', 'Permiso de Circulación', 'Autorización para circulación de vehículos especiales', 'transporte_transito', 'DNI, Tarjeta de propiedad, SOAT vigente', 100.00, 10, 6, TRUE),
('TT-004', 'Permiso de Estacionamiento', 'Autorización para estacionamiento exclusivo', 'transporte_transito', 'DNI, Justificación, Croquis de ubicación', 150.00, 15, 5, TRUE),
('TT-005', 'Registro de Vehículo Menor', 'Registro de mototaxis, triciclos, etc.', 'transporte_transito', 'DNI, Tarjeta de propiedad, Licencia de conducir', 120.00, 12, 6, TRUE);

-- ============================================
-- TIPOS DE TRÁMITE - CATEGORÍA 8: SERVICIOS MUNICIPALES
-- ============================================
INSERT INTO tipos_tramite (codigo, nombre, descripcion, categoria, requisitos, costo, tiempo_estimado_dias, prioridad_base, requiere_documentos) VALUES
('SM-001', 'Limpieza de Terreno', 'Solicitud de limpieza de terreno abandonado', 'servicios_municipales', 'DNI, Ubicación del terreno, Fotos', 200.00, 10, 7, TRUE),
('SM-002', 'Retiro de Escombros', 'Servicio de recojo de desmonte o escombros', 'servicios_municipales', 'DNI, Dirección, Cantidad estimada', 150.00, 7, 7, FALSE),
('SM-003', 'Reporte de Falla en Alumbrado', 'Avisar de luminarias malogradas o apagadas', 'servicios_municipales', 'Ubicación exacta, Referencia', 0.00, 5, 8, FALSE),
('SM-004', 'Poda de Árboles', 'Solicitud de poda o tala de árboles', 'servicios_municipales', 'DNI, Dirección, Justificación', 80.00, 15, 6, TRUE),
('SM-005', 'Mantenimiento de Parques', 'Solicitud de arreglo de áreas verdes', 'servicios_municipales', 'Ubicación del parque, Descripción', 0.00, 10, 6, FALSE);

-- ============================================
-- TIPOS DE TRÁMITE - CATEGORÍA 9: ATENCIÓN AL CIUDADANO
-- ============================================
INSERT INTO tipos_tramite (codigo, nombre, descripcion, categoria, requisitos, costo, tiempo_estimado_dias, prioridad_base, requiere_documentos) VALUES
('AC-001', 'Reservar Cita Presencial', 'Agendar cita para atención en oficinas', 'atencion_ciudadano', 'DNI, Motivo de la cita', 0.00, 1, 5, FALSE),
('AC-002', 'Consulta de Estado de Trámite', 'Verificar avance de trámite en proceso', 'atencion_ciudadano', 'DNI, Código de trámite', 0.00, 1, 6, FALSE),
('AC-003', 'Solicitud de Información Pública', 'Acceso a información según Ley de Transparencia', 'atencion_ciudadano', 'DNI, Detalle de información solicitada', 0.00, 10, 6, FALSE),
('AC-004', 'Descargar Documentos Digitales', 'Obtener copias digitales de resoluciones emitidas', 'atencion_ciudadano', 'DNI, Código de trámite', 0.00, 1, 5, FALSE),
('AC-005', 'Libro de Reclamaciones', 'Registro de quejas en libro oficial', 'atencion_ciudadano', 'DNI, Motivo del reclamo', 0.00, 15, 7, FALSE);

-- ============================================
-- CONFIGURACIONES INICIALES
-- ============================================
INSERT INTO configuracion (clave, valor, tipo, descripcion) VALUES
('sistema_nombre', 'Municipalidad de Yau', 'string', 'Nombre de la institución'),
('sistema_email', 'contacto@municipalidad-yau.gob.pe', 'string', 'Email de contacto'),
('sistema_telefono', '+51 987 654 321', 'string', 'Teléfono de contacto'),
('gemini_activo', 'true', 'boolean', 'Activar asistente de IA'),
('max_archivos_tramite', '5', 'number', 'Máximo de archivos por trámite'),
('tamano_max_archivo_mb', '10', 'number', 'Tamaño máximo de archivo en MB'),
('tipos_archivo_permitidos', '["pdf","jpg","jpeg","png","docx","xlsx"]', 'json', 'Extensiones de archivo permitidas');

-- ============================================
-- VISTA: Trámites con información completa
-- ============================================
CREATE VIEW vista_tramites_completos AS
SELECT 
    t.id,
    t.codigo_tramite,
    t.estado,
    t.prioridad,
    t.score_ml,
    t.descripcion,
    t.respuesta_admin,
    t.fecha_solicitud,
    t.fecha_actualizacion,
    t.fecha_completado,
    t.tiempo_atencion_dias,
    u.id as usuario_id,
    u.dni as usuario_dni,
    CONCAT(u.nombres, ' ', u.apellidos) as usuario_nombre,
    u.email as usuario_email,
    u.telefono as usuario_telefono,
    tt.codigo as tipo_codigo,
    tt.nombre as tipo_nombre,
    tt.categoria as tipo_categoria,
    tt.costo as tipo_costo,
    tt.tiempo_estimado_dias as tipo_tiempo_estimado,
    admin.id as admin_id,
    CONCAT(admin.nombres, ' ', admin.apellidos) as atendido_por_nombre
FROM tramites t
JOIN usuarios u ON t.usuario_id = u.id
JOIN tipos_tramite tt ON t.tipo_tramite_id = tt.id
LEFT JOIN usuarios admin ON t.atendido_por = admin.id;

-- ============================================
-- ÍNDICES ADICIONALES PARA OPTIMIZACIÓN
-- ============================================
CREATE INDEX idx_tramites_estado_prioridad ON tramites(estado, prioridad DESC);
CREATE INDEX idx_tramites_fecha_estado ON tramites(fecha_solicitud DESC, estado);
CREATE INDEX idx_notificaciones_usuario_fecha ON notificaciones(usuario_id, fecha_creacion DESC);

-- ============================================
-- FIN DEL SCRIPT
-- ============================================
