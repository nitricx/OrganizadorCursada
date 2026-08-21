const fs = require('fs');
const path = require('path');

const targetPath = path.join(__dirname, '../src/environments/environment.prod.ts');

const envConfigFile = `export const environment = {
  production: true,
  aws: {
    region: "${process.env.AWS_REGION || 'YOUR_AWS_REGION'}",
    userPoolId: "${process.env.AWS_USER_POOL_ID || 'YOUR_AWS_USER_POOL_ID'}",
    userPoolWebClientId: "${process.env.AWS_USER_POOL_WEB_CLIENT_ID || 'YOUR_AWS_USER_POOL_WEB_CLIENT_ID'}",
    oauthDomain: "${process.env.AWS_COGNITO_OAUTH_DOMAIN || 'YOUR_AWS_COGNITO_OAUTH_DOMAIN'}",
    redirectSignIn: "${process.env.AWS_REDIRECT_SIGN_IN || 'YOUR_AWS_REDIRECT_SIGN_IN'}",
    redirectSignOut: "${process.env.AWS_REDIRECT_SIGN_OUT || 'YOUR_AWS_REDIRECT_SIGN_OUT'}",
    apiEndpoint: "${process.env.AWS_API_ENDPOINT || 'YOUR_AWS_API_ENDPOINT'}"
  }
};
`;

fs.writeFileSync(targetPath, envConfigFile, { encoding: 'utf8' });
console.log(`[set-env] Archivo environment.prod.ts generado correctamente para AWS.`);
