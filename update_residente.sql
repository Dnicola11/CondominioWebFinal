USE Condominio;

ALTER TABLE acceder
  ADD COLUMN rol VARCHAR(20) NOT NULL DEFAULT 'residente',
  ADD COLUMN IdResidente INT NULL,
  ADD KEY idx_acceder_residente (IdResidente);

UPDATE acceder SET rol = 'admin' WHERE usuario = 'samantha';

CREATE TABLE IF NOT EXISTS Anuncios (
  IdAnuncio INT NOT NULL AUTO_INCREMENT,
  Titulo VARCHAR(150) NOT NULL,
  Descripcion TEXT,
  Fecha DATE,
  ImagenUrl VARCHAR(200),
  PRIMARY KEY (IdAnuncio)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_spanish_ci;

CREATE TABLE IF NOT EXISTS Areas_Comunes (
  IdArea INT NOT NULL AUTO_INCREMENT,
  Nombre VARCHAR(100) NOT NULL,
  Descripcion VARCHAR(200),
  Capacidad INT,
  PRIMARY KEY (IdArea)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_spanish_ci;

CREATE TABLE IF NOT EXISTS Reservas (
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

ALTER TABLE acceder
  ADD CONSTRAINT fk_acceder_residente
  FOREIGN KEY (IdResidente) REFERENCES Residentes (IdResidente);

INSERT INTO Anuncios (IdAnuncio, Titulo, Descripcion, Fecha, ImagenUrl)
VALUES
  (1, 'Reunion de Junta', 'Se convoca a reunion extraordinaria este viernes a las 7pm.', '2017-06-12', NULL),
  (2, 'Mantenimiento ascensor', 'El ascensor estara en mantenimiento el sabado por la manana.', '2017-06-10', NULL)
ON DUPLICATE KEY UPDATE Titulo = VALUES(Titulo);

INSERT INTO Areas_Comunes (IdArea, Nombre, Descripcion, Capacidad)
VALUES
  (1, 'Salon Comunal', 'Espacio para reuniones y eventos', 40),
  (2, 'Piscina', 'Piscina principal del condominio', 25),
  (3, 'Gimnasio', 'Equipos de cardio y pesas', 15)
ON DUPLICATE KEY UPDATE Nombre = VALUES(Nombre);
