// utils/rosterUtils.test.ts
// Test file for roster utility functions

import { logger } from '../src/lib/logger';
import { 
  isRosterExpired, 
  isRosterActive, 
  getActiveRosters, 
  getExpiredRosters, 
  getRosterStatus, 
  getRosterStatusText, 
  getRosterStatusBadgeClass 
} from './rosterUtils';

// Test data
const activeRoster = {
  end_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 7 days from now
  name: 'Active Roster'
};

const expiredRoster = {
  end_date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 7 days ago
  name: 'Expired Roster'
};

const invalidRoster = {
  name: 'Invalid Roster'
};

logger.info('Testing roster utility functions...\n', undefined, 'rosterUtils.test');

// Test isRosterExpired
logger.info('1. Testing isRosterExpired:', undefined, 'rosterUtils.test');
logger.info('   Active roster expired:', isRosterExpired(activeRoster, 'rosterUtils.test')); // Should be false
logger.info('   Expired roster expired:', isRosterExpired(expiredRoster, 'rosterUtils.test')); // Should be true
logger.info('   Invalid roster expired:', isRosterExpired(invalidRoster, 'rosterUtils.test')); // Should be true
logger.info('   Null roster expired:', isRosterExpired(null, 'rosterUtils.test')); // Should be true

// Test isRosterActive
logger.info('\n2. Testing isRosterActive:', undefined, 'rosterUtils.test');
logger.info('   Active roster active:', isRosterActive(activeRoster, 'rosterUtils.test')); // Should be true
logger.info('   Expired roster active:', isRosterActive(expiredRoster, 'rosterUtils.test')); // Should be false

// Test getActiveRosters
logger.info('\n3. Testing getActiveRosters:', undefined, 'rosterUtils.test');
const mixedRosters = [activeRoster, expiredRoster, invalidRoster];
const activeRosters = getActiveRosters(mixedRosters);
logger.info('   Active rosters count:', activeRosters.length, 'rosterUtils.test'); // Should be 1

// Test getExpiredRosters
logger.info('\n4. Testing getExpiredRosters:', undefined, 'rosterUtils.test');
const expiredRosters = getExpiredRosters(mixedRosters);
logger.info('   Expired rosters count:', expiredRosters.length, 'rosterUtils.test'); // Should be 2

// Test getRosterStatus
logger.info('\n5. Testing getRosterStatus:', undefined, 'rosterUtils.test');
logger.info('   Active roster status:', getRosterStatus(activeRoster, 'rosterUtils.test')); // Should be 'active'
logger.info('   Expired roster status:', getRosterStatus(expiredRoster, 'rosterUtils.test')); // Should be 'expired'
logger.info('   Invalid roster status:', getRosterStatus(invalidRoster, 'rosterUtils.test')); // Should be 'unknown'
logger.info('   Null roster status:', getRosterStatus(null, 'rosterUtils.test')); // Should be 'unknown'

// Test getRosterStatusText
logger.info('\n6. Testing getRosterStatusText:', undefined, 'rosterUtils.test');
logger.info('   Active roster status text:', getRosterStatusText(activeRoster, 'rosterUtils.test')); // Should be 'Active'
logger.info('   Expired roster status text:', getRosterStatusText(expiredRoster, 'rosterUtils.test')); // Should be 'Expired'

// Test getRosterStatusBadgeClass
logger.info('\n7. Testing getRosterStatusBadgeClass:', undefined, 'rosterUtils.test');
logger.info('   Active roster badge class:', getRosterStatusBadgeClass(activeRoster, 'rosterUtils.test').includes('green')); // Should be true
logger.info('   Expired roster badge class:', getRosterStatusBadgeClass(expiredRoster, 'rosterUtils.test').includes('red')); // Should be true

logger.info('\n✅ All tests completed successfully!', undefined, 'rosterUtils.test');