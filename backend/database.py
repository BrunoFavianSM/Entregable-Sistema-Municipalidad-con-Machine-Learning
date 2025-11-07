"""
Módulo de gestión de base de datos MySQL
"""
import mysql.connector
import bcrypt
from mysql.connector import pooling, Error
from contextlib import contextmanager
from config import Config
import logging
import warnings
import sys

# Suprimir TODOS los warnings de MySQL
warnings.filterwarnings('ignore')
if not sys.warnoptions:
    warnings.simplefilter("ignore")

logger = logging.getLogger(__name__)

class Database:
    """Clase para gestionar conexiones a MySQL"""
    
    _pool = None
    
    @classmethod
    def initialize(cls):
        """Inicializar pool de conexiones"""
        try:
            cls._pool = pooling.MySQLConnectionPool(
                pool_name="municipalidad_pool",
                pool_size=Config.DB_CONFIG['pool_size'],
                pool_reset_session=Config.DB_CONFIG['pool_reset_session'],
                host=Config.DB_CONFIG['host'],
                port=Config.DB_CONFIG['port'],
                user=Config.DB_CONFIG['user'],
                password=Config.DB_CONFIG['password'],
                database=Config.DB_CONFIG['database'],
                charset=Config.DB_CONFIG['charset'],
                collation=Config.DB_CONFIG['collation'],
                autocommit=Config.DB_CONFIG['autocommit']
            )
            logger.info("✅ Pool de conexiones MySQL inicializado")
            return True
        except Error as e:
            logger.error(f"❌ Error al inicializar pool de conexiones: {e}")
            return False
    
    @classmethod
    @contextmanager
    def get_connection(cls):
        """Obtener conexión del pool"""
        connection = None
        try:
            if cls._pool is None:
                cls.initialize()
            
            connection = cls._pool.get_connection()
            yield connection
        except Error as e:
            logger.error(f"❌ Error de conexión: {e}")
            raise
        finally:
            if connection and connection.is_connected():
                connection.close()
    
    @classmethod
    @contextmanager
    def get_cursor(cls, dictionary=True):
        """Obtener cursor para ejecutar consultas"""
        with cls.get_connection() as connection:
            cursor = connection.cursor(dictionary=dictionary)
            try:
                yield cursor
                connection.commit()
            except Error as e:
                connection.rollback()
                logger.error(f"❌ Error en transacción: {e}")
                raise
            finally:
                cursor.close()
    
    @classmethod
    def execute_query(cls, query, params=None, fetch=True):
        """Ejecutar consulta SQL"""
        try:
            with cls.get_cursor() as cursor:
                # Convertir params a tupla si no lo es
                if params is not None:
                    if isinstance(params, dict):
                        logger.error(f"❌ Error: params es un dict, debe ser tupla o lista")
                        raise ValueError("params debe ser tupla o lista, no dict")
                    if not isinstance(params, (tuple, list)):
                        params = (params,)
                else:
                    params = ()
                
                cursor.execute(query, params)
                if fetch:
                    return cursor.fetchall()
                return cursor.rowcount
        except Error as e:
            logger.error(f"❌ Error ejecutando query: {e}")
            logger.error(f"Query: {query}")
            logger.error(f"Params: {params}")
            raise
    
    @classmethod
    def execute_many(cls, query, params_list):
        """Ejecutar múltiples inserts/updates"""
        try:
            with cls.get_cursor() as cursor:
                cursor.executemany(query, params_list)
                return cursor.rowcount
        except Error as e:
            logger.error(f"❌ Error ejecutando executemany: {e}")
            raise
    
    @classmethod
    def call_procedure(cls, proc_name, params=None):
        """Llamar procedimiento almacenado"""
        try:
            with cls.get_cursor() as cursor:
                cursor.callproc(proc_name, params or ())
                results = []
                for result in cursor.stored_results():
                    results.extend(result.fetchall())
                return results
        except Error as e:
            logger.error(f"❌ Error llamando procedimiento {proc_name}: {e}")
            raise
    
    @classmethod
    def test_connection(cls):
        """Probar conexión a la base de datos"""
        try:
            with cls.get_connection() as conn:
                if conn.is_connected():
                    db_info = conn.get_server_info()
                    logger.info(f"✅ Conectado a MySQL Server versión {db_info}")
                    return True
        except Error as e:
            logger.error(f"❌ Error de conexión: {e}")
            return False
    
    @classmethod
    def get_table_count(cls, table_name):
        """Obtener cantidad de registros en una tabla"""
        query = f"SELECT COUNT(*) as count FROM {table_name}"
        result = cls.execute_query(query)
        return result[0]['count'] if result else 0

