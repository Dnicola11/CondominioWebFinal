SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0;
SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0;

DROP DATABASE IF EXISTS Condominio;
CREATE DATABASE Condominio CHARACTER SET utf8mb4 COLLATE utf8mb4_spanish_ci;
USE Condominio;

CREATE TABLE acceder (
  id INT NOT NULL AUTO_INCREMENT,
  usuario VARCHAR(20) NOT NULL,
  password VARCHAR(255) NOT NULL,
  email VARCHAR(150) DEFAULT NULL,
  rol VARCHAR(20) NOT NULL DEFAULT 'residente',
  IdResidente INT DEFAULT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_acceder_usuario (usuario),
  UNIQUE KEY uq_acceder_email (email),
  KEY idx_acceder_residente (IdResidente)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_spanish_ci;

CREATE TABLE Perfil (
  IdPerfil CHAR(2) NOT NULL,
  Descripcion VARCHAR(100) NOT NULL,
  PRIMARY KEY (IdPerfil)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_spanish_ci;

CREATE TABLE Seccion (
  IdSeccion CHAR(2) NOT NULL,
  Descripcion VARCHAR(50) NOT NULL,
  PRIMARY KEY (IdSeccion)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_spanish_ci;

CREATE TABLE Pais (
  IdPais CHAR(2) NOT NULL,
  Descripcion VARCHAR(100) NOT NULL,
  PRIMARY KEY (IdPais)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_spanish_ci;

CREATE TABLE Tipo_Fondo (
  IdTipoFondo CHAR(2) NOT NULL,
  Descripcion VARCHAR(100) NOT NULL,
  PRIMARY KEY (IdTipoFondo)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_spanish_ci;

CREATE TABLE Clase_Presupuestal (
  IdCPresupuestal CHAR(2) NOT NULL,
  Descripcion VARCHAR(100) NOT NULL,
  TipoClasePre CHAR(1) NOT NULL,
  PRIMARY KEY (IdCPresupuestal)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_spanish_ci;

CREATE TABLE Tipo_Egreso (
  IdTipoEgreso CHAR(2) NOT NULL,
  Descripcion VARCHAR(80) NOT NULL,
  PRIMARY KEY (IdTipoEgreso)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_spanish_ci;

CREATE TABLE Empleados (
  IdEmpleado INT NOT NULL AUTO_INCREMENT,
  Nombre VARCHAR(150) NOT NULL,
  Email VARCHAR(150),
  Telefono VARCHAR(12),
  Comentarios VARCHAR(150),
  Estado CHAR(1),
  PRIMARY KEY (IdEmpleado)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_spanish_ci;

CREATE TABLE Edificio (
  IdEdificio INT NOT NULL AUTO_INCREMENT,
  Nombre VARCHAR(100),
  Email VARCHAR(150),
  Clave VARCHAR(20),
  Telefono VARCHAR(12),
  Direccion VARCHAR(150),
  Ciudad VARCHAR(50),
  CodigoPostal CHAR(8),
  IdPais CHAR(2),
  PRIMARY KEY (IdEdificio),
  KEY idx_edificio_pais (IdPais),
  CONSTRAINT fk_edificio_pais FOREIGN KEY (IdPais) REFERENCES Pais (IdPais)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_spanish_ci;

CREATE TABLE Vivienda (
  IdVivienda INT NOT NULL AUTO_INCREMENT,
  NroVivienda INT,
  Telefono VARCHAR(12),
  Estado CHAR(1),
  PorceParti DECIMAL(18,2),
  AreaOcu DECIMAL(18,2),
  AreaTech DECIMAL(18,2),
  Comentario VARCHAR(150),
  IdSeccion CHAR(2),
  PRIMARY KEY (IdVivienda),
  KEY idx_vivienda_seccion (IdSeccion),
  CONSTRAINT fk_vivienda_seccion FOREIGN KEY (IdSeccion) REFERENCES Seccion (IdSeccion)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_spanish_ci;

CREATE TABLE Residentes (
  IdResidente INT NOT NULL AUTO_INCREMENT,
  Nombre VARCHAR(150),
  Email VARCHAR(200),
  Telefono VARCHAR(12),
  Estado CHAR(1),
  IdVivienda INT,
  PRIMARY KEY (IdResidente),
  KEY idx_residentes_vivienda (IdVivienda),
  CONSTRAINT fk_residentes_vivienda FOREIGN KEY (IdVivienda) REFERENCES Vivienda (IdVivienda)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_spanish_ci;

ALTER TABLE acceder
  ADD CONSTRAINT fk_acceder_residente
  FOREIGN KEY (IdResidente) REFERENCES Residentes (IdResidente);

CREATE TABLE Vehiculos (
  IdVehiculo INT NOT NULL AUTO_INCREMENT,
  NroEstacio INT,
  Placa VARCHAR(8),
  Descripcion VARCHAR(100),
  IdVivienda INT,
  PRIMARY KEY (IdVehiculo),
  KEY idx_vehiculos_vivienda (IdVivienda),
  CONSTRAINT fk_vehiculos_vivienda FOREIGN KEY (IdVivienda) REFERENCES Vivienda (IdVivienda)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_spanish_ci;

CREATE TABLE Proveedor (
  IdProveedor INT NOT NULL AUTO_INCREMENT,
  Descripcion VARCHAR(150),
  Nombre VARCHAR(150),
  Direccion VARCHAR(200),
  Telefono VARCHAR(12),
  Email VARCHAR(150),
  PaginaWeb VARCHAR(100),
  PRIMARY KEY (IdProveedor)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_spanish_ci;

CREATE TABLE Anuncios (
  IdAnuncio INT NOT NULL AUTO_INCREMENT,
  Titulo VARCHAR(150) NOT NULL,
  Descripcion TEXT,
  Fecha DATE,
  ImagenUrl VARCHAR(200),
  PRIMARY KEY (IdAnuncio)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_spanish_ci;

CREATE TABLE Areas_Comunes (
  IdArea INT NOT NULL AUTO_INCREMENT,
  Nombre VARCHAR(100) NOT NULL,
  Descripcion VARCHAR(200),
  Capacidad INT,
  PRIMARY KEY (IdArea)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_spanish_ci;

CREATE TABLE Reservas (
  IdReserva INT NOT NULL AUTO_INCREMENT,
  IdResidente INT NOT NULL,
  IdArea INT NOT NULL,
  Fecha DATE NOT NULL,
  HoraInicio TIME NOT NULL,
  HoraFin TIME NOT NULL,
  Estado VARCHAR(20) NOT NULL DEFAULT 'Pendiente',
  PRIMARY KEY (IdReserva),
  KEY idx_reservas_residente (IdResidente),
  KEY idx_reservas_area (IdArea),
  CONSTRAINT fk_reservas_residente FOREIGN KEY (IdResidente) REFERENCES Residentes (IdResidente),
  CONSTRAINT fk_reservas_area FOREIGN KEY (IdArea) REFERENCES Areas_Comunes (IdArea)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_spanish_ci;

CREATE TABLE Notificaciones (
  IdNotificacion INT NOT NULL AUTO_INCREMENT,
  IdResidente INT NOT NULL,
  Mensaje VARCHAR(255) NOT NULL,
  Fecha DATETIME NOT NULL,
  Leido TINYINT(1) NOT NULL DEFAULT 0,
  PRIMARY KEY (IdNotificacion),
  KEY idx_notif_residente (IdResidente),
  CONSTRAINT fk_notif_residente FOREIGN KEY (IdResidente) REFERENCES Residentes (IdResidente)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_spanish_ci;

CREATE TABLE Pagos (
  IdPago INT NOT NULL AUTO_INCREMENT,
  IdCuota INT NOT NULL,
  IdResidente INT NOT NULL,
  FechaPago DATETIME NOT NULL,
  Monto DECIMAL(18,2) NOT NULL,
  Estado VARCHAR(20) NOT NULL DEFAULT 'En revision',
  ComprobanteUrl VARCHAR(200),
  PRIMARY KEY (IdPago),
  KEY idx_pagos_cuota (IdCuota),
  KEY idx_pagos_residente (IdResidente),
  CONSTRAINT fk_pagos_cuota FOREIGN KEY (IdCuota) REFERENCES Cuota (IdCuota),
  CONSTRAINT fk_pagos_residente FOREIGN KEY (IdResidente) REFERENCES Residentes (IdResidente)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_spanish_ci;

CREATE TABLE Perfil_Residente (
  IdPerfil CHAR(2) NOT NULL,
  IdResidente INT NOT NULL,
  Comentarios VARCHAR(100),
  PRIMARY KEY (IdPerfil, IdResidente),
  KEY idx_perf_residente (IdResidente),
  CONSTRAINT fk_perf_residente_perfil FOREIGN KEY (IdPerfil) REFERENCES Perfil (IdPerfil),
  CONSTRAINT fk_perf_residente_residente FOREIGN KEY (IdResidente) REFERENCES Residentes (IdResidente)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_spanish_ci;

CREATE TABLE Ingresos (
  IdIngreso INT NOT NULL AUTO_INCREMENT,
  Monto DECIMAL(18,2),
  Referencia VARCHAR(50),
  FechaRegist DATE,
  Comentarios VARCHAR(200),
  TipoPago VARCHAR(50),
  IdTipoFondo CHAR(2),
  IdVivienda INT,
  PRIMARY KEY (IdIngreso),
  KEY idx_ingresos_tipofondo (IdTipoFondo),
  KEY idx_ingresos_vivienda (IdVivienda),
  CONSTRAINT fk_ingresos_tipofondo FOREIGN KEY (IdTipoFondo) REFERENCES Tipo_Fondo (IdTipoFondo),
  CONSTRAINT fk_ingresos_vivienda FOREIGN KEY (IdVivienda) REFERENCES Vivienda (IdVivienda)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_spanish_ci;

CREATE TABLE CtaBancaria (
  IdCtaBanca CHAR(2) NOT NULL,
  Nombre VARCHAR(50),
  NroCuenta VARCHAR(20),
  SaldoIni INT,
  FechaSaldoI DATE,
  IdTipoFondo CHAR(2),
  IdTipoEgreso CHAR(2),
  PRIMARY KEY (IdCtaBanca),
  KEY idx_cta_tipofondo (IdTipoFondo),
  KEY idx_cta_tipoegreso (IdTipoEgreso),
  CONSTRAINT fk_cta_tipofondo FOREIGN KEY (IdTipoFondo) REFERENCES Tipo_Fondo (IdTipoFondo),
  CONSTRAINT fk_cta_tipoegreso FOREIGN KEY (IdTipoEgreso) REFERENCES Tipo_Egreso (IdTipoEgreso)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_spanish_ci;

CREATE TABLE Egresos (
  IdEgreso INT NOT NULL AUTO_INCREMENT,
  Concepto VARCHAR(150),
  FechaEgreso DATE,
  Importe DECIMAL(18,2),
  FormaPago VARCHAR(60),
  PRIMARY KEY (IdEgreso)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_spanish_ci;

CREATE TABLE Cuota (
  IdCuota INT NOT NULL AUTO_INCREMENT,
  FechaEmision DATE,
  FechaVen DATE,
  Concepto VARCHAR(150),
  Monto DECIMAL(18,2),
  Estado VARCHAR(15),
  IdCPresupuestal CHAR(2),
  IdVivienda INT,
  IdTipoFondo CHAR(2),
  PRIMARY KEY (IdCuota),
  KEY idx_cuota_clase (IdCPresupuestal),
  KEY idx_cuota_vivienda (IdVivienda),
  KEY idx_cuota_tipofondo (IdTipoFondo),
  CONSTRAINT fk_cuota_clase FOREIGN KEY (IdCPresupuestal) REFERENCES Clase_Presupuestal (IdCPresupuestal),
  CONSTRAINT fk_cuota_vivienda FOREIGN KEY (IdVivienda) REFERENCES Vivienda (IdVivienda),
  CONSTRAINT fk_cuota_tipofondo FOREIGN KEY (IdTipoFondo) REFERENCES Tipo_Fondo (IdTipoFondo)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_spanish_ci;

INSERT INTO acceder (id, usuario, password, email, rol)
VALUES (1, 'samantha', '123', 'sam@gmail.com', 'admin');

INSERT INTO Tipo_Fondo VALUES ('01', 'Fondo Ordinario');
INSERT INTO Tipo_Fondo VALUES ('02', 'Fondo Extraordinario');
INSERT INTO Tipo_Fondo VALUES ('03', 'Fondo Reserva');

INSERT INTO Clase_Presupuestal VALUES ('01', 'Cuotas de Mantenimiento', 'i');
INSERT INTO Clase_Presupuestal VALUES ('02', 'Consumo de Gas', 'i');
INSERT INTO Clase_Presupuestal VALUES ('03', 'Consumo de Agua', 'i');
INSERT INTO Clase_Presupuestal VALUES ('04', 'Estacionamiento', 'i');
INSERT INTO Clase_Presupuestal VALUES ('05', 'Ingreso de Terceros', 'i');
INSERT INTO Clase_Presupuestal VALUES ('06', 'Intereses Bancarios', 'i');
INSERT INTO Clase_Presupuestal VALUES ('07', '', 'e');

INSERT INTO Seccion VALUES ('01', 'Torre A');
INSERT INTO Seccion VALUES ('02', 'Torre B');
INSERT INTO Seccion VALUES ('03', 'Torre C');

INSERT INTO Vivienda
  (IdVivienda, NroVivienda, Telefono, Estado, PorceParti, AreaOcu, AreaTech, Comentario, IdSeccion)
VALUES
  (1, 101, '987362356', 'O', 1.79, 65.42, 65.42, 'aaaaaaaaaaa', '01'),
  (2, 201, '987547865', '1', 2.55, 45.24, 45.24, 'debe', '01'),
  (3, 105, '952344751', '1', 1.54, 74.15, 74.15, 'cancelo', '02'),
  (4, 102, '966475229', '1', 1.68, 24.55, 24.55, 'debe', '03'),
  (5, 205, '945733551', 'O', 2.15, 48.25, 48.25, 'aaaaaaaaaaa', '03');

INSERT INTO Residentes VALUES
  (1, 'Edwin Vargas Llamosas', 'evargaslla@gmail.com', '986741139', '1', 1),
  (2, 'Jean Pierre Taipe', 'jtaipe@gmail.com', '99567718', '0', 1),
  (3, 'Merlhy Marquina Zevallos', 'mmarquina@gmail.com', '679845128', '1', 2),
  (4, 'Melissa Loconi Flores', 'mloconi@gmail.com', '679845128', '0', 2),
  (5, 'David Nicola Tenorio', 'dnicola@gmail.com', '679845128', '1', 3),
  (6, 'Luis Luna Vaasquez', 'lluna@gmail.com', '679845128', '0', 3);

INSERT INTO Vehiculos VALUES
  (11, 17, 'A1A-602', 'Toyota', 1),
  (12, 18, 'N1A-603', 'Audi', 1),
  (13, 19, 'A1A-602', 'Bugatti', 2),
  (14, 18, 'N1A-606', 'Cadillac', 2),
  (15, 19, 'A1A-608', 'Bentley', 3);

INSERT INTO Proveedor VALUES
  (1, 'Sedapal', 'Juan Bedoya', 'Av.Arenales', '986741139', 'sedapal@gmail.com', 'www.sedapal.com'),
  (2, 'Luz del Sur', 'Brayan Rocarey', 'Av.Arequipa 2098', '962230682', 'luzdelsur@gmail.com', 'www.luzdelsur.com'),
  (3, 'Mantenimiento S.A.C', 'Carlos Quispe', 'Av.Ontario', '654821114', 'mtto@gmail.com', 'www.mtto.com');

INSERT INTO Anuncios (Titulo, Descripcion, Fecha, ImagenUrl) VALUES
  ('Reunion de Junta', 'Se convoca a reunion extraordinaria este viernes a las 7pm.', '2017-06-12', NULL),
  ('Mantenimiento ascensor', 'El ascensor estara en mantenimiento el sabado por la manana.', '2017-06-10', NULL);

INSERT INTO Areas_Comunes (Nombre, Descripcion, Capacidad) VALUES
  ('Salon Comunal', 'Espacio para reuniones y eventos', 40),
  ('Piscina', 'Piscina principal del condominio', 25),
  ('Gimnasio', 'Equipos de cardio y pesas', 15);

INSERT INTO Empleados VALUES
  (1, 'Anais Fernades Rojas', 'afernandes@gmail.com', '9448514784', 'Limpieza', 'A'),
  (2, 'Felipe Sanchez Chancan', 'fsanchez@gmail.com', '9665422896', 'Porteria', 'I'),
  (3, 'Cristian Ordoñes Iparraguirre', 'cordoñes@gmail.com', '945516734', 'Porteria', 'A'),
  (4, 'Alejandra Castro Cueva', 'acastro@gmail.com', '997889223', 'Limpieza', 'A');

INSERT INTO Cuota
  (IdCuota, FechaEmision, FechaVen, Concepto, Monto, Estado, IdCPresupuestal, IdVivienda, IdTipoFondo)
VALUES
  (1, '2017-06-15', '2017-06-30', 'Mantenimiento Junio', 152.30, 'Pendiente', '01', 1, '01');

INSERT INTO Edificio (IdEdificio, IdPais, Nombre, Email, Clave, Telefono)
VALUES (1, '01', 'Administrador 1', 'adm@gmail.com', 'polo123', '2555555');

-- CONSULTAS DE EJEMPLO (OPCIONAL)
-- SELECT * FROM Empleados;
-- SELECT * FROM Seccion WHERE IdSeccion = IF('01' = '', IdSeccion, '01');
-- SELECT IFNULL(MAX(IdCuota), 0) + 1 AS newcod FROM Cuota;
-- SELECT clave FROM Edificio WHERE email = 'adm@gmail.com';
-- SELECT v.IdVivienda, CONCAT(SUBSTRING(s.Descripcion, -1), v.NroVivienda) AS sv
-- FROM Vivienda v
-- JOIN Seccion s ON v.IdSeccion = s.IdSeccion
-- ORDER BY sv;

SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS;
SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS;
