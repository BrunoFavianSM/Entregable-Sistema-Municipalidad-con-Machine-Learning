"""
Sistema Municipal - Versión Simplificada (SIN JWT)
Se conecta a la MISMA base de datos MySQL en XAMPP
TODO es REAL - Nada es falso
"""
from flask import Flask, request, jsonify, session, send_file
from flask_cors import CORS
import os
import numpy as np
from PIL import Image
import io
import base64
import json
from datetime import datetime, timedelta
import face_recognition
import pickle
import logging
import warnings

# Suprimir warnings de MySQL
warnings.filterwarnings('ignore', message='.*format-parameters.*')
warnings.filterwarnings('ignore', category=DeprecationWarning)

# Módulos del sistema (MISMOS que app.py)
from config import Config
from database import (
    Database, get_usuario_by_dni, get_usuario_by_email, get_usuario_by_id,
    crear_usuario, actualizar_face_encoding, get_tipos_tramite,
    get_tramites_usuario, get_tramites_pendientes, crear_notificacion,
    get_notificaciones_usuario, marcar_notificacion_leida,
    get_configuracion, set_configuracion, get_estadisticas_dashboard,
    verificar_password, guardar_pregunta_seguridad, get_pregunta_seguridad,
    verificar_respuesta_seguridad, actualizar_password, get_archivos_tramite,
    guardar_archivo_adjunto
)
from ml_engine import ml_engine
from gemini_service import gemini_service

# Configurar logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Crear aplicación Flask
app = Flask(__name__)
app.secret_key = 'sistema-municipal-yau-2024'  # Para sesiones
app.config.from_object(Config)
Config.init_app(app)

# Configurar CORS
CORS(app, origins=['http://localhost:5173', 'http://localhost:3000'], supports_credentials=True)

# Variables globales
face_encodings_db = {}
current_user = {}  # Sesión simple en memoria

# Funciones de utilidad
def get_face_encoding(image_bytes):
    """Obtener encoding facial de una imagen"""
    try:
        img = Image.open(io.BytesIO(image_bytes)).convert('RGB')
        img_array = np.array(img)
        
        face_locations = face_recognition.face_locations(img_array)
        
        if len(face_locations) == 0:
            return None, "No se detectó ningún rostro en la imagen"
        
        if len(face_locations) > 1:
            return None, "Se detectaron múltiples rostros"
        
        face_encodings = face_recognition.face_encodings(img_array, face_locations)
        
        if len(face_encodings) == 0:
            return None, "No se pudo procesar el rostro"
        
        return face_encodings[0], None
    
    except Exception as e:
        return None, f"Error al procesar imagen: {str(e)}"

def recognize_face(face_encoding):
    """Reconocer rostro"""
    if len(face_encodings_db) == 0:
        return None, 0.0
    
    best_match_id = None
    best_similarity = 0.0
    
    for user_id, stored_encoding in face_encodings_db.items():
        distance = face_recognition.face_distance([stored_encoding], face_encoding)[0]
        similarity = max(0, (1 - distance))
        
        if similarity > best_similarity and similarity >= 0.6:
            best_similarity = similarity
            best_match_id = user_id
    
    return best_match_id, best_similarity

def load_face_encodings():
    """Cargar encodings faciales desde BD"""
    global face_encodings_db
    
    try:
        query = "SELECT id, face_encoding FROM usuarios WHERE face_encoding IS NOT NULL"
        usuarios = Database.execute_query(query)
        
        for usuario in usuarios:
            if usuario['face_encoding']:
                encoding = pickle.loads(usuario['face_encoding'])
                face_encodings_db[usuario['id']] = encoding
        
        logger.info(f"✅ {len(face_encodings_db)} encodings faciales cargados")
    except Exception as e:
        logger.error(f"❌ Error cargando encodings: {e}")

def initialize_system():
    """Inicializar sistema"""
    logger.info("="*60)
    logger.info("🏛️  SISTEMA MUNICIPAL - VERSIÓN SIMPLE")
    logger.info("Conectado a MySQL en XAMPP")
    logger.info("="*60)
    
    if Database.initialize():
        logger.info("✅ Conexión a base de datos MySQL establecida")
    else:
        logger.error("❌ Error conectando a base de datos")
        return False
    
    load_face_encodings()
    
    logger.info(f"✅ Motor ML inicializado")
    
    if gemini_service.is_available():
        logger.info("✅ Servicio Gemini AI disponible")
    else:
        logger.warning("⚠️  Servicio Gemini no disponible")
    
    logger.info("="*60)
    return True

# ============================================
# ENDPOINTS - AUTENTICACIÓN
# ============================================

