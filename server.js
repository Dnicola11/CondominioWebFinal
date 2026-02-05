const path = require("path");
const fs = require("fs");
const express = require("express");
const cors = require('cors');
const multer = require("multer");
require("dotenv").config();
const db = require("./db");


const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(cors({ origin: 'http://localhost:3000' }));
app.use(express.json());
app.use(express.static(path.join(__dirname)));

const uploadsRoot = path.join(__dirname, "uploads");
const anunciosDir = path.join(uploadsRoot, "anuncios");
const comprobantesDir = path.join(uploadsRoot, "comprobantes");
fs.mkdirSync(anunciosDir, { recursive: true });
fs.mkdirSync(comprobantesDir, { recursive: true });
app.use("/uploads", express.static(uploadsRoot));

const makeStorage = (dest) =>
  multer.diskStorage({
    destination: dest,
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname || "").toLowerCase();
      const name = `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
      cb(null, name);
    },
  });

const uploadAnuncio = multer({ storage: makeStorage(anunciosDir) });
const uploadComprobante = multer({ storage: makeStorage(comprobantesDir) });

const resources = {
  secciones: {
    table: "Seccion",
    id: "IdSeccion",
    columns: ["IdSeccion", "Descripcion"],
    autoId: false,
  },
  empleados: {
    table: "Empleados",
    id: "IdEmpleado",
    columns: ["IdEmpleado", "Nombre", "Email", "Telefono", "Comentarios", "Estado"],
    autoId: true,
  },
  viviendas: {
    table: "Vivienda",
    id: "IdVivienda",
    columns: [
      "IdVivienda",
      "NroVivienda",
      "Telefono",
      "Estado",
      "PorceParti",
      "AreaOcu",
      "AreaTech",
      "Comentario",
      "IdSeccion",
    ],
    autoId: true,
  },
  residentes: {
    table: "Residentes",
    id: "IdResidente",
    columns: ["IdResidente", "Nombre", "Email", "Telefono", "Estado", "IdVivienda"],
    autoId: true,
  },
  vehiculos: {
    table: "Vehiculos",
    id: "IdVehiculo",
    columns: ["IdVehiculo", "NroEstacio", "Placa", "Descripcion", "IdVivienda"],
    autoId: true,
  },
  proveedores: {
    table: "Proveedor",
    id: "IdProveedor",
    columns: [
      "IdProveedor",
      "Descripcion",
      "Nombre",
      "Direccion",
      "Telefono",
      "Email",
      "PaginaWeb",
    ],
    autoId: true,
  },
  anuncios: {
    table: "Anuncios",
    id: "IdAnuncio",
    columns: ["IdAnuncio", "Titulo", "Descripcion", "Fecha", "ImagenUrl"],
    autoId: true,
  },
  cuotas: {
    table: "Cuota",
    id: "IdCuota",
    columns: [
      "IdCuota",
      "FechaEmision",
      "FechaVen",
      "Concepto",
      "Monto",
      "Estado",
      "IdCPresupuestal",
      "IdVivienda",
      "IdTipoFondo",
    ],
    autoId: true,
  },
  ingresos: {
    table: "Ingresos",
    id: "IdIngreso",
    columns: [
      "IdIngreso",
      "Monto",
      "Referencia",
      "FechaRegist",
      "Comentarios",
      "TipoPago",
      "IdTipoFondo",
      "IdVivienda",
    ],
    autoId: true,
  },
  egresos: {
    table: "Egresos",
    id: "IdEgreso",
    columns: ["IdEgreso", "Concepto", "FechaEgreso", "Importe", "FormaPago"],
    autoId: true,
  },
};

app.get("/api/health", (req, res) => {
  res.json({ ok: true });
});

const getNextSeccionId = async () => {
  const [rows] = await db.query(
    "SELECT MAX(CAST(IdSeccion AS UNSIGNED)) AS maxId FROM Seccion"
  );
  const maxId = rows[0]?.maxId ? Number(rows[0].maxId) : 0;
  const next = maxId + 1;
  return String(next).padStart(2, "0");
};

app.get("/api/secciones/next", async (req, res) => {
  try {
    const IdSeccion = await getNextSeccionId();
    return res.json({ IdSeccion });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Error al generar IdSeccion." });
  }
});

app.post("/api/soporte", async (req, res) => {
  const { Nombre, Email, Mensaje } = req.body || {};
  if (!Nombre || !Email || !Mensaje) {
    return res.status(400).json({ message: "Datos incompletos." });
  }
  try {
    const [result] = await db.query(
      "INSERT INTO Soporte_Acceso (Nombre, Email, Mensaje, Fecha) VALUES (?, ?, ?, NOW())",
      [Nombre, Email, Mensaje]
    );
    return res.status(201).json({ id: result.insertId });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Error al registrar soporte." });
  }
});

app.get("/api/soporte", async (req, res) => {
  try {
    const [rows] = await db.query(
      "SELECT IdSoporte, Nombre, Email, Mensaje, Fecha FROM Soporte_Acceso ORDER BY Fecha DESC"
    );
    return res.json(rows);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Error al consultar soporte." });
  }
});

app.post("/api/login", async (req, res) => {
  console.log(req.body)
  const { usuario, password } = req.body || {};
  if (!usuario || !password) {
    return res.status(400).json({ message: "Usuario y contrasena requeridos." });
  }
  try {
    const [rows] = await db.query(
      `SELECT a.id, a.usuario, a.email, a.password, a.rol, a.IdResidente, r.Estado AS ResidenteEstado
       FROM acceder a
       LEFT JOIN Residentes r ON a.IdResidente = r.IdResidente
       WHERE a.usuario = ? OR a.email = ?
       LIMIT 1`,
      [usuario, usuario]
    );
    if (!rows.length) {
      return res.status(401).json({ message: "Credenciales invalidas." });
    }
    const user = rows[0];
    if (user.password !== password) {
      return res.status(401).json({ message: "Credenciales invalidas." });
    }
    if (user.rol === "residente" && user.IdResidente && user.ResidenteEstado === "0") {
      return res.status(403).json({ message: "Cuenta desactivada." });
    }
    return res.json({
      user: {
        id: user.id,
        usuario: user.usuario,
        email: user.email,
        rol: user.rol || "admin",
        idResidente: user.IdResidente || null,
      },
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Error interno." });
  }
});

app.post("/api/register", async (req, res) => {
  const { usuario, email, password, IdResidente } = req.body || {};
  if (!usuario || !email || !password) {
    return res.status(400).json({ message: "Datos incompletos." });
  }
  try {
    const [existing] = await db.query(
      "SELECT id FROM acceder WHERE usuario = ? OR email = ? LIMIT 1",
      [usuario, email]
    );
    if (existing.length) {
      return res.status(409).json({ message: "Usuario o email ya registrado." });
    }
    let residenteId = null;
    if (IdResidente) {
      const parsed = Number(IdResidente);
      if (!Number.isNaN(parsed)) residenteId = parsed;
    }
    if (!residenteId) {
      const [residentRows] = await db.query(
        "SELECT IdResidente FROM Residentes WHERE Email = ? LIMIT 1",
        [email]
      );
      if (residentRows.length) {
        residenteId = residentRows[0].IdResidente;
      }
    }
    if (!residenteId) {
      const [insertRes] = await db.query(
        "INSERT INTO Residentes (Nombre, Email, Telefono, Estado, IdVivienda) VALUES (?, ?, NULL, '1', NULL)",
        [usuario, email]
      );
      residenteId = insertRes.insertId;
    }
    const [result] = await db.query(
      "INSERT INTO acceder (usuario, password, email, rol, IdResidente) VALUES (?, ?, ?, 'residente', ?)",
      [usuario, password, email, residenteId]
    );
    return res.status(201).json({ id: result.insertId });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Error al registrar." });
  }
});

app.get("/api/anuncios", async (req, res) => {
  try {
    const [rows] = await db.query(
      "SELECT IdAnuncio, Titulo, Descripcion, Fecha, ImagenUrl FROM Anuncios ORDER BY Fecha DESC"
    );
    return res.json(rows);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Error al consultar anuncios." });
  }
});

app.post("/api/anuncios", uploadAnuncio.single("imagen"), async (req, res) => {
  const { Titulo, Descripcion, Fecha, ImagenUrl } = req.body || {};
  if (!Titulo) {
    return res.status(400).json({ message: "Titulo requerido." });
  }
  try {
    const imagenFinal = req.file
      ? `/uploads/anuncios/${req.file.filename}`
      : ImagenUrl || null;
    const [result] = await db.query(
      "INSERT INTO Anuncios (Titulo, Descripcion, Fecha, ImagenUrl) VALUES (?, ?, ?, ?)",
      [Titulo, Descripcion || null, Fecha || null, imagenFinal]
    );
    return res.status(201).json({ id: result.insertId });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Error al crear anuncio." });
  }
});

app.put("/api/anuncios/:id", uploadAnuncio.single("imagen"), async (req, res) => {
  const { Titulo, Descripcion, Fecha, ImagenUrl } = req.body || {};
  try {
    let imagenFinal = ImagenUrl || null;
    if (req.file) {
      imagenFinal = `/uploads/anuncios/${req.file.filename}`;
    } else if (!ImagenUrl) {
      const [rows] = await db.query("SELECT ImagenUrl FROM Anuncios WHERE IdAnuncio = ?", [req.params.id]);
      imagenFinal = rows[0]?.ImagenUrl || null;
    }
    await db.query(
      "UPDATE Anuncios SET Titulo = ?, Descripcion = ?, Fecha = ?, ImagenUrl = ? WHERE IdAnuncio = ?",
      [Titulo, Descripcion || null, Fecha || null, imagenFinal, req.params.id]
    );
    return res.json({ ok: true });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Error al actualizar anuncio." });
  }
});

app.delete("/api/anuncios/:id", async (req, res) => {
  try {
    const [rows] = await db.query("SELECT ImagenUrl FROM Anuncios WHERE IdAnuncio = ?", [req.params.id]);
    await db.query("DELETE FROM Anuncios WHERE IdAnuncio = ?", [req.params.id]);
    const imagenUrl = rows[0]?.ImagenUrl;
    if (imagenUrl && imagenUrl.startsWith("/uploads/anuncios/")) {
      const filePath = path.join(__dirname, imagenUrl.replace('/uploads/', 'uploads/'));
      fs.unlink(filePath, () => {});
    }
    return res.json({ ok: true });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Error al eliminar anuncio." });
  }
});


app.get("/api/areas", async (req, res) => {
  try {
    const [rows] = await db.query(
      "SELECT IdArea, Nombre, Descripcion, Capacidad FROM Areas_Comunes ORDER BY Nombre"
    );
    return res.json(rows);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Error al consultar areas." });
  }
});

app.get("/api/notificaciones", async (req, res) => {
  const residenteId = Number(req.query.residenteId);
  if (!residenteId) {
    return res.status(400).json({ message: "residenteId requerido." });
  }
  try {
    const [rows] = await db.query(
      "SELECT IdNotificacion, Mensaje, Fecha, Leido FROM Notificaciones WHERE IdResidente = ? ORDER BY Fecha DESC",
      [residenteId]
    );
    return res.json(rows);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Error al consultar notificaciones." });
  }
});

app.post("/api/pagos", uploadComprobante.single("comprobante"), async (req, res) => {
  const { IdCuota, IdResidente, Monto } = req.body || {};
  if (!IdCuota || !IdResidente || !Monto) {
    return res.status(400).json({ message: "Datos incompletos." });
  }
  try {
    const comprobanteUrl = req.file ? `/uploads/comprobantes/${req.file.filename}` : null;
    const [result] = await db.query(
      "INSERT INTO Pagos (IdCuota, IdResidente, FechaPago, Monto, Estado, ComprobanteUrl) VALUES (?, ?, NOW(), ?, 'En revision', ?)",
      [IdCuota, IdResidente, Monto, comprobanteUrl]
    );
    await db.query("UPDATE Cuota SET Estado = 'En revision' WHERE IdCuota = ?", [IdCuota]);
    return res.status(201).json({ id: result.insertId });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Error al registrar pago." });
  }
});

app.get("/api/pagos", async (req, res) => {
  const residenteId = Number(req.query.residenteId);
  if (!residenteId) {
    return res.status(400).json({ message: "residenteId requerido." });
  }
  try {
    const [rows] = await db.query(
      `SELECT p.IdPago, p.IdCuota, p.FechaPago, p.Monto, p.Estado, p.ComprobanteUrl
       FROM Pagos p
       WHERE p.IdResidente = ?
       ORDER BY p.FechaPago DESC`,
      [residenteId]
    );
    return res.json(rows);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Error al consultar pagos." });
  }
});

app.get("/api/pagos/admin", async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT p.IdPago, p.IdCuota, p.FechaPago, p.Monto, p.Estado, p.ComprobanteUrl,
              r.Nombre AS Residente
       FROM Pagos p
       JOIN Residentes r ON p.IdResidente = r.IdResidente
       ORDER BY p.FechaPago DESC`
    );
    return res.json(rows);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Error al consultar pagos admin." });
  }
});

