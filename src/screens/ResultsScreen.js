import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Share
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../context/ThemeContext';
import { 
  ChevronDownIcon, ChevronRightIcon, RefreshIcon, HomeIcon, ShareIcon,
  ScoreResultIcon, getScoreIcon 
} from '../components/Icons';

// Función auxiliar para obtener el color según la puntuación
const getScoreColor = (score, theme) => {
  if (score >= 70) return theme.colors.success;
  if (score >= 50) return theme.colors.warning;
  return theme.colors.error;
};

export default function ResultsScreen({ route, navigation }) {
  const { theme } = useTheme();
  const { result } = route.params;
  const [showIncorrect, setShowIncorrect] = useState(true);
  const [showUnanswered, setShowUnanswered] = useState(true);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `¡He completado el test "${result.testName}" en Testeate!\n\nResultado: ${result.score.toFixed(1)}%\nCorrectas: ${result.correct}\nIncorrectas: ${result.incorrect}\nTiempo: ${formatTime(result.timeSpent)}`,
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  const handleReviewAnswers = () => {
    navigation.navigate('ReviewAnswers', { details: result.details });
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.colors.background }]} edges={['bottom']}>
      <ScrollView 
        style={[styles.container, { backgroundColor: theme.colors.background }]} 
        nestedScrollEnabled={true}
        contentContainerStyle={styles.contentContainer}
      >
      {/* Score Card */}
      <View style={[styles.scoreCard, { borderColor: theme.colors.success, backgroundColor: theme.colors.card }]}>
        <View style={styles.emoji}>
          <ScoreResultIcon size={48} color={getScoreColor(result.score, theme)} />
        </View>
        <Text style={[styles.score, { color: theme.colors.success }]}>
          {result.score.toFixed(1)}%
        </Text>
        <Text style={[styles.testName, { color: theme.colors.text }]}>{result.testName}</Text>
        <Text style={[styles.modeText, { color: theme.colors.textSecondary }]}>
          Modo: {result.mode === 'practice' ? 'Práctica' : 'Examen'}
        </Text>
      </View>

      {/* Stats */}
      <View style={styles.statsContainer}>
        <View style={[styles.statItem, { backgroundColor: theme.colors.card }]}>
          <View style={[styles.statIcon, { backgroundColor: theme.colors.successLight }]}>
            <Text style={[styles.statIconText, { color: theme.colors.success }]}>✓</Text>
          </View>
          <Text style={[styles.statValue, { color: theme.colors.text }]}>{result.correct}</Text>
          <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>Correctas</Text>
        </View>

        <View style={[styles.statItem, { backgroundColor: theme.colors.card }]}>
          <View style={[styles.statIcon, { backgroundColor: theme.colors.errorLight }]}>
            <Text style={[styles.statIconText, { color: theme.colors.error }]}>✗</Text>
          </View>
          <Text style={[styles.statValue, { color: theme.colors.text }]}>{result.incorrect}</Text>
          <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>Incorrectas</Text>
        </View>

        <View style={[styles.statItem, { backgroundColor: theme.colors.card }]}>
          <View style={[styles.statIcon, { backgroundColor: theme.colors.warningLight }]}>
            <Text style={[styles.statIconText, { color: theme.colors.warning }]}>-</Text>
          </View>
          <Text style={[styles.statValue, { color: theme.colors.text }]}>{result.unanswered}</Text>
          <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>Sin responder</Text>
        </View>
      </View>

      {/* Additional Info */}
      <View style={[styles.infoCard, { backgroundColor: theme.colors.card }]}>
        <View style={styles.infoRow}>
          <Text style={[styles.infoLabel, { color: theme.colors.textSecondary }]}>Total de preguntas:</Text>
          <Text style={[styles.infoValue, { color: theme.colors.text }]}>{result.totalQuestions}</Text>
        </View>
        <View style={[styles.infoRow, { borderTopColor: theme.colors.borderLight }]}>
          <Text style={[styles.infoLabel, { color: theme.colors.textSecondary }]}>Tiempo empleado:</Text>
          <Text style={[styles.infoValue, { color: theme.colors.text }]}>{formatTime(result.timeSpent)}</Text>
        </View>
        <View style={[styles.infoRow, { borderTopColor: theme.colors.borderLight }]}>
          <Text style={[styles.infoLabel, { color: theme.colors.textSecondary }]}>Promedio por pregunta:</Text>
          <Text style={[styles.infoValue, { color: theme.colors.text }]}>
            {(result.timeSpent / result.totalQuestions).toFixed(1)}s
          </Text>
        </View>
      </View>

      {/* Performance Message */}
      <View style={[styles.messageCard, { backgroundColor: getScoreColor(result.score, theme) + '15' }]}>
        <Text style={[styles.messageText, { color: getScoreColor(result.score, theme) }]}>
          {result.score >= 90
            ? '¡Excelente! Estás muy bien preparado/a.'
            : result.score >= 70
            ? '¡Buen trabajo! Sigue así.'
            : result.score >= 50
            ? 'Vas por buen camino. Repasa los temas con errores.'
            : 'No te desanimes. La práctica hace al maestro.'}
        </Text>
      </View>

      {/* Review incorrect answers */}
      {result.incorrect > 0 && (
        <View style={[styles.reviewSection, { backgroundColor: theme.colors.card }]}>
          <TouchableOpacity 
            style={[styles.sectionHeader, { backgroundColor: theme.colors.cardHighlight }]}
            onPress={() => setShowIncorrect(!showIncorrect)}
            activeOpacity={0.7}
          >
            <View style={styles.sectionHeaderLeft}>
              <View style={[styles.sectionIconWrong, { backgroundColor: theme.colors.errorLight }]}>
                <Text style={styles.sectionIconText}>✗</Text>
              </View>
              <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Preguntas falladas ({result.incorrect})</Text>
            </View>
            {showIncorrect ? <ChevronDownIcon size={20} color={theme.colors.textSecondary} /> : <ChevronRightIcon size={20} color={theme.colors.textSecondary} />}
          </TouchableOpacity>
          {showIncorrect && result.details
            .filter(d => d.userAnswer && !d.isCorrect)
            .map((detail, index) => (
              <View key={`detail-${detail.questionNumber}-${index}`} style={[styles.reviewItem, { backgroundColor: theme.colors.card, borderLeftColor: theme.colors.error }]}>
                <View style={styles.reviewQuestionHeader}>
                  <View style={[styles.reviewQuestionBadge, { backgroundColor: theme.colors.error }]}>
                    <Text style={styles.reviewQuestionBadgeText}>{detail.questionNumber}</Text>
                  </View>
                </View>
                <Text style={[styles.reviewQuestion, { color: theme.colors.text }]}>
                  {detail.questionText}
                </Text>
                <View style={styles.reviewOptions}>
                  {detail.options?.map((opt, optIndex) => {
                    const letter = String.fromCharCode(97 + optIndex);
                    const isUserAnswer = detail.userAnswer === letter;
                    const isCorrectAnswer = detail.correctAnswer === letter;
                    const optionText = typeof opt === 'object' ? opt.text : opt;
                    
                    return (
                      <View 
                        key={`opt-${optIndex}`}
                        style={[
                          styles.reviewOption,
                          { backgroundColor: theme.colors.cardHighlight },
                          isCorrectAnswer && [styles.reviewOptionCorrect, { backgroundColor: theme.colors.successLight, borderColor: theme.colors.success }],
                          isUserAnswer && !isCorrectAnswer && [styles.reviewOptionWrong, { backgroundColor: theme.colors.errorLight, borderColor: theme.colors.error }]
                        ]}
                      >
                        <View style={[
                          styles.reviewOptionLetter,
                          { backgroundColor: theme.colors.badge },
                          isCorrectAnswer && { backgroundColor: theme.colors.success },
                          isUserAnswer && !isCorrectAnswer && { backgroundColor: theme.colors.error }
                        ]}>
                          <Text style={[
                            styles.reviewOptionLetterText,
                            { color: theme.colors.textSecondary },
                            (isCorrectAnswer || isUserAnswer) && styles.reviewOptionLetterTextHighlight
                          ]}>{letter.toUpperCase()}</Text>
                        </View>
                        <Text style={[
                          styles.reviewOptionText,
                          { color: theme.colors.text },
                          isCorrectAnswer && [styles.reviewOptionTextCorrect, { color: theme.colors.success }],
                          isUserAnswer && !isCorrectAnswer && [styles.reviewOptionTextWrong, { color: theme.colors.error }]
                        ]}>
                          {optionText}
                        </Text>
                        {isCorrectAnswer && <Text style={[styles.reviewBadgeCorrect, { color: theme.colors.success }]}>✓</Text>}
                        {isUserAnswer && !isCorrectAnswer && <Text style={[styles.reviewBadgeWrong, { color: theme.colors.error }]}>✗</Text>}
                      </View>
                    );
                  })}
                </View>
              </View>
            ))}
        </View>
      )}

      {/* Review unanswered questions */}
      {result.unanswered > 0 && (
        <View style={[styles.reviewSection, { backgroundColor: theme.colors.card }]}>
          <TouchableOpacity 
            style={[styles.sectionHeader, { backgroundColor: theme.colors.cardHighlight }]}
            onPress={() => setShowUnanswered(!showUnanswered)}
            activeOpacity={0.7}
          >
            <View style={styles.sectionHeaderLeft}>
              <View style={[styles.sectionIconUnanswered, { backgroundColor: theme.colors.warningLight }]}>
                <Text style={styles.sectionIconText}>?</Text>
              </View>
              <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Sin responder ({result.unanswered})</Text>
            </View>
            {showUnanswered ? <ChevronDownIcon size={20} color={theme.colors.textSecondary} /> : <ChevronRightIcon size={20} color={theme.colors.textSecondary} />}
          </TouchableOpacity>
          {showUnanswered && result.details
            .filter(d => !d.userAnswer)
            .map((detail, index) => (
              <View key={`unanswered-${detail.questionNumber}-${index}`} style={[styles.reviewItem, { backgroundColor: theme.colors.card, borderLeftColor: theme.colors.warning }]}>
                <View style={styles.reviewQuestionHeader}>
                  <View style={[styles.reviewQuestionBadge, { backgroundColor: theme.colors.warning }]}>
                    <Text style={styles.reviewQuestionBadgeText}>{detail.questionNumber}</Text>
                  </View>
                </View>
                <Text style={[styles.reviewQuestion, { color: theme.colors.text }]}>
                  {detail.questionText}
                </Text>
                <View style={styles.reviewOptions}>
                  {detail.options?.map((opt, optIndex) => {
                    const letter = String.fromCharCode(97 + optIndex);
                    const isCorrectAnswer = detail.correctAnswer === letter;
                    const optionText = typeof opt === 'object' ? opt.text : opt;
                    
                    return (
                      <View 
                        key={`opt-${optIndex}`}
                        style={[
                          styles.reviewOption,
                          { backgroundColor: theme.colors.cardHighlight },
                          isCorrectAnswer && [styles.reviewOptionCorrect, { backgroundColor: theme.colors.successLight, borderColor: theme.colors.success }]
                        ]}
                      >
                        <View style={[
                          styles.reviewOptionLetter,
                          { backgroundColor: theme.colors.badge },
                          isCorrectAnswer && { backgroundColor: theme.colors.success }
                        ]}>
                          <Text style={[
                            styles.reviewOptionLetterText,
                            { color: theme.colors.textSecondary },
                            isCorrectAnswer && styles.reviewOptionLetterTextHighlight
                          ]}>{letter.toUpperCase()}</Text>
                        </View>
                        <Text style={[
                          styles.reviewOptionText,
                          { color: theme.colors.text },
                          isCorrectAnswer && [styles.reviewOptionTextCorrect, { color: theme.colors.success }]
                        ]}>
                          {optionText}
                        </Text>
                        {isCorrectAnswer && <Text style={[styles.reviewBadgeCorrect, { color: theme.colors.success }]}>✓ Correcta</Text>}
                      </View>
                    );
                  })}
                </View>
              </View>
            ))}
        </View>
      )}

      {/* Actions */}
      <View style={styles.actionsContainer}>
        <TouchableOpacity style={[styles.shareButton, { backgroundColor: theme.colors.primary }]} onPress={handleShare}>
          <View style={styles.buttonContent}>
            <ShareIcon size={18} color={theme.colors.textInverse} />
            <Text style={[styles.shareButtonText, { color: theme.colors.textInverse }]}> Compartir resultado</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.retryButton, { backgroundColor: theme.colors.cardHighlight, borderColor: theme.colors.border }]}
          onPress={() => navigation.replace('TakeTest', { testId: result.testId, mode: result.mode })}
        >
          <View style={styles.buttonContent}>
            <RefreshIcon size={18} color={theme.colors.text} />
            <Text style={[styles.retryButtonText, { color: theme.colors.text }]}> Repetir test</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.homeButton, { backgroundColor: theme.colors.cardHighlight, borderColor: theme.colors.border }]}
          onPress={() => navigation.popToTop()}
        >
          <View style={styles.buttonContent}>
            <HomeIcon size={18} color={theme.colors.text} />
            <Text style={[styles.homeButtonText, { color: theme.colors.text }]}> Volver al inicio</Text>
          </View>
        </TouchableOpacity>
      </View>
    </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  contentContainer: {
    paddingBottom: 40,
  },
  scoreCard: {
    margin: 16,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    borderWidth: 3,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  emoji: {
    marginBottom: 8,
  },
  score: {
    fontSize: 56,
    fontWeight: 'bold',
  },
  testName: {
    fontSize: 18,
    marginTop: 8,
    textAlign: 'center',
  },
  modeText: {
    fontSize: 14,
    marginTop: 4,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  statItem: {
    alignItems: 'center',
    borderRadius: 12,
    padding: 16,
    flex: 1,
    marginHorizontal: 4,
  },
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  correctIcon: {
  },
  incorrectIcon: {
  },
  unansweredIcon: {
  },
  statIconText: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  statLabel: {
    fontSize: 12,
    marginTop: 4,
  },
  infoCard: {
    marginHorizontal: 16,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
  },
  infoLabel: {
    fontSize: 14,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  messageCard: {
    marginHorizontal: 16,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  messageText: {
    fontSize: 16,
    textAlign: 'center',
    fontWeight: '500',
  },
  reviewSection: {
    marginHorizontal: 16,
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
    padding: 12,
    borderRadius: 12,
  },
  sectionHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  expandIcon: {
    fontSize: 14,
    marginLeft: 10,
  },
  sectionIconWrong: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  sectionIconUnanswered: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  sectionIconText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
  },
  reviewItem: {
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  reviewItemUnanswered: {
  },
  reviewQuestionHeader: {
    marginBottom: 8,
  },
  reviewQuestionBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  reviewQuestionBadgeUnanswered: {
  },
  reviewQuestionBadgeText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  reviewQuestion: {
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 12,
  },
  reviewAnswers: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  reviewWrong: {
    fontSize: 12,
  },
  reviewCorrect: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  reviewOptions: {
    marginTop: 4,
  },
  reviewOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginBottom: 8,
    borderRadius: 10,
  },
  reviewOptionCorrect: {
    borderWidth: 2,
  },
  reviewOptionWrong: {
    borderWidth: 2,
  },
  reviewOptionLetter: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  reviewOptionLetterCorrect: {
  },
  reviewOptionLetterWrong: {
  },
  reviewOptionLetterText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  reviewOptionLetterTextHighlight: {
    color: '#fff',
  },
  reviewOptionText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  },
  reviewOptionTextCorrect: {
    fontWeight: '600',
  },
  reviewOptionTextWrong: {
    textDecorationLine: 'line-through',
    opacity: 0.8,
  },
  reviewBadgeCorrect: {
    fontSize: 14,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  reviewBadgeWrong: {
    fontSize: 14,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  moreText: {
    textAlign: 'center',
    fontStyle: 'italic',
    marginTop: 8,
  },
  actionsContainer: {
    padding: 16,
    paddingBottom: 32,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  shareButton: {
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  shareButtonText: {
    fontSize: 16,
    fontWeight: '700',
  },
  retryButton: {
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    borderWidth: 2,
  },
  retryButtonText: {
    fontSize: 16,
    fontWeight: '700',
  },
  homeButton: {
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
    borderWidth: 2,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  homeButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});
