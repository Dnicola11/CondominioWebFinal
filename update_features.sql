USE Condominio;

CREATE TABLE IF NOT EXISTS Notificaciones (
  IdNotificacion INT NOT NULL AUTO_INCREMENT,
  IdResidente INT NOT NULL,
  Mensaje VARCHAR(255) NOT NULL,
  Fecha DATETIME NOT NULL,
  Leido TINYINT(1) NOT NULL DEFAULT 0,
  PRIMARY KEY (IdNotificacion),
  KEY idx_notif_residente (IdResidente),
  CONSTRAINT fk_notif_residente FOREIGN KEY (IdResidente) REFERENCES Residentes (IdResidente)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_spanish_ci;

CREATE TABLE IF NOT EXISTS Pagos (
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
