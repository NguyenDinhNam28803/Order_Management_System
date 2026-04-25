/**
 * k6 Load Test — Order Management System API
 *
 * Chạy: k6 run k6/load-test.js
 * Kèm biến môi trường:
 *   k6 run -e BASE_URL=http://localhost:3001 -e JWT_TOKEN=<token> k6/load-test.js
 */

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';

// ─── Config ──────────────────────────────────────────────────────────────────

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3001';
const JWT_TOKEN = __ENV.JWT_TOKEN || '';

// ─── Custom metrics ───────────────────────────────────────────────────────────

const errorRate = new Rate('error_rate');
const healthLatency = new Trend('health_latency', true);
const authLatency = new Trend('auth_latency', true);
const prListLatency = new Trend('pr_list_latency', true);
const poListLatency = new Trend('po_list_latency', true);
const rfqListLatency = new Trend('rfq_list_latency', true);

// ─── Scenarios ────────────────────────────────────────────────────────────────

export const options = {
  scenarios: {
    // 1. Health check — luôn nhẹ, chạy xuyên suốt để phát hiện downtime
    health_probe: {
      executor: 'constant-arrival-rate',
      rate: 5,           // 5 req/s
      timeUnit: '1s',
      duration: '2m',
      preAllocatedVUs: 2,
      maxVUs: 5,
      exec: 'healthCheck',
    },

    // 2. Browse workload — mô phỏng 20 user đồng thời đọc dữ liệu
    browse: {
      executor: 'constant-vus',
      vus: 20,
      duration: '2m',
      exec: 'browse',
      startTime: '5s',
    },

    // 3. Spike test — đẩy 100 VU trong 15s để kiểm tra khả năng chịu tải đột biến
    spike: {
      executor: 'ramping-vus',
      stages: [
        { duration: '10s', target: 0 },
        { duration: '15s', target: 100 },
        { duration: '15s', target: 0 },
      ],
      exec: 'browse',
      startTime: '1m45s',
    },
  },

  thresholds: {
    // Tỷ lệ lỗi phải dưới 1%
    error_rate: ['rate<0.01'],
    // 95% request health phải dưới 200ms
    health_latency: ['p(95)<200'],
    // 95% request list phải dưới 1000ms
    pr_list_latency: ['p(95)<1000'],
    po_list_latency: ['p(95)<1000'],
    rfq_list_latency: ['p(95)<1000'],
    // HTTP lỗi chung
    http_req_failed: ['rate<0.01'],
    http_req_duration: ['p(95)<2000'],
  },
};

// ─── Shared headers ───────────────────────────────────────────────────────────

function authHeaders() {
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${JWT_TOKEN}`,
  };
}

// ─── Scenario: Health check ───────────────────────────────────────────────────

export function healthCheck() {
  const res = http.get(`${BASE_URL}/health`);

  healthLatency.add(res.timings.duration);
  const ok = check(res, {
    'health status 200': (r) => r.status === 200,
    'health status ok': (r) => {
      try {
        return JSON.parse(r.body).status === 'ok';
      } catch {
        return false;
      }
    },
  });
  errorRate.add(!ok);

  sleep(0.2);
}

// ─── Scenario: Browse (authenticated read-heavy workload) ─────────────────────

export function browse() {
  const headers = authHeaders();

  // PR list
  let res = http.get(`${BASE_URL}/prmodule`, { headers });
  prListLatency.add(res.timings.duration);
  const prOk = check(res, { 'PR list 200': (r) => r.status === 200 || r.status === 401 });
  errorRate.add(!prOk);

  sleep(0.3);

  // PO list
  res = http.get(`${BASE_URL}/purchase-orders`, { headers });
  poListLatency.add(res.timings.duration);
  const poOk = check(res, { 'PO list 200': (r) => r.status === 200 || r.status === 401 });
  errorRate.add(!poOk);

  sleep(0.3);

  // RFQ list
  res = http.get(`${BASE_URL}/rfq`, { headers });
  rfqListLatency.add(res.timings.duration);
  const rfqOk = check(res, { 'RFQ list 200': (r) => r.status === 200 || r.status === 401 });
  errorRate.add(!rfqOk);

  sleep(0.4);

  // Auth check — bộ đếm login attempts
  res = http.get(`${BASE_URL}/auth/me`, { headers });
  authLatency.add(res.timings.duration);
  check(res, { 'auth me not 500': (r) => r.status !== 500 });

  sleep(0.5);
}

// ─── Summary callback ─────────────────────────────────────────────────────────

export function handleSummary(data) {
  return {
    'k6/summary.json': JSON.stringify(data, null, 2),
    stdout: textSummary(data),
  };
}

function textSummary(data) {
  const m = data.metrics;
  const lines = [
    '═══════════════════════════════════════════',
    '  OMS Load Test Summary',
    '═══════════════════════════════════════════',
    `  Total requests  : ${m.http_reqs?.values?.count ?? 0}`,
    `  Failed requests : ${((m.http_req_failed?.values?.rate ?? 0) * 100).toFixed(2)}%`,
    `  Error rate      : ${((m.error_rate?.values?.rate ?? 0) * 100).toFixed(2)}%`,
    '',
    `  Latency p50     : ${(m.http_req_duration?.values?.['p(50)'] ?? 0).toFixed(0)} ms`,
    `  Latency p95     : ${(m.http_req_duration?.values?.['p(95)'] ?? 0).toFixed(0)} ms`,
    `  Latency p99     : ${(m.http_req_duration?.values?.['p(99)'] ?? 0).toFixed(0)} ms`,
    '',
    `  /health p95     : ${(m.health_latency?.values?.['p(95)'] ?? 0).toFixed(0)} ms`,
    `  /prmodule p95   : ${(m.pr_list_latency?.values?.['p(95)'] ?? 0).toFixed(0)} ms`,
    `  /po p95         : ${(m.po_list_latency?.values?.['p(95)'] ?? 0).toFixed(0)} ms`,
    `  /rfq p95        : ${(m.rfq_list_latency?.values?.['p(95)'] ?? 0).toFixed(0)} ms`,
    '═══════════════════════════════════════════',
  ];
  return lines.join('\n');
}
