export default {
  oidc: {
    clientId: '0oagw2ixksL8bvcv75d7',
    issuer: 'https://dev-40781634.okta.com/oauth2/default',
    redirectUri: 'https://localhost:4200/login/callback',
    scopes: ['openid', 'profile', 'email'],
  },
  features: {
    registration: true, // enable self-service registration
  },
  idps: [
    {
      type: 'GOOGLE',
      id: '0oagwg52yhGjeIfvY5d7',
    },
  ],
  idpDisplay: 'SECONDARY',
};
