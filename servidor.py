from datetime import datetime
from pathlib import Path
from threading import Lock
from flask import Flask, jsonify, request, send_from_directory
from openpyxl import load_workbook

BASE = Path(__file__).resolve().parent
ARCHIVO = BASE / "datos" / "contactos.xlsx"
app = Flask(__name__, static_folder=None)
bloqueo = Lock()


@app.post("/api/contacto")
def guardar_contacto():
    datos = request.get_json(silent=True) or {}
    nombre = str(datos.get("nombre", "")).strip()
    email = str(datos.get("email", "")).strip()
    asunto = str(datos.get("asunto", "")).strip()
    mensaje = str(datos.get("mensaje", "")).strip()
    asuntos = {
        "Consultas",
        "Reclamos",
        "Cliente",
        "Nuevo cliente",
        "Proveedores",
        "Otros",
    }
    if not (
        2 <= len(nombre) <= 150
        and 3 <= len(email) <= 254
        and "@" in email
        and "." in email.split("@")[-1]
        and asunto in asuntos
        and 10 <= len(mensaje) <= 5000
    ):
        return jsonify(error="Revisa los datos del formulario."), 400
    try:
        with bloqueo:
            libro = load_workbook(ARCHIVO)

            def seguro(texto):
                return (
                    "'" + texto
                    if texto.lstrip().startswith(("=", "+", "-", "@"))
                    else texto
                )

            libro.active.append(
                [
                    datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
                    seguro(nombre),
                    seguro(email),
                    seguro(asunto),
                    seguro(mensaje),
                ]
            )
            libro.save(ARCHIVO)
        return jsonify(mensaje="Guardado correctamente"), 201
    except (OSError, PermissionError):
        return (
            jsonify(
                error="No se pudo guardar. Cierra el Excel si está abierto y vuelve a intentar."
            ),
            500,
        )


@app.get("/")
def inicio():
    return send_from_directory(BASE, "index.html")


@app.get("/<path:ruta>")
def recursos(ruta):
    if ruta.startswith(("datos/", ".vscode/")) or ruta in (
        "servidor.py",
        "requirements.txt",
        "INSTRUCCIONES.txt",
    ):
        return "No disponible", 404
    return send_from_directory(BASE, ruta)


if __name__ == "__main__":
    print("Abre http://127.0.0.1:5000 en tu navegador")
    app.run(host="127.0.0.1", port=5000, debug=False)
