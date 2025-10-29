import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { DataMigrationService } from '../services/dataMigrationService';
import { useAuth } from '../contexts/AuthContext';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface MigrationStatus {
  migrated: boolean;
  migratedAt?: string;
}

interface MigrationResult {
  success: boolean;
  message: string;
  details?: any;
}

const DataMigrationScreen: React.FC = () => {
  const { user, loading: authLoading } = useAuth();
  const [migrationStatus, setMigrationStatus] = useState<MigrationStatus>({ migrated: false });
  const [isLoading, setIsLoading] = useState(false);
  const [migrationResult, setMigrationResult] = useState<MigrationResult | null>(null);
  const [asyncStorageData, setAsyncStorageData] = useState<any>({});
  const [migrationProgress, setMigrationProgress] = useState<string>('');

  useEffect(() => {
    checkMigrationStatus();
    checkAsyncStorageData();
  }, []);

  const checkMigrationStatus = async () => {
    try {
      const status = await DataMigrationService.checkMigrationStatus();
      setMigrationStatus(status);
    } catch (error) {
      console.error('检查迁移状态失败:', error);
    }
  };

  const checkAsyncStorageData = async () => {
    try {
      const keys = ['recipes', 'favorites', 'comments', 'socialStats', 'userData'];
      const data: any = {};
      
      for (const key of keys) {
        const value = await AsyncStorage.getItem(key);
        if (value) {
          data[key] = JSON.parse(value);
        }
      }
      
      setAsyncStorageData(data);
    } catch (error) {
      console.error('检查AsyncStorage数据失败:', error);
    }
  };

  const handleMigration = async () => {
    if (!user) {
      Alert.alert(
        '需要登录',
        '您需要先登录才能进行数据迁移。请先登录后再试。',
        [{ text: '确定' }]
      );
      return;
    }

    const dataCount = Object.keys(asyncStorageData).length;
    if (dataCount === 0) {
      Alert.alert(
        '没有数据',
        'AsyncStorage中没有找到需要迁移的数据。',
        [{ text: '确定' }]
      );
      return;
    }

    Alert.alert(
      '确认数据迁移',
      `这将把AsyncStorage中的${dataCount}种类型的数据迁移到Supabase。此操作将在您登录的账户下创建数据，请确认继续。`,
      [
        { text: '取消', style: 'cancel' },
        { text: '确认迁移', onPress: startMigration }
      ]
    );
  };

  const startMigration = async () => {
    setIsLoading(true);
    setMigrationResult(null);
    setMigrationProgress('正在检查用户认证...');

    try {
      console.log('🚀 开始数据迁移...');
      
      setMigrationProgress('正在迁移用户数据...');
      await new Promise(resolve => setTimeout(resolve, 500));
      
      setMigrationProgress('正在迁移菜谱数据...');
      await new Promise(resolve => setTimeout(resolve, 500));
      
      setMigrationProgress('正在迁移食材和步骤...');
      await new Promise(resolve => setTimeout(resolve, 500));
      
      setMigrationProgress('正在迁移收藏和评论...');
      await new Promise(resolve => setTimeout(resolve, 500));
      
      setMigrationProgress('正在完成迁移...');
      const result = await DataMigrationService.migrateAllData();
      
      if (result.success) {
        await DataMigrationService.markMigrationComplete();
        setMigrationStatus({ migrated: true, migratedAt: new Date().toISOString() });
        setMigrationResult(result);
        setMigrationProgress('');
        
        const message = result.message || '数据已成功迁移到Supabase！';
        Alert.alert(
          '迁移成功',
          message,
          [{ text: '确定' }]
        );
      } else {
        setMigrationResult(result);
        setMigrationProgress('');
        Alert.alert(
          '迁移失败',
          result.message,
          [{ text: '确定' }]
        );
      }
    } catch (error) {
      const errorResult = {
        success: false,
        message: `迁移过程中发生错误: ${error}`,
        details: error
      };
      setMigrationResult(errorResult);
      setMigrationProgress('');
      
      Alert.alert(
        '迁移失败',
        errorResult.message,
        [{ text: '确定' }]
      );
    } finally {
      setIsLoading(false);
      setMigrationProgress('');
    }
  };

  const handleCleanup = async () => {
    Alert.alert(
      '清理AsyncStorage',
      '这将删除AsyncStorage中的旧数据。请确保数据已成功迁移到Supabase。',
      [
        { text: '取消', style: 'cancel' },
        { text: '确认清理', onPress: performCleanup }
      ]
    );
  };

  const performCleanup = async () => {
    try {
      await DataMigrationService.cleanupAsyncStorage();
      await checkAsyncStorageData();
      Alert.alert('清理完成', 'AsyncStorage数据已清理');
    } catch (error) {
      Alert.alert('清理失败', `清理过程中发生错误: ${error}`);
    }
  };

  const getDataCount = (data: any) => {
    if (Array.isArray(data)) return data.length;
    if (typeof data === 'object' && data !== null) return Object.keys(data).length;
    return 0;
  };

  const renderDataSummary = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>AsyncStorage 数据概览</Text>
      {Object.keys(asyncStorageData).length === 0 ? (
        <Text style={styles.emptyText}>没有找到AsyncStorage数据</Text>
      ) : (
        Object.entries(asyncStorageData).map(([key, data]) => (
          <View key={key} style={styles.dataItem}>
            <Text style={styles.dataKey}>{key}</Text>
            <Text style={styles.dataValue}>
              {getDataCount(data)} 项数据
            </Text>
          </View>
        ))
      )}
    </View>
  );

  const renderMigrationStatus = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>迁移状态</Text>
      <View style={styles.statusContainer}>
        <Ionicons
          name={migrationStatus.migrated ? "checkmark-circle" : "time"}
          size={24}
          color={migrationStatus.migrated ? "#4CAF50" : "#FF9800"}
        />
        <Text style={[
          styles.statusText,
          { color: migrationStatus.migrated ? "#4CAF50" : "#FF9800" }
        ]}>
          {migrationStatus.migrated ? "已迁移" : "未迁移"}
        </Text>
      </View>
      {migrationStatus.migratedAt && (
        <Text style={styles.migrationDate}>
          迁移时间: {new Date(migrationStatus.migratedAt).toLocaleString()}
        </Text>
      )}
    </View>
  );

  const renderMigrationResult = () => {
    if (!migrationResult) return null;

    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>迁移结果</Text>
        <View style={[
          styles.resultContainer,
          { backgroundColor: migrationResult.success ? "#d4edda" : "#f8d7da" }
        ]}>
          <Ionicons
            name={migrationResult.success ? "checkmark-circle" : "close-circle"}
            size={20}
            color={migrationResult.success ? "#155724" : "#721c24"}
          />
          <Text style={[
            styles.resultText,
            { color: migrationResult.success ? "#155724" : "#721c24" }
          ]}>
            {migrationResult.message}
          </Text>
        </View>
      </View>
    );
  };

  const renderUserStatus = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>用户状态</Text>
      <View style={styles.statusContainer}>
        <Ionicons
          name={user ? "checkmark-circle" : "close-circle"}
          size={24}
          color={user ? "#4CAF50" : "#F44336"}
        />
        <Text style={[
          styles.statusText,
          { color: user ? "#4CAF50" : "#F44336" }
        ]}>
          {user ? `已登录: ${user.email}` : "未登录"}
        </Text>
      </View>
      {!user && (
        <Text style={styles.warningText}>
          请先登录才能进行数据迁移
        </Text>
      )}
    </View>
  );

  const renderMigrationProgress = () => {
    if (!isLoading || !migrationProgress) return null;

    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>迁移进度</Text>
        <View style={styles.progressContainer}>
          <ActivityIndicator size="small" color="#FF6B35" />
          <Text style={styles.progressText}>{migrationProgress}</Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>数据迁移</Text>
          <Text style={styles.subtitle}>将AsyncStorage数据迁移到Supabase</Text>
        </View>

        {renderUserStatus()}
        {renderDataSummary()}
        {renderMigrationStatus()}
        {renderMigrationProgress()}
        {renderMigrationResult()}

        <View style={styles.actions}>
          <TouchableOpacity
            style={[
              styles.button,
              styles.primaryButton,
              (isLoading || migrationStatus.migrated || !user) && styles.buttonDisabled
            ]}
            onPress={handleMigration}
            disabled={isLoading || migrationStatus.migrated || !user}
          >
            {isLoading ? (
              <ActivityIndicator color="white" size="small" />
            ) : (
              <Ionicons name="cloud-upload" size={20} color="white" />
            )}
            <Text style={styles.buttonText}>
              {isLoading ? '迁移中...' : migrationStatus.migrated ? '已迁移' : '开始迁移'}
            </Text>
          </TouchableOpacity>

          {migrationStatus.migrated && (
            <TouchableOpacity
              style={[styles.button, styles.secondaryButton]}
              onPress={handleCleanup}
            >
              <Ionicons name="trash" size={20} color="#FF6B35" />
              <Text style={[styles.buttonText, styles.secondaryButtonText]}>
                清理AsyncStorage
              </Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.info}>
          <Text style={styles.infoTitle}>注意事项</Text>
          <Text style={styles.infoText}>
            • 迁移前请确保Supabase连接正常{'\n'}
            • 迁移过程可能需要几分钟时间{'\n'}
            • 建议在WiFi环境下进行迁移{'\n'}
            • 迁移完成后可以清理AsyncStorage数据
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    flex: 1,
  },
  header: {
    backgroundColor: 'white',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
  },
  section: {
    backgroundColor: 'white',
    margin: 20,
    padding: 16,
    borderRadius: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  emptyText: {
    color: '#999',
    fontStyle: 'italic',
  },
  dataItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  dataKey: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  dataValue: {
    fontSize: 14,
    color: '#666',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  statusText: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  migrationDate: {
    fontSize: 14,
    color: '#666',
  },
  warningText: {
    fontSize: 14,
    color: '#F44336',
    marginTop: 8,
    fontStyle: 'italic',
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
  },
  progressText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 12,
  },
  resultContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
  },
  resultText: {
    fontSize: 14,
    marginLeft: 8,
    flex: 1,
  },
  actions: {
    padding: 20,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginBottom: 12,
  },
  primaryButton: {
    backgroundColor: '#FF6B35',
  },
  secondaryButton: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#FF6B35',
  },
  buttonDisabled: {
    backgroundColor: '#ccc',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  secondaryButtonText: {
    color: '#FF6B35',
  },
  info: {
    backgroundColor: 'white',
    margin: 20,
    padding: 16,
    borderRadius: 12,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
});

export default DataMigrationScreen;
