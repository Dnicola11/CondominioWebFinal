import http from 'k6/http';
import { check } from 'k6';
import { sleep } from 'k6';

// Configuración de los usuarios virtuales
export let options = {
  stages: [
    { duration: '1m', target: 100 },
    { duration: '2m', target: 100 },
    { duration: '1m', target: 0 },
  ],
};

// Definir las solicitudes HTTP que se simularán
export default function () {
  let res = http.post('http://localhost:3000/login.html', {
    username: 'admin',
    password: 'admin123',
  });

  // Verificar que la respuesta sea exitosa (status 200)
  check(res, {
    'is status 200': (r) => r.status === 200,
  });

  sleep(1); // Pausa de 1 segundo entre solicitudes
}
