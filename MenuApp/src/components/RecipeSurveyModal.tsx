import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export type TasteRating = 'like' | 'neutral' | 'dislike';
export type DifficultyRating = 'easy' | 'medium' | 'hard';
export type WillMakeAgain = 'yes' | 'no';

export interface SurveyData {
  taste: TasteRating | null;
  difficulty: DifficultyRating | null;
  willMakeAgain: WillMakeAgain | null;
}

interface RecipeSurveyModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (data: SurveyData) => void;
  recipeTitle?: string;
}

const RecipeSurveyModal: React.FC<RecipeSurveyModalProps> = ({
  visible,
  onClose,
  onSubmit,
  recipeTitle,
}) => {
  const [taste, setTaste] = useState<TasteRating | null>(null);
  const [difficulty, setDifficulty] = useState<DifficultyRating | null>(null);
  const [willMakeAgain, setWillMakeAgain] = useState<WillMakeAgain | null>(null);

  const handleSubmit = () => {
    if (taste && difficulty && willMakeAgain) {
      onSubmit({ taste, difficulty, willMakeAgain });
      // Reset form
      setTaste(null);
      setDifficulty(null);
      setWillMakeAgain(null);
      onClose();
    }
  };

  const handleClose = () => {
    // Reset form when closing
    setTaste(null);
    setDifficulty(null);
    setWillMakeAgain(null);
    onClose();
  };

  const canSubmit = taste !== null && difficulty !== null && willMakeAgain !== null;

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={handleClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          <View style={styles.header}>
            <Text style={styles.title}>Recipe Survey</Text>
            <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
              <Ionicons name="close" size={20} color="#666" />
            </TouchableOpacity>
          </View>

          {recipeTitle && (
            <Text style={styles.recipeTitle}>{recipeTitle}</Text>
          )}

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {/* Taste Question */}
            <View style={styles.questionSection}>
              <Text style={styles.questionText}>How did it taste?</Text>
              <View style={styles.optionsRow}>
                <TouchableOpacity
                  style={[
                    styles.optionButton,
                    taste === 'dislike' && styles.optionButtonActive,
                  ]}
                  onPress={() => setTaste('dislike')}
                >
                  <Ionicons
                    name="sad"
                    size={20}
                    color={taste === 'dislike' ? '#fff' : '#FF6B35'}
                  />
                  <Text
                    style={[
                      styles.optionText,
                      taste === 'dislike' && styles.optionTextActive,
                    ]}
                  >
                    Dislike
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.optionButton,
                    taste === 'neutral' && styles.optionButtonActive,
                  ]}
                  onPress={() => setTaste('neutral')}
                >
                  <Ionicons
                    name="remove-circle-outline"
                    size={20}
                    color={taste === 'neutral' ? '#fff' : '#666'}
                  />
                  <Text
                    style={[
                      styles.optionText,
                      taste === 'neutral' && styles.optionTextActive,
                    ]}
                  >
                    Neutral
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.optionButton,
                    taste === 'like' && styles.optionButtonActive,
                  ]}
                  onPress={() => setTaste('like')}
                >
                  <Ionicons
                    name="happy"
                    size={20}
                    color={taste === 'like' ? '#fff' : '#4CAF50'}
                  />
                  <Text
                    style={[
                      styles.optionText,
                      taste === 'like' && styles.optionTextActive,
                    ]}
                  >
                    Like
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Difficulty Question */}
            <View style={styles.questionSection}>
              <Text style={styles.questionText}>How difficult was it?</Text>
              <View style={styles.optionsRow}>
                <TouchableOpacity
                  style={[
                    styles.optionButton,
                    difficulty === 'easy' && styles.optionButtonActive,
                  ]}
                  onPress={() => setDifficulty('easy')}
                >
                  <Ionicons
                    name="checkmark-circle"
                    size={20}
                    color={difficulty === 'easy' ? '#fff' : '#4CAF50'}
                  />
                  <Text
                    style={[
                      styles.optionText,
                      difficulty === 'easy' && styles.optionTextActive,
                    ]}
                  >
                    Easy
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.optionButton,
                    difficulty === 'medium' && styles.optionButtonActive,
                  ]}
                  onPress={() => setDifficulty('medium')}
                >
                  <Ionicons
                    name="remove-circle"
                    size={20}
                    color={difficulty === 'medium' ? '#fff' : '#FFA500'}
                  />
                  <Text
                    style={[
                      styles.optionText,
                      difficulty === 'medium' && styles.optionTextActive,
                    ]}
                  >
                    Medium
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.optionButton,
                    difficulty === 'hard' && styles.optionButtonActive,
                  ]}
                  onPress={() => setDifficulty('hard')}
                >
                  <Ionicons
                    name="alert-circle"
                    size={20}
                    color={difficulty === 'hard' ? '#fff' : '#FF6B35'}
                  />
                  <Text
                    style={[
                      styles.optionText,
                      difficulty === 'hard' && styles.optionTextActive,
                    ]}
                  >
                    Hard
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Will Make Again Question */}
            <View style={styles.questionSection}>
              <Text style={styles.questionText}>Will you make it again?</Text>
              <View style={styles.optionsRow}>
                <TouchableOpacity
                  style={[
                    styles.optionButton,
                    styles.optionButtonWide,
                    willMakeAgain === 'yes' && styles.optionButtonActive,
                  ]}
                  onPress={() => setWillMakeAgain('yes')}
                >
                  <Ionicons
                    name="checkmark-circle"
                    size={20}
                    color={willMakeAgain === 'yes' ? '#fff' : '#4CAF50'}
                  />
                  <Text
                    style={[
                      styles.optionText,
                      willMakeAgain === 'yes' && styles.optionTextActive,
                    ]}
                  >
                    Yes
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.optionButton,
                    styles.optionButtonWide,
                    willMakeAgain === 'no' && styles.optionButtonActive,
                  ]}
                  onPress={() => setWillMakeAgain('no')}
                >
                  <Ionicons
                    name="close-circle"
                    size={20}
                    color={willMakeAgain === 'no' ? '#fff' : '#FF6B35'}
                  />
                  <Text
                    style={[
                      styles.optionText,
                      willMakeAgain === 'no' && styles.optionTextActive,
                    ]}
                  >
                    No
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>

          <View style={styles.footer}>
            <TouchableOpacity
              style={[styles.submitButton, !canSubmit && styles.submitButtonDisabled]}
              onPress={handleSubmit}
              disabled={!canSubmit}
            >
              <Text style={[styles.submitButtonText, !canSubmit && styles.submitButtonTextDisabled]}>
                Submit
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    backgroundColor: 'white',
    borderRadius: 20,
    width: '90%',
    maxWidth: 500,
    maxHeight: '85%',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  title: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#333',
  },
  closeButton: {
    padding: 4,
  },
  recipeTitle: {
    fontSize: 14,
    color: '#666',
    paddingHorizontal: 16,
    paddingTop: 6,
    paddingBottom: 4,
    fontStyle: 'italic',
  },
  content: {
    padding: 16,
    maxHeight: 400,
  },
  questionSection: {
    marginBottom: 20,
  },
  questionText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  optionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  optionButton: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderRadius: 10,
    backgroundColor: '#f8f9fa',
    borderWidth: 2,
    borderColor: '#e0e0e0',
    minHeight: 70,
  },
  optionButtonWide: {
    flex: 1,
  },
  optionButtonActive: {
    backgroundColor: '#d96709',
    borderColor: '#d96709',
  },
  optionText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
    marginTop: 6,
  },
  optionTextActive: {
    color: '#fff',
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  submitButton: {
    backgroundColor: '#d96709',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitButtonDisabled: {
    backgroundColor: '#ccc',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  submitButtonTextDisabled: {
    color: '#999',
  },
});

export default RecipeSurveyModal;

