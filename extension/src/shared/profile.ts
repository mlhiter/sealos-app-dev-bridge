import { normalizeOrigin } from './origin';
import type {
  BridgeProfile,
  BridgeState,
  EffectiveProfileResolution,
  LocalOriginDefault,
  ProfileSummary,
  TabProfileSelection
} from './types';

export function toProfileSummary(profile: BridgeProfile): ProfileSummary {
  return {
    id: profile.id,
    name: profile.name,
    desktopOrigin: profile.desktopOrigin,
    capturedAt: profile.capturedAt,
    lastUsedAt: profile.lastUsedAt,
    cloud: profile.cloud,
    language: profile.language,
    user: profile.session.user,
    hasToken: Boolean(profile.session.token),
    hasKubeconfig: Boolean(profile.session.kubeconfig)
  };
}

export function resolveEffectiveProfile(
  state: BridgeState,
  input: {
    tabId?: number;
    localOrigin: string;
  }
): EffectiveProfileResolution {
  const localOrigin = normalizeOrigin(input.localOrigin);

  if (typeof input.tabId === 'number') {
    const tabSelection = state.tabSelections[String(input.tabId)];
    if (tabSelection?.localOrigin === localOrigin) {
      const profile = state.profiles[tabSelection.profileId];
      if (profile) {
        return {
          source: 'tab-selection',
          profile: toProfileSummary(profile),
          profileId: profile.id,
          localOrigin,
          reloadRecommended: true
        };
      }
    }
  }

  const originDefault = state.originDefaults[localOrigin];
  if (originDefault?.enabled) {
    const profile = state.profiles[originDefault.profileId];
    if (profile) {
      return {
        source: 'origin-default',
        profile: toProfileSummary(profile),
        profileId: profile.id,
        localOrigin,
        reloadRecommended: true
      };
    }
  }

  if (state.activeProfileId) {
    const profile = state.profiles[state.activeProfileId];
    if (profile) {
      return {
        source: 'active-profile',
        profile: toProfileSummary(profile),
        profileId: profile.id,
        localOrigin,
        reloadRecommended: true
      };
    }
  }

  return {
    source: 'none',
    localOrigin,
    reloadRecommended: false,
    error: 'No profile selected for this local tab'
  };
}

export function createTabSelection(input: {
  tabId: number;
  localOrigin: string;
  profileId: string;
  selectedAt: string;
}): TabProfileSelection {
  return {
    tabId: input.tabId,
    localOrigin: normalizeOrigin(input.localOrigin),
    profileId: input.profileId,
    selectedAt: input.selectedAt
  };
}

export function createOriginDefault(input: {
  localOrigin: string;
  profileId: string;
  enabled: boolean;
  updatedAt: string;
}): LocalOriginDefault {
  return {
    localOrigin: normalizeOrigin(input.localOrigin),
    profileId: input.profileId,
    enabled: input.enabled,
    updatedAt: input.updatedAt
  };
}
