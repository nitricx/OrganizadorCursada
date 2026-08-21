import { TestBed } from '@angular/core/testing';
import { SecureStorageService } from './secure-storage.service';

describe('SecureStorageService', () => {
  let service: SecureStorageService;
  let mockStore: Record<string, string> = {};

  const mockLocalStorage = {
    getItem: (key: string) => mockStore[key] ?? null,
    setItem: (key: string, value: string) => {
      mockStore[key] = value;
    },
    removeItem: (key: string) => {
      delete mockStore[key];
    },
    clear: () => {
      mockStore = {};
    },
  };

  beforeAll(() => {
    try {
      if (typeof globalThis.localStorage === 'undefined' || !globalThis.localStorage) {
        Object.defineProperty(globalThis, 'localStorage', {
          value: mockLocalStorage,
          writable: true,
          configurable: true,
        });
      }
    } catch {}
  });

  beforeEach(() => {
    mockStore = {};
    try {
      if (typeof localStorage !== 'undefined' && localStorage && typeof localStorage.clear === 'function') {
        localStorage.clear();
      }
    } catch {}

    TestBed.configureTestingModule({
      providers: [SecureStorageService],
    });
    service = TestBed.inject(SecureStorageService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should encrypt sensitive object and prepend enc:v1: prefix', () => {
    const sensitiveData = {
      courseStatuses: { mat101: 'approved' },
      userNotes: { mat101: 'Nota privada confidencial' },
    };

    const encrypted = service.encrypt(sensitiveData);

    expect(encrypted.startsWith('enc:v1:')).toBe(true);
    expect(encrypted).not.toContain('Nota privada confidencial');
    expect(encrypted).not.toContain('approved');
  });

  it('should decrypt encrypted payload correctly', () => {
    const sensitiveData = {
      courseStatuses: { mat101: 'approved' },
      userNotes: { mat101: 'Nota privada confidencial' },
    };

    const encrypted = service.encrypt(sensitiveData);
    const decrypted = service.decrypt<typeof sensitiveData>(encrypted);

    expect(decrypted).toEqual(sensitiveData);
  });

  it('should seamlessly parse and migrate legacy plain JSON payload', () => {
    const legacyPlainJson = JSON.stringify({
      courseStatuses: { phys101: 'coursing' },
      userNotes: { phys101: 'Nota antigua sin encriptar' },
    });

    const decrypted = service.decrypt<any>(legacyPlainJson);

    expect(decrypted).toEqual({
      courseStatuses: { phys101: 'coursing' },
      userNotes: { phys101: 'Nota antigua sin encriptar' },
    });
  });

  it('should set and get items from localStorage with automatic encryption', () => {
    const testKey = 'test-progress-key';
    const payload = { status: 'approved', notes: 'Secret note' };

    service.setItem(testKey, payload);

    // Verify item in storage is encrypted
    let rawInStorage: string | null = null;
    try {
      if (typeof localStorage !== 'undefined' && localStorage) {
        rawInStorage = localStorage.getItem(testKey);
      }
    } catch {}
    if (!rawInStorage) rawInStorage = mockStore[testKey] ?? null;

    expect(rawInStorage).toBeTruthy();
    expect(rawInStorage?.startsWith('enc:v1:')).toBe(true);
    expect(rawInStorage).not.toContain('Secret note');

    // Verify getItem returns decrypted payload
    const retrieved = service.getItem<typeof payload>(testKey);
    expect(retrieved).toEqual(payload);
  });

  it('should remove items correctly', () => {
    const testKey = 'test-key-to-remove';
    service.setItem(testKey, { data: 123 });
    expect(service.getItem(testKey)).toBeTruthy();

    service.removeItem(testKey);
    expect(service.getItem(testKey)).toBeNull();
  });

  it('should return null gracefully for null or invalid key/payload', () => {
    expect(service.decrypt(null)).toBeNull();
    expect(service.getItem('non-existent-key')).toBeNull();
    expect(service.decrypt('enc:v1:invalidbase64!@#$')).toBeNull();
  });
});
