import mysql.connector
import bcrypt

# Conectar a la BD
conn = mysql.connector.connect(
    host='localhost',
    user='root',
    password='',
    database='municipalidad_yau'
)

cursor = conn.cursor(dictionary=True)

# Buscar admin
cursor.execute("SELECT * FROM usuarios WHERE dni = '12345678'")
admin = cursor.fetchone()

if admin:
    print("Usuario admin EXISTE:")
    print(f"   DNI: {admin['dni']}")
    print(f"   Nombre: {admin['nombres']} {admin['apellidos']}")
    print(f"   Email: {admin['email']}")
    print(f"   Tipo: {admin['tipo_usuario']}")
    
    # Verificar si tiene contraseña
    password_correcta = "Admin2024!"
    
    # Buscar con contraseña explícita
    cursor.execute("SELECT dni, password_hash FROM usuarios WHERE dni = '12345678'")
    admin_pass = cursor.fetchone()
    
    if admin_pass and admin_pass.get('password_hash'):
        print(f"   Password Hash existe: {admin_pass['password_hash'][:50]}...")
        try:
            if bcrypt.checkpw(password_correcta.encode('utf-8'), admin_pass['password_hash'].encode('utf-8')):
                print(f"\nLa contraseña '{password_correcta}' es CORRECTA")
                print("\nPuedes hacer login con:")
                print(f"   DNI: 12345678")
                print(f"   Contraseña: {password_correcta}")
            else:
                print(f"\nLa contraseña '{password_correcta}' NO coincide")
                print("\nActualizando contraseña...")
                nuevo_hash = bcrypt.hashpw(password_correcta.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
                cursor.execute("UPDATE usuarios SET password_hash = %s WHERE dni = '12345678'", (nuevo_hash,))
                conn.commit()
                print("Contraseña actualizada a: Admin2024!")
        except Exception as e:
            print(f"Error verificando contraseña: {e}")
            print("\nCreando nueva contraseña...")
            nuevo_hash = bcrypt.hashpw(password_correcta.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
            cursor.execute("UPDATE usuarios SET password_hash = %s WHERE dni = '12345678'", (nuevo_hash,))
            conn.commit()
            print("Contraseña actualizada a: Admin2024!")
    else:
        print("El usuario no tiene contraseña")
        print("\nCreando contraseña...")
        nuevo_hash = bcrypt.hashpw(password_correcta.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
        cursor.execute("UPDATE usuarios SET password_hash = %s WHERE dni = '12345678'", (nuevo_hash,))
        conn.commit()
        print("Contraseña creada: Admin2024!")
else:
    print("Usuario admin NO EXISTE")
    print("\nCreando usuario admin...")
    
    password = "Admin2024!"
    password_hash = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
    
    cursor.execute("""
        INSERT INTO usuarios (dni, nombres, apellidos, email, password_hash, 
        tipo_usuario, fecha_nacimiento, telefono, direccion)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
    """, (
        '12345678',
        'Administrador',
        'Municipal',
        'alcalde@municipalidad-yau.gob.pe',
        password_hash,
        'administrador',
        '1980-01-01',
        '999999999',
        'Municipalidad Provincial de Yau'
    ))
    conn.commit()
    print("Usuario admin CREADO exitosamente")
    print(f"   DNI: 12345678")
    print(f"   Contraseña: {password}")

cursor.close()
conn.close()
