// Google Identity Services (GIS) type declarations
declare namespace google {
  namespace accounts {
    namespace id {
      interface CredentialResponse {
        credential: string;
        select_by?: string;
        clientId?: string;
      }

      interface GsiButtonConfiguration {
        type?: 'standard' | 'icon';
        theme?: 'outline' | 'filled_blue' | 'filled_black';
        size?: 'large' | 'medium' | 'small';
        text?: 'signin_with' | 'signup_with' | 'continue_with' | 'signin';
        shape?: 'rectangular' | 'pill' | 'circle' | 'square';
        logo_alignment?: 'left' | 'center';
        width?: string;
        locale?: string;
      }

      interface IdConfiguration {
        client_id: string;
        callback: (response: CredentialResponse) => void;
        auto_select?: boolean;
        cancel_on_tap_outside?: boolean;
        context?: 'signin' | 'signup' | 'use';
        ux_mode?: 'popup' | 'redirect';
        login_uri?: string;
        itp_support?: boolean;
      }

      function initialize(config: IdConfiguration): void;
      function prompt(momentListener?: (notification: any) => void): void;
      function renderButton(parent: HTMLElement, config: GsiButtonConfiguration): void;
      function disableAutoSelect(): void;
      function revoke(hint: string, callback?: (done: { successful: boolean }) => void): void;
      function cancel(): void;
    }
  }
}

interface Window {
  google?: typeof google;
}