app.patch("/api/pagos/:id", async (req, res) => {
  const estado = req.body?.Estado;
  if (!estado) {
    return res.status(400).json({ message: "Estado requerido." });
  }
  try {
    const [rows] = await db.query(
      `SELECT p.IdCuota, p.IdResidente FROM Pagos p WHERE p.IdPago = ?`,
      [req.params.id]
    );
    await db.query("UPDATE Pagos SET Estado = ? WHERE IdPago = ?", [
      estado,
      req.params.id,
    ]);
    if (rows.length) {
      const pago = rows[0];
      const mensaje = `Tu pago de la cuota ${pago.IdCuota} fue ${estado}.`;
      await db.query(
        "INSERT INTO Notificaciones (IdResidente, Mensaje, Fecha, Leido) VALUES (?, ?, NOW(), 0)",
        [pago.IdResidente, mensaje]
      );
      if (estado === "Aprobado") {
        await db.query("UPDATE Cuota SET Estado = 'Pagado' WHERE IdCuota = ?", [
          pago.IdCuota,
        ]);
      } else if (estado === "Rechazado") {
        await db.query("UPDATE Cuota SET Estado = 'Pendiente' WHERE IdCuota = ?", [
          pago.IdCuota,
        ]);
      }
    }
    return res.json({ ok: true });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Error al actualizar pago." });
  }
});


