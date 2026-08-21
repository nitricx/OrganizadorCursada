export const environment = {
  production: false,
  useEmulators: false,
  aws: {
    region: 'us-east-1',
    userPoolId: 'us-east-1_example',
    userPoolWebClientId: 'exampleclientid123',
    oauthDomain: 'organizador-cursada.auth.us-east-1.amazoncognito.com',
    redirectSignIn: 'http://localhost:4200/',
    redirectSignOut: 'http://localhost:4200/',
    apiEndpoint: 'https://api.example.com'
  }
};
