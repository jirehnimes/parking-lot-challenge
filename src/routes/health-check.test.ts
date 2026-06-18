import request from 'supertest';
import { app } from '@/app';
import { HTTP_STATUS_CODE } from '@/constants/common.constant';

describe('GET /health-check', () => {
  it('returns 200 with status ok', async () => {
    const res = await request(app).get('/health-check');
    expect(res.status).toBe(HTTP_STATUS_CODE.OK);
    expect(res.body).toEqual({ status: 'Parking lot system is working!' });
  });
});