# Funciones auxiliares para consultas comunes

def get_usuario_by_dni(dni):
    """Obtener usuario por DNI"""
    query = "SELECT * FROM usuarios WHERE dni = %s AND activo = TRUE"
    result = Database.execute_query(query, (dni,))
    return result[0] if result else None

def get_usuario_by_email(email):
    """Obtener usuario por email"""
    query = "SELECT * FROM usuarios WHERE email = %s AND activo = TRUE"
    result = Database.execute_query(query, (email,))
    return result[0] if result else None

def get_usuario_by_id(user_id):
    """Obtener usuario por ID"""
    query = "SELECT * FROM usuarios WHERE id = %s AND activo = TRUE"
    result = Database.execute_query(query, (user_id,))
    return result[0] if result else None

def crear_usuario(dni, nombres, apellidos, email, telefono, direccion, fecha_nacimiento, password, tipo_usuario='ciudadano', face_encoding=None):
    """Crear nuevo usuario con contraseña"""
    # Hash de la contraseña
    password_hash = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
    
    query = """
        INSERT INTO usuarios (dni, nombres, apellidos, email, telefono, direccion, fecha_nacimiento, password_hash, tipo_usuario, face_encoding)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
    """
    
    # Asegurar que todos los parámetros sean del tipo correcto
    params = (
        str(dni),
        str(nombres),
        str(apellidos),
        str(email),
        str(telefono),
        str(direccion),
        str(fecha_nacimiento),  # MySQL espera string en formato 'YYYY-MM-DD'
        str(password_hash),
        str(tipo_usuario),
        face_encoding  # bytes o None
    )
    
    Database.execute_query(query, params, fetch=False)
    return get_usuario_by_dni(dni)

def actualizar_face_encoding(user_id, face_encoding):
    """Actualizar encoding facial de usuario"""
    query = "UPDATE usuarios SET face_encoding = %s WHERE id = %s"
    Database.execute_query(query, (face_encoding, int(user_id)), fetch=False)

def get_tipos_tramite(activos_only=True):
    """Obtener tipos de trámite"""
    query = "SELECT * FROM tipos_tramite"
    if activos_only:
        query += " WHERE activo = TRUE"
    query += " ORDER BY categoria, nombre"
    return Database.execute_query(query)

def get_tramites_usuario(user_id, estado=None):
    """Obtener trámites de un usuario"""
    query = """
        SELECT t.*, tt.nombre as tipo_tramite_nombre, tt.categoria
        FROM tramites t
        INNER JOIN tipos_tramite tt ON t.tipo_tramite_id = tt.id
        WHERE t.usuario_id = %s
    """
    params = [user_id]
    
    if estado:
        query += " AND t.estado = %s"
        params.append(estado)
    
    query += " ORDER BY t.fecha_solicitud DESC"
    return Database.execute_query(query, tuple(params))

def get_tramites_pendientes():
    """Obtener trámites pendientes (vista optimizada)"""
    query = "SELECT * FROM vista_tramites_pendientes ORDER BY prioridad DESC, score_ml DESC"
    return Database.execute_query(query)

def crear_notificacion(user_id, tramite_id, tipo, titulo, mensaje):
    """Crear notificación para usuario"""
    query = """
        INSERT INTO notificaciones (usuario_id, tramite_id, tipo, titulo, mensaje)
        VALUES (%s, %s, %s, %s, %s)
    """
    # tramite_id puede ser None
    params = (int(user_id), tramite_id if tramite_id is None else int(tramite_id), 
              str(tipo), str(titulo), str(mensaje))
    Database.execute_query(query, params, fetch=False)

def get_notificaciones_usuario(user_id, no_leidas_only=False):
    """Obtener notificaciones de usuario"""
    query = "SELECT * FROM notificaciones WHERE usuario_id = %s"
    if no_leidas_only:
        query += " AND leida = FALSE"
    query += " ORDER BY fecha_creacion DESC LIMIT 50"
    return Database.execute_query(query, (user_id,))

def marcar_notificacion_leida(notif_id):
    """Marcar notificación como leída"""
    query = "UPDATE notificaciones SET leida = TRUE, fecha_lectura = NOW() WHERE id = %s"
    Database.execute_query(query, (notif_id,), fetch=False)

