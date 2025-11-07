"""
Configuración del Sistema Municipal
"""
import os
from dotenv import load_dotenv
from datetime import timedelta

# Cargar variables de entorno
load_dotenv()

class Config:
    """Configuración base del sistema"""
    
    # Flask
    SECRET_KEY = os.getenv('SECRET_KEY', 'dev-secret-key-change-in-production')
    DEBUG = os.getenv('FLASK_DEBUG', 'True') == 'True'
    
    # JWT
    JWT_SECRET_KEY = os.getenv('JWT_SECRET_KEY', 'jwt-secret-key-change-in-production')
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(hours=8)
    JWT_REFRESH_TOKEN_EXPIRES = timedelta(days=30)
    
    # Base de Datos MySQL
    DB_CONFIG = {
        'host': os.getenv('DB_HOST', 'localhost'),
        'port': int(os.getenv('DB_PORT', 3306)),
        'user': os.getenv('DB_USER', 'root'),
        'password': os.getenv('DB_PASSWORD', ''),
        'database': os.getenv('DB_NAME', 'municipalidad_yau'),
        'charset': 'utf8mb4',
        'collation': 'utf8mb4_unicode_ci',
        'autocommit': True,
        'pool_size': 10,
        'pool_reset_session': True
    }
    
    # Google Gemini
    GEMINI_API_KEY = os.getenv('GEMINI_API_KEY', '')
    GEMINI_MODEL = 'gemini-2.0-flash-exp'  # Modelo actualizado
    
    # Machine Learning
    ML_MODEL_PATH = os.getenv('ML_MODEL_PATH', 'models/tramites_priority_model.pkl')
    ML_RETRAIN_INTERVAL_DAYS = int(os.getenv('ML_RETRAIN_INTERVAL_DAYS', 7))
    
    # Archivos
    BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    UPLOAD_FOLDER = os.path.join(BASE_DIR, os.getenv('UPLOAD_FOLDER', 'uploads'))
    CLIENTES_DIR = os.path.join(BASE_DIR, 'clientes')
    MAX_UPLOAD_SIZE_MB = int(os.getenv('MAX_UPLOAD_SIZE_MB', 10))
    MAX_CONTENT_LENGTH = MAX_UPLOAD_SIZE_MB * 1024 * 1024
    ALLOWED_EXTENSIONS = set(os.getenv('ALLOWED_EXTENSIONS', 'pdf,jpg,jpeg,png,doc,docx').split(','))
    
    # Reconocimiento Facial
    FACE_ENCODINGS_PATH = os.path.join(BASE_DIR, 'face_encodings.pkl')
    FACE_RECOGNITION_TOLERANCE = 0.6
    
    # Notificaciones
    NOTIFICATIONS_ENABLED = os.getenv('NOTIFICATIONS_ENABLED', 'True') == 'True'
    
    # Logs
    LOG_LEVEL = os.getenv('LOG_LEVEL', 'INFO')
    LOG_FILE = os.path.join(BASE_DIR, os.getenv('LOG_FILE', 'logs/sistema.log'))
    
    # CORS
    CORS_ORIGINS = ['http://localhost:3000', 'http://localhost:5173', 'http://127.0.0.1:3000']
    
    @staticmethod
    def init_app(app):
        """Inicializar configuración de la aplicación"""
        # Crear directorios necesarios
        os.makedirs(Config.UPLOAD_FOLDER, exist_ok=True)
        os.makedirs(Config.CLIENTES_DIR, exist_ok=True)
        os.makedirs(os.path.dirname(Config.LOG_FILE), exist_ok=True)
        os.makedirs(os.path.dirname(Config.ML_MODEL_PATH), exist_ok=True)