@app.route('/api/auth/register', methods=['POST'])
def register():
    """Registrar nuevo usuario con contraseña"""
    try:
        data = request.get_json()
        
        required_fields = ['dni', 'nombres', 'apellidos', 'email', 'telefono', 'fecha_nacimiento', 'password']
        for field in required_fields:
            if field not in data or not data[field]:
                return jsonify({'error': f'Campo requerido: {field}'}), 400
        
        # Validar DNI
        if len(data['dni']) != 8 or not data['dni'].isdigit():
            return jsonify({'error': 'DNI debe tener 8 dígitos'}), 400
        
        if get_usuario_by_dni(data['dni']):
            return jsonify({'error': 'DNI ya registrado'}), 400
        
        if get_usuario_by_email(data['email']):
            return jsonify({'error': 'Email ya registrado'}), 400
        
        # Validar contraseña
        if len(data['password']) < 8:
            return jsonify({'error': 'La contraseña debe tener al menos 8 caracteres'}), 400
        
        usuario = crear_usuario(
            dni=data['dni'],
            nombres=data['nombres'],
            apellidos=data['apellidos'],
            email=data['email'],
            telefono=data['telefono'],
            direccion=data.get('direccion', ''),
            fecha_nacimiento=data['fecha_nacimiento'],
            password=data['password'],
            tipo_usuario='ciudadano'
        )
        
        crear_notificacion(
            usuario['id'],
            None,
            'exito',
            '¡Bienvenido!',
            f'Tu cuenta ha sido creada exitosamente. DNI: {usuario["dni"]}'
        )
        
        logger.info(f"✅ Usuario registrado: {usuario['dni']}")
        
        return jsonify({
            'success': True,
            'mensaje': 'Usuario registrado exitosamente',
            'usuario': {
                'id': usuario['id'],
                'dni': usuario['dni'],
                'nombres': usuario['nombres'],
                'apellidos': usuario['apellidos'],
                'email': usuario['email']
            }
        })
    
    except Exception as e:
        logger.error(f"Error en registro: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/auth/login', methods=['POST'])
def login():
    """Login con DNI y contraseña"""
    try:
        data = request.get_json()
        
        if 'dni' not in data or 'password' not in data:
            return jsonify({'error': 'DNI y contraseña requeridos'}), 400
        
        # Validar que dni sea un string/número, no un objeto
        if isinstance(data['dni'], dict) or isinstance(data['dni'], list):
            logger.error(f"❌ DNI inválido recibido: tipo {type(data['dni'])}")
            return jsonify({'error': 'DNI debe ser un valor simple, no un objeto'}), 400
        
        # Convertir a string para asegurar consistencia
        dni = str(data['dni']).strip()
        
        usuario = get_usuario_by_dni(dni)
        
        if not usuario:
            return jsonify({'error': 'Credenciales incorrectas'}), 401
        
        # Verificar contraseña
        if not usuario.get('password_hash'):
            return jsonify({'error': 'Usuario sin contraseña configurada. Por favor contacta al administrador.'}), 401
        
        if not verificar_password(data['password'], usuario['password_hash']):
            return jsonify({'error': 'Credenciales incorrectas'}), 401
        
        # Guardar en sesión simple
        current_user[request.remote_addr] = usuario['id']
        
        query = "UPDATE usuarios SET ultimo_acceso = NOW(), intentos_fallidos = 0 WHERE id = %s"
        Database.execute_query(query, (usuario['id'],), fetch=False)
        
        logger.info(f"✅ Login exitoso: {usuario['dni']}")
        
        return jsonify({
            'success': True,
            'access_token': f"simple_{usuario['id']}",  # Token simple
            'usuario': {
                'id': usuario['id'],
                'dni': usuario['dni'],
                'nombres': usuario['nombres'],
                'apellidos': usuario['apellidos'],
                'email': usuario['email'],
                'telefono': usuario.get('telefono'),
                'direccion': usuario.get('direccion'),
                'tipo_usuario': usuario['tipo_usuario'],
                'tiene_face_encoding': usuario['face_encoding'] is not None
            }
        })
    
    except Exception as e:
        import traceback
        logger.error(f"Error en login: {e}")
        logger.error(f"Traceback: {traceback.format_exc()}")
        logger.error(f"Data recibida: {request.get_json()}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/auth/login-facial', methods=['POST'])
def login_facial():
    """Login con reconocimiento facial"""
    try:
        data = request.get_json()
        
        if 'image' not in data:
            return jsonify({'error': 'Imagen requerida'}), 400
        
        logger.info("📸 Procesando login facial...")
        
        # Decodificar imagen
        image_data = data['image']
        if ',' in image_data:
            image_data = image_data.split(',')[1]
        
        image_bytes = base64.b64decode(image_data)
        
        # Obtener encoding del rostro
        face_encoding, error = get_face_encoding(image_bytes)
        
        if error:
            logger.error(f"Error obteniendo encoding: {error}")
            return jsonify({'error': error}), 400
        
        # Reconocer rostro
        user_id, similarity = recognize_face(face_encoding)
        
        if not user_id:
            logger.warning("❌ No se reconoció ningún rostro")
            return jsonify({'error': 'No se reconoció ningún rostro registrado'}), 404
        
        logger.info(f"✅ Rostro reconocido: Usuario {user_id} (similitud: {similarity:.2%})")
        
        # Obtener datos del usuario
        usuario = get_usuario_by_id(user_id)
        
        if not usuario:
            return jsonify({'error': 'Usuario no encontrado'}), 404
        
        # Actualizar último acceso
        query = "UPDATE usuarios SET ultimo_acceso = NOW() WHERE id = %s"
        Database.execute_query(query, (user_id,), fetch=False)
        
        # Guardar en sesión
        current_user[request.remote_addr] = user_id
        
        logger.info(f"✅ Login facial exitoso: {usuario['dni']}")
        
        return jsonify({
            'success': True,
            'access_token': f"simple_{user_id}",
            'usuario': {
                'id': usuario['id'],
                'dni': usuario['dni'],
                'nombres': usuario['nombres'],
                'apellidos': usuario['apellidos'],
                'email': usuario['email'],
                'tipo_usuario': usuario['tipo_usuario'],
                'tiene_face_encoding': True
            },
            'similarity': float(similarity)
        })
    
    except Exception as e:
        logger.error(f"❌ Error en login facial: {e}")
        import traceback
        logger.error(traceback.format_exc())
        return jsonify({'error': str(e)}), 500

@app.route('/api/auth/register-face', methods=['POST'])
def register_face():
    """Registrar rostro"""
    try:
        data = request.get_json()
        
        # Obtener user_id del token simple
        token = request.headers.get('Authorization', '').replace('Bearer ', '')
        if not token.startswith('simple_'):
            return jsonify({'error': 'No autenticado'}), 401
        
        user_id = int(token.replace('simple_', ''))
        
        if 'image' not in data:
            return jsonify({'error': 'Imagen requerida'}), 400
        
        image_data = data['image']
        if ',' in image_data:
            image_data = image_data.split(',')[1]
        
        image_bytes = base64.b64decode(image_data)
        
        face_encoding, error = get_face_encoding(image_bytes)
        
        if error:
            return jsonify({'error': error}), 400
        
        encoding_bytes = pickle.dumps(face_encoding)
        actualizar_face_encoding(user_id, encoding_bytes)
        
        face_encodings_db[user_id] = face_encoding
        
        logger.info(f"✅ Rostro registrado para usuario {user_id}")
        
        return jsonify({
            'success': True,
            'mensaje': 'Rostro registrado exitosamente'
        })
    
    except Exception as e:
        logger.error(f"Error registrando rostro: {e}")
        return jsonify({'error': str(e)}), 500

# Función helper para obtener user_id
def get_current_user_id():
    """Obtener user_id del token"""
    try:
        token = request.headers.get('Authorization', '').replace('Bearer ', '')
        if token.startswith('simple_'):
            return int(token.replace('simple_', ''))
        return None
    except:
        return None

# ============================================
# ENDPOINTS - TRÁMITES
# ============================================

@app.route('/api/tramites/tipos', methods=['GET'])
def get_tipos_tramites():
    """Obtener tipos de trámites"""
    try:
        tipos = get_tipos_tramite()
        return jsonify({'tipos_tramite': tipos})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/tramites', methods=['POST'])
def crear_tramite():
    """Crear trámite"""
    try:
        user_id = get_current_user_id()
        if not user_id:
            return jsonify({'error': 'Debes iniciar sesión'}), 401
        
        data = request.get_json()
        
        if 'tipo_tramite_id' not in data:
            return jsonify({'error': 'tipo_tramite_id requerido'}), 400
        
        query = "SELECT * FROM tipos_tramite WHERE id = %s"
        tipo_tramite = Database.execute_query(query, (data['tipo_tramite_id'],))
        
        if not tipo_tramite:
            return jsonify({'error': 'Tipo de trámite no encontrado'}), 404
        
        tipo_tramite = tipo_tramite[0]
        
        codigo = f"{tipo_tramite['codigo']}-{datetime.now().year}-{np.random.randint(1000, 9999)}"
        
        tramite_data = {
            'fecha_solicitud': datetime.now(),
            'prioridad_base': tipo_tramite['prioridad_base'],
            'costo': float(tipo_tramite['costo']),
            'tiempo_estimado_dias': tipo_tramite['tiempo_estimado_dias'],
            'categoria': tipo_tramite['categoria']
        }
        
        score_ml = ml_engine.predict_priority(tramite_data)
        prioridad = int(min(10, max(1, score_ml)))
        
        query = """
            INSERT INTO tramites 
            (codigo_tramite, usuario_id, tipo_tramite_id, estado, prioridad, score_ml, descripcion, documentos_adjuntos)
            VALUES (%s, %s, %s, 'pendiente', %s, %s, %s, %s)
        """
        # Asegurar que documentos sea JSON string
        documentos_json = json.dumps(data.get('documentos', []))
        
        Database.execute_query(
            query,
            (str(codigo), int(user_id), int(data['tipo_tramite_id']), int(prioridad), float(score_ml), 
             str(data.get('descripcion', '')), str(documentos_json)),
            fetch=False
        )
        
        # Obtener el ID del trámite recién creado
        result = Database.execute_query("SELECT LAST_INSERT_ID() as id")
        tramite_id = result[0]['id'] if result else None
        
        # Solo crear notificación si tenemos el ID del trámite
        if tramite_id:
            try:
                crear_notificacion(
                    user_id,
                    tramite_id,
                    'exito',
                    'Trámite Registrado',
                    f'Tu trámite {codigo} ha sido registrado. Prioridad: {prioridad}/10'
                )
            except Exception as notif_error:
                logger.warning(f"⚠️ Error creando notificación: {notif_error}")
                # Continuar aunque falle la notificación
        
        logger.info(f"✅ Trámite creado: {codigo}")
        
        return jsonify({
            'success': True,
            'tramite': {
                'id': tramite_id,
                'codigo': codigo,
                'prioridad': prioridad,
                'score_ml': float(score_ml)
            }
        })
    
    except Exception as e:
        logger.error(f"Error creando trámite: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/tramites/mis-tramites', methods=['GET'])
def mis_tramites():
    """Obtener mis trámites"""
    try:
        user_id = get_current_user_id()
        if not user_id:
            return jsonify({'tramites': []})
        
        estado = request.args.get('estado')
        tramites = get_tramites_usuario(user_id, estado)
        
        return jsonify({'tramites': tramites})
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/tramites/<int:tramite_id>/exportar/<formato>', methods=['GET'])
def exportar_tramite(tramite_id, formato):
    """Exportar trámite a DOCX o PDF"""
    try:
        from exportar_tramites import generar_docx, generar_pdf
        
        user_id = get_current_user_id()
        if not user_id:
            return jsonify({'error': 'No autenticado'}), 401
        
        # Verificar si es admin
        usuario_actual = get_usuario_by_id(user_id)
        es_admin = usuario_actual['tipo_usuario'] == 'administrador'
        
        # Obtener trámite (admin puede ver cualquiera, usuario solo los suyos)
        if es_admin:
            query = """
                SELECT t.*, tt.nombre as tipo_nombre, tt.requisitos,
                       u.dni, u.nombres, u.apellidos, u.email, u.telefono, u.direccion
                FROM tramites t
                JOIN tipos_tramite tt ON t.tipo_tramite_id = tt.id
                JOIN usuarios u ON t.usuario_id = u.id
                WHERE t.id = %s
            """
            resultado = Database.execute_query(query, (tramite_id,), fetch=True)
        else:
            query = """
                SELECT t.*, tt.nombre as tipo_nombre, tt.requisitos,
                       u.dni, u.nombres, u.apellidos, u.email, u.telefono, u.direccion
                FROM tramites t
                JOIN tipos_tramite tt ON t.tipo_tramite_id = tt.id
                JOIN usuarios u ON t.usuario_id = u.id
                WHERE t.id = %s AND t.usuario_id = %s
            """
            resultado = Database.execute_query(query, (tramite_id, user_id), fetch=True)
        
        if not resultado or len(resultado) == 0:
            return jsonify({'error': 'Trámite no encontrado'}), 404
        
        tramite = resultado[0]
        
        # Datos del usuario
        usuario = {
            'dni': tramite['dni'],
            'nombres': tramite['nombres'],
            'apellidos': tramite['apellidos'],
            'email': tramite['email'],
            'telefono': tramite.get('telefono', 'No especificado'),
            'direccion': tramite.get('direccion', 'No especificada')
        }
        
        # Generar documento
        if formato.lower() == 'docx':
            buffer = generar_docx(tramite, usuario)
            filename = f"Tramite_{tramite['codigo_tramite']}.docx"
            mimetype = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        elif formato.lower() == 'pdf':
            buffer = generar_pdf(tramite, usuario)
            filename = f"Tramite_{tramite['codigo_tramite']}.pdf"
            mimetype = 'application/pdf'
        else:
            return jsonify({'error': 'Formato no soportado'}), 400
        
        logger.info(f"✅ Trámite {tramite_id} exportado a {formato.upper()}")
        
        return send_file(
            buffer,
            mimetype=mimetype,
            as_attachment=True,
            download_name=filename
        )
    
    except Exception as e:
        logger.error(f"❌ Error exportando trámite: {e}")
        import traceback
        logger.error(traceback.format_exc())
        return jsonify({'error': str(e), 'traceback': traceback.format_exc()}), 500

# ============================================
# ENDPOINTS - GEMINI AI
# ============================================

@app.route('/api/gemini/consultar', methods=['POST'])
def consultar_gemini():
    """Consultar Gemini AI"""
    try:
        user_id = get_current_user_id()
        data = request.get_json()
        
        if 'pregunta' not in data:
            return jsonify({'error': 'Pregunta requerida'}), 400
        
        logger.info(f"🤖 Consultando Gemini: '{data['pregunta']}'")
        
        if not gemini_service.is_available():
            logger.error("❌ Servicio Gemini no disponible")
            return jsonify({
                'success': False,
                'error': 'Servicio de IA no disponible. API Key no configurada o inválida.'
            })
        
        resultado = gemini_service.consultar(
            pregunta=data['pregunta'],
            contexto=data.get('contexto'),
            user_id=user_id,
            tramite_id=data.get('tramite_id')
        )
        
        if resultado.get('success'):
            logger.info(f"✅ Gemini respondió correctamente")
        else:
            logger.error(f"❌ Gemini falló: {resultado.get('error')}")
        
        return jsonify(resultado)
    
    except Exception as e:
        logger.error(f"❌ Error en endpoint Gemini: {e}")
        import traceback
        logger.error(traceback.format_exc())
        return jsonify({
            'success': False,
            'error': 'Error al consultar la IA'
        }), 500

@app.route('/api/gemini/ayudar-redactar', methods=['POST'])
def ayudar_redactar():
    """Ayudar a redactar solicitud de trámite"""
    try:
        user_id = get_current_user_id()
        data = request.get_json()
        
        if 'tipo_tramite_id' not in data:
            return jsonify({'error': 'tipo_tramite_id requerido'}), 400
        
        logger.info(f"🤖 Ayudando a redactar trámite ID: {data['tipo_tramite_id']}")
        
        if not gemini_service.is_available():
            logger.error("❌ Servicio Gemini no disponible")
            return jsonify({
                'success': False,
                'error': 'Servicio de IA no disponible'
            })
        
        resultado = gemini_service.ayudar_redactar_tramite(
            tipo_tramite_id=int(data['tipo_tramite_id']),
            descripcion_usuario=data.get('descripcion_usuario', ''),
            user_id=user_id
        )
        
        if resultado.get('success'):
            logger.info(f"✅ Solicitud redactada correctamente")
        else:
            logger.error(f"❌ Error al redactar: {resultado.get('error')}")
        
        return jsonify(resultado)
    
    except Exception as e:
        logger.error(f"❌ Error en ayudar-redactar: {e}")
        import traceback
        logger.error(traceback.format_exc())
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/gemini/consultar-admin', methods=['POST'])
def consultar_admin():
    """Consultar IA específico para administradores"""
    try:
        user_id = get_current_user_id()
        if not user_id:
            return jsonify({'error': 'Debes iniciar sesión'}), 401
        
        usuario = get_usuario_by_id(user_id)
        if usuario['tipo_usuario'] != 'administrador':
            return jsonify({'error': 'Acceso denegado. Solo administradores.'}), 403
        
        data = request.get_json()
        
        if 'pregunta' not in data:
            return jsonify({'error': 'Pregunta requerida'}), 400
        
        logger.info(f"🤖 Admin consultando Gemini: '{data['pregunta']}'")
        
        if not gemini_service.is_available():
            logger.error("❌ Servicio Gemini no disponible")
            return jsonify({
                'success': False,
                'error': 'Servicio de IA no disponible'
            })
        
        # Contexto adicional específico para la consulta
        contexto_adicional = data.get('contexto', '')
        
        resultado = gemini_service.consultar(
            pregunta=data['pregunta'],
            contexto=contexto_adicional,
            user_id=user_id,
            es_admin=True
        )
        
        if resultado.get('success'):
            logger.info(f"✅ Consulta admin respondida correctamente")
        else:
            logger.error(f"❌ Error en consulta admin: {resultado.get('error')}")
        
        return jsonify(resultado)
    
    except Exception as e:
        logger.error(f"❌ Error en consultar-admin: {e}")
        import traceback
        logger.error(traceback.format_exc())
        return jsonify({'success': False, 'error': str(e)}), 500

# ============================================
# ENDPOINTS - NOTIFICACIONES
# ============================================

@app.route('/api/notificaciones', methods=['GET'])
def get_notificaciones():
    """Obtener notificaciones"""
    try:
        user_id = get_current_user_id()
        if not user_id:
            return jsonify({'notificaciones': []})
        
        no_leidas = request.args.get('no_leidas', 'false').lower() == 'true'
        notificaciones = get_notificaciones_usuario(user_id, no_leidas)
        
        return jsonify({'notificaciones': notificaciones})
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/notificaciones/<int:notif_id>/leer', methods=['PUT'])
def marcar_leida(notif_id):
    """Marcar notificación como leída"""
    try:
        marcar_notificacion_leida(notif_id)
        return jsonify({'success': True})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# ============================================
# ENDPOINTS - DASHBOARD
# ============================================

@app.route('/api/dashboard/stats', methods=['GET'])
def dashboard_stats():
    """Estadísticas del dashboard del usuario"""
    try:
        user_id = get_current_user_id()
        if not user_id:
            return jsonify({'error': 'Debes iniciar sesión'}), 401
        
        # Estadísticas solo del usuario actual
        query = """
            SELECT 
                COUNT(*) as total_tramites,
                AVG(DATEDIFF(NOW(), fecha_solicitud)) as tiempo_promedio_dias
            FROM tramites 
            WHERE usuario_id = %s
        """
        resultado = Database.execute_query(query, (user_id,), fetch=True)
        stats_base = resultado[0] if resultado else {'total_tramites': 0, 'tiempo_promedio_dias': 0}
        
        # Trámites por estado del usuario
        query_estados = """
            SELECT estado, COUNT(*) as cantidad
            FROM tramites
            WHERE usuario_id = %s
            GROUP BY estado
        """
        tramites_por_estado = Database.execute_query(query_estados, (user_id,), fetch=True)
        
        return jsonify({
            'total_tramites': stats_base['total_tramites'] or 0,
            'tiempo_promedio_dias': float(stats_base['tiempo_promedio_dias'] or 0),
            'tramites_por_estado': tramites_por_estado or []
        })
    except Exception as e:
        logger.error(f"Error obteniendo stats: {e}")
        return jsonify({'error': str(e)}), 500

# ============================================
# ENDPOINTS - RECUPERACIÓN DE CONTRASEÑA
# ============================================

@app.route('/api/auth/guardar-pregunta-seguridad', methods=['POST'])
def guardar_pregunta():
    """Guardar pregunta de seguridad del usuario"""
    try:
        user_id = get_current_user_id()
        if not user_id:
            return jsonify({'error': 'Debes iniciar sesión'}), 401
        
        data = request.get_json()
        
        if 'pregunta' not in data or 'respuesta' not in data:
            return jsonify({'error': 'Pregunta y respuesta requeridas'}), 400
        
        if not data['respuesta'] or len(data['respuesta']) < 3:
            return jsonify({'error': 'La respuesta debe tener al menos 3 caracteres'}), 400
        
        guardar_pregunta_seguridad(user_id, data['pregunta'], data['respuesta'])
        
        logger.info(f"✅ Pregunta de seguridad guardada para usuario {user_id}")
        
        return jsonify({
            'success': True,
            'mensaje': 'Pregunta de seguridad guardada exitosamente'
        })
    
    except Exception as e:
        logger.error(f"Error guardando pregunta: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/auth/obtener-pregunta/<dni>', methods=['GET'])
def obtener_pregunta(dni):
    """Obtener pregunta de seguridad para recuperar contraseña"""
    try:
        usuario = get_usuario_by_dni(dni)
        
        if not usuario:
            return jsonify({'error': 'Usuario no encontrado'}), 404
        
        pregunta = get_pregunta_seguridad(usuario['id'])
        
        if not pregunta:
            return jsonify({'error': 'No has configurado pregunta de seguridad'}), 404
        
        return jsonify({
            'success': True,
            'pregunta': pregunta,
            'usuario': {
                'nombres': usuario['nombres'],
                'apellidos': usuario['apellidos']
            }
        })
    
    except Exception as e:
        logger.error(f"Error obteniendo pregunta: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/auth/recuperar-password', methods=['POST'])
def recuperar_password():
    """Recuperar contraseña usando pregunta de seguridad"""
    try:
        data = request.get_json()
        
        required = ['dni', 'respuesta', 'nueva_password']
        for field in required:
            if field not in data:
                return jsonify({'error': f'{field} requerido'}), 400
        
        if len(data['nueva_password']) < 8:
            return jsonify({'error': 'La contraseña debe tener al menos 8 caracteres'}), 400
        
        usuario = get_usuario_by_dni(data['dni'])
        
        if not usuario:
            return jsonify({'error': 'Usuario no encontrado'}), 404
        
        if not verificar_respuesta_seguridad(usuario['id'], data['respuesta']):
            return jsonify({'error': 'Respuesta incorrecta'}), 401
        
        actualizar_password(usuario['id'], data['nueva_password'])
        
        logger.info(f"✅ Contraseña recuperada para usuario {usuario['dni']}")
        
        return jsonify({
            'success': True,
            'mensaje': 'Contraseña actualizada exitosamente. Ya puedes iniciar sesión.'
        })
    
    except Exception as e:
        logger.error(f"Error recuperando contraseña: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/auth/cambiar-password', methods=['POST'])
def cambiar_password():
    """Cambiar contraseña (estando autenticado)"""
    try:
        user_id = get_current_user_id()
        if not user_id:
            return jsonify({'error': 'Debes iniciar sesión'}), 401
        
        data = request.get_json()
        
        if 'password_actual' not in data or 'password_nueva' not in data:
            return jsonify({'error': 'Contraseñas requeridas'}), 400
        
        if len(data['password_nueva']) < 8:
            return jsonify({'error': 'La nueva contraseña debe tener al menos 8 caracteres'}), 400
        
        usuario = get_usuario_by_id(user_id)
        
        if not verificar_password(data['password_actual'], usuario['password_hash']):
            return jsonify({'error': 'Contraseña actual incorrecta'}), 401
        
        actualizar_password(user_id, data['password_nueva'])
        
        logger.info(f"✅ Contraseña cambiada para usuario {user_id}")
        
        return jsonify({
            'success': True,
            'mensaje': 'Contraseña actualizada exitosamente'
        })
    
    except Exception as e:
        logger.error(f"Error cambiando contraseña: {e}")
        return jsonify({'error': str(e)}), 500

# ============================================
# ENDPOINTS - ADMINISTRADOR
# ============================================

@app.route('/api/admin/tramites', methods=['GET'])
def admin_get_tramites():
    """Obtener todos los trámites (solo admin)"""
    try:
        user_id = get_current_user_id()
        if not user_id:
            return jsonify({'error': 'Debes iniciar sesión'}), 401
        
        usuario = get_usuario_by_id(user_id)
        if usuario['tipo_usuario'] != 'administrador':
            return jsonify({'error': 'Acceso denegado. Solo administradores.'}), 403
        
        estado = request.args.get('estado')
        categoria = request.args.get('categoria')
        
        query = "SELECT * FROM vista_tramites_completos WHERE 1=1"
        params = []
        
        if estado:
            query += " AND estado = %s"
            params.append(estado)
        
        if categoria:
            query += " AND tipo_categoria = %s"
            params.append(categoria)
        
        query += " ORDER BY prioridad DESC, fecha_solicitud DESC LIMIT 100"
        
        tramites = Database.execute_query(query, tuple(params) if params else None)
        
        return jsonify({
            'success': True,
            'tramites': tramites,
            'total': len(tramites)
        })
    
    except Exception as e:
        logger.error(f"Error obteniendo trámites admin: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/admin/tramites/<int:tramite_id>/responder', methods=['POST'])
def admin_responder_tramite(tramite_id):
    """Responder/Actualizar trámite (solo admin)"""
    try:
        user_id = get_current_user_id()
        if not user_id:
            return jsonify({'error': 'Debes iniciar sesión'}), 401
        
        usuario = get_usuario_by_id(user_id)
        if usuario['tipo_usuario'] != 'administrador':
            return jsonify({'error': 'Acceso denegado. Solo administradores.'}), 403
        
        data = request.get_json()
        
        if 'estado' not in data:
            return jsonify({'error': 'Estado requerido'}), 400
        
        # Preparar documentos del admin si existen
        documentos_admin_json = None
        if 'documentos_admin' in data and data['documentos_admin']:
            documentos_admin_json = json.dumps(data['documentos_admin'])
        
        query = """
            UPDATE tramites 
            SET estado = %s, 
                respuesta_admin = %s,
                atendido_por = %s,
                documentos_admin = %s,
                fecha_actualizacion = NOW(),
                fecha_completado = CASE 
                    WHEN %s IN ('aprobado', 'rechazado', 'completado') THEN NOW()
                    ELSE fecha_completado 
                END,
                tiempo_atencion_dias = CASE 
                    WHEN %s IN ('aprobado', 'rechazado', 'completado') 
                    THEN DATEDIFF(NOW(), fecha_solicitud)
                    ELSE tiempo_atencion_dias 
                END
            WHERE id = %s
        """
        
        params = (
            str(data['estado']),
            str(data.get('respuesta', '')),
            int(user_id),
            documentos_admin_json,
            str(data['estado']),
            str(data['estado']),
            int(tramite_id)
        )
        
        Database.execute_query(query, params, fetch=False)
        
        tramite = Database.execute_query(
            "SELECT * FROM vista_tramites_completos WHERE id = %s",
            (int(tramite_id),)
        )[0]
        
        # Mensajes personalizados según estado
        mensajes_estado = {
            'en_revision': {
                'tipo': 'info',
                'titulo': '🔍 Trámite en Revisión',
                'mensaje': f'Tu trámite {tramite["codigo_tramite"]} está siendo revisado por nuestro equipo.'
            },
            'observado': {
                'tipo': 'advertencia',
                'titulo': '⚠️ Trámite Observado',
                'mensaje': f'Tu trámite {tramite["codigo_tramite"]} tiene observaciones. {data.get("respuesta", "Revisa los detalles.")}'
            },
            'aprobado': {
                'tipo': 'exito',
                'titulo': '✅ Trámite Aprobado',
                'mensaje': f'¡Felicitaciones! Tu trámite {tramite["codigo_tramite"]} ha sido aprobado. {data.get("respuesta", "")}'
            },
            'rechazado': {
                'tipo': 'error',
                'titulo': '❌ Trámite Rechazado',
                'mensaje': f'Tu trámite {tramite["codigo_tramite"]} ha sido rechazado. Motivo: {data.get("respuesta", "No especificado")}'
            },
            'completado': {
                'tipo': 'exito',
                'titulo': '🎉 Trámite Completado',
                'mensaje': f'Tu trámite {tramite["codigo_tramite"]} ha sido completado exitosamente. {data.get("respuesta", "")}'
            }
        }
        
        notif_data = mensajes_estado.get(data['estado'], {
            'tipo': 'info',
            'titulo': 'Actualización de Trámite',
            'mensaje': f'Tu trámite {tramite["codigo_tramite"]} ha sido actualizado.'
        })
        
        crear_notificacion(
            tramite['usuario_id'],
            tramite_id,
            notif_data['tipo'],
            notif_data['titulo'],
            notif_data['mensaje']
        )
        
        logger.info(f"✅ Trámite {tramite_id} actualizado por admin {user_id}")
        
        return jsonify({
            'success': True,
            'mensaje': 'Trámite actualizado exitosamente'
        })
    
    except Exception as e:
        logger.error(f"Error respondiendo trámite: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/admin/estadisticas', methods=['GET'])
def admin_estadisticas():
    """Obtener estadísticas generales (solo admin)"""
    try:
        user_id = get_current_user_id()
        if not user_id:
            return jsonify({'error': 'Debes iniciar sesión'}), 401
        
        usuario = get_usuario_by_id(user_id)
        if usuario['tipo_usuario'] != 'administrador':
            return jsonify({'error': 'Acceso denegado'}), 403
        
        stats = get_estadisticas_dashboard()
        
        stats['total_ciudadanos'] = Database.execute_query(
            "SELECT COUNT(*) as count FROM usuarios WHERE tipo_usuario = 'ciudadano'"
        )[0]['count']
        
        stats['tramites_hoy'] = Database.execute_query(
            "SELECT COUNT(*) as count FROM tramites WHERE DATE(fecha_solicitud) = CURDATE()"
        )[0]['count']
        
        return jsonify({
            'success': True,
            'estadisticas': stats
        })
    
    except Exception as e:
        logger.error(f"Error obteniendo estadísticas: {e}")
        return jsonify({'error': str(e)}), 500

# ============================================
# ENDPOINTS - SISTEMA
# ============================================

@app.route('/api/health', methods=['GET'])
def health_check():
    """Estado del sistema"""
    try:
        db_ok = Database.test_connection()
        
        return jsonify({
            'status': 'ok' if db_ok else 'error',
            'database': 'connected' if db_ok else 'disconnected',
            'ml_engine': 'active' if ml_engine.model else 'inactive',
            'gemini': 'active' if gemini_service.is_available() else 'inactive',
            'version': 'simple',
            'usuarios_registrados': len(face_encodings_db)
        })
    except Exception as e:
        return jsonify({'status': 'error', 'error': str(e)}), 500

# ============================================
# ENDPOINTS - CALIFICACIONES ALCALDE
# ============================================

@app.route('/api/calificaciones/calificar', methods=['POST'])
def calificar_alcalde():
    """Ciudadano califica al alcalde"""
    try:
        user_id = get_current_user_id()
        if not user_id:
            return jsonify({'error': 'Debes iniciar sesión'}), 401
        
        data = request.get_json()
        calificacion = data.get('calificacion')
        comentario = data.get('comentario', '')
        
        if not calificacion or calificacion < 1 or calificacion > 5:
            return jsonify({'error': 'Calificación debe estar entre 1 y 5'}), 400
        
        # Verificar si ya calificó
        query_check = "SELECT id FROM calificaciones_alcalde WHERE usuario_id = %s"
        existente = Database.execute_query(query_check, (user_id,))
        
        if existente and len(existente) > 0:
            # Actualizar
            query = """
                UPDATE calificaciones_alcalde 
                SET calificacion = %s, comentario = %s, fecha_calificacion = NOW()
                WHERE usuario_id = %s
            """
            Database.execute_query(query, (calificacion, comentario, user_id), fetch=False)
        else:
            # Insertar
            query = """
                INSERT INTO calificaciones_alcalde (usuario_id, calificacion, comentario)
                VALUES (%s, %s, %s)
            """
            Database.execute_query(query, (user_id, calificacion, comentario), fetch=False)
        
        logger.info(f"✅ Usuario {user_id} calificó con {calificacion} estrellas")
        
        return jsonify({
            'success': True,
            'message': 'Gracias por tu calificación'
        })
    
    except Exception as e:
        logger.error(f"❌ Error al calificar: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/calificaciones/mi-calificacion', methods=['GET'])
def obtener_mi_calificacion():
    """Obtener la calificación del usuario actual"""
    try:
        user_id = get_current_user_id()
        if not user_id:
            return jsonify({'calificacion': None})
        
        query = """
            SELECT calificacion, comentario, fecha_calificacion
            FROM calificaciones_alcalde
            WHERE usuario_id = %s
        """
        resultado = Database.execute_query(query, (user_id,))
        
        if resultado and len(resultado) > 0:
            return jsonify({
                'success': True,
                'calificacion': resultado[0]
            })
        
        return jsonify({
            'success': True,
            'calificacion': None
        })
    
    except Exception as e:
        logger.error(f"❌ Error al obtener calificación: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/calificaciones/estadisticas', methods=['GET'])
def estadisticas_calificaciones():
    """Estadísticas de calificaciones (solo admin)"""
    try:
        user_id = get_current_user_id()
        if not user_id:
            return jsonify({'error': 'Debes iniciar sesión'}), 401
        
        usuario = get_usuario_by_id(user_id)
        if usuario['tipo_usuario'] != 'administrador':
            return jsonify({'error': 'Solo administradores'}), 403
        
        # Estadísticas generales
        query_stats = """
            SELECT 
                COUNT(*) as total_calificaciones,
                AVG(calificacion) as promedio,
                SUM(CASE WHEN calificacion = 5 THEN 1 ELSE 0 END) as cinco_estrellas,
                SUM(CASE WHEN calificacion = 4 THEN 1 ELSE 0 END) as cuatro_estrellas,
                SUM(CASE WHEN calificacion = 3 THEN 1 ELSE 0 END) as tres_estrellas,
                SUM(CASE WHEN calificacion = 2 THEN 1 ELSE 0 END) as dos_estrellas,
                SUM(CASE WHEN calificacion = 1 THEN 1 ELSE 0 END) as una_estrella
            FROM calificaciones_alcalde
        """
        stats = Database.execute_query(query_stats)[0]
        
        # Calificaciones recientes con comentarios
        query_recientes = """
            SELECT c.calificacion, c.comentario, c.fecha_calificacion,
                   u.nombres, u.apellidos
            FROM calificaciones_alcalde c
            JOIN usuarios u ON c.usuario_id = u.id
            WHERE c.comentario IS NOT NULL AND c.comentario != ''
            ORDER BY c.fecha_calificacion DESC
            LIMIT 10
        """
        recientes = Database.execute_query(query_recientes)
        
        return jsonify({
            'success': True,
            'estadisticas': stats,
            'comentarios_recientes': recientes
        })
    
    except Exception as e:
        logger.error(f"❌ Error en estadísticas: {e}")
        return jsonify({'error': str(e)}), 500

# ============================================
# INICIAR APLICACIÓN
# ============================================

if __name__ == '__main__':
    if initialize_system():
        logger.info("🚀 Servidor Flask SIMPLE iniciado en http://localhost:5000")
        logger.info("📋 Conectado a MySQL en XAMPP - Base de datos: municipalidad_yau")
        logger.info("="*60)
        app.run(debug=True, host='0.0.0.0', port=5000)
    else:
        logger.error("❌ Error inicializando sistema")
