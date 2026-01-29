USE Condominio;

CREATE TABLE IF NOT EXISTS Reclamos (
  IdReclamo INT NOT NULL AUTO_INCREMENT,
  IdResidente INT NOT NULL,
  Tipo VARCHAR(30) NOT NULL,
  Asunto VARCHAR(120) NOT NULL,
  Descripcion TEXT NOT NULL,
  Estado VARCHAR(20) NOT NULL DEFAULT 'Pendiente',
  Respuesta TEXT,
  FechaEstimada DATE NULL,
  FechaRegistro DATETIME NOT NULL,
  FechaRespuesta DATETIME NULL,
  PRIMARY KEY (IdReclamo),
  KEY idx_reclamos_residente (IdResidente),
  CONSTRAINT fk_reclamos_residente FOREIGN KEY (IdResidente) REFERENCES Residentes (IdResidente)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_spanish_ci;

-- Si la tabla ya existe, agrega la columna FechaEstimada
ALTER TABLE Reclamos ADD COLUMN FechaEstimada DATE NULL;
