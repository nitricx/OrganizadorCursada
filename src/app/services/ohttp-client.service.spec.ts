import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { OHttpClientService } from './ohttp-client.service';

describe('OHttpClientService', () => {
  let service: OHttpClientService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [OHttpClientService]
    });
    service = TestBed.inject(OHttpClientService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should format HPKE payload and post to relay with application/ohttp-keys+json headers', async () => {
    const payload = { rating: 5, planId: 'plan1' };
    const encryptedResponsePayload = btoa(encodeURIComponent(JSON.stringify({ status: 'success' })));

    const requestPromise = service.sendObliviousRequest('https://relay.example.com/ohttp', 'https://gateway.example.com/vote', payload);

    const req = httpMock.expectOne('https://relay.example.com/ohttp');
    expect(req.request.method).toBe('POST');
    expect(req.request.headers.get('Content-Type')).toBe('application/ohttp-keys+json');
    expect(req.request.headers.get('X-OHTTP-Encrypted')).toBe('true');

    req.flush({ encryptedResponse: encryptedResponsePayload });

    const res = await requestPromise;
    expect(res.status).toBe('success');
  });
});
