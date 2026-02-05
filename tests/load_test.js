import http from 'k6/http';
import { check } from 'k6';
import { sleep } from 'k6';

export let options = {
  stages: [
    { duration: '1m', target: 100 },
    { duration: '2m', target: 100 },
    { duration: '1m', target: 0 },
  ],
};

export default function () {
  // Solicitud POST al endpoint de login
  let res = http.post('http://localhost:3000/api/login', {
    usuario: 'admin',  // Usuario validado
    password: 'admin123',  // Contraseña validada
  });

  // Verificar que la respuesta sea exitosa (status 200)
  check(res, {
    'is status 200': (r) => r.status === 200,
  });

  sleep(1);  // Pausa entre solicitudes
}
