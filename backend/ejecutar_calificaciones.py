"""
Script para crear tabla de calificaciones
"""
from database import Database

try:
    print("Creando tabla calificaciones_alcalde...")
    
    query = """
        CREATE TABLE IF NOT EXISTS calificaciones_alcalde (
            id INT AUTO_INCREMENT PRIMARY KEY,
            usuario_id INT NOT NULL,
            calificacion INT NOT NULL CHECK (calificacion BETWEEN 1 AND 5),
            comentario TEXT,
            fecha_calificacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
            UNIQUE KEY unique_calificacion_usuario (usuario_id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    """
    
    Database.execute_query(query, fetch=False)
    
    print("✅ Tabla creada exitosamente")
    
except Exception as e:
    print(f"❌ Error: {e}")
    print("Nota: Si el error dice que la tabla ya existe, está bien.")
