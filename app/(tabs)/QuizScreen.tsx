import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Alert, Animated, Easing } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import * as Animatable from 'react-native-animatable';

interface Question {
  question: string;
  options: string[];
  correctAnswer: string;
  image?: string;
  historicalFact?: string;
}

interface Quiz {
  title: string;
  questions: Question[];
  reward: string;
}

const historicalQuizzes: Quiz[] = [
  {
    title: "Ancient Wonders Challenge",
    reward: "History Scholar Badge",
    questions: [
      {
        question: "Which ancient wonder was located in Alexandria?",
        options: ["Colossus of Rhodes", "Hanging Gardens", "Lighthouse of Alexandria", "Great Pyramid"],
        correctAnswer: "Lighthouse of Alexandria",
        image: "https://upload.wikimedia.org/wikipedia/commons/thumb/2/22/Alexandria-Lighthouse.jpg/800px-Alexandria-Lighthouse.jpg",
        historicalFact: "The Lighthouse of Alexandria was estimated to be over 100 meters tall!"
      },
      {
        question: "The Colosseum was primarily used for:",
        options: ["Political Debates", "Gladiatorial Contests", "Religious Ceremonies", "Market Trading"],
        correctAnswer: "Gladiatorial Contests",
        image: "https://upload.wikimedia.org/wikipedia/commons/thumb/5/53/Colosseum_in_Rome%2C_Italy_-_April_2007.jpg/800px-Colosseum_in_Rome%2C_Italy_-_April_2007.jpg"
      },
      // Add more questions...
    ]
  },
  // Add more quizzes...
];

