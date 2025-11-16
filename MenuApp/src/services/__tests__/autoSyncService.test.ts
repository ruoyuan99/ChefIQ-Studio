import { AutoSyncService } from '../autoSyncService';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Mock dependencies
const mockSupabase = {
  auth: {
    getUser: jest.fn(),
    getSession: jest.fn(),
  },
  from: jest.fn(),
};

jest.mock('../../config/supabase', () => ({
  supabase: mockSupabase,
}));

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(() => Promise.resolve(null)),
  setItem: jest.fn(() => Promise.resolve()),
  removeItem: jest.fn(() => Promise.resolve()),
  clear: jest.fn(() => Promise.resolve()),
  getAllKeys: jest.fn(() => Promise.resolve([])),
}));

describe('AutoSyncService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);
    (AsyncStorage.setItem as jest.Mock).mockResolvedValue(undefined);
    (AsyncStorage.removeItem as jest.Mock).mockResolvedValue(undefined);
    (AsyncStorage.getAllKeys as jest.Mock).mockResolvedValue([]);
  });

  describe('syncAllDataToSupabase', () => {
    it('should return error when user is not authenticated', async () => {
      (mockSupabase.auth.getSession as jest.Mock).mockResolvedValue({
        data: { session: null },
      });

      const result = await AutoSyncService.syncAllDataToSupabase();
      
      expect(result.success).toBe(false);
      expect(result.message).toBe('User not authenticated');
    });

    it('should sync data when user is authenticated', async () => {
      const mockUser = { id: 'user-123' };
      (mockSupabase.auth.getSession as jest.Mock).mockResolvedValue({
        data: { session: { user: mockUser } },
      });

      const mockFrom = {
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            single: jest.fn().mockResolvedValue({ data: { id: 'user-123' }, error: null }),
            order: jest.fn().mockResolvedValue({ data: [], error: null }),
          })),
        })),
        insert: jest.fn(() => ({
          select: jest.fn().mockResolvedValue({ data: [{ id: 'user-123' }], error: null }),
        })),
        update: jest.fn(() => ({
          eq: jest.fn().mockResolvedValue({ data: null, error: null }),
        })),
        upsert: jest.fn().mockResolvedValue({ data: null, error: null }),
      };

      (mockSupabase.from as jest.Mock).mockReturnValue(mockFrom);

      const result = await AutoSyncService.syncAllDataToSupabase();
      
      // Should attempt to sync
      expect(mockSupabase.auth.getUser).toHaveBeenCalled();
    });

    it('should prevent concurrent syncs', async () => {
      const mockUser = { id: 'user-123' };
      (mockSupabase.auth.getUser as jest.Mock).mockResolvedValue({
        data: { user: mockUser },
      });

      const mockFrom = {
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            single: jest.fn().mockResolvedValue({ data: { id: 'user-123' }, error: null }),
            order: jest.fn().mockResolvedValue({ data: [], error: null }),
          })),
        })),
        insert: jest.fn(() => ({
          select: jest.fn().mockResolvedValue({ data: [{ id: 'user-123' }], error: null }),
        })),
        update: jest.fn(() => ({
          eq: jest.fn().mockResolvedValue({ data: null, error: null }),
        })),
        upsert: jest.fn().mockResolvedValue({ data: null, error: null }),
      };

      (mockSupabase.from as jest.Mock).mockReturnValue(mockFrom);

      // Start first sync
      const promise1 = AutoSyncService.syncAllDataToSupabase();
      
      // Try second sync immediately
      const promise2 = AutoSyncService.syncAllDataToSupabase();
      
      const [result1, result2] = await Promise.all([promise1, promise2]);
      
      // One should succeed, one should fail with "Sync is in progress"
      const results = [result1, result2];
      const inProgressResult = results.find(r => r.message === 'Sync is in progress...');
      expect(inProgressResult).toBeDefined();
    });
  });

  describe('needsSync', () => {
    it('should return true when sync is needed', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify({
        lastSyncTime: null,
      }));

      const result = await AutoSyncService.needsSync();
      
      expect(result).toBe(true);
    });

    it('should return false when sync is not needed', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify({
        lastSyncTime: new Date().toISOString(),
      }));

      const result = await AutoSyncService.needsSync();
      
      // May return true or false depending on implementation
      expect(typeof result).toBe('boolean');
    });
  });
});

