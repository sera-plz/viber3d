import { trait } from 'koota';

/**
 * Gravity trait - applies gravity to entities
 */
export const Gravity = trait({
	// Gravity strength (units per second squared)
	strength: 20,
	// Ground level Y position
	groundLevel: 0,
	// Height above ground when grounded
	groundOffset: 0,
	// Is affected by gravity (false when flying)
	enabled: true,
});
