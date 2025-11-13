import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  StatusBar,
  Platform,
  Alert,
  SafeAreaView,
  PanResponder,
  Dimensions,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Speech from 'expo-speech';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRecipe } from '../contexts/RecipeContext';
import { sampleRecipes } from '../data/sampleRecipes';
import { Instruction } from '../types';


interface CookStepScreenProps {
  navigation: any;
  route: any;
}

const CookStepScreen: React.FC<CookStepScreenProps> = ({ navigation, route }) => {
  const { getRecipeById } = useRecipe();
  const { recipeId } = route.params;
  
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());
  const [showIngredients, setShowIngredients] = useState(false);
  const [servingSize, setServingSize] = useState(4); // 默认4人份
  const [isPlaying, setIsPlaying] = useState(false);
  const [speechRate, setSpeechRate] = useState(0.85); // 默认语速（0.0-1.0），优化为0.85更自然
  const [speechPitch, setSpeechPitch] = useState(1.1); // 默认音调（0.5-2.0），优化为1.1更自然
  const [isLoopMode, setIsLoopMode] = useState(false); // 循环播放模式（默认关闭）
  const [loopInterval, setLoopInterval] = useState(2); // 循环间隔时间（秒），默认2秒
  const [loopPlayCount, setLoopPlayCount] = useState(0); // 当前循环播放次数
  const [showLoopTutorial, setShowLoopTutorial] = useState(false); // 显示循环模式教程
  const [showLoopSettings, setShowLoopSettings] = useState(false); // 显示循环设置面板
  const [showSpeechSettings, setShowSpeechSettings] = useState(false); // 显示语音设置面板
  
  // 获取屏幕宽度用于滑动手势
  const screenWidth = Dimensions.get('window').width;
  
  // 用于存储当前播放的语音ID，以便停止
  const currentSpeechIdRef = useRef<string | null>(null);
  // 用于跟踪是否正在播放（避免useEffect依赖问题）
  const isPlayingRef = useRef<boolean>(false);
  // 用于跟踪循环播放的定时器
  const loopTimerRef = useRef<NodeJS.Timeout | null>(null);
  // 用于跟踪循环模式状态（避免闭包问题）
  const isLoopModeRef = useRef<boolean>(false);
  // 用于跟踪循环播放次数（避免闭包问题）
  const loopPlayCountRef = useRef<number>(0);
  // 最大循环播放次数（5次后提示）
  const MAX_LOOP_COUNT = 5;
  
  // 根据ID判断数据来源
  let recipe: any;
  if (recipeId.startsWith('sample_')) {
    recipe = sampleRecipes.find(r => r.id === recipeId);
  } else {
    recipe = getRecipeById(recipeId);
  }

  // 在 recipe 加载后设置正确的 serving size
  useEffect(() => {
    if (recipe?.servings) {
      const servings = parseFloat(recipe.servings);
      if (!isNaN(servings) && servings > 0) {
        setServingSize(Math.min(99, Math.max(1, servings)));
      }
    }
  }, [recipe]);

  // 检查是否首次使用循环模式
  useEffect(() => {
    const checkFirstTimeLoop = async () => {
      try {
        const hasSeenTutorial = await AsyncStorage.getItem('hasSeenLoopTutorial');
        if (!hasSeenTutorial) {
          // 首次使用，但不自动显示，等用户点击Loop按钮时再显示
        }
      } catch (error) {
        console.error('Error checking loop tutorial:', error);
      }
    };
    checkFirstTimeLoop();
  }, []);

  // 语音播放功能
  const speakStep = (text: string, isLoop: boolean = false) => {
    // 停止之前的播放
    if (currentSpeechIdRef.current) {
      Speech.stop();
      currentSpeechIdRef.current = null;
    }

    // 清除之前的循环定时器
    if (loopTimerRef.current) {
      clearTimeout(loopTimerRef.current);
      loopTimerRef.current = null;
    }

    // 准备要朗读的文本（包含步骤编号）
    const stepNumber = currentStep + 1;
    const speechText = `Step ${stepNumber}. ${text}`;

    // 开始播放
    Speech.speak(speechText, {
      language: 'en', // 可以根据需要更改语言
      pitch: speechPitch, // 音调（0.5-2.0），使用可调节的音调
      rate: speechRate, // 语速（0.0-1.0）
      onStart: () => {
        setIsPlaying(true);
        isPlayingRef.current = true;
      },
      onDone: () => {
        setIsPlaying(false);
        isPlayingRef.current = false;
        currentSpeechIdRef.current = null;
        
        // 如果是循环模式，等待间隔后再次播放
        if (isLoopModeRef.current && recipe?.instructions?.[currentStep]?.description) {
          // 增加播放次数
          const newCount = loopPlayCountRef.current + 1;
          loopPlayCountRef.current = newCount;
          setLoopPlayCount(newCount);
          
          // 如果达到最大播放次数，提示用户
          if (newCount >= MAX_LOOP_COUNT) {
            Alert.alert(
              'Loop Playback',
              `This step has been repeated ${MAX_LOOP_COUNT} times. Would you like to continue?`,
              [
                {
                  text: 'Stop',
                  style: 'cancel',
                  onPress: () => {
                    stopSpeaking();
                  },
                },
                {
                  text: 'Continue',
                  onPress: () => {
                    // 重置计数，继续播放
                    loopPlayCountRef.current = 0;
                    setLoopPlayCount(0);
                    // 延迟后继续播放
                    loopTimerRef.current = setTimeout(() => {
                      if (isLoopModeRef.current && recipe?.instructions?.[currentStep]?.description) {
                        speakStep(recipe.instructions[currentStep].description, true);
                      }
                    }, loopInterval * 1000);
                  },
                },
              ]
            );
            return;
          }
          
          // 间隔指定秒数后再次播放
          loopTimerRef.current = setTimeout(() => {
            // 再次检查循环模式状态（可能用户已经关闭）
            if (isLoopModeRef.current && recipe?.instructions?.[currentStep]?.description) {
              speakStep(recipe.instructions[currentStep].description, true);
            }
          }, loopInterval * 1000); // 使用可调节的间隔时间
        }
      },
      onStopped: () => {
        setIsPlaying(false);
        isPlayingRef.current = false;
        currentSpeechIdRef.current = null;
        
        // 停止时清除循环定时器
        if (loopTimerRef.current) {
          clearTimeout(loopTimerRef.current);
          loopTimerRef.current = null;
        }
      },
      onError: (error) => {
        console.error('Speech error:', error);
        setIsPlaying(false);
        isPlayingRef.current = false;
        currentSpeechIdRef.current = null;
        
        // 错误时清除循环定时器
        if (loopTimerRef.current) {
          clearTimeout(loopTimerRef.current);
          loopTimerRef.current = null;
        }
      },
    });

    // 注意：expo-speech 不返回ID，但我们可以用其他方式跟踪
    currentSpeechIdRef.current = 'playing';
  };

  const stopSpeaking = () => {
    Speech.stop();
    setIsPlaying(false);
    isPlayingRef.current = false;
    currentSpeechIdRef.current = null;
    
    // 清除循环定时器
    if (loopTimerRef.current) {
      clearTimeout(loopTimerRef.current);
      loopTimerRef.current = null;
    }
    
    // 停止时关闭循环模式并重置计数
    setIsLoopMode(false);
    isLoopModeRef.current = false;
    setLoopPlayCount(0);
    loopPlayCountRef.current = 0;
  };

  const toggleSpeech = () => {
    if (isPlaying) {
      stopSpeaking();
    } else {
      const currentInstruction = recipe?.instructions?.[currentStep];
      if (currentInstruction?.description) {
        speakStep(currentInstruction.description, isLoopMode);
      }
    }
  };

  const toggleLoopMode = async () => {
    // 如果是首次开启循环模式，显示教程
    if (!isLoopMode) {
      const hasSeenTutorial = await AsyncStorage.getItem('hasSeenLoopTutorial');
      if (!hasSeenTutorial) {
        setShowLoopTutorial(true);
        await AsyncStorage.setItem('hasSeenLoopTutorial', 'true');
        // 不立即开启，等用户看完教程后手动开启
        return;
      }
    }

    const newLoopMode = !isLoopMode;
    setIsLoopMode(newLoopMode);
    isLoopModeRef.current = newLoopMode; // 同步更新 ref
    
    // 重置播放计数
    if (newLoopMode) {
      setLoopPlayCount(0);
      loopPlayCountRef.current = 0;
    }
    
    // 如果当前正在播放，需要重新开始以应用循环模式
    if (isPlaying) {
      stopSpeaking();
      // 延迟一下再开始，确保停止完成
      setTimeout(() => {
        const currentInstruction = recipe?.instructions?.[currentStep];
        if (currentInstruction?.description) {
          speakStep(currentInstruction.description, newLoopMode);
        }
      }, 300);
    } else if (newLoopMode) {
      // 如果开启循环模式但未播放，直接开始播放
      const currentInstruction = recipe?.instructions?.[currentStep];
      if (currentInstruction?.description) {
        speakStep(currentInstruction.description, true);
      }
    }
  };

  const handleLoopTutorialContinue = () => {
    setShowLoopTutorial(false);
    // 用户看完教程后，开启循环模式
    const newLoopMode = true;
    setIsLoopMode(newLoopMode);
    isLoopModeRef.current = newLoopMode;
    setLoopPlayCount(0);
    loopPlayCountRef.current = 0;
    
    // 自动开始播放
    const currentInstruction = recipe?.instructions?.[currentStep];
    if (currentInstruction?.description) {
      speakStep(currentInstruction.description, true);
    }
  };

  // 当步骤改变时，如果正在播放，停止并播放新步骤
  useEffect(() => {
    if (recipe?.instructions?.[currentStep]?.description) {
      // 重置循环播放计数
      setLoopPlayCount(0);
      loopPlayCountRef.current = 0;
      
      // 如果之前正在播放，停止并播放新步骤
      if (isPlayingRef.current) {
        stopSpeaking();
        // 延迟一下再播放新步骤，确保停止完成
        // 使用 ref 获取最新的循环模式状态
        setTimeout(() => {
          speakStep(recipe.instructions[currentStep].description, isLoopModeRef.current);
        }, 300);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentStep]);

  // 组件卸载时停止播放
  useEffect(() => {
    return () => {
      stopSpeaking();
      // 清除循环定时器
      if (loopTimerRef.current) {
        clearTimeout(loopTimerRef.current);
        loopTimerRef.current = null;
      }
    };
  }, []);
  
  // 计算调整后的食材用量
  const calculateAdjustedAmount = (ingredient: any) => {
    const originalServings = parseFloat(recipe?.servings || '4') || 4;
    const currentServings = parseFloat(String(servingSize)) || 4;
    const multiplier = currentServings / originalServings;
    const amount = parseFloat(ingredient.amount) || 0;
    const adjustedAmount = amount * multiplier;
    
    // 检查是否为有效数字
    if (isNaN(adjustedAmount) || !isFinite(adjustedAmount)) {
      return ingredient.amount || '0';
    }
    
    // 保留一位小数，如果是整数则不显示小数点
    return adjustedAmount % 1 === 0 ? adjustedAmount.toString() : adjustedAmount.toFixed(1);
  };
  
  // 创建 PanResponder 处理滑动手势
  const panResponder = PanResponder.create({
    onMoveShouldSetPanResponder: (evt, gestureState) => {
      // 如果水平滑动距离大于垂直滑动距离，则处理手势
      return Math.abs(gestureState.dx) > Math.abs(gestureState.dy) && Math.abs(gestureState.dx) > 20;
    },
    onPanResponderMove: (evt, gestureState) => {
      // 这里可以添加滑动过程中的视觉反馈
    },
    onPanResponderRelease: (evt, gestureState) => {
      const { dx } = gestureState;
      const threshold = screenWidth * 0.3; // 滑动阈值：屏幕宽度的30%
      
      if (dx > threshold) {
        // 向右滑动，显示上一步
        handlePreviousStep();
      } else if (dx < -threshold) {
        // 向左滑动，显示下一步
        handleNextStep();
      }
    },
  });

  if (!recipe || !recipe.instructions || recipe.instructions.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={64} color="#FF6B35" />
          <Text style={styles.errorTitle}>Recipe Not Found</Text>
          <Text style={styles.errorText}>This recipe doesn't have cooking instructions.</Text>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const totalSteps = recipe.instructions.length;
  const progress = ((currentStep + 1) / totalSteps) * 100;

  const handleNextStep = () => {
    if (currentStep < totalSteps - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePreviousStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleCompleteStep = () => {
    const newCompletedSteps = new Set(completedSteps);
    newCompletedSteps.add(currentStep);
    setCompletedSteps(newCompletedSteps);
    
    // Auto advance to next step if not the last step
    if (currentStep < totalSteps - 1) {
      setTimeout(() => {
        setCurrentStep(currentStep + 1);
      }, 1000);
    }
  };

  const handleFinishCooking = () => {
    Alert.alert(
      'Congratulations! 🎉', 
      'You have completed cooking this recipe!',
      [
        {
          text: 'OK',
          onPress: () => navigation.goBack()
        }
      ]
    );
  };

  const currentInstruction = recipe.instructions[currentStep];

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.headerButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>{recipe.title}</Text>
          <Text style={styles.headerSubtitle}>Cook Step by Step</Text>
        </View>
        
        <TouchableOpacity
          style={styles.headerButton}
          onPress={() => setCurrentStep(0)}
        >
          <Ionicons name="refresh" size={24} color="#FF6B35" />
        </TouchableOpacity>
      </View>

      {/* Progress Section */}
      <View style={styles.progressSection}>
        <View style={styles.progressInfo}>
          <Text style={styles.progressText}>
            Step {currentStep + 1} of {totalSteps}
          </Text>
          <Text style={styles.progressPercentage}>
            {Math.round(progress)}%
          </Text>
        </View>
        <View style={styles.progressBar}>
          <View 
            style={[
              styles.progressFill, 
              { width: `${progress}%` }
            ]} 
          />
        </View>
      </View>

      {/* Step Content */}
      <ScrollView 
        style={styles.content} 
        showsVerticalScrollIndicator={false}
        {...panResponder.panHandlers}
      >
        <View style={styles.stepContainer}>
          {/* Step Number */}
          <View style={styles.stepNumberContainer}>
            <View style={styles.stepNumberCircle}>
              <Text style={styles.stepNumberText}>{currentInstruction.step}</Text>
            </View>
            {completedSteps.has(currentStep) && (
              <View style={styles.completedBadge}>
                <Ionicons name="checkmark" size={16} color="white" />
              </View>
            )}
          </View>

          {/* Step Description */}
          <Text style={styles.stepDescription}>
            {currentInstruction.description}
          </Text>

          {/* Speech Control - Combined Row */}
          <View style={styles.speechControlRow}>
            <TouchableOpacity
              style={[styles.speechButtonCompact, isPlaying && styles.speechButtonActiveCompact]}
              onPress={toggleSpeech}
            >
              <Ionicons 
                name={isPlaying ? "pause" : "volume-high"} 
                size={18} 
                color={isPlaying ? "white" : "#666"} 
              />
              <Text style={[styles.speechButtonTextCompact, isPlaying && styles.speechButtonTextActiveCompact]}>
                {isPlaying ? "Pause" : "Read"}
              </Text>
            </TouchableOpacity>
            
            {isPlaying && (
              <TouchableOpacity
                style={styles.stopButtonCompact}
                onPress={stopSpeaking}
              >
                <Ionicons name="stop" size={16} color="#666" />
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={styles.speechSettingsToggleButtonCompact}
              onPress={() => setShowSpeechSettings(!showSpeechSettings)}
            >
              <Ionicons 
                name={showSpeechSettings ? "chevron-up" : "chevron-down"} 
                size={16} 
                color="#666" 
              />
              <Text style={styles.speechSettingsToggleTextCompact}>
                Settings
              </Text>
            </TouchableOpacity>
          </View>

          {/* Speech Settings Panel (Collapsible) */}
          {showSpeechSettings && (
            <View style={styles.speechSettingsContainer}>
              {/* Loop Mode Control */}
              <View style={styles.loopControlContainer}>
                <View style={styles.loopButtonRow}>
                  <TouchableOpacity
                    style={[styles.loopButton, isLoopMode && styles.loopButtonActive]}
                    onPress={toggleLoopMode}
                  >
                    <Ionicons 
                      name={isLoopMode ? "repeat" : "repeat-outline"} 
                      size={20} 
                      color={isLoopMode ? "white" : "#d96709"} 
                    />
                    <Text style={[styles.loopButtonText, isLoopMode && styles.loopButtonTextActive]}>
                      {isLoopMode ? "Loop On" : "Loop Off"}
                    </Text>
                  </TouchableOpacity>
                  
                  {isLoopMode && (
                    <TouchableOpacity
                      style={styles.loopSettingsButton}
                      onPress={() => setShowLoopSettings(true)}
                    >
                      <Ionicons name="settings-outline" size={18} color="#d96709" />
                    </TouchableOpacity>
                  )}
                </View>
                
                {isLoopMode && (
                  <View style={styles.loopInfoContainer}>
                    <Text style={styles.loopHint}>
                      Repeating every {loopInterval} second{loopInterval !== 1 ? 's' : ''}
                    </Text>
                    {loopPlayCount > 0 && (
                      <Text style={styles.loopCountText}>
                        Played {loopPlayCount} time{loopPlayCount !== 1 ? 's' : ''}
                      </Text>
                    )}
                  </View>
                )}
              </View>
            {/* Speech Rate Control */}
            <View style={styles.speechRateContainer}>
              <Text style={styles.speechRateLabel}>Speech Speed:</Text>
              <View style={styles.speechRateControls}>
                <TouchableOpacity
                  style={[styles.speechRateButton, speechRate <= 0.5 && styles.speechRateButtonDisabled]}
                  onPress={() => {
                    const newRate = Math.max(0.5, speechRate - 0.05);
                    setSpeechRate(Number(newRate.toFixed(2)));
                  }}
                  disabled={speechRate <= 0.5}
                >
                  <Ionicons name="remove" size={16} color={speechRate <= 0.5 ? "#ccc" : "#d96709"} />
                </TouchableOpacity>
                
                <Text style={styles.speechRateValue}>
                  {Math.round(speechRate * 100)}%
                </Text>
                
                <TouchableOpacity
                  style={[styles.speechRateButton, speechRate >= 1.0 && styles.speechRateButtonDisabled]}
                  onPress={() => {
                    const newRate = Math.min(1.0, speechRate + 0.05);
                    setSpeechRate(Number(newRate.toFixed(2)));
                  }}
                  disabled={speechRate >= 1.0}
                >
                  <Ionicons name="add" size={16} color={speechRate >= 1.0 ? "#ccc" : "#d96709"} />
                </TouchableOpacity>
              </View>
            </View>

            {/* Speech Pitch Control */}
            <View style={styles.speechPitchContainer}>
              <Text style={styles.speechPitchLabel}>Voice Pitch:</Text>
              <View style={styles.speechPitchControls}>
                <TouchableOpacity
                  style={[styles.speechPitchButton, speechPitch <= 0.5 && styles.speechPitchButtonDisabled]}
                  onPress={() => {
                    const newPitch = Math.max(0.5, speechPitch - 0.1);
                    setSpeechPitch(Number(newPitch.toFixed(1)));
                  }}
                  disabled={speechPitch <= 0.5}
                >
                  <Ionicons name="remove" size={16} color={speechPitch <= 0.5 ? "#ccc" : "#d96709"} />
                </TouchableOpacity>
                
                <Text style={styles.speechPitchValue}>
                  {speechPitch.toFixed(1)}
                </Text>
                
                <TouchableOpacity
                  style={[styles.speechPitchButton, speechPitch >= 2.0 && styles.speechPitchButtonDisabled]}
                  onPress={() => {
                    const newPitch = Math.min(2.0, speechPitch + 0.1);
                    setSpeechPitch(Number(newPitch.toFixed(1)));
                  }}
                  disabled={speechPitch >= 2.0}
                >
                  <Ionicons name="add" size={16} color={speechPitch >= 2.0 ? "#ccc" : "#d96709"} />
                </TouchableOpacity>
              </View>
            </View>

            {/* Quick Presets */}
            <View style={styles.presetsContainer}>
              <Text style={styles.presetsLabel}>Quick Presets:</Text>
              <View style={styles.presetsRow}>
                <TouchableOpacity
                  style={[styles.presetButton, { marginRight: 8 }, speechRate === 0.75 && speechPitch === 1.0 && styles.presetButtonActive]}
                  onPress={() => {
                    setSpeechRate(0.75);
                    setSpeechPitch(1.0);
                  }}
                >
                  <Text style={[styles.presetButtonText, speechRate === 0.75 && speechPitch === 1.0 && styles.presetButtonTextActive]}>
                    Slow
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.presetButton, { marginHorizontal: 4 }, speechRate === 0.85 && speechPitch === 1.1 && styles.presetButtonActive]}
                  onPress={() => {
                    setSpeechRate(0.85);
                    setSpeechPitch(1.1);
                  }}
                >
                  <Text style={[styles.presetButtonText, speechRate === 0.85 && speechPitch === 1.1 && styles.presetButtonTextActive]}>
                    Natural
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.presetButton, { marginLeft: 8 }, speechRate === 0.95 && speechPitch === 1.2 && styles.presetButtonActive]}
                  onPress={() => {
                    setSpeechRate(0.95);
                    setSpeechPitch(1.2);
                  }}
                >
                  <Text style={[styles.presetButtonText, speechRate === 0.95 && speechPitch === 1.2 && styles.presetButtonTextActive]}>
                    Fast
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
          )}


          {/* Step Image */}
          {currentInstruction.imageUri && (
            <View style={styles.stepImageContainer}>
              <Image 
                source={{ uri: currentInstruction.imageUri }} 
                style={styles.stepImage} 
              />
            </View>
          )}

          {/* Complete Step Button */}
          <TouchableOpacity
            style={[
              styles.completeButton,
              completedSteps.has(currentStep) && styles.completeButtonCompleted
            ]}
            onPress={handleCompleteStep}
          >
            <Ionicons 
              name={completedSteps.has(currentStep) ? "checkmark-circle" : "checkmark-circle-outline"} 
              size={24} 
              color="white" 
            />
            <Text style={styles.completeButtonText}>
              {completedSteps.has(currentStep) ? "Completed" : "Mark Complete"}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Navigation Footer */}
      <View style={styles.footer}>
        {/* Previous Button */}
        <TouchableOpacity
          style={[
            styles.navButton,
            currentStep === 0 && styles.navButtonDisabled
          ]}
          onPress={handlePreviousStep}
          disabled={currentStep === 0}
        >
          <Ionicons 
            name="chevron-back" 
            size={20} 
            color={currentStep === 0 ? "#ccc" : "#FF6B35"} 
          />
          <Text style={[
            styles.navButtonText,
            { color: currentStep === 0 ? "#ccc" : "#FF6B35" }
          ]}>
            Previous
          </Text>
        </TouchableOpacity>

            {/* Review Button - Center */}
            <TouchableOpacity
              style={styles.ingredientsButton}
              onPress={() => setShowIngredients(true)}
            >
              <Ionicons name="eye" size={20} color="white" />
              <Text style={styles.ingredientsButtonText}>Review</Text>
            </TouchableOpacity>

        {/* Next/Finish Button - Right */}
        {currentStep === totalSteps - 1 ? (
          <TouchableOpacity
            style={styles.finishButton}
            onPress={handleFinishCooking}
          >
            <Ionicons name="checkmark" size={20} color="white" />
            <Text style={styles.finishButtonText}>Finish</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={styles.navButton}
            onPress={handleNextStep}
          >
            <Text style={styles.navButtonText}>Next</Text>
            <Ionicons name="chevron-forward" size={20} color="#FF6B35" />
          </TouchableOpacity>
        )}
      </View>

      {/* Review Modal */}
      {showIngredients && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Recipe Review</Text>
              <TouchableOpacity
                style={styles.modalCloseButton}
                onPress={() => setShowIngredients(false)}
              >
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.reviewContent} showsVerticalScrollIndicator={true}>
              {/* Ingredients Section */}
              <View style={styles.reviewSection}>
                <View style={styles.ingredientsHeader}>
                  <Text style={styles.reviewSectionTitle}>Ingredients ({recipe.ingredients?.length || 0})</Text>
                  
                  {/* Serving Size Selector */}
                  <View style={styles.servingSelector}>
                    <Text style={styles.servingLabel}>Servings:</Text>
                    <View style={styles.servingControls}>
                      <TouchableOpacity
                        style={[styles.servingButton, servingSize <= 1 && styles.servingButtonDisabled]}
                        onPress={() => {
                          const newSize = Math.max(1, Number(servingSize) - 1);
                          setServingSize(newSize);
                        }}
                        disabled={servingSize <= 1}
                      >
                        <Ionicons name="remove" size={16} color={servingSize <= 1 ? "#ccc" : "#FF6B35"} />
                      </TouchableOpacity>
                      
                      <Text style={styles.servingValue}>{Number(servingSize)}</Text>
                      
                      <TouchableOpacity
                        style={[styles.servingButton, servingSize >= 99 && styles.servingButtonDisabled]}
                        onPress={() => {
                          const newSize = Math.min(99, Number(servingSize) + 1);
                          setServingSize(newSize);
                        }}
                        disabled={servingSize >= 99}
                      >
                        <Ionicons name="add" size={16} color={servingSize >= 99 ? "#ccc" : "#FF6B35"} />
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
                
                {recipe.ingredients && recipe.ingredients.length > 0 ? (
                  recipe.ingredients.map((ingredient: any, index: number) => (
                    <View key={index} style={styles.ingredientItem}>
                      <Text style={styles.ingredientAmount}>
                        {calculateAdjustedAmount(ingredient)} {ingredient.unit}
                      </Text>
                      <Text style={styles.ingredientName}>{ingredient.name}</Text>
                    </View>
                  ))
                ) : (
                  <Text style={styles.emptyText}>No ingredients available</Text>
                )}
              </View>

              {/* Instructions Section */}
              <View style={styles.reviewSection}>
                <Text style={styles.reviewSectionTitle}>Cooking Steps ({recipe.instructions?.length || 0})</Text>
                {recipe.instructions && recipe.instructions.length > 0 ? (
                  recipe.instructions.map((instruction: any, index: number) => {
                    const isCompleted = completedSteps.has(index);
                    return (
                      <View key={instruction.id || index} style={[styles.stepItem, isCompleted && styles.stepItemCompleted]}>
                        <View style={[styles.stepNumberContainer, isCompleted && styles.stepNumberContainerCompleted]}>
                          <Text style={styles.stepNumber}>{index + 1}</Text>
                          {isCompleted && (
                            <Ionicons name="checkmark" size={12} color="white" style={styles.stepCheckmark} />
                          )}
                        </View>
                        <View style={styles.stepContent}>
                          <Text style={[styles.stepText, isCompleted && styles.stepTextCompleted]}>
                            {instruction.description || instruction.step || 'No description available'}
                          </Text>
                          {isCompleted && (
                            <Text style={styles.stepStatusText}>✓ Completed</Text>
                          )}
                        </View>
                      </View>
                    );
                  })
                ) : (
                  <Text style={styles.emptyText}>No instructions available</Text>
                )}
              </View>
            </ScrollView>
          </View>
        </View>
      )}

      {/* Loop Tutorial Modal */}
      <Modal
        visible={showLoopTutorial}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowLoopTutorial(false)}
      >
        <View style={styles.tutorialOverlay}>
          <View style={styles.tutorialContainer}>
            <View style={styles.tutorialHeader}>
              <Ionicons name="information-circle" size={32} color="#d96709" />
              <Text style={styles.tutorialTitle}>Loop Playback Mode</Text>
            </View>
            
            <ScrollView style={styles.tutorialContent}>
              <Text style={styles.tutorialText}>
                <Text style={styles.tutorialBold}>Loop Playback</Text> allows the app to automatically repeat the current step.
              </Text>
              
              <View style={styles.tutorialFeature}>
                <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
                <Text style={styles.tutorialFeatureText}>
                  Automatically repeats every {loopInterval} second{loopInterval !== 1 ? 's' : ''}
                </Text>
              </View>
              
              <View style={styles.tutorialFeature}>
                <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
                <Text style={styles.tutorialFeatureText}>
                  Stops after {MAX_LOOP_COUNT} repetitions (you can choose to continue)
                </Text>
              </View>
              
              <View style={styles.tutorialFeature}>
                <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
                <Text style={styles.tutorialFeatureText}>
                  Adjustable interval time (1-5 seconds)
                </Text>
              </View>
              
              <View style={styles.tutorialWarning}>
                <Ionicons name="warning" size={20} color="#FF9800" />
                <Text style={styles.tutorialWarningText}>
                  Note: Continuous playback may drain battery faster. Use when needed.
                </Text>
              </View>
            </ScrollView>
            
            <View style={styles.tutorialButtons}>
              <TouchableOpacity
                style={[styles.tutorialButton, styles.tutorialButtonSecondary, { marginRight: 6 }]}
                onPress={() => setShowLoopTutorial(false)}
              >
                <Text style={styles.tutorialButtonSecondaryText}>Maybe Later</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.tutorialButton, styles.tutorialButtonPrimary, { marginLeft: 6 }]}
                onPress={handleLoopTutorialContinue}
              >
                <Text style={styles.tutorialButtonPrimaryText}>Enable Loop</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Loop Settings Modal */}
      <Modal
        visible={showLoopSettings}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowLoopSettings(false)}
      >
        <View style={styles.settingsOverlay}>
          <View style={styles.settingsContainer}>
            <View style={styles.settingsHeader}>
              <Text style={styles.settingsTitle}>Loop Settings</Text>
              <TouchableOpacity
                style={styles.settingsCloseButton}
                onPress={() => setShowLoopSettings(false)}
              >
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>
            
            <View style={styles.settingsContent}>
              <Text style={styles.settingsLabel}>Repeat Interval</Text>
              <Text style={styles.settingsDescription}>
                Time between each repetition
              </Text>
              
              <View style={styles.intervalControls}>
                <TouchableOpacity
                  style={[styles.intervalButton, loopInterval <= 1 && styles.intervalButtonDisabled]}
                  onPress={() => {
                    const newInterval = Math.max(1, loopInterval - 1);
                    setLoopInterval(newInterval);
                  }}
                  disabled={loopInterval <= 1}
                >
                  <Ionicons name="remove" size={20} color={loopInterval <= 1 ? "#ccc" : "#d96709"} />
                </TouchableOpacity>
                
                <View style={styles.intervalValueContainer}>
                  <Text style={styles.intervalValue}>{loopInterval}</Text>
                  <Text style={styles.intervalUnit}>second{loopInterval !== 1 ? 's' : ''}</Text>
                </View>
                
                <TouchableOpacity
                  style={[styles.intervalButton, loopInterval >= 5 && styles.intervalButtonDisabled]}
                  onPress={() => {
                    const newInterval = Math.min(5, loopInterval + 1);
                    setLoopInterval(newInterval);
                  }}
                  disabled={loopInterval >= 5}
                >
                  <Ionicons name="add" size={20} color={loopInterval >= 5 ? "#ccc" : "#d96709"} />
                </TouchableOpacity>
              </View>
              
              <View style={styles.settingsInfo}>
                <Ionicons name="information-circle-outline" size={16} color="#666" />
                <Text style={styles.settingsInfoText}>
                  The app will pause after {MAX_LOOP_COUNT} repetitions and ask if you want to continue.
                </Text>
              </View>
            </View>
            
            <TouchableOpacity
              style={styles.settingsDoneButton}
              onPress={() => setShowLoopSettings(false)}
            >
              <Text style={styles.settingsDoneButtonText}>Done</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 44 : (StatusBar.currentHeight || 24) + 16,
    paddingBottom: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  headerButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: '#f8f9fa',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 16,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  progressSection: {
    backgroundColor: 'white',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  progressInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  progressText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  progressPercentage: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FF6B35',
  },
  progressBar: {
    height: 8,
    backgroundColor: 'white',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#FF6B35',
    borderRadius: 4,
  },
  content: {
    flex: 1,
  },
  stepContainer: {
    backgroundColor: 'white',
    margin: 16,
    borderRadius: 16,
    padding: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  stepNumberContainerLarge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 32,
  },
  stepNumberLarge: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#FF6B35',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#FF6B35',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  stepNumberText: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
  },
  completedBadge: {
    position: 'absolute',
    top: -8,
    right: -8,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#4CAF50',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepDescription: {
    fontSize: 18,
    color: '#333',
    lineHeight: 32,
    textAlign: 'center',
    marginBottom: 24,
  },
  swipeHint: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: '#f8f9fa',
    borderRadius: 20,
    alignSelf: 'center',
  },
  swipeHintText: {
    fontSize: 12,
    color: '#999',
    marginHorizontal: 8,
    fontWeight: '500',
  },
  stepImageContainer: {
    marginBottom: 32,
    borderRadius: 12,
    overflow: 'hidden',
  },
  stepImage: {
    width: '100%',
    height: 250,
    resizeMode: 'cover',
  },
  completeButton: {
    backgroundColor: '#FF6B35',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 20,
    marginTop: 8,
    shadowColor: '#FF6B35',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  completeButtonCompleted: {
    backgroundColor: '#4CAF50',
  },
  completeButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  navButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#FF6B35',
    backgroundColor: 'white',
  },
  navButtonDisabled: {
    borderColor: '#ccc',
    backgroundColor: '#f8f9fa',
  },
  navButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FF6B35',
    marginHorizontal: 4,
  },
  finishButton: {
    backgroundColor: '#4CAF50',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 20,
    shadowColor: '#4CAF50',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  finishButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 16,
    marginBottom: 8,
  },
  errorText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
  },
  backButton: {
    backgroundColor: '#FF6B35',
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 20,
  },
  backButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  // Ingredients Button
  ingredientsButton: {
    backgroundColor: '#FF6B35',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    shadowColor: '#FF6B35',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
    minWidth: 80,
    justifyContent: 'center',
  },
  ingredientsButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  // Ingredients Modal
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    backgroundColor: 'white',
    borderRadius: 20,
    marginHorizontal: 20,
    width: '90%',
    maxWidth: 400,
    height: '80%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  modalCloseButton: {
    padding: 4,
  },
  ingredientsList: {
    maxHeight: 400,
    padding: 20,
  },
  reviewContent: {
    padding: 20,
  },
  reviewSection: {
    marginBottom: 24,
  },
  reviewSectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
    borderBottomWidth: 2,
    borderBottomColor: '#FF6B35',
    paddingBottom: 8,
  },
  ingredientsHeader: {
    marginBottom: 16,
  },
  servingSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
  },
  servingLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  servingControls: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  servingButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#FF6B35',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  servingButtonDisabled: {
    backgroundColor: 'white',
    borderColor: '#ddd',
  },
  servingValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginHorizontal: 16,
    minWidth: 40,
    textAlign: 'center',
  },
  stepItem: {
    flexDirection: 'row',
    marginBottom: 16,
    alignItems: 'flex-start',
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#f8f9fa',
  },
  stepItemCompleted: {
    backgroundColor: '#e8f5e8',
    borderLeftWidth: 4,
    borderLeftColor: '#4CAF50',
  },
  stepNumberContainer: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#FF6B35',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    marginTop: 2,
    position: 'relative',
  },
  stepNumberContainerCompleted: {
    backgroundColor: '#4CAF50',
  },
  stepNumberCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#FF6B35',
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepNumber: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
  stepCheckmark: {
    position: 'absolute',
    top: -2,
    right: -2,
  },
  stepContent: {
    flex: 1,
  },
  stepText: {
    fontSize: 16,
    color: '#333',
    lineHeight: 24,
    marginBottom: 4,
  },
  stepTextCompleted: {
    color: '#2e7d32',
    textDecorationLine: 'line-through',
  },
  stepStatusText: {
    fontSize: 12,
    color: '#4CAF50',
    fontWeight: '600',
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    fontStyle: 'italic',
    padding: 20,
  },
  ingredientItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  ingredientAmount: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FF6B35',
    minWidth: 80,
    marginRight: 16,
  },
  ingredientName: {
    fontSize: 16,
    color: '#333',
    flex: 1,
  },
  speechControlRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  speechButtonCompact: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#ddd',
    backgroundColor: '#f8f9fa',
    marginRight: 8,
  },
  speechButtonActiveCompact: {
    backgroundColor: '#d96709',
    borderColor: '#d96709',
  },
  speechButtonTextCompact: {
    fontSize: 13,
    fontWeight: '500',
    color: '#666',
    marginLeft: 6,
  },
  speechButtonTextActiveCompact: {
    color: 'white',
  },
  stopButtonCompact: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 20,
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#ddd',
    marginRight: 8,
  },
  speechSettingsToggleButtonCompact: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  speechSettingsToggleTextCompact: {
    fontSize: 13,
    fontWeight: '500',
    color: '#666',
    marginLeft: 4,
  },
  speechSettingsContainer: {
    marginBottom: 16,
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: '#f8f9fa',
    borderRadius: 20,
    alignSelf: 'center',
    width: '100%',
  },
  speechRateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  speechRateLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginRight: 12,
  },
  speechRateControls: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  speechRateButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#d96709',
    justifyContent: 'center',
    alignItems: 'center',
  },
  speechRateButtonDisabled: {
    backgroundColor: 'white',
    borderColor: '#ddd',
  },
  speechRateValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginHorizontal: 16,
    minWidth: 50,
    textAlign: 'center',
  },
  speechPitchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  speechPitchLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginRight: 12,
  },
  speechPitchControls: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  speechPitchButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#d96709',
    justifyContent: 'center',
    alignItems: 'center',
  },
  speechPitchButtonDisabled: {
    backgroundColor: 'white',
    borderColor: '#ddd',
  },
  speechPitchValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginHorizontal: 16,
    minWidth: 50,
    textAlign: 'center',
  },
  presetsContainer: {
    alignItems: 'center',
  },
  presetsLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginBottom: 8,
  },
  presetsRow: {
    flexDirection: 'row',
  },
  presetButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 16,
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#ddd',
    minWidth: 70,
    alignItems: 'center',
  },
  presetButtonActive: {
    backgroundColor: '#d96709',
    borderColor: '#d96709',
  },
  presetButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
  },
  presetButtonTextActive: {
    color: 'white',
  },
  loopControlContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  loopButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#d96709',
    backgroundColor: 'white',
    minWidth: 120,
  },
  loopButtonActive: {
    backgroundColor: '#d96709',
    borderColor: '#d96709',
  },
  loopButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#d96709',
    marginLeft: 6,
  },
  loopButtonTextActive: {
    color: 'white',
  },
  loopButtonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loopSettingsButton: {
    marginLeft: 12,
    padding: 8,
    borderRadius: 20,
    backgroundColor: '#FFF3E0',
  },
  loopInfoContainer: {
    marginTop: 8,
    alignItems: 'center',
  },
  loopHint: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
  },
  loopCountText: {
    fontSize: 11,
    color: '#999',
    marginTop: 4,
  },
  // Tutorial Modal Styles
  tutorialOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  tutorialContainer: {
    backgroundColor: 'white',
    borderRadius: 20,
    width: '100%',
    maxWidth: 400,
    maxHeight: '80%',
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  tutorialHeader: {
    alignItems: 'center',
    marginBottom: 20,
  },
  tutorialTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 12,
  },
  tutorialContent: {
    maxHeight: 300,
  },
  tutorialText: {
    fontSize: 16,
    color: '#666',
    lineHeight: 24,
    marginBottom: 20,
  },
  tutorialBold: {
    fontWeight: '600',
    color: '#333',
  },
  tutorialFeature: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  tutorialFeatureText: {
    flex: 1,
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
    lineHeight: 20,
  },
  tutorialWarning: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 16,
    padding: 12,
    backgroundColor: '#FFF3E0',
    borderRadius: 8,
  },
  tutorialWarningText: {
    flex: 1,
    fontSize: 13,
    color: '#E65100',
    marginLeft: 8,
    lineHeight: 18,
  },
  tutorialButtons: {
    flexDirection: 'row',
    marginTop: 24,
  },
  tutorialButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  tutorialButtonSecondary: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  tutorialButtonSecondaryText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  tutorialButtonPrimary: {
    backgroundColor: '#d96709',
  },
  tutorialButtonPrimaryText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
  // Settings Modal Styles
  settingsOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  settingsContainer: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
    maxHeight: '60%',
  },
  settingsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  settingsTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  settingsCloseButton: {
    padding: 4,
  },
  settingsContent: {
    marginBottom: 24,
  },
  settingsLabel: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  settingsDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 20,
  },
  intervalControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  intervalButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'white',
    borderWidth: 2,
    borderColor: '#d96709',
    justifyContent: 'center',
    alignItems: 'center',
  },
  intervalButtonDisabled: {
    backgroundColor: 'white',
    borderColor: '#ddd',
  },
  intervalValueContainer: {
    alignItems: 'center',
    marginHorizontal: 24,
    minWidth: 80,
  },
  intervalValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#d96709',
  },
  intervalUnit: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  settingsInfo: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 12,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
  },
  settingsInfoText: {
    flex: 1,
    fontSize: 12,
    color: '#666',
    marginLeft: 8,
    lineHeight: 18,
  },
  settingsDoneButton: {
    backgroundColor: '#d96709',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  settingsDoneButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
});

export default CookStepScreen;
