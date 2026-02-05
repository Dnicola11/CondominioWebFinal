import http from 'k6/http';
import { check } from 'k6';
import { sleep } from 'k6';

export let options = {
  stages: [
    { duration: '1m', target: 100 },  // Subir a 100 usuarios en 1 minuto
    { duration: '2m', target: 100 },  // Mantener 100 usuarios por 2 minutos
    { duration: '1m', target: 0 },    // Bajar a 0 usuarios en 1 minuto
  ],
};

export default function () {
  const res = http.post('http://localhost:3000/api/login', JSON.stringify({
    usuario: 'admin',  // Debes usar el usuario correcto
    password: 'admin123',  // Debes usar la contraseña correcta
  }), {
    headers: { 'Content-Type': 'application/json' },
  });

  // Comprobamos que la respuesta sea 200 OK
  check(res, {
    'is status 200': (r) => r.status === 200,
  });

  sleep(1);  // Pausa entre solicitudes
}