const QuizScreen = () => {
  const [currentQuizIndex, setCurrentQuizIndex] = useState(0);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [quizFinished, setQuizFinished] = useState(false);
  const [timeLeft, setTimeLeft] = useState(30);
  const progressAnim = useState(new Animated.Value(0))[0];

  const currentQuiz = historicalQuizzes[currentQuizIndex];
  const currentQuestion = currentQuiz.questions[currentQuestionIndex];

  useEffect(() => {
    if (!quizFinished && timeLeft > 0) {
      const timer = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 500);
      return () => clearInterval(timer);
    } else if (timeLeft === 0) {
      handleAnswerSelect(null);
    }
  }, [timeLeft, quizFinished]);

  useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: (currentQuestionIndex + 1) / currentQuiz.questions.length,
      duration: 500,
      easing: Easing.linear,
      useNativeDriver: false,
    }).start();
  }, [currentQuestionIndex]);

  const handleAnswerSelect = (answer: string | null) => {
    setSelectedAnswer(answer);
    
    if (answer === currentQuestion.correctAnswer) {
      setScore((prev) => prev + 100);
    }

    setTimeout(() => {
      if (currentQuestionIndex < currentQuiz.questions.length - 1) {
        setCurrentQuestionIndex((prev) => prev + 1);
        setTimeLeft(30);
        setSelectedAnswer(null);
      } else {
        setQuizFinished(true);
      }
    }, 1500);
  };

  const resetQuiz = () => {
    setCurrentQuestionIndex(0);
    setScore(0);
    setQuizFinished(false);
    setTimeLeft(30);
    setSelectedAnswer(null);
  };

  const ProgressBar = () => {
    const width = progressAnim.interpolate({
      inputRange: [0, 1],
      outputRange: ['0%', '100%'],
    });

    return (
      <View style={styles.progressContainer}>
        <Animated.View style={[styles.progressBar, { width }]} />
      </View>
    );
  };

  if (quizFinished) {
    return (
      <LinearGradient colors={['#2E3047', '#43455C']} style={styles.container}>
        <Animatable.View animation="zoomIn" style={styles.resultContainer}>
          <MaterialIcons name="emoji-events" size={80} color="#FFD700" />
          <Text style={styles.resultTitle}>Quiz Complete!</Text>
          <Text style={styles.scoreText}>Your Score: {score}</Text>
          <Text style={styles.rewardText}>Earned: {currentQuiz.reward}</Text>
          
          <TouchableOpacity style={styles.retryButton} onPress={resetQuiz}>
            <Text style={styles.buttonText}>Retry Quiz</Text>
          </TouchableOpacity>
        </Animatable.View>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={['#2E3047', '#43455C']} style={styles.container}>
      <ProgressBar />
      
      <View style={styles.header}>
        <Text style={styles.quizTitle}>{currentQuiz.title}</Text>
        <View style={styles.scoreContainer}>
          <MaterialIcons name="star" size={24} color="#FFD700" />
          <Text style={styles.scoreText}>{score}</Text>
        </View>
      </View>

      <View style={styles.timerContainer}>
        <Text style={styles.timerText}>Time Left: {timeLeft}s</Text>
        <View style={[styles.timerBar, { width: `${(timeLeft/30)*100}%` }]} />
      </View>

      <Animatable.View animation="fadeInUp" style={styles.questionContainer}>
        {currentQuestion.image && (
          <Image source={{ uri: currentQuestion.image }} style={styles.questionImage} />
        )}
        
        <Text style={styles.questionText}>{currentQuestion.question}</Text>

        {currentQuestion.options.map((option, index) => (
          <TouchableOpacity
            key={index}
            style={[
              styles.optionButton,
              selectedAnswer === option && {
                backgroundColor: option === currentQuestion.correctAnswer ? '#4CAF50' : '#F44336'
              }
            ]}
            onPress={() => handleAnswerSelect(option)}
            disabled={selectedAnswer !== null}
          >
            <Text style={styles.optionText}>{option}</Text>
            {selectedAnswer === option && (
              <MaterialIcons 
                name={option === currentQuestion.correctAnswer ? "check-circle" : "cancel"} 
                size={24} 
                color="white" 
                style={styles.optionIcon} 
              />
            )}
          </TouchableOpacity>
        ))}
      </Animatable.View>

      <View style={styles.questionCounter}>
        <Text style={styles.counterText}>
          Question {currentQuestionIndex + 1} of {currentQuiz.questions.length}
        </Text>
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  progressContainer: {
    height: 5,
    backgroundColor: '#3B3D56',
    borderRadius: 5,
    marginVertical: 10,
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#4CAF50',
    borderRadius: 5,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  quizTitle: {
    color: 'white',
    fontSize: 24,
    fontFamily: 'Inter-SemiBold',
    maxWidth: '70%',
  },
  scoreContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#3B3D56',
    padding: 10,
    borderRadius: 20,
  },
  scoreText: {
    color: 'white',
    fontSize: 18,
    marginLeft: 5,
    fontFamily: 'Inter-SemiBold',
  },
  timerContainer: {
    marginBottom: 20,
  },
  timerText: {
    color: 'white',
    fontSize: 16,
    marginBottom: 5,
  },
  timerBar: {
    height: 4,
    backgroundColor: '#4CAF50',
    borderRadius: 2,
  },
  questionContainer: {
    backgroundColor: '#3B3D56',
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
  },
  questionImage: {
    width: '100%',
    height: 200,
    borderRadius: 15,
    marginBottom: 15,
  },
  questionText: {
    color: 'white',
    fontSize: 20,
    marginBottom: 20,
    fontFamily: 'Inter-SemiBold',
  },
  optionButton: {
    backgroundColor: '#43455C',
    padding: 15,
    borderRadius: 12,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  optionText: {
    color: 'white',
    fontSize: 16,
    flex: 1,
    fontFamily: 'Inter-Regular',
  },
  optionIcon: {
    marginLeft: 10,
  },
  questionCounter: {
    alignItems: 'center',
    marginTop: 10,
  },
  counterText: {
    color: 'white',
    fontSize: 16,
    fontFamily: 'Inter-Regular',
  },
  resultContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  resultTitle: {
    color: 'white',
    fontSize: 32,
    fontFamily: 'Inter-Bold',
    marginVertical: 20,
  },
  rewardText: {
    color: '#FFD700',
    fontSize: 24,
    fontFamily: 'Inter-SemiBold',
    marginBottom: 40,
  },
  retryButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 15,
    paddingHorizontal: 40,
    borderRadius: 30,
  },
  buttonText: {
    color: 'white',
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
  },
});

export default QuizScreen;