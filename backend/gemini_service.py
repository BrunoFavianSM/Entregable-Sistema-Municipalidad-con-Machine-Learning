"""
Servicio de integración con Google Gemini AI
"""
import google.generativeai as genai
from config import Config
import logging
from datetime import datetime
from database import Database, crear_notificacion

logger = logging.getLogger(__name__)

class GeminiService:
    """Servicio para consultas a Gemini AI"""
    
    def __init__(self):
        self.model = None
        # API Key directa
        self.api_key = 'AIzaSyDHsTlq9HCdp2OxGXvvtOg5zt4LrDUklR4'
        self.initialize()
    
    def initialize(self):
        """Inicializar servicio de Gemini"""
        try:
            if not self.api_key or self.api_key == '':
                logger.warning("⚠️ API Key de Gemini no configurada")
                return False
            
            logger.info(f"🔧 Configurando Gemini con API Key: {self.api_key[:20]}...")
            genai.configure(api_key=self.api_key)
            
            modelo = Config.GEMINI_MODEL if hasattr(Config, 'GEMINI_MODEL') else 'gemini-2.0-flash-exp'
            logger.info(f"🔧 Inicializando modelo: {modelo}")
            self.model = genai.GenerativeModel(modelo)
            
            logger.info("✅ Servicio Gemini inicializado correctamente")
            return True
        except Exception as e:
            logger.error(f"❌ Error inicializando Gemini: {e}")
            import traceback
            logger.error(traceback.format_exc())
            return False
    
    def is_available(self):
        """Verificar si el servicio está disponible"""
        return self.model is not None
    
    def consultar(self, pregunta, contexto=None, user_id=None, tramite_id=None, es_admin=False):
        """
        Realizar consulta a Gemini
        
        Args:
            pregunta: Pregunta del usuario
            contexto: Contexto adicional (información de trámite, etc)
            user_id: ID del usuario que consulta
            tramite_id: ID del trámite relacionado (opcional)
            es_admin: Si es consulta de administrador
        
        Returns:
            dict con respuesta y metadata
        """
        if not self.is_available():
            return {
                'success': False,
                'error': 'Servicio de IA no disponible. Verifica la configuración de API Key.'
            }
        
        try:
            start_time = datetime.now()
            
            # Construir prompt con contexto
            prompt = self._build_prompt(pregunta, contexto, es_admin)
            
            # Generar respuesta
            response = self.model.generate_content(prompt)
            
            # Calcular tiempo de respuesta
            tiempo_respuesta = (datetime.now() - start_time).total_seconds() * 1000
            
            respuesta_texto = response.text
            
            # Registrar consulta en base de datos
            if user_id:
                self._registrar_consulta(
                    user_id, 
                    tramite_id, 
                    pregunta, 
                    respuesta_texto,
                    tiempo_respuesta
                )
            
            return {
                'success': True,
                'respuesta': respuesta_texto,
                'tiempo_respuesta_ms': int(tiempo_respuesta),
                'timestamp': datetime.now().isoformat()
            }
        
        except Exception as e:
            logger.error(f"❌ Error en consulta Gemini: {e}")
            import traceback
            logger.error(traceback.format_exc())
            
            error_msg = str(e)
            if '429' in error_msg or 'quota' in error_msg.lower():
                error_msg = 'Has excedido el límite de consultas. Intenta de nuevo en unos minutos.'
            elif '403' in error_msg or 'permission' in error_msg.lower():
                error_msg = 'API Key inválida o sin permisos. Verifica la configuración.'
            elif 'api_key' in error_msg.lower():
                error_msg = 'Error con la API Key de Gemini. Verifica la configuración.'
            
            return {
                'success': False,
                'error': error_msg
            }
    
    def _build_prompt(self, pregunta, contexto=None, es_admin=False):
        """Construir prompt con contexto mejorado para Gemini"""
        
        # Obtener información actualizada del sistema
        sistema_info = self._get_sistema_context()
        
        if es_admin:
            system_context = f"""
Eres un asistente IA especializado para ADMINISTRADORES de la Municipalidad Provincial de Yau.

INFORMACIÓN DEL SISTEMA:
📊 Trámites disponibles: {sistema_info['total_tramites_disponibles']} tipos
👥 Total de usuarios registrados: {sistema_info['total_usuarios']}
📋 Trámites activos: {sistema_info['tramites_activos']}
⏱️ Trámites pendientes: {sistema_info['tramites_pendientes']}

CATEGORÍAS DE TRÁMITES:
{sistema_info['categorias_info']}

Tu rol como asistente del administrador:
✅ Ayudar con análisis de trámites y toma de decisiones
✅ Sugerir respuestas apropiadas para ciudadanos
✅ Identificar patrones y problemas en trámites
✅ Recomendar priorización de casos
✅ Ayudar con redacción de observaciones y respuestas
✅ Proporcionar información sobre normativas y procedimientos
✅ Análisis de estadísticas y tendencias

INSTRUCCIONES:
- Sé profesional, preciso y eficiente
- Enfócate en optimizar procesos administrativos
- Ayuda a tomar decisiones informadas
- Sugiere mejoras cuando sea apropiado
- Ten en cuenta el contexto legal y normativo municipal
"""
        else:
            system_context = f"""
Eres un asistente virtual inteligente de la Municipalidad Provincial de Yau.

INFORMACIÓN DEL SISTEMA:
📊 Trámites disponibles: {sistema_info['total_tramites_disponibles']} tipos
👥 Usuarios registrados: {sistema_info['total_usuarios']}

Tu rol es ayudar a los ciudadanos con:
✅ Información sobre trámites municipales
✅ Requisitos y documentación necesaria
✅ Orientación paso a paso
✅ Tiempos estimados y costos
✅ Redacción y mejora de solicitudes
✅ Seguimiento de trámites

CATEGORÍAS DE TRÁMITES DISPONIBLES:
{sistema_info['categorias_info']}

INSTRUCCIONES:
- Sé amable, claro y profesional
- Da respuestas específicas y útiles
- Si ayudas a redactar, usa lenguaje formal pero accesible
- Menciona requisitos específicos cuando sea relevante
- Si no tienes información exacta, recomienda consultar presencialmente
- Puedes sugerir trámites relacionados que podrían ser útiles
"""
        
        prompt_parts = [system_context]
        
        if contexto:
            prompt_parts.append(f"\n📋 CONTEXTO ESPECÍFICO:\n{contexto}\n")
        
        prompt_parts.append(f"\n💬 PREGUNTA DEL CIUDADANO:\n{pregunta}\n\n📝 RESPUESTA:")
        
        return "\n".join(prompt_parts)
    
    def _registrar_consulta(self, user_id, tramite_id, pregunta, respuesta, tiempo_ms):
        """Registrar consulta en base de datos"""
        try:
            query = """
                INSERT INTO consultas_gemini 
                (usuario_id, tramite_id, pregunta, respuesta, tiempo_respuesta_ms)
                VALUES (%s, %s, %s, %s, %s)
            """
            # Asegurar conversión correcta de tipos
            params = (
                int(user_id) if user_id else None,
                int(tramite_id) if tramite_id else None,
                str(pregunta),
                str(respuesta),
                int(tiempo_ms)
            )
            Database.execute_query(query, params, fetch=False)
        except Exception as e:
            logger.error(f"❌ Error registrando consulta: {e}")
    
    def obtener_informacion_tramite(self, tipo_tramite_codigo):
        """Obtener información detallada de un tipo de trámite usando IA"""
        try:
            # Buscar información del trámite en BD
            query = """
                SELECT * FROM tipos_tramite 
                WHERE codigo = %s AND activo = TRUE
            """
            result = Database.execute_query(query, (tipo_tramite_codigo,))
            
            if not result:
                return {
                    'success': False,
                    'error': 'Tipo de trámite no encontrado'
                }
            
            tramite_info = result[0]
            
            # Construir contexto
            contexto = f"""
Información del trámite:
- Nombre: {tramite_info['nombre']}
- Categoría: {tramite_info['categoria']}
- Costo: S/ {tramite_info['costo']}
- Tiempo estimado: {tramite_info['tiempo_estimado_dias']} días
- Descripción: {tramite_info['descripcion']}
"""
            
            pregunta = f"Proporciona información detallada sobre el trámite '{tramite_info['nombre']}', incluyendo pasos a seguir y recomendaciones."
            
            return self.consultar(pregunta, contexto)
        
        except Exception as e:
            logger.error(f"❌ Error obteniendo info de trámite: {e}")
            return {
                'success': False,
                'error': str(e)
            }
    
    def analizar_documentos_faltantes(self, tramite_id):
        """Analizar qué documentos faltan en un trámite"""
        try:
            # Obtener información del trámite
            query = """
                SELECT t.*, tt.nombre, tt.requisitos, tt.descripcion
                FROM tramites t
                INNER JOIN tipos_tramite tt ON t.tipo_tramite_id = tt.id
                WHERE t.id = %s
            """
            result = Database.execute_query(query, (tramite_id,))
            
            if not result:
                return {
                    'success': False,
                    'error': 'Trámite no encontrado'
                }
            
            tramite = result[0]
            
            contexto = f"""
Trámite: {tramite['nombre']}
Estado: {tramite['estado']}
Documentos adjuntos: {tramite.get('documentos_adjuntos', 'Ninguno')}
Observaciones: {tramite.get('observaciones', 'Sin observaciones')}
"""
            
            pregunta = "Basándote en el estado del trámite, ¿qué documentos o información adicional podría necesitar el ciudadano?"
            
            return self.consultar(pregunta, contexto)
        
        except Exception as e:
            logger.error(f"❌ Error analizando documentos: {e}")
            return {
                'success': False,
                'error': str(e)
            }
    
    def generar_recomendaciones_ciudadano(self, user_id):
        """Generar recomendaciones personalizadas para un ciudadano"""
        try:
            # Obtener trámites del usuario
            query = """
                SELECT t.*, tt.nombre, tt.categoria
                FROM tramites t
                INNER JOIN tipos_tramite tt ON t.tipo_tramite_id = tt.id
                WHERE t.usuario_id = %s
                ORDER BY t.fecha_solicitud DESC
                LIMIT 5
            """
            tramites = Database.execute_query(query, (user_id,))
            
            if not tramites:
                contexto = "El ciudadano no tiene trámites registrados."
            else:
                tramites_info = "\n".join([
                    f"- {t['nombre']} ({t['estado']})" for t in tramites
                ])
                contexto = f"Trámites recientes del ciudadano:\n{tramites_info}"
            
            pregunta = "Proporciona recomendaciones útiles para el ciudadano sobre sus trámites y servicios municipales."
            
            return self.consultar(pregunta, contexto, user_id)
        
        except Exception as e:
            logger.error(f"❌ Error generando recomendaciones: {e}")
            return {
                'success': False,
                'error': str(e)
            }
    
    def obtener_historial_consultas(self, user_id, limit=10):
        """Obtener historial de consultas de un usuario"""
        try:
            query = """
                SELECT * FROM consultas_gemini
                WHERE usuario_id = %s
                ORDER BY fecha_consulta DESC
                LIMIT %s
            """
            return Database.execute_query(query, (user_id, limit))
        except Exception as e:
            logger.error(f"❌ Error obteniendo historial: {e}")
            return []
    
    def estadisticas_uso(self):
        """Obtener estadísticas de uso del servicio"""
        try:
            stats = {}
            
            # Total de consultas
            query = "SELECT COUNT(*) as total FROM consultas_gemini"
            result = Database.execute_query(query)
            stats['total_consultas'] = result[0]['total'] if result else 0
            
            # Consultas hoy
            query = """
                SELECT COUNT(*) as total FROM consultas_gemini
                WHERE DATE(fecha_consulta) = CURDATE()
            """
            result = Database.execute_query(query)
            stats['consultas_hoy'] = result[0]['total'] if result else 0
            
            # Tiempo promedio de respuesta
            query = """
                SELECT AVG(tiempo_respuesta_ms) as promedio
                FROM consultas_gemini
                WHERE tiempo_respuesta_ms IS NOT NULL
            """
            result = Database.execute_query(query)
            stats['tiempo_promedio_ms'] = int(result[0]['promedio']) if result and result[0]['promedio'] else 0
            
            # Usuarios únicos
            query = "SELECT COUNT(DISTINCT usuario_id) as total FROM consultas_gemini"
            result = Database.execute_query(query)
            stats['usuarios_unicos'] = result[0]['total'] if result else 0
            
            return stats
        except Exception as e:
            logger.error(f"❌ Error obteniendo estadísticas: {e}")
            return {}
    
    def _get_sistema_context(self):
        """Obtener contexto actualizado del sistema desde la BD"""
        try:
            # Obtener tipos de trámite desde BD
            query = "SELECT categoria, COUNT(*) as cantidad FROM tipos_tramite WHERE activo = TRUE GROUP BY categoria"
            categorias = Database.execute_query(query)
            
            # Obtener total de usuarios
            query_usuarios = "SELECT COUNT(*) as total FROM usuarios WHERE tipo_usuario = 'ciudadano'"
            result_usuarios = Database.execute_query(query_usuarios)
            total_usuarios = result_usuarios[0]['total'] if result_usuarios else 0
            
            # Obtener total de trámites activos
            query_tramites = "SELECT COUNT(*) as total FROM tramites WHERE estado NOT IN ('completado', 'rechazado')"
            result_tramites = Database.execute_query(query_tramites)
            tramites_activos = result_tramites[0]['total'] if result_tramites else 0
            
            # Obtener trámites pendientes
            query_pendientes = "SELECT COUNT(*) as total FROM tramites WHERE estado = 'pendiente'"
            result_pendientes = Database.execute_query(query_pendientes)
            tramites_pendientes = result_pendientes[0]['total'] if result_pendientes else 0
            
            categorias_map = {
                'impuestos_pagos': '🏦 Impuestos y Pagos',
                'tramites_catastrales': '🏠 Trámites Catastrales',
                'licencias_autorizaciones': '🧑‍💼 Licencias y Autorizaciones',
                'obras_construccion': '🚧 Obras y Construcción',
                'quejas_reclamos': '🧑‍⚖️ Quejas, Reclamos y Denuncias',
                'registro_civil': '⚰️ Registro Civil',
                'transporte_transito': '🚗 Transporte y Tránsito',
                'servicios_municipales': '💡 Servicios Municipales',
                'atencion_ciudadano': '🧍 Atención al Ciudadano'
            }
            
            categorias_info = []
            total_tramites = 0
            
            for cat in categorias:
                nombre_cat = categorias_map.get(cat['categoria'], cat['categoria'])
                cantidad = cat['cantidad']
                total_tramites += cantidad
                categorias_info.append(f"  - {nombre_cat}: {cantidad} trámites")
            
            return {
                'total_tramites_disponibles': total_tramites,
                'total_usuarios': total_usuarios,
                'tramites_activos': tramites_activos,
                'tramites_pendientes': tramites_pendientes,
                'categorias_info': '\n'.join(categorias_info)
            }
        except Exception as e:
            logger.error(f"Error obteniendo contexto: {e}")
            return {
                'total_tramites_disponibles': '50+',
                'total_usuarios': 'N/A',
                'tramites_activos': 'N/A',
                'tramites_pendientes': 'N/A',
                'categorias_info': 'Múltiples categorías disponibles'
            }
    
    def ayudar_redactar_tramite(self, tipo_tramite_id, descripcion_usuario, user_id=None):
        """Ayudar a redactar o mejorar la descripción de un trámite"""
        try:
            # Obtener información del tipo de trámite
            query = "SELECT * FROM tipos_tramite WHERE id = %s"
            result = Database.execute_query(query, (tipo_tramite_id,))
            
            if not result:
                return {
                    'success': False,
                    'error': 'Tipo de trámite no encontrado'
                }
            
            tramite_info = result[0]
            
            contexto = f"""
TIPO DE TRÁMITE: {tramite_info['nombre']}
CATEGORÍA: {tramite_info['categoria']}
DESCRIPCIÓN: {tramite_info['descripcion']}
TIEMPO ESTIMADO: {tramite_info['tiempo_estimado_dias']} días
COSTO: S/ {tramite_info['costo']}

DESCRIPCIÓN INICIAL DEL CIUDADANO:
{descripcion_usuario}
"""
            
            pregunta = """
Por favor, ayúdame a redactar una solicitud formal y completa para este trámite.

Debes:
1. Mejorar la redacción haciéndola más formal y profesional
2. Incluir todos los elementos importantes (datos del solicitante, motivo, etc.)
3. Mantener la información proporcionada por el ciudadano
4. Usar un lenguaje claro y directo
5. Estructurar bien la solicitud

Formato sugerido:
- Introducción: "Yo [nombre], identificado con DNI [dni], me dirijo a ustedes para..."
- Cuerpo: Explicar claramente lo que se solicita
- Cierre: Despedida formal

Redacta SOLO la solicitud mejorada, sin explicaciones adicionales.
"""
            
            resultado = self.consultar(pregunta, contexto, user_id)
            
            if resultado.get('success'):
                # Guardar contexto para registro
                if user_id:
                    try:
                        import json
                        contexto_json = json.dumps({"tipo": "ayuda_redaccion", "tramite": tramite_info['nombre']})
                        query = """
                            UPDATE consultas_gemini 
                            SET contexto_usado = %s 
                            WHERE usuario_id = %s 
                            ORDER BY fecha_consulta DESC 
                            LIMIT 1
                        """
                        Database.execute_query(
                            query,
                            (str(contexto_json), int(user_id)),
                            fetch=False
                        )
                    except:
                        pass
            
            return resultado
        
        except Exception as e:
            logger.error(f"❌ Error ayudando a redactar: {e}")
            return {
                'success': False,
                'error': str(e)
            }
    
    def buscar_tramite_por_descripcion(self, descripcion, user_id=None):
        """Buscar el tipo de trámite más adecuado según una descripción"""
        try:
            # Obtener todos los tipos de trámite
            query = "SELECT id, codigo, nombre, descripcion, categoria FROM tipos_tramite WHERE activo = TRUE"
            tramites = Database.execute_query(query)
            
            tramites_info = "\n".join([
                f"ID: {t['id']} | {t['nombre']} ({t['categoria']}) - {t['descripcion']}"
                for t in tramites[:30]  # Limitar para no exceder tokens
            ])
            
            contexto = f"""
LISTA DE TRÁMITES DISPONIBLES:
{tramites_info}
"""
            
            pregunta = f"""
El ciudadano necesita: "{descripcion}"

Analiza su necesidad y recomienda:
1. El trámite MÁS APROPIADO de la lista (menciona el ID y nombre exacto)
2. Por qué es el indicado
3. Qué documentos necesitará
4. Pasos básicos a seguir

Sé específico y usa el formato:
"Recomendación: [Nombre del trámite] (ID: [número])"
"""
            
            return self.consultar(pregunta, contexto, user_id)
        
        except Exception as e:
            logger.error(f"❌ Error buscando trámite: {e}")
            return {
                'success': False,
                'error': str(e)
            }

# Instancia global del servicio
gemini_service = GeminiService()
