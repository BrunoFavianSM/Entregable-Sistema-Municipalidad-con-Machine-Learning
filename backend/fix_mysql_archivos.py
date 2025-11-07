"""
Script para arreglar problemas de MySQL con archivos adjuntos grandes
"""
from database import Database
import pymysql

def fix_mysql_config():
    """Arreglar configuración de MySQL y columnas de BD"""
    
    print("=" * 60)
    print("🔧 ARREGLANDO CONFIGURACIÓN MYSQL PARA ARCHIVOS GRANDES")
    print("=" * 60)
    print()
    
    try:
        # 1. Verificar configuración actual
        print("📊 Verificando configuración actual...")
        query = "SHOW VARIABLES LIKE 'max_allowed_packet'"
        result = Database.execute_query(query)
        
        if result and len(result) > 0:
            valor_actual = int(result[0]['Value'])
            mb_actual = valor_actual / (1024 * 1024)
            print(f"   max_allowed_packet actual: {mb_actual:.0f} MB")
            
            if valor_actual < 268435456:  # 256 MB
                print("   ⚠️  ADVERTENCIA: max_allowed_packet es muy pequeño")
                print("   📝 Necesitas editar my.ini y reiniciar MySQL")
                print()
                print("   Agregar en [mysqld]:")
                print("   max_allowed_packet=256M")
                print()
        
        # 2. Intentar cambiar configuración (temporal)
        print("🔄 Intentando cambiar configuración temporalmente...")
        try:
            queries_config = [
                "SET GLOBAL max_allowed_packet=268435456",
                "SET GLOBAL net_read_timeout=600",
                "SET GLOBAL net_write_timeout=600",
                "SET GLOBAL wait_timeout=28800",
                "SET GLOBAL interactive_timeout=28800"
            ]
            
            for query in queries_config:
                try:
                    Database.execute_query(query, fetch=False)
                    print(f"   ✅ {query.split('=')[0].replace('SET GLOBAL ', '')}")
                except Exception as e:
                    print(f"   ⚠️  No se pudo cambiar (requiere privilegios): {query.split('=')[0]}")
        except Exception as e:
            print(f"   ⚠️  Advertencia: {e}")
        
        print()
        
        # 3. Verificar y arreglar columnas
        print("📋 Verificando columnas de la tabla tramites...")
        query_columnas = """
            SELECT 
                COLUMN_NAME,
                DATA_TYPE,
                CHARACTER_MAXIMUM_LENGTH
            FROM INFORMATION_SCHEMA.COLUMNS
            WHERE TABLE_SCHEMA = 'sistema_municipal_yau'
              AND TABLE_NAME = 'tramites'
              AND COLUMN_NAME IN ('documentos_adjuntos', 'documentos_admin')
        """
        
        columnas = Database.execute_query(query_columnas)
        
        cambios_necesarios = []
        for col in columnas:
            nombre = col['COLUMN_NAME']
            tipo = col['DATA_TYPE']
            
            if tipo != 'longtext':
                print(f"   ⚠️  {nombre}: {tipo.upper()} (necesita cambio a LONGTEXT)")
                cambios_necesarios.append(nombre)
            else:
                print(f"   ✅ {nombre}: LONGTEXT (correcto)")
        
        print()
        
        # 4. Aplicar cambios a columnas
        if cambios_necesarios:
            print("🔧 Aplicando cambios a columnas...")
            for columna in cambios_necesarios:
                try:
                    query_alter = f"ALTER TABLE tramites MODIFY COLUMN {columna} LONGTEXT"
                    Database.execute_query(query_alter, fetch=False)
                    print(f"   ✅ {columna} cambiado a LONGTEXT")
                except Exception as e:
                    print(f"   ❌ Error cambiando {columna}: {e}")
        else:
            print("✅ Todas las columnas ya son LONGTEXT")
        
        print()
        
        # 5. Verificación final
        print("✅ VERIFICACIÓN FINAL:")
        print()
        
        # Verificar max_allowed_packet
        result = Database.execute_query("SHOW VARIABLES LIKE 'max_allowed_packet'")
        if result:
            valor = int(result[0]['Value'])
            mb = valor / (1024 * 1024)
            print(f"📦 max_allowed_packet: {mb:.0f} MB")
            
            if mb >= 256:
                print("   ✅ SUFICIENTE para archivos grandes")
            else:
                print("   ⚠️  INSUFICIENTE - Edita my.ini y reinicia MySQL")
        
        # Verificar columnas
        columnas_final = Database.execute_query(query_columnas)
        print()
        print("📊 Columnas de archivos:")
        for col in columnas_final:
            tipo = col['DATA_TYPE']
            icono = "✅" if tipo == 'longtext' else "❌"
            print(f"   {icono} {col['COLUMN_NAME']}: {tipo.upper()}")
        
        print()
        print("=" * 60)
        print("🎯 INSTRUCCIONES FINALES:")
        print("=" * 60)
        
        # Verificar si necesita reiniciar MySQL
        result = Database.execute_query("SHOW VARIABLES LIKE 'max_allowed_packet'")
        if result:
            valor = int(result[0]['Value'])
            if valor < 268435456:
                print()
                print("⚠️  ACCIÓN REQUERIDA:")
                print()
                print("1. Encuentra el archivo my.ini:")
                print("   XAMPP: C:\\xampp\\mysql\\bin\\my.ini")
                print("   MySQL: C:\\ProgramData\\MySQL\\MySQL Server 8.0\\my.ini")
                print()
                print("2. Abre my.ini como Administrador")
                print()
                print("3. Busca [mysqld] y agrega:")
                print("   max_allowed_packet=256M")
                print("   net_read_timeout=600")
                print("   net_write_timeout=600")
                print()
                print("4. Reinicia MySQL:")
                print("   XAMPP: Stop y Start MySQL en el panel")
                print("   Servicio: net stop MySQL80 && net start MySQL80")
                print()
                print("5. Vuelve a ejecutar este script para verificar")
                print()
            else:
                print()
                print("✅ TODO CONFIGURADO CORRECTAMENTE")
                print()
                print("Ahora puedes:")
                print("1. Reiniciar backend: python app.py")
                print("2. Probar crear trámite con archivos adjuntos")
                print()
        
        print("=" * 60)
        
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    fix_mysql_config()
