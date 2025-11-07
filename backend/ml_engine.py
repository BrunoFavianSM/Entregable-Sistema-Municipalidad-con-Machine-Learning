"""
Motor de Machine Learning para priorización inteligente de trámites
"""
import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestRegressor, GradientBoostingRegressor
from sklearn.preprocessing import StandardScaler
from sklearn.model_selection import train_test_split
import joblib
import os
from datetime import datetime, timedelta
import logging
from database import Database

logger = logging.getLogger(__name__)

class MLEngine:
    """Motor de ML para priorización de trámites"""
    
    def __init__(self, model_path='models/tramites_priority_model.pkl'):
        self.model_path = model_path
        self.model = None
        self.scaler = None
        self.feature_names = [
            'dias_transcurridos',
            'prioridad_base',
            'costo',
            'tiempo_estimado',
            'categoria_encoded',
            'hora_dia',
            'dia_semana',
            'mes',
            'carga_sistema'
        ]
        self.load_model()
    
    def load_model(self):
        """Cargar modelo entrenado"""
        try:
            if os.path.exists(self.model_path):
                data = joblib.load(self.model_path)
                self.model = data['model']
                self.scaler = data['scaler']
                logger.info(f"✅ Modelo ML cargado desde {self.model_path}")
            else:
                logger.warning("⚠️ No existe modelo entrenado, se creará uno nuevo")
                self.train_initial_model()
        except Exception as e:
            logger.error(f"❌ Error cargando modelo: {e}")
            self.train_initial_model()
    
    def save_model(self):
        """Guardar modelo entrenado"""
        try:
            os.makedirs(os.path.dirname(self.model_path), exist_ok=True)
            joblib.dump({
                'model': self.model,
                'scaler': self.scaler,
                'feature_names': self.feature_names,
                'trained_at': datetime.now().isoformat()
            }, self.model_path)
            logger.info(f"✅ Modelo guardado en {self.model_path}")
        except Exception as e:
            logger.error(f"❌ Error guardando modelo: {e}")
    
    def extract_features(self, tramite_data):
        """Extraer características de un trámite"""
        features = {}
        
        # Días transcurridos desde la solicitud
        fecha_solicitud = tramite_data.get('fecha_solicitud', datetime.now())
        if isinstance(fecha_solicitud, str):
            fecha_solicitud = datetime.fromisoformat(fecha_solicitud.replace('Z', '+00:00'))
        features['dias_transcurridos'] = (datetime.now() - fecha_solicitud).days
        
        # Prioridad base del tipo de trámite
        features['prioridad_base'] = tramite_data.get('prioridad_base', 5)
        
        # Costo del trámite (normalizado)
        features['costo'] = float(tramite_data.get('costo', 0))
        
        # Tiempo estimado
        features['tiempo_estimado'] = tramite_data.get('tiempo_estimado_dias', 5)
        
        # Categoría codificada
        categoria_map = {
            'licencias': 5,
            'permisos': 4,
            'certificados': 2,
            'registros': 3,
            'otros': 1
        }
        features['categoria_encoded'] = categoria_map.get(
            tramite_data.get('categoria', 'otros'), 1
        )
        
        # Características temporales
        now = datetime.now()
        features['hora_dia'] = now.hour
        features['dia_semana'] = now.weekday()
        features['mes'] = now.month
        
        # Carga del sistema (cantidad de trámites pendientes)
        try:
            query = "SELECT COUNT(*) as count FROM tramites WHERE estado IN ('pendiente', 'en_revision')"
            result = Database.execute_query(query)
            features['carga_sistema'] = result[0]['count'] if result else 0
        except:
            features['carga_sistema'] = 0
        
        return features
    
    def predict_priority(self, tramite_data):
        """Predecir prioridad de un trámite"""
        try:
            features = self.extract_features(tramite_data)
            
            # Convertir a array
            X = np.array([[features[name] for name in self.feature_names]])
            
            # Escalar si existe scaler
            if self.scaler:
                X = self.scaler.transform(X)
            
            # Predecir
            if self.model:
                score = self.model.predict(X)[0]
            else:
                # Si no hay modelo, usar heurística simple
                score = self._calculate_heuristic_score(features)
            
            # Normalizar score entre 0 y 10
            score = max(0, min(10, score))
            
            return float(score)
        
        except Exception as e:
            logger.error(f"❌ Error prediciendo prioridad: {e}")
            return 5.0  # Prioridad media por defecto
    
    def _calculate_heuristic_score(self, features):
        """Calcular score heurístico sin modelo ML"""
        score = 0.0
        
        # Peso por días transcurridos (más días = mayor prioridad)
        score += features['dias_transcurridos'] * 0.3
        
        # Peso por prioridad base
        score += features['prioridad_base'] * 0.4
        
        # Peso por categoría
        score += features['categoria_encoded'] * 0.2
        
        # Peso por carga del sistema (menos carga = más atención a cada trámite)
        if features['carga_sistema'] > 50:
            score -= 1.0
        
        # Bonus por urgencia (más de 7 días)
        if features['dias_transcurridos'] > 7:
            score += 2.0
        
        return score
    
    def train_initial_model(self):
        """Entrenar modelo inicial con datos sintéticos"""
        logger.info("🔄 Entrenando modelo inicial...")
        
        try:
            # Intentar obtener datos reales
            query = """
                SELECT 
                    t.*,
                    tt.prioridad_base,
                    tt.costo,
                    tt.tiempo_estimado_dias,
                    tt.categoria,
                    DATEDIFF(COALESCE(t.fecha_finalizacion, NOW()), t.fecha_solicitud) as dias_atencion
                FROM tramites t
                INNER JOIN tipos_tramite tt ON t.tipo_tramite_id = tt.id
                WHERE t.tiempo_atencion_dias IS NOT NULL
                LIMIT 1000
            """
            tramites_reales = Database.execute_query(query)
            
            if tramites_reales and len(tramites_reales) > 50:
                # Usar datos reales
                X_data = []
                y_data = []
                
                for tramite in tramites_reales:
                    features = self.extract_features(tramite)
                    X_data.append([features[name] for name in self.feature_names])
                    
                    # Target: prioridad basada en tiempo de atención
                    # Menos días = mejor servicio = mayor prioridad efectiva
                    dias = tramite.get('dias_atencion', 5)
                    target_priority = max(1, 10 - (dias / 5))
                    y_data.append(target_priority)
                
                X = np.array(X_data)
                y = np.array(y_data)
            else:
                # Generar datos sintéticos
                X, y = self._generate_synthetic_data(500)
            
            # Escalar características
            self.scaler = StandardScaler()
            X_scaled = self.scaler.fit_transform(X)
            
            # Entrenar modelo
            self.model = GradientBoostingRegressor(
                n_estimators=100,
                learning_rate=0.1,
                max_depth=5,
                random_state=42
            )
            self.model.fit(X_scaled, y)
            
            # Guardar modelo
            self.save_model()
            
            logger.info("✅ Modelo inicial entrenado exitosamente")
            
        except Exception as e:
            logger.error(f"❌ Error entrenando modelo inicial: {e}")
            # Crear modelo básico
            self.model = None
            self.scaler = None
    
    def _generate_synthetic_data(self, n_samples=500):
        """Generar datos sintéticos para entrenamiento inicial"""
        np.random.seed(42)
        
        X = []
        y = []
        
        for _ in range(n_samples):
            # Características aleatorias pero realistas
            dias_transcurridos = np.random.randint(0, 30)
            prioridad_base = np.random.randint(1, 10)
            costo = np.random.uniform(10, 1000)
            tiempo_estimado = np.random.randint(1, 45)
            categoria = np.random.randint(1, 6)
            hora = np.random.randint(0, 24)
            dia_semana = np.random.randint(0, 7)
            mes = np.random.randint(1, 13)
            carga = np.random.randint(0, 100)
            
            features = [
                dias_transcurridos,
                prioridad_base,
                costo,
                tiempo_estimado,
                categoria,
                hora,
                dia_semana,
                mes,
                carga
            ]
            
            # Target: prioridad calculada con lógica de negocio
            priority = (
                prioridad_base * 0.4 +
                (dias_transcurridos / 3) * 0.3 +
                categoria * 0.2 +
                (1 if carga > 50 else 0) * 0.1
            )
            priority = max(1, min(10, priority))
            
            X.append(features)
            y.append(priority)
        
        return np.array(X), np.array(y)
    
    def retrain_model(self):
        """Re-entrenar modelo con datos actualizados"""
        logger.info("🔄 Re-entrenando modelo con datos actuales...")
        
        try:
            # Obtener datos históricos
            query = """
                SELECT 
                    t.*,
                    tt.prioridad_base,
                    tt.costo,
                    tt.tiempo_estimado_dias,
                    tt.categoria,
                    t.tiempo_atencion_dias
                FROM tramites t
                INNER JOIN tipos_tramite tt ON t.tipo_tramite_id = tt.id
                WHERE t.estado IN ('finalizado', 'rechazado')
                AND t.tiempo_atencion_dias IS NOT NULL
                ORDER BY t.fecha_finalizacion DESC
                LIMIT 2000
            """
            tramites = Database.execute_query(query)
            
            if not tramites or len(tramites) < 50:
                logger.warning("⚠️ Datos insuficientes para re-entrenar")
                return False
            
            # Preparar datos
            X_data = []
            y_data = []
            
            for tramite in tramites:
                features = self.extract_features(tramite)
                X_data.append([features[name] for name in self.feature_names])
                
                # Target: prioridad inversa al tiempo de atención
                dias = tramite['tiempo_atencion_dias']
                target = max(1, 10 - (dias / 5))
                y_data.append(target)
            
            X = np.array(X_data)
            y = np.array(y_data)
            
            # Dividir en train/test
            X_train, X_test, y_train, y_test = train_test_split(
                X, y, test_size=0.2, random_state=42
            )
            
            # Escalar
            self.scaler = StandardScaler()
            X_train_scaled = self.scaler.fit_transform(X_train)
            X_test_scaled = self.scaler.transform(X_test)
            
            # Entrenar nuevo modelo
            new_model = GradientBoostingRegressor(
                n_estimators=150,
                learning_rate=0.1,
                max_depth=5,
                random_state=42
            )
            new_model.fit(X_train_scaled, y_train)
            
            # Evaluar
            train_score = new_model.score(X_train_scaled, y_train)
            test_score = new_model.score(X_test_scaled, y_test)
            
            logger.info(f"📊 Train Score: {train_score:.3f}, Test Score: {test_score:.3f}")
            
            # Actualizar modelo si es mejor
            if test_score > 0.5:  # Umbral mínimo de calidad
                self.model = new_model
                self.save_model()
                logger.info("✅ Modelo re-entrenado y actualizado")
                return True
            else:
                logger.warning("⚠️ Nuevo modelo no supera umbral de calidad")
                return False
        
        except Exception as e:
            logger.error(f"❌ Error re-entrenando modelo: {e}")
            return False
    
    def get_model_info(self):
        """Obtener información del modelo"""
        info = {
            'model_loaded': self.model is not None,
            'scaler_loaded': self.scaler is not None,
            'feature_count': len(self.feature_names),
            'features': self.feature_names
        }
        
        if os.path.exists(self.model_path):
            info['model_file_exists'] = True
            info['model_size_kb'] = os.path.getsize(self.model_path) / 1024
        else:
            info['model_file_exists'] = False
        
        return info

# Instancia global del motor ML
ml_engine = MLEngine()
