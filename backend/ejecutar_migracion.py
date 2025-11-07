"""
Script para agregar columna documentos_admin
"""
from database import Database

try:
    print("Agregando columna documentos_admin...")
    
    query = """
        ALTER TABLE tramites 
        ADD COLUMN IF NOT EXISTS documentos_admin LONGTEXT 
        COMMENT 'Archivos adjuntos subidos por el administrador en formato JSON'
    """
    
    Database.execute_query(query, fetch=False)
    
    print("✅ Columna agregada exitosamente")
    
except Exception as e:
    print(f"❌ Error: {e}")
    print("Nota: Si el error dice que la columna ya existe, está bien.")