app.get("/api/residente/cuotas", async (req, res) => {
  const residenteId = Number(req.query.residenteId);
  const estado = req.query.estado;
  if (!residenteId) {
    return res.status(400).json({ message: "residenteId requerido." });
  }
  try {
    const params = [residenteId];
    let estadoClause = "";
    if (estado) {
      estadoClause = " AND c.Estado = ? ";
      params.push(estado);
    }
    const [rows] = await db.query(
      `SELECT c.IdCuota, c.FechaEmision, c.FechaVen, c.Concepto, c.Monto, c.Estado,
              p.Estado AS EstadoPago, p.ComprobanteUrl
       FROM Cuota c
       JOIN Vivienda v ON c.IdVivienda = v.IdVivienda
       JOIN Residentes r ON r.IdVivienda = v.IdVivienda
       LEFT JOIN (
         SELECT p1.* FROM Pagos p1
         JOIN (SELECT IdCuota, MAX(IdPago) AS IdPago FROM Pagos GROUP BY IdCuota) p2
           ON p1.IdPago = p2.IdPago
       ) p ON p.IdCuota = c.IdCuota AND p.IdResidente = r.IdResidente
       WHERE r.IdResidente = ?
       ${estadoClause}
       ORDER BY c.FechaEmision DESC`,
      params
    );
    return res.json(rows);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Error al consultar cuotas." });
  }
});

