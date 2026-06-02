import type {
  BridgeProfile,
  BridgeState,
  EffectiveProfileResolution,
  LocalOriginDefault,
  ProfileSummary
} from './types';

export type BridgeRequest =
  | {
      type: 'bridge.captureCurrentTab';
      tabId?: number;
      trustOrigin?: boolean;
    }
  | {
      type: 'bridge.getState';
    }
  | {
      type: 'bridge.selectTabProfile';
      tabId: number;
      localOrigin: string;
      profileId: string;
    }
  | {
      type: 'bridge.clearTabProfile';
      tabId: number;
    }
  | {
      type: 'bridge.rememberOriginDefault';
      localOrigin: string;
      profileId: string;
      enabled: boolean;
    }
  | {
      type: 'bridge.setActiveProfile';
      profileId?: string;
    }
  | {
      type: 'bridge.resolveProfile';
      tabId?: number;
      localOrigin: string;
    };

export type BridgeError = {
  code: string;
  message: string;
};

export type BridgeResponse<T> =
  | {
      ok: true;
      data: T;
    }
  | {
      ok: false;
      error: BridgeError;
    };

export type PublicBridgeState = {
  profiles: ProfileSummary[];
  tabSelections: BridgeState['tabSelections'];
  originDefaults: LocalOriginDefault[];
  activeProfileId?: string;
  allowedDesktopOrigins: string[];
  allowedLocalOrigins: string[];
};

export type BridgeResponseMap = {
  'bridge.captureCurrentTab': {
    profile: ProfileSummary;
    trustedOriginAdded: boolean;
  };
  'bridge.getState': PublicBridgeState;
  'bridge.selectTabProfile': EffectiveProfileResolution;
  'bridge.clearTabProfile': PublicBridgeState;
  'bridge.rememberOriginDefault': LocalOriginDefault;
  'bridge.setActiveProfile': PublicBridgeState;
  'bridge.resolveProfile': EffectiveProfileResolution;
};

export type InternalBridgeState = BridgeState & {
  profilesById: Record<string, BridgeProfile>;
};
