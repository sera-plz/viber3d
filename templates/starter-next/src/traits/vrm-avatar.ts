import { trait } from 'koota';
import type { VRM } from '@pixiv/three-vrm';

/**
 * VRMAvatar trait - stores the loaded VRM model reference
 */
export const VRMAvatar = trait({
	vrm: null as VRM | null,
	url: '' as string,
	loaded: false,
});