app.get("/api/reservas", async (req, res) => {
  const residenteId = Number(req.query.residenteId);
  if (!residenteId) {
    return res.status(400).json({ message: "residenteId requerido." });
  }
  try {
    const [rows] = await db.query(
      `SELECT r.IdReserva, r.Fecha, r.HoraInicio, r.HoraFin, r.Estado,
              a.Nombre AS Area
       FROM Reservas r
       JOIN Areas_Comunes a ON r.IdArea = a.IdArea
       WHERE r.IdResidente = ?
       ORDER BY r.Fecha DESC, r.HoraInicio DESC`,
      [residenteId]
    );
    return res.json(rows);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Error al consultar reservas." });
  }
});

app.get("/api/reservas/admin", async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT r.IdReserva, r.Fecha, r.HoraInicio, r.HoraFin, r.Estado,
              a.Nombre AS Area,
              res.Nombre AS Residente
       FROM Reservas r
       JOIN Areas_Comunes a ON r.IdArea = a.IdArea
       JOIN Residentes res ON r.IdResidente = res.IdResidente
       ORDER BY r.Fecha DESC, r.HoraInicio DESC`
    );
    return res.json(rows);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Error al consultar reservas." });
  }
});

app.post("/api/reservas", async (req, res) => {
  const { IdResidente, IdArea, Fecha, HoraInicio, HoraFin } = req.body || {};
  if (!IdResidente || !IdArea || !Fecha || !HoraInicio || !HoraFin) {
    return res.status(400).json({ message: "Datos incompletos." });
  }
  try {
    const [result] = await db.query(
      `INSERT INTO Reservas (IdResidente, IdArea, Fecha, HoraInicio, HoraFin, Estado)
       VALUES (?, ?, ?, ?, ?, 'Pendiente')`,
      [IdResidente, IdArea, Fecha, HoraInicio, HoraFin]
    );
    return res.status(201).json({ id: result.insertId });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Error al registrar reserva." });
  }
});

app.patch("/api/reservas/:id", async (req, res) => {
  const estado = req.body?.Estado;
  if (!estado) {
    return res.status(400).json({ message: "Estado requerido." });
  }
  try {
    await db.query("UPDATE Reservas SET Estado = ? WHERE IdReserva = ?", [
      estado,
      req.params.id,
    ]);
    const [rows] = await db.query(
      `SELECT r.IdResidente, r.Fecha, r.HoraInicio, r.HoraFin, a.Nombre AS Area
       FROM Reservas r
       JOIN Areas_Comunes a ON r.IdArea = a.IdArea
       WHERE r.IdReserva = ?`,
      [req.params.id]
    );
    if (rows.length) {
      const info = rows[0];
      const mensaje = `Tu reserva de ${info.Area} (${info.Fecha} ${info.HoraInicio}-${info.HoraFin}) fue ${estado}.`;
      await db.query("INSERT INTO Notificaciones (IdResidente, Mensaje, Fecha, Leido) VALUES (?, ?, NOW(), 0)", [
        info.IdResidente,
        mensaje,
      ]);
    }
    return res.json({ ok: true });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Error al actualizar reserva." });
  }
});

const getResource = (name) => resources[name];

app.post("/api/reclamos", async (req, res) => {
  const { IdResidente, Tipo, Asunto, Descripcion, FechaEstimada } =
    req.body || {};
  if (!IdResidente || !Tipo || !Asunto || !Descripcion) {
    return res.status(400).json({ message: "Datos incompletos." });
  }
  try {
    const [result] = await db.query(
      "INSERT INTO Reclamos (IdResidente, Tipo, Asunto, Descripcion, Estado, FechaRegistro, FechaEstimada) VALUES (?, ?, ?, ?, 'Pendiente', NOW(), ?)",
      [IdResidente, Tipo, Asunto, Descripcion, FechaEstimada || null]
    );
    return res.status(201).json({ id: result.insertId });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Error al registrar reclamo." });
  }
});

app.get("/api/reclamos", async (req, res) => {
  const residenteId = Number(req.query.residenteId);
  if (!residenteId) {
    return res.status(400).json({ message: "residenteId requerido." });
  }
  try {
    const [rows] = await db.query(
      `SELECT IdReclamo, Tipo, Asunto, Descripcion, Estado, Respuesta, FechaEstimada, FechaRegistro, FechaRespuesta
       FROM Reclamos WHERE IdResidente = ? ORDER BY FechaRegistro DESC`,
      [residenteId]
    );
    return res.json(rows);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Error al consultar reclamos." });
  }
});

app.get("/api/reclamos/admin", async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT r.IdReclamo, r.Tipo, r.Asunto, r.Descripcion, r.Estado, r.Respuesta, r.FechaEstimada, r.FechaRegistro, r.FechaRespuesta,
              res.Nombre AS Residente
       FROM Reclamos r
       JOIN Residentes res ON r.IdResidente = res.IdResidente
       ORDER BY r.FechaRegistro DESC`
    );
    return res.json(rows);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Error al consultar reclamos admin." });
  }
});