def get_configuracion(clave):
    """Obtener valor de configuración"""
    query = "SELECT valor, tipo FROM configuracion WHERE clave = %s"
    result = Database.execute_query(query, (clave,))
    if result:
        valor = result[0]['valor']
        tipo = result[0]['tipo']
        
        # Convertir según tipo
        if tipo == 'number':
            return float(valor) if '.' in valor else int(valor)
        elif tipo == 'boolean':
            return valor.lower() == 'true'
        elif tipo == 'json':
            import json
            return json.loads(valor)
        return valor
    return None

def set_configuracion(clave, valor):
    """Establecer valor de configuración"""
    query = "UPDATE configuracion SET valor = %s WHERE clave = %s"
    Database.execute_query(query, (str(valor), clave), fetch=False)

def get_estadisticas_dashboard():
    """Obtener estadísticas para dashboard"""
    stats = {}
    
    # Total de usuarios
    stats['total_usuarios'] = Database.get_table_count('usuarios')
    
    # Total de trámites
    stats['total_tramites'] = Database.get_table_count('tramites')
    
    # Trámites por estado
    query = """
        SELECT estado, COUNT(*) as cantidad
        FROM tramites
        GROUP BY estado
    """
    stats['tramites_por_estado'] = Database.execute_query(query)
    
    # Trámites del mes
    query = """
        SELECT COUNT(*) as cantidad
        FROM tramites
        WHERE MONTH(fecha_solicitud) = MONTH(CURRENT_DATE)
        AND YEAR(fecha_solicitud) = YEAR(CURRENT_DATE)
    """
    result = Database.execute_query(query)
    stats['tramites_mes'] = result[0]['cantidad'] if result else 0
    
    # Tiempo promedio de atención
    query = """
        SELECT AVG(tiempo_atencion_dias) as promedio
        FROM tramites
        WHERE tiempo_atencion_dias IS NOT NULL
    """
    result = Database.execute_query(query)
    stats['tiempo_promedio_dias'] = round(result[0]['promedio'], 1) if result and result[0]['promedio'] else 0
    
    return stats

def verificar_password(password, password_hash):
    """Verificar contraseña contra hash"""
    try:
        return bcrypt.checkpw(password.encode('utf-8'), password_hash.encode('utf-8'))
    except:
        return False

