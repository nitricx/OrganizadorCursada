export const environment = {
  production: false,
  useEmulators: true,
  firebase: {
    apiKey: "demo-api-key",
    authDomain: "demo-project.firebaseapp.com",
    projectId: "organizador-cursada-demo",
    storageBucket: "demo-project.appspot.com",
    messagingSenderId: "123456789",
    appId: "1:123456789:web:123456"
  },
  emulatorHosts: {
    auth: 'http://localhost:9099',
    firestore: {
      host: 'localhost',
      port: 8080
    }
  }
};