app.patch("/api/reclamos/:id", async (req, res) => {
  const { Estado, Respuesta, FechaEstimada } = req.body || {};
  if (!Estado || !Respuesta) {
    return res.status(400).json({ message: "Estado y respuesta requeridos." });
  }
  try {
    const [rows] = await db.query(
      `SELECT IdResidente FROM Reclamos WHERE IdReclamo = ?`,
      [req.params.id]
    );
    await db.query(
      "UPDATE Reclamos SET Estado = ?, Respuesta = ?, FechaEstimada = ?, FechaRespuesta = NOW() WHERE IdReclamo = ?",
      [Estado, Respuesta, FechaEstimada || null, req.params.id]
    );
    if (rows.length) {
      const mensaje = `Tu reclamo #${req.params.id} fue respondido: ${Respuesta}`;
      await db.query("INSERT INTO Notificaciones (IdResidente, Mensaje, Fecha, Leido) VALUES (?, ?, NOW(), 0)", [
        rows[0].IdResidente,
        mensaje,
      ]);
    }
    return res.json({ ok: true });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Error al responder reclamo." });
  }
});

app.get("/api/viviendas/:id/resumen", async (req, res) => {
  const id = Number(req.params.id);
  if (!id) {
    return res.status(400).json({ message: "Id vivienda requerido." });
  }
  try {
    const [totalRows] = await db.query(
      `SELECT 
         IFNULL(SUM(CASE WHEN Estado IN ('Pendiente', 'En revision') THEN Monto ELSE 0 END), 0) AS totalDeuda
       FROM Cuota
       WHERE IdVivienda = ?`,
      [id]
    );
    const [lastRows] = await db.query(
      `SELECT Monto, FechaEmision
       FROM Cuota
       WHERE IdVivienda = ?
       ORDER BY FechaEmision DESC
       LIMIT 1`,
      [id]
    );
    return res.json({
      totalDeuda: totalRows[0]?.totalDeuda || 0,
      ultimaCuota: lastRows[0]?.Monto || 0,
      ultimaFecha: lastRows[0]?.FechaEmision || null,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Error al consultar vivienda." });
  }
});

app.get("/api/:resource", async (req, res) => {
  const resource = getResource(req.params.resource);
  if (!resource) return res.status(404).json({ message: "Recurso no valido." });
  try {
    const sql = `SELECT ${resource.columns.join(", ")} FROM ${resource.table} ORDER BY ${resource.id}`;
    const [rows] = await db.query(sql);
    return res.json(rows);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Error al consultar." });
  }
});

app.post("/api/:resource", async (req, res) => {
  const resource = getResource(req.params.resource);
  if (!resource) return res.status(404).json({ message: "Recurso no valido." });

  const payload = req.body || {};
  if (
    req.params.resource === "secciones" &&
    (payload.IdSeccion === undefined || payload.IdSeccion === "")
  ) {
    try {
      payload.IdSeccion = await getNextSeccionId();
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: "Error al generar IdSeccion." });
    }
  }
  const columns = resource.columns.filter((col) => {
    if (col === resource.id && resource.autoId && payload[col] === undefined) {
      return false;
    }
    return payload[col] !== undefined;
  });

  if (columns.length === 0) {
    return res.status(400).json({ message: "Datos insuficientes." });
  }

  const values = columns.map((col) => payload[col]);
  const placeholders = columns.map(() => "?").join(", ");
  const sql = `INSERT INTO ${resource.table} (${columns.join(", ")}) VALUES (${placeholders})`;

  try {
    const [result] = await db.query(sql, values);
    return res.status(201).json({ id: result.insertId || payload[resource.id] });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Error al guardar." });
  }
});

