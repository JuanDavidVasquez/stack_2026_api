export interface EmailTemplateConfig {
  templateName: string;
  subjectKey: string;
  buildContext: (params: any, baseContext: Record<string, any>) => Record<string, any>;
}

export const EMAIL_TEMPLATES: Record<string, EmailTemplateConfig> = {
  ACCOUNT_ACTIVATION: {
    templateName: 'account-activation/account-activation',
    subjectKey: 'email.activation.subject',
    buildContext: (params: { firstName: string; token: string; expiresIn: number }, baseContext) => ({
      ...baseContext,
      firstName: params.firstName,
      activationUrl: `${baseContext.frontendUrl}/api/onboarding/validate-activation/${params.token}`,
      expiresIn: params.expiresIn,
    }),
  },

  WELCOME: {
    templateName: 'welcome/welcome',
    subjectKey: 'email.welcome.subject',
    buildContext: (params: { firstName: string }, baseContext) => ({
      ...baseContext,
      firstName: params.firstName,
      loginUrl: `${baseContext.frontendUrl}/login`,
      dashboardUrl: `${baseContext.frontendUrl}/dashboard`,
    }),
  },

  PASSWORD_RESET: {
    templateName: 'password-reset/password-reset',
    subjectKey: 'email.passwordReset.subject',
    buildContext: (params: { firstName: string; token: string; expiresIn: number }, baseContext) => ({
      ...baseContext,
      firstName: params.firstName,
      resetUrl: `${baseContext.frontendUrl}/reset-password?token=${params.token}`,
      expiresIn: params.expiresIn,
    }),
  },

  PASSWORD_CHANGED: {
    templateName: 'password-changed/password-changed',
    subjectKey: 'email.passwordChanged.subject',
    buildContext: (params: { firstName: string }, baseContext) => ({
      ...baseContext,
      firstName: params.firstName,
      changedAt: new Date().toLocaleString(),
      supportUrl: `${baseContext.frontendUrl}/support`,
    }),
  },

  VERIFICATION_CODE: {
    templateName: 'verification-code/verification-code',
    subjectKey: 'email.verificationCode.subject',
    buildContext: (params: { firstName: string; code: string; expiresIn: number }, baseContext) => ({
      ...baseContext,
      firstName: params.firstName,
      code: params.code,
      expiresIn: params.expiresIn,
    }),
  },
};

export type EmailTemplateParams<T extends keyof typeof EMAIL_TEMPLATES> = 
  Parameters<typeof EMAIL_TEMPLATES[T]['buildContext']>[0];