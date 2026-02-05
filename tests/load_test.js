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
  let res = http.post('http://localhost:3000/api/login', {
    username: 'testuser',
    password: 'testpassword',
  });

  check(res, {
    'is status 200': (r) => r.status === 200,
  });

  sleep(1); // Pausa de 1 segundo entre solicitudes
}
