
import { validateCSRF } from '../_shared/auth.ts';
import { logger } from '../../../src/lib/logger';

// Mock Request object
class MockRequest {
    headers: Map<string, string>;
    constructor(headers: Record<string, string>) {
        this.headers = new Map(Object.entries(headers));
    }
}
// Add get method to Map if not present (Deno's Headers object works like Map.get, but standard Request.headers is Headers interface)
// We'll just implement a simple conformant interface
const createRequest = (headersObj: Record<string, string>) => {
    return {
        headers: {
            get: (key: string) => headersObj[key] || headersObj[key.toLowerCase()] || null
        }
    } as unknown as Request;
};

logger.info("🧪 Testing CSRF Validation Logic...", undefined, 'test_csrf_logic');

// Test 1: Valid Match
try {
    const req = createRequest({
        'X-CSRF-Token': '12345',
        'Cookie': 'csrf-token=12345; path=/'
    });
    validateCSRF(req);
    logger.info("✅ Valid Match: Passed", undefined, 'test_csrf_logic');
} catch (e) {
    logger.error("❌ Valid Match: Failed", e, 'test_csrf_logic');
}

// Test 2: Mismatch
try {
    const req = createRequest({
        'X-CSRF-Token': '12345',
        'Cookie': 'csrf-token=67890; path=/'
    });
    validateCSRF(req);
    logger.error("❌ Mismatch: Failed (Should have thrown)", undefined, 'test_csrf_logic');
} catch (e) {
    logger.info("✅ Mismatch: Passed (Threw error as expected)", undefined, 'test_csrf_logic');
}

// Test 3: Missing Header
try {
    const req = createRequest({
        'Cookie': 'csrf-token=12345'
    });
    validateCSRF(req);
    logger.error("❌ Missing Header: Failed (Should have thrown)", undefined, 'test_csrf_logic');
} catch (e) {
    logger.info("✅ Missing Header: Passed (Threw error as expected)", undefined, 'test_csrf_logic');
}

// Test 4: Missing Cookie
try {
    const req = createRequest({
        'X-CSRF-Token': '12345'
    });
    validateCSRF(req);
    logger.error("❌ Missing Cookie: Failed (Should have thrown)", undefined, 'test_csrf_logic');
} catch (e) {
    logger.info("✅ Missing Cookie: Passed (Threw error as expected)", undefined, 'test_csrf_logic');
}
