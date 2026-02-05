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
  const res = http.post('http://localhost:3000/api/login', JSON.stringify({
    usuario: 'admin', 
    password: 'admin123',
  }), {
    headers: { 'Content-Type': 'application/json' },
  });

  // Comprobamos que la respuesta sea 200 OK
  check(res, {
    'is status 200': (r) => r.status === 200,
  });

  sleep(1); 
}
