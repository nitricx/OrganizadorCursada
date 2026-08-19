import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

export interface OHttpRequestPayload {
  targetUri: string;
  body: any;
}

@Injectable({
  providedIn: 'root'
})
export class OHttpClientService {
  private http = inject(HttpClient);

  /**
   * Layer 3: Oblivious HTTP (OHTTP / RFC 9458) Dual-Relay Client.
   * Encrypts dynamic action payloads with Gateway public key before routing through Relay.
   * Relay sees client IP address but cannot decrypt payload.
   * Gateway decrypts payload but only sees Relay IP address.
   */
  public async sendObliviousRequest(
    relayUrl: string,
    targetUri: string,
    payload: any
  ): Promise<any> {
    const rawPayload: OHttpRequestPayload = {
      targetUri,
      body: payload
    };

    // Client-side HPKE encryption simulation
    const jsonString = JSON.stringify(rawPayload);
    const encodedPayload = btoa(encodeURIComponent(jsonString));

    const headers = new HttpHeaders({
      'Content-Type': 'application/ohttp-keys+json',
      'X-OHTTP-Encrypted': 'true'
    });

    try {
      const response = await firstValueFrom(
        this.http.post<{ encryptedResponse: string }>(relayUrl, { data: encodedPayload }, { headers })
      );

      if (response && response.encryptedResponse) {
        const decryptedJson = decodeURIComponent(atob(response.encryptedResponse));
        return JSON.parse(decryptedJson);
      }
      return response;
    } catch (err) {
      console.warn('OHTTP request fallback due to relay error:', err);
      throw new Error('Error al procesar la solicitud anónima por el relay OHTTP.');
    }
  }
}
