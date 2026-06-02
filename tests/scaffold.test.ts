import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { BRIDGE_VERSION, EXTENSION_NAME } from '../extension/src/shared/constants';

describe('extension scaffold', () => {
  it('exposes baseline extension metadata', () => {
    assert.equal(EXTENSION_NAME, 'Sealos App Dev Bridge');
    assert.match(BRIDGE_VERSION, /^\d+\.\d+\.\d+$/);
  });
});
