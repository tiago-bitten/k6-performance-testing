import { htmlReport } from 'https://raw.githubusercontent.com/benc-uk/k6-reporter/latest/dist/bundle.js';
import { textSummary } from 'https://jslib.k6.io/k6-summary/0.0.1/index.js';
import http from 'k6/http';
import { check } from 'k6';
import { Trend, Rate } from 'k6/metrics';

export const getCatFactDuration = new Trend('get_cat_fact', true);
export const RateContentOK = new Rate('content_OK');

export const options = {
  thresholds: {
    http_req_failed: ['rate<0.25'],        
    get_cat_fact: ['p(90)<6800'],       
    content_OK: ['rate>0.75']          
  },

  stages: [
    { duration: '30s', target: 7 },    
    { duration: '90s', target: 92 },   
    { duration: '90s', target: 92 },    
  ]
};

export function handleSummary(data) {
  return {
    './src/output/index.html': htmlReport(data),
    stdout: textSummary(data, { indent: ' ', enableColors: true }),
  };
}

export default function () {
  const baseUrl = 'https://catfact.ninja/fact';

  const params = {
    headers: {
      'Content-Type': 'application/json',
    },
  };

  const res = http.get(baseUrl, params);

  getCatFactDuration.add(res.timings.duration);
  RateContentOK.add(res.status === 200);

  check(res, {
    'GET CatFact - Status 200': () => res.status === 200,
    'Response has "fact" field': () => {
      try {
        const body = JSON.parse(res.body);
        return body.fact !== undefined;
      } catch {
        return false;
      }
    }
  });
}