def actualizar_password(user_id, nueva_password):
    """Actualizar contraseña de usuario"""
    password_hash = bcrypt.hashpw(nueva_password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
    query = "UPDATE usuarios SET password_hash = %s, intentos_fallidos = 0, cuenta_bloqueada = FALSE WHERE id = %s"
    Database.execute_query(query, (str(password_hash), int(user_id)), fetch=False)

def registrar_intento_fallido(user_id):
    """Registrar intento fallido de login"""
    query = """
        UPDATE usuarios 
        SET intentos_fallidos = intentos_fallidos + 1,
            cuenta_bloqueada = CASE WHEN intentos_fallidos >= 4 THEN TRUE ELSE FALSE END
        WHERE id = %s
    """
    Database.execute_query(query, (int(user_id),), fetch=False)

def resetear_intentos_fallidos(user_id):
    """Resetear intentos fallidos tras login exitoso"""
    query = "UPDATE usuarios SET intentos_fallidos = 0 WHERE id = %s"
    Database.execute_query(query, (int(user_id),), fetch=False)

# Preguntas de seguridad

def guardar_pregunta_seguridad(user_id, pregunta, respuesta):
    """Guardar pregunta de seguridad"""
    respuesta_hash = bcrypt.hashpw(respuesta.lower().strip().encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
    query = """
        INSERT INTO preguntas_seguridad (usuario_id, pregunta, respuesta_hash)
        VALUES (%s, %s, %s)
        ON DUPLICATE KEY UPDATE respuesta_hash = %s
    """
    Database.execute_query(query, (int(user_id), str(pregunta), str(respuesta_hash), str(respuesta_hash)), fetch=False)

def get_pregunta_seguridad(user_id):
    """Obtener pregunta de seguridad de usuario"""
    query = "SELECT pregunta FROM preguntas_seguridad WHERE usuario_id = %s LIMIT 1"
    result = Database.execute_query(query, (user_id,))
    return result[0]['pregunta'] if result else None

def verificar_respuesta_seguridad(user_id, respuesta):
    """Verificar respuesta de seguridad"""
    query = "SELECT respuesta_hash FROM preguntas_seguridad WHERE usuario_id = %s LIMIT 1"
    result = Database.execute_query(query, (user_id,))
    if result:
        try:
            return bcrypt.checkpw(respuesta.lower().strip().encode('utf-8'), result[0]['respuesta_hash'].encode('utf-8'))
        except:
            return False
    return False

# Archivos adjuntos

def guardar_archivo_adjunto(tramite_id, nombre_archivo, nombre_original, ruta_archivo, tipo_archivo, tamano_bytes, tipo_documento):
    """Guardar información de archivo adjunto"""
    query = """
        INSERT INTO archivos_adjuntos 
        (tramite_id, nombre_archivo, nombre_original, ruta_archivo, tipo_archivo, tamano_bytes, tipo_documento)
        VALUES (%s, %s, %s, %s, %s, %s, %s)
    """
    Database.execute_query(
        query, 
        (int(tramite_id), str(nombre_archivo), str(nombre_original), str(ruta_archivo), 
         str(tipo_archivo), int(tamano_bytes), str(tipo_documento)),
        fetch=False
    )

def get_archivos_tramite(tramite_id):
    """Obtener archivos de un trámite"""
    query = "SELECT * FROM archivos_adjuntos WHERE tramite_id = %s ORDER BY fecha_subida DESC"
    return Database.execute_query(query, (tramite_id,))

def eliminar_archivo(archivo_id):
    """Eliminar registro de archivo adjunto"""
    query = "DELETE FROM archivos_adjuntos WHERE id = %s"
    Database.execute_query(query, (archivo_id,), fetch=False)

# Funciones para administrador

def get_todos_tramites(estado=None, categoria=None, limit=100, offset=0):
    """Obtener todos los trámites (para admin)"""
    query = "SELECT * FROM vista_todos_tramites WHERE 1=1"
    params = []
    
    if estado:
        query += " AND estado = %s"
        params.append(estado)
    
    if categoria:
        query += " AND categoria = %s"
        params.append(categoria)
    
    query += " LIMIT %s OFFSET %s"
    params.extend([limit, offset])
    
    return Database.execute_query(query, tuple(params))

def get_todos_usuarios(tipo_usuario=None, activo=None):
    """Obtener todos los usuarios (para admin)"""
    query = "SELECT id, dni, nombres, apellidos, email, telefono, tipo_usuario, activo, fecha_registro, ultimo_acceso FROM usuarios WHERE 1=1"
    params = []
    
    if tipo_usuario:
        query += " AND tipo_usuario = %s"
        params.append(tipo_usuario)
    
    if activo is not None:
        query += " AND activo = %s"
        params.append(activo)
    
    query += " ORDER BY fecha_registro DESC"
    return Database.execute_query(query, tuple(params) if params else None)

def actualizar_estado_tramite(tramite_id, nuevo_estado, admin_id, comentario):
    """Actualizar estado de trámite (para admin)"""
    try:
        Database.call_procedure('sp_actualizar_estado_tramite', (tramite_id, nuevo_estado, admin_id, comentario))
        return True
    except Exception as e:
        logger.error(f"Error actualizando estado: {e}")
        return False

def asignar_funcionario_tramite(tramite_id, funcionario_id):
    """Asignar funcionario a trámite"""
    query = "UPDATE tramites SET funcionario_asignado_id = %s, fecha_asignacion = NOW() WHERE id = %s"
    Database.execute_query(query, (funcionario_id, tramite_id), fetch=False)

def get_estadisticas_admin():
    """Estadísticas completas para administrador"""
    stats = get_estadisticas_dashboard()
    
    # Trámites por categoría
    query = """
        SELECT tt.categoria, COUNT(t.id) as cantidad
        FROM tipos_tramite tt
        LEFT JOIN tramites t ON tt.id = t.tipo_tramite_id
        GROUP BY tt.categoria
    """
    stats['tramites_por_categoria'] = Database.execute_query(query)
    
    # Usuarios por tipo
    query = """
        SELECT tipo_usuario, COUNT(*) as cantidad
        FROM usuarios
        WHERE activo = TRUE
        GROUP BY tipo_usuario
    """
    stats['usuarios_por_tipo'] = Database.execute_query(query)
    
    # Trámites últimos 7 días
    query = """
        SELECT DATE(fecha_solicitud) as fecha, COUNT(*) as cantidad
        FROM tramites
        WHERE fecha_solicitud >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
        GROUP BY DATE(fecha_solicitud)
        ORDER BY fecha
    """
    stats['tramites_ultimos_7_dias'] = Database.execute_query(query)
    
    return stats