app.put("/api/:resource/:id", async (req, res) => {
  const resource = getResource(req.params.resource);
  if (!resource) return res.status(404).json({ message: "Recurso no valido." });

  const payload = req.body || {};
  const columns = resource.columns.filter(
    (col) => col !== resource.id && payload[col] !== undefined
  );

  if (columns.length === 0) {
    return res.status(400).json({ message: "Nada para actualizar." });
  }

  const setClause = columns.map((col) => `${col} = ?`).join(", ");
  const values = columns.map((col) => payload[col]);
  values.push(req.params.id);

  const sql = `UPDATE ${resource.table} SET ${setClause} WHERE ${resource.id} = ?`;

  try {
    await db.query(sql, values);
    return res.json({ ok: true });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Error al actualizar." });
  }
});

app.delete("/api/:resource/:id", async (req, res) => {
  const resource = getResource(req.params.resource);
  if (!resource) return res.status(404).json({ message: "Recurso no valido." });
  try {
    if (req.params.resource === "residentes") {
      await db.query(
        "UPDATE Residentes SET Estado = '0' WHERE IdResidente = ?",
        [req.params.id]
      );
      return res.json({ ok: true, softDeleted: true });
    }
    await db.query(
      `DELETE FROM ${resource.table} WHERE ${resource.id} = ?`,
      [req.params.id]
    );
    return res.json({ ok: true });
  } catch (error) {
    console.error(error);
    if (error.code === "ER_ROW_IS_REFERENCED_2") {
      return res.status(409).json({
        message: "No se puede eliminar porque tiene registros relacionados.",
      });
    }
    return res.status(500).json({ message: "Error al eliminar." });
  }
});

app.listen(PORT, () => {
  console.log(`Servidor listo en http://localhost:${PORT}`);
});
