import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { Amplify } from 'aws-amplify';

import { routes } from './app.routes';
import { environment } from '../environments/environment';

if (environment.aws) {
  try {
    Amplify.configure({
      Auth: {
        Cognito: {
          userPoolId: environment.aws.userPoolId,
          userPoolClientId: environment.aws.userPoolWebClientId,
          loginWith: {
            oauth: {
              domain: environment.aws.oauthDomain,
              scopes: ['email', 'profile', 'openid'],
              redirectSignIn: [environment.aws.redirectSignIn],
              redirectSignOut: [environment.aws.redirectSignOut],
              responseType: 'code'
            }
          }
        }
      }
    });
  } catch (err) {
    console.warn('AWS Amplify initial configuration deferred:', err);
  }
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideHttpClient(),
  ],
};
