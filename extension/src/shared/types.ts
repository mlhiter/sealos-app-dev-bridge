export type DesktopCloudConfig = {
  domain: string;
  port: string;
  regionUID: string;
  proxyDomain?: string;
  allowedOrigins?: string[];
};

export type HostConfig = {
  cloud: {
    domain: string;
    port: string;
    regionUid: string;
  };
  features: {
    subscription: boolean;
  };
};

export type UserInfoV1 = Readonly<{
  id: string;
  name: string;
  avatar: string;
  k8sUsername: string;
  nsid: string;
}>;

export type SessionV1 = {
  token?: string;
  user: UserInfoV1;
  subscription: unknown;
  kubeconfig: string;
};

export type WorkspaceQuotaItem = {
  type: 'cpu' | 'memory' | 'storage' | 'gpu' | 'traffic' | 'nodeport';
  used: number;
  limit: number;
};

export type SdkMessageLogEntry = {
  messageId: string;
  apiName: string;
  success: boolean;
  message: string;
  at: string;
};

export type DesktopCapturePayload = {
  desktopOrigin: string;
  sessionText: string | null;
  language?: string;
  cloud?: Partial<DesktopCloudConfig> & {
    regionUid?: string;
  };
  features?: Partial<HostConfig['features']>;
  capturedAt?: string;
};

export type BridgeProfile = {
  id: string;
  name: string;
  desktopOrigin: string;
  capturedAt: string;
  lastUsedAt?: string;
  cloud: DesktopCloudConfig;
  hostConfig: HostConfig;
  session: SessionV1;
  language: string;
};

export type ProfileSummary = {
  id: string;
  name: string;
  desktopOrigin: string;
  capturedAt: string;
  lastUsedAt?: string;
  cloud: DesktopCloudConfig;
  language: string;
  user: UserInfoV1;
  hasToken: boolean;
  hasKubeconfig: boolean;
};

export type TabProfileSelection = {
  tabId: number;
  localOrigin: string;
  profileId: string;
  languageOverride?: string;
  selectedAt: string;
};

export type LocalOriginDefault = {
  localOrigin: string;
  profileId: string;
  enabled: boolean;
  updatedAt: string;
};

export type BridgeSettings = {
  allowedDesktopOrigins: string[];
  allowedLocalOrigins: string[];
};

export type BridgeState = {
  schemaVersion: 1;
  profiles: Record<string, BridgeProfile>;
  tabSelections: Record<string, TabProfileSelection>;
  originDefaults: Record<string, LocalOriginDefault>;
  activeProfileId?: string;
  recentMessages: SdkMessageLogEntry[];
  settings: BridgeSettings;
  updatedAt: string;
};

export type EffectiveProfileResolution =
  | {
      source: 'tab-selection' | 'origin-default' | 'active-profile';
      profile: ProfileSummary;
      profileId: string;
      language: string;
      languageOverride?: string;
      localOrigin: string;
      reloadRecommended: boolean;
    }
  | {
      source: 'none';
      profile?: undefined;
      profileId?: undefined;
      localOrigin: string;
      reloadRecommended: false;
      error: string;
    };
