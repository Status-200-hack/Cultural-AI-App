<<<<<<< HEAD
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  ScrollView,
  ActivityIndicator,
  Alert,
  StyleSheet,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import * as Speech from "expo-speech";
import * as GoogleGenerativeAI from "@google/generative-ai";
import { MaterialIcons } from "@expo/vector-icons";

const API_KEY = "AIzaSyBNiU6meGclnmMdC23YYs9rCccTXicz-tw";

type LanguageCode = "en" | "hi" | "mr";

interface LanguageConfig {
  title: string;
  description: string;
  analyze: string;
  upload: string;
  capture: string;
  remove: string;
  resultTitle: string;
  readAloud: string;
  stop: string;
  name: string;
  origin: string;
  significance: string;
  age: string;
  authenticity: string;
  replica: string;
  uploadFirst: string;
  error: string;
}

interface ResultItem {
  label: string;
  value: string;
}

const DiscoverArtifact: React.FC = () => {
  const [image, setImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [resultItems, setResultItems] = useState<ResultItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isReading, setIsReading] = useState(false);
  const [language, setLanguage] = useState<LanguageCode>("en");

  const languageConfig: Record<LanguageCode, LanguageConfig> = {
    en: {
      title: "Discover Artifacts",
      description: "Upload or capture images of artifacts to uncover their history using AI.",
      analyze: "Analyze",
      upload: "Upload Image",
      capture: "Capture Image",
      remove: "Remove Image",
      resultTitle: "Analysis Result",
      readAloud: "Read Aloud",
      stop: "Stop",
      name: "Name",
      origin: "Origin",
      significance: "Cultural Significance",
      age: "Estimated Age",
      authenticity: "Authenticity",
      replica: "Replica?",
      uploadFirst: "Please upload or capture an image first.",
      error: "Failed to analyze the image. Please try again."
    },
    hi: {
      title: "कलाकृतियाँ खोजें",
      description: "AI का उपयोग करके कलाकृतियों के इतिहास को उजागर करने के लिए छवियाँ अपलोड या कैप्चर करें।",
      analyze: "विश्लेषण करें",
      upload: "छवि अपलोड करें",
      capture: "छवि कैप्चर करें",
      remove: "छवि हटाएं",
      resultTitle: "विश्लेषण परिणाम",
      readAloud: "जोर से पढ़ें",
      stop: "रोकें",
      name: "नाम",
      origin: "मूल",
      significance: "सांस्कृतिक महत्व",
      age: "अनुमानित आयु",
      authenticity: "प्रामाणिकता",
      replica: "प्रतिकृति?",
      uploadFirst: "कृपया पहले एक छवि अपलोड या कैप्चर करें।",
      error: "छवि का विश्लेषण करने में विफल। कृपया पुनः प्रयास करें।"
    },
    mr: {
      title: "वस्तू शोधा",
      description: "कृत्रिम बुद्धिमत्तेचा वापर करून वस्तूंचा इतिहास उलगडण्यासाठी प्रतिमा अपलोड किंवा कॅप्चर करा.",
      analyze: "विश्लेषण करा",
      upload: "प्रतिमा अपलोड करा",
      capture: "प्रतिमा कॅप्चर करा",
      remove: "प्रतिमा काढून टाका",
      resultTitle: "विश्लेषण परिणाम",
      readAloud: "मोठ्याने वाचा",
      stop: "थांबवा",
      name: "नाव",
      origin: "मूळ",
      significance: "सांस्कृतिक महत्त्व",
      age: "अंदाजे वय",
      authenticity: "प्रामाणिकता",
      replica: "प्रतिकृती?",
      uploadFirst: "कृपया प्रथम एक प्रतिमा अपलोड किंवा कॅप्चर करा.",
      error: "प्रतिमेचे विश्लेषण करण्यात अयशस्वी. कृपया पुन्हा प्रयत्न करा."
    },
  };

  useEffect(() => {
    (async () => {
      await ImagePicker.requestMediaLibraryPermissionsAsync();
      await ImagePicker.requestCameraPermissionsAsync();
    })();
  }, []);

  const readAloud = () => {
    if (isReading) {
      Speech.stop();
      setIsReading(false);
    } else if (resultItems.length > 0) {
      const fullText = resultItems.map(item => `${item.label}: ${item.value}`).join('\n');
      Speech.speak(fullText, { language, onDone: () => setIsReading(false) });
      setIsReading(true);
    }
  };

  const captureImage = async () => {
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });

    if (!result.canceled && result.assets[0].uri) {
      setImage(result.assets[0].uri);
      setResultItems([]);
    }
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });

    if (!result.canceled && result.assets[0].uri) {
      setImage(result.assets[0].uri);
      setResultItems([]);
    }
  };

  const analyzeImage = async () => {
    if (!image) {
      Alert.alert(languageConfig[language].error, languageConfig[language].uploadFirst);
      return;
    }
  
    setLoading(true);
    setError(null);
  
    try {
      const genAI = new GoogleGenerativeAI.GoogleGenerativeAI(API_KEY);
      const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
  
      const response = await fetch(image);
      const blob = await response.blob();
      const base64Data = await convertBlobToBase64(blob);
  
      const prompt = 
  `Analyze the artifact in the image comprehensively and provide detailed information in this exact format:
  ${languageConfig[language].name}: [Full official name and common names]
  ${languageConfig[language].origin}: [Geographic origin with historical context]
  ${languageConfig[language].significance}: [Detailed cultural/historical importance with examples]
  ${languageConfig[language].age}: [Estimated age with dating methods and confidence level]
  ${languageConfig[language].authenticity}: [Authenticity percentage with verification details]
  ${languageConfig[language].replica}: [Replica status with supporting evidence]
  
  Additional Information:
  Materials: [Primary materials and construction techniques]
  Dimensions: [Size measurements and weight if applicable]
  Artistic Style: [Specific artistic movement or cultural style]
  Historical Context: [Contemporary historical events and usage]
  Preservation: [Current condition and conservation status]
  Discovery: [Circumstances of discovery and current location]
  Cultural Impact: [Modern relevance and cultural references]
  
  Provide response in ${language} language. Use complete sentences for descriptions. 
  Include specific details, measurements, historical references, and cultural context. 
  Maintain strict adherence to the specified format without markdown.`;
  
      const result = await model.generateContent([
        { text: prompt },
        { inlineData: { mimeType: "image/jpeg", data: base64Data } },
      ]);
  
      const text = result.response.text();
      const parsedItems = parseResponse(text, languageConfig[language]);
      setResultItems(parsedItems);
    } catch (error) {
      console.error("Error:", error);
      setError(languageConfig[language].error);
=======
import React, { useState, useRef } from 'react';
import { 
  View, 
  Text, 
  Image, 
  ScrollView, 
  TouchableOpacity, 
  StyleSheet,
  Alert
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as Speech from 'expo-speech';
import { Ionicons } from '@expo/vector-icons';
import { ThemedView } from '../../components/ThemedView';
import { ThemedText } from '../../components/ThemedText';

const DiscoverArtifact = () => {
  const [image, setImage] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isReading, setIsReading] = useState<boolean>(false);
  const [expandedItems, setExpandedItems] = useState<number[]>([]);

  const resultSectionRef = useRef<ScrollView>(null);

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (status !== 'granted') {
      Alert.alert('Sorry, we need camera roll permissions to make this work!');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled) {
      setImage(result.assets[0].uri);
    }
  };

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    
    if (status !== 'granted') {
      Alert.alert('Sorry, we need camera permissions to make this work!');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled) {
      setImage(result.assets[0].uri);
    }
  };

  const handleAnalyze = async () => {
    if (!image) {
      Alert.alert('Please select an image first');
      return;
    }

    setLoading(true);
    setError(null);

    const formData = new FormData();
    formData.append('image', {
      uri: image,
      type: 'image/jpeg',
      name: 'image.jpg',
    } as any);

    try {
      const response = await fetch('YOUR_API_URL/analyze', {
        method: 'POST',
        body: formData,
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      const data = await response.json();
      if (response.ok) {
        setResult(data.result);
      } else {
        setError('Error processing the image.');
      }
    } catch (error) {
      setError('An error occurred while analyzing the image.');
>>>>>>> 3007bbec377deb945723d3925bc6ac882042ed87
    } finally {
      setLoading(false);
    }
  };

<<<<<<< HEAD
  const parseResponse = (text: string, config: LanguageConfig): ResultItem[] => {
    const lines = text.split('\n').filter(line => line.trim() !== '');
    return lines.map(line => {
      const [label, ...valueParts] = line.split(':').map(part => part.trim());
      const value = valueParts.join(':').replace(/[*_]/g, '');
      return { label, value };
    });
  };

  const convertBlobToBase64 = (blob: Blob) => 
    new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = reject;
      reader.onload = () => {
        if (typeof reader.result === "string") {
          resolve(reader.result.split(",")[1]);
        } else {
          reject(new Error("Failed to read blob"));
        }
      };
      reader.readAsDataURL(blob);
    });

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>{languageConfig[language].title}</Text>
      <Text style={styles.description}>{languageConfig[language].description}</Text>

      <View style={styles.languageContainer}>
        {(Object.keys(languageConfig) as LanguageCode[]).map((code) => (
          <TouchableOpacity
            key={code}
            onPress={() => setLanguage(code)}
            style={[
              styles.languageButton,
              language === code && styles.selectedLanguageButton,
            ]}
          >
            <Text style={styles.languageButtonText}>
              {languageConfig[code].readAloud}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {image ? (
        <View style={styles.imageContainer}>
          <Image source={{ uri: image }} style={styles.imagePreview} />
          
          <View style={styles.actionButtonContainer}>
            <TouchableOpacity 
              onPress={() => {
                setImage(null);
                setResultItems([]);
              }} 
              style={[styles.button, styles.removeButton]}
            >
              <MaterialIcons name="delete" size={20} color="white" />
              <Text style={styles.buttonText}>
                {languageConfig[language].remove}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity 
              onPress={analyzeImage} 
              style={[styles.button, styles.analyzeButton]}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="white" />
              ) : (
                <>
                  <MaterialIcons name="search" size={20} color="white" />
                  <Text style={styles.buttonText}>
                    {languageConfig[language].analyze}
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <View style={styles.imageSelectionContainer}>
          <TouchableOpacity 
            onPress={pickImage} 
            style={[styles.button, styles.uploadButton]}
          >
            <MaterialIcons name="photo-library" size={24} color="white" />
            <Text style={styles.buttonText}>
              {languageConfig[language].upload}
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            onPress={captureImage} 
            style={[styles.button, styles.captureButton]}
          >
            <MaterialIcons name="camera-alt" size={24} color="white" />
            <Text style={styles.buttonText}>
              {languageConfig[language].capture}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {resultItems.length > 0 && (
        <View style={styles.resultContainer}>
          <Text style={styles.resultTitle}>
            {languageConfig[language].resultTitle}
          </Text>
          
          <View style={styles.cardContainer}>
            {resultItems.map((item, index) => (
              <View key={index} style={styles.card}>
                <Text style={styles.cardLabel}>{item.label}</Text>
                <Text style={styles.cardValue}>{item.value}</Text>
              </View>
            ))}
          </View>

          <TouchableOpacity 
            onPress={readAloud} 
            style={[styles.button, styles.speakButton]}
          >
            <MaterialIcons 
              name={isReading ? "stop" : "volume-up"} 
              size={24} 
              color="white" 
            />
            <Text style={styles.buttonText}>
              {isReading ? languageConfig[language].stop : languageConfig[language].readAloud}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {error && <Text style={styles.errorText}>{error}</Text>}
    </ScrollView>
=======
  const parseResult = (result: string | null) => {
    if (!result) return null;
    const sanitizedResult = result.replace(/\*/g, '');
    const lines = sanitizedResult.split('\n').filter(line => line.trim() !== '');
    
    return lines.map(line => {
      const [key, ...valueParts] = line.split(':');
      return { key: key.trim(), value: valueParts.join(':').trim() };
    });
  };

  const toggleExpand = (index: number) => {
    setExpandedItems(prev => 
      prev.includes(index) 
        ? prev.filter(i => i !== index)
        : [...prev, index]
    );
  };

  const readAloud = async (text: string) => {
    if (isReading) {
      await Speech.stop();
      setIsReading(false);
    } else {
      setIsReading(true);
      await Speech.speak(text, {
        onDone: () => setIsReading(false),
        onError: () => setIsReading(false),
      });
    }
  };

  const structuredResult = parseResult(result);

  return (
    <ThemedView style={styles.container}>
      <ScrollView ref={resultSectionRef}>
        {/* Hero Section */}
        <View style={styles.heroSection}>
          <ThemedText style={styles.title}>Discover Artifacts</ThemedText>
          <ThemedText style={styles.subtitle}>
            Upload images of artifacts to unlock their history using our advanced AI recognition technology.
          </ThemedText>
        </View>

        {/* Image Upload Section */}
        <View style={styles.uploadSection}>
          {image && (
            <View style={styles.imageContainer}>
              <Image source={{ uri: image }} style={styles.previewImage} />
              <View style={styles.buttonContainer}>
                <TouchableOpacity
                  style={[styles.button, styles.analyzeButton]}
                  onPress={handleAnalyze}
                  disabled={loading}
                >
                  <ThemedText style={styles.buttonText}>
                    {loading ? 'Analyzing...' : 'Analyze Artifact'}
                  </ThemedText>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.button, styles.deleteButton]}
                  onPress={() => setImage(null)}
                >
                  <Ionicons name="trash" size={24} color="white" />
                </TouchableOpacity>
              </View>
            </View>
          )}

          {!image && (
            <View style={styles.uploadButtons}>
              <TouchableOpacity
                style={[styles.button, styles.uploadButton]}
                onPress={pickImage}
              >
                <Ionicons name="image" size={24} color="white" />
                <ThemedText style={styles.buttonText}>Upload Image</ThemedText>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.button, styles.cameraButton]}
                onPress={takePhoto}
              >
                <Ionicons name="camera" size={24} color="white" />
                <ThemedText style={styles.buttonText}>Take Photo</ThemedText>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Results Section */}
        {structuredResult && (
          <View style={styles.resultsSection}>
            <ThemedText style={styles.resultTitle}>Analysis Result</ThemedText>
            
            <TouchableOpacity
              style={[styles.button, isReading ? styles.stopButton : styles.readButton]}
              onPress={() => structuredResult && readAloud(
                structuredResult.map(item => `${item.key}: ${item.value}`).join('. ')
              )}
            >
              <ThemedText style={styles.buttonText}>
                {isReading ? 'Stop Reading' : 'Read Aloud'}
              </ThemedText>
            </TouchableOpacity>

            {structuredResult.map((item, index) => (
              <View key={index} style={styles.resultCard}>
                <View style={styles.resultHeader}>
                  <Ionicons name="information-circle" size={24} color="#F59E0B" />
                  <ThemedText style={styles.resultKey}>{item.key}</ThemedText>
                </View>
                <ThemedText style={styles.resultValue}>
                  {expandedItems.includes(index) 
                    ? item.value 
                    : item.value.slice(0, 200)}
                </ThemedText>
                {item.value.length > 200 && (
                  <TouchableOpacity
                    onPress={() => toggleExpand(index)}
                    style={styles.expandButton}
                  >
                    <ThemedText style={styles.expandButtonText}>
                      {expandedItems.includes(index) ? 'Read Less' : 'Read More'}
                    </ThemedText>
                  </TouchableOpacity>
                )}
              </View>
            ))}
          </View>
        )}

        {error && (
          <View style={styles.errorContainer}>
            <ThemedText style={styles.errorText}>{error}</ThemedText>
          </View>
        )}
      </ScrollView>
    </ThemedView>
>>>>>>> 3007bbec377deb945723d3925bc6ac882042ed87
  );
};

const styles = StyleSheet.create({
  container: {
<<<<<<< HEAD
    padding: 20,
    backgroundColor: "#F5F5F5",
    minHeight: "100%",
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 15,
    color: "#2C3E50",
    textAlign: "center",
  },
  description: {
    fontSize: 16,
    textAlign: "center",
    marginBottom: 25,
    color: "#7F8C8D",
    lineHeight: 24,
  },
  languageContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: 25,
    gap: 10,
  },
  languageButton: {
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 20,
    backgroundColor: "#E0E0E0",
  },
  selectedLanguageButton: {
    backgroundColor: "#3498DB",
  },
  languageButtonText: {
    color: "#2C3E50",
    fontWeight: "500",
  },
  imageSelectionContainer: {
    flexDirection: "row",
    gap: 15,
    justifyContent: "center",
    marginBottom: 20,
  },
  imageContainer: {
    alignItems: "center",
    marginBottom: 25,
    width: '100%',
  },
  imagePreview: {
    width: "100%",
    height: 300,
    borderRadius: 15,
    marginBottom: 20,
    backgroundColor: "#D0D0D0",
  },
  actionButtonContainer: {
    flexDirection: 'row',
    gap: 15,
    width: '100%',
  },
  button: {
    paddingVertical: 14,
    paddingHorizontal: 25,
    borderRadius: 10,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  analyzeButton: {
    backgroundColor: "#27AE60",
    flex: 2,
  },
  uploadButton: {
    backgroundColor: "#2980B9",
  },
  captureButton: {
    backgroundColor: "#8E44AD",
  },
  removeButton: {
    backgroundColor: '#E74C3C',
    flex: 1,
  },
  speakButton: {
    backgroundColor: "#E67E22",
    marginTop: 15,
  },
  buttonText: {
    color: "white",
    fontWeight: "600",
    fontSize: 16,
  },
  resultContainer: {
    backgroundColor: "white",
    borderRadius: 15,
    padding: 20,
    marginBottom: 20,
  },
  resultTitle: {
    fontSize: 22,
    fontWeight: "600",
    color: "#2C3E50",
    marginBottom: 15,
    textAlign: "center",
  },
  cardContainer: {
    gap: 15,
  },
  card: {
    backgroundColor: "#F8F9FA",
    borderRadius: 12,
    padding: 20,
    width: '100%',
    borderLeftWidth: 5,
    borderLeftColor: "#3498DB",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  cardLabel: {
    fontSize: 14,
    color: "#7F8C8D",
    marginBottom: 5,
    fontWeight: "500",
  },
  cardValue: {
    fontSize: 16,
    color: "#2C3E50",
    fontWeight: "600",
    lineHeight: 24,
  },
  errorText: {
    color: "#E74C3C",
    textAlign: "center",
    marginTop: 10,
    fontSize: 16,
  },
});

export default DiscoverArtifact;






















































































//best code 
// import React, { useState, useEffect } from "react";
// import {
//   View,
//   Text,
//   TouchableOpacity,
//   Image,
//   ScrollView,
//   ActivityIndicator,
//   Alert,
//   StyleSheet,
// } from "react-native";
// import * as ImagePicker from "expo-image-picker";
// import * as Speech from "expo-speech";
// import * as GoogleGenerativeAI from "@google/generative-ai";
// import { MaterialIcons } from "@expo/vector-icons";

// const API_KEY = "AIzaSyBNiU6meGclnmMdC23YYs9rCccTXicz-tw";

// type LanguageCode = "en" | "hi" | "mr";

// interface LanguageConfig {
//   title: string;
//   description: string;
//   analyze: string;
//   upload: string;
//   capture: string;
//   remove: string;
//   resultTitle: string;
//   readAloud: string;
//   stop: string;
//   name: string;
//   origin: string;
//   significance: string;
//   age: string;
//   authenticity: string;
//   replica: string;
//   uploadFirst: string;
//   error: string;
// }

// interface ResultItem {
//   label: string;
//   value: string;
// }

// const DiscoverArtifact: React.FC = () => {
//   const [image, setImage] = useState<string | null>(null);
//   const [loading, setLoading] = useState(false);
//   const [resultItems, setResultItems] = useState<ResultItem[]>([]);
//   const [error, setError] = useState<string | null>(null);
//   const [isReading, setIsReading] = useState(false);
//   const [language, setLanguage] = useState<LanguageCode>("en");

//   const languageConfig: Record<LanguageCode, LanguageConfig> = {
//     en: {
//       title: "Discover Artifacts",
//       description: "Upload or capture images of artifacts to uncover their history using AI.",
//       analyze: "Analyze",
//       upload: "Upload Image",
//       capture: "Capture Image",
//       remove: "Remove Image",
//       resultTitle: "Analysis Result",
//       readAloud: "Read Aloud",
//       stop: "Stop",
//       name: "Name",
//       origin: "Origin",
//       significance: "Cultural Significance",
//       age: "Estimated Age",
//       authenticity: "Authenticity",
//       replica: "Replica?",
//       uploadFirst: "Please upload or capture an image first.",
//       error: "Failed to analyze the image. Please try again."
//     },
//     hi: {
//       title: "कलाकृतियाँ खोजें",
//       description: "AI का उपयोग करके कलाकृतियों के इतिहास को उजागर करने के लिए छवियाँ अपलोड या कैप्चर करें।",
//       analyze: "विश्लेषण करें",
//       upload: "छवि अपलोड करें",
//       capture: "छवि कैप्चर करें",
//       remove: "छवि हटाएं",
//       resultTitle: "विश्लेषण परिणाम",
//       readAloud: "जोर से पढ़ें",
//       stop: "रोकें",
//       name: "नाम",
//       origin: "मूल",
//       significance: "सांस्कृतिक महत्व",
//       age: "अनुमानित आयु",
//       authenticity: "प्रामाणिकता",
//       replica: "प्रतिकृति?",
//       uploadFirst: "कृपया पहले एक छवि अपलोड या कैप्चर करें।",
//       error: "छवि का विश्लेषण करने में विफल। कृपया पुनः प्रयास करें।"
//     },
//     mr: {
//       title: "वस्तू शोधा",
//       description: "कृत्रिम बुद्धिमत्तेचा वापर करून वस्तूंचा इतिहास उलगडण्यासाठी प्रतिमा अपलोड किंवा कॅप्चर करा.",
//       analyze: "विश्लेषण करा",
//       upload: "प्रतिमा अपलोड करा",
//       capture: "प्रतिमा कॅप्चर करा",
//       remove: "प्रतिमा काढून टाका",
//       resultTitle: "विश्लेषण परिणाम",
//       readAloud: "मोठ्याने वाचा",
//       stop: "थांबवा",
//       name: "नाव",
//       origin: "मूळ",
//       significance: "सांस्कृतिक महत्त्व",
//       age: "अंदाजे वय",
//       authenticity: "प्रामाणिकता",
//       replica: "प्रतिकृती?",
//       uploadFirst: "कृपया प्रथम एक प्रतिमा अपलोड किंवा कॅप्चर करा.",
//       error: "प्रतिमेचे विश्लेषण करण्यात अयशस्वी. कृपया पुन्हा प्रयत्न करा."
//     },
//   };

//   useEffect(() => {
//     (async () => {
//       await ImagePicker.requestMediaLibraryPermissionsAsync();
//       await ImagePicker.requestCameraPermissionsAsync();
//     })();
//   }, []);

//   const readAloud = () => {
//     if (isReading) {
//       Speech.stop();
//       setIsReading(false);
//     } else if (resultItems.length > 0) {
//       const fullText = resultItems.map(item => `${item.label}: ${item.value}`).join('\n');
//       Speech.speak(fullText, { language, onDone: () => setIsReading(false) });
//       setIsReading(true);
//     }
//   };

//   const captureImage = async () => {
//     const result = await ImagePicker.launchCameraAsync({
//       mediaTypes: ImagePicker.MediaTypeOptions.Images,
//       allowsEditing: true,
//       aspect: [1, 1],
//       quality: 1,
//     });

//     if (!result.canceled && result.assets[0].uri) {
//       setImage(result.assets[0].uri);
//       setResultItems([]);
//     }
//   };

//   const pickImage = async () => {
//     const result = await ImagePicker.launchImageLibraryAsync({
//       mediaTypes: ImagePicker.MediaTypeOptions.Images,
//       allowsEditing: true,
//       aspect: [1, 1],
//       quality: 1,
//     });

//     if (!result.canceled && result.assets[0].uri) {
//       setImage(result.assets[0].uri);
//       setResultItems([]);
//     }
//   };

//   const analyzeImage = async () => {
//     if (!image) {
//       Alert.alert(languageConfig[language].error, languageConfig[language].uploadFirst);
//       return;
//     }

//     setLoading(true);
//     setError(null);

//     try {
//       const genAI = new GoogleGenerativeAI.GoogleGenerativeAI(API_KEY);
//       const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

//       const response = await fetch(image);
//       const blob = await response.blob();
//       const base64Data = await convertBlobToBase64(blob);

//       const prompt = `
// Identify the artifact in the image and provide details in this exact format:
// ${languageConfig[language].name}: [value]
// ${languageConfig[language].origin}: [value]
// ${languageConfig[language].significance}: [value]
// ${languageConfig[language].age}: [value]
// ${languageConfig[language].authenticity}: [value]%
// ${languageConfig[language].replica}: [Yes/No]

// Provide response in ${language} language. Use only the specified format.`;

//       const result = await model.generateContent([
//         { text: prompt },
//         { inlineData: { mimeType: "image/jpeg", data: base64Data } },
//       ]);

//       const text = result.response.text();
//       const parsedItems = parseResponse(text, languageConfig[language]);
//       setResultItems(parsedItems);
//     } catch (error) {
//       console.error("Error:", error);
//       setError(languageConfig[language].error);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const parseResponse = (text: string, config: LanguageConfig): ResultItem[] => {
//     const lines = text.split('\n').filter(line => line.trim() !== '');
//     return lines.map(line => {
//       const [label, ...valueParts] = line.split(':').map(part => part.trim());
//       const value = valueParts.join(':').replace(/[*_]/g, '');
//       return { label, value };
//     });
//   };

//   const convertBlobToBase64 = (blob: Blob) => 
//     new Promise<string>((resolve, reject) => {
//       const reader = new FileReader();
//       reader.onerror = reject;
//       reader.onload = () => {
//         if (typeof reader.result === "string") {
//           resolve(reader.result.split(",")[1]);
//         } else {
//           reject(new Error("Failed to read blob"));
//         }
//       };
//       reader.readAsDataURL(blob);
//     });

//   return (
//     <ScrollView contentContainerStyle={styles.container}>
//       <Text style={styles.title}>{languageConfig[language].title}</Text>
//       <Text style={styles.description}>{languageConfig[language].description}</Text>

//       <View style={styles.languageContainer}>
//         {(Object.keys(languageConfig) as LanguageCode[]).map((code) => (
//           <TouchableOpacity
//             key={code}
//             onPress={() => setLanguage(code)}
//             style={[
//               styles.languageButton,
//               language === code && styles.selectedLanguageButton,
//             ]}
//           >
//             <Text style={styles.languageButtonText}>
//               {languageConfig[code].readAloud}
//             </Text>
//           </TouchableOpacity>
//         ))}
//       </View>

//       {image ? (
//         <View style={styles.imageContainer}>
//           <Image source={{ uri: image }} style={styles.imagePreview} />
          
//           <View style={styles.actionButtonContainer}>
//             <TouchableOpacity 
//               onPress={() => {
//                 setImage(null);
//                 setResultItems([]);
//               }} 
//               style={[styles.button, styles.removeButton]}
//             >
//               <MaterialIcons name="delete" size={20} color="white" />
//               <Text style={styles.buttonText}>
//                 {languageConfig[language].remove}
//               </Text>
//             </TouchableOpacity>

//             <TouchableOpacity 
//               onPress={analyzeImage} 
//               style={[styles.button, styles.analyzeButton]}
//               disabled={loading}
//             >
//               {loading ? (
//                 <ActivityIndicator color="white" />
//               ) : (
//                 <>
//                   <MaterialIcons name="search" size={20} color="white" />
//                   <Text style={styles.buttonText}>
//                     {languageConfig[language].analyze}
//                   </Text>
//                 </>
//               )}
//             </TouchableOpacity>
//           </View>
//         </View>
//       ) : (
//         <View style={styles.imageSelectionContainer}>
//           <TouchableOpacity 
//             onPress={pickImage} 
//             style={[styles.button, styles.uploadButton]}
//           >
//             <MaterialIcons name="photo-library" size={24} color="white" />
//             <Text style={styles.buttonText}>
//               {languageConfig[language].upload}
//             </Text>
//           </TouchableOpacity>
          
//           <TouchableOpacity 
//             onPress={captureImage} 
//             style={[styles.button, styles.captureButton]}
//           >
//             <MaterialIcons name="camera-alt" size={24} color="white" />
//             <Text style={styles.buttonText}>
//               {languageConfig[language].capture}
//             </Text>
//           </TouchableOpacity>
//         </View>
//       )}

//       {resultItems.length > 0 && (
//         <View style={styles.resultContainer}>
//           <Text style={styles.resultTitle}>
//             {languageConfig[language].resultTitle}
//           </Text>
          
//           <View style={styles.cardContainer}>
//             {resultItems.map((item, index) => (
//               <View key={index} style={styles.card}>
//                 <Text style={styles.cardLabel}>{item.label}</Text>
//                 <Text style={styles.cardValue}>{item.value}</Text>
//               </View>
//             ))}
//           </View>

//           <TouchableOpacity 
//             onPress={readAloud} 
//             style={[styles.button, styles.speakButton]}
//           >
//             <MaterialIcons 
//               name={isReading ? "stop" : "volume-up"} 
//               size={24} 
//               color="white" 
//             />
//             <Text style={styles.buttonText}>
//               {isReading ? languageConfig[language].stop : languageConfig[language].readAloud}
//             </Text>
//           </TouchableOpacity>
//         </View>
//       )}

//       {error && <Text style={styles.errorText}>{error}</Text>}
//     </ScrollView>
//   );
// };

// const styles = StyleSheet.create({
//   container: {
//     padding: 20,
//     backgroundColor: "#F5F5F5",
//     minHeight: "100%",
//   },
//   title: {
//     fontSize: 28,
//     fontWeight: "bold",
//     marginBottom: 15,
//     color: "#2C3E50",
//     textAlign: "center",
//   },
//   description: {
//     fontSize: 16,
//     textAlign: "center",
//     marginBottom: 25,
//     color: "#7F8C8D",
//     lineHeight: 24,
//   },
//   languageContainer: {
//     flexDirection: "row",
//     justifyContent: "center",
//     marginBottom: 25,
//     gap: 10,
//   },
//   languageButton: {
//     paddingVertical: 8,
//     paddingHorizontal: 15,
//     borderRadius: 20,
//     backgroundColor: "#E0E0E0",
//   },
//   selectedLanguageButton: {
//     backgroundColor: "#3498DB",
//   },
//   languageButtonText: {
//     color: "#2C3E50",
//     fontWeight: "500",
//   },
//   imageSelectionContainer: {
//     flexDirection: "row",
//     gap: 15,
//     justifyContent: "center",
//     marginBottom: 20,
//   },
//   imageContainer: {
//     alignItems: "center",
//     marginBottom: 25,
//     width: '100%',
//   },
//   imagePreview: {
//     width: "100%",
//     height: 300,
//     borderRadius: 15,
//     marginBottom: 20,
//     backgroundColor: "#D0D0D0",
//   },
//   actionButtonContainer: {
//     flexDirection: 'row',
//     gap: 15,
//     width: '100%',
//   },
//   button: {
//     paddingVertical: 14,
//     paddingHorizontal: 25,
//     borderRadius: 10,
//     flexDirection: "row",
//     justifyContent: "center",
//     alignItems: "center",
//     gap: 10,
//     shadowColor: "#000",
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.1,
//     shadowRadius: 4,
//     elevation: 3,
//   },
//   analyzeButton: {
//     backgroundColor: "#27AE60",
//     flex: 2,
//   },
//   uploadButton: {
//     backgroundColor: "#2980B9",
//   },
//   captureButton: {
//     backgroundColor: "#8E44AD",
//   },
//   removeButton: {
//     backgroundColor: '#E74C3C',
//     flex: 1,
//   },
//   speakButton: {
//     backgroundColor: "#E67E22",
//     marginTop: 15,
//   },
//   buttonText: {
//     color: "white",
//     fontWeight: "600",
//     fontSize: 16,
//   },
//   resultContainer: {
//     backgroundColor: "white",
//     borderRadius: 15,
//     padding: 20,
//     marginBottom: 20,
//   },
//   resultTitle: {
//     fontSize: 22,
//     fontWeight: "600",
//     color: "#2C3E50",
//     marginBottom: 15,
//     textAlign: "center",
//   },
//   cardContainer: {
//     gap: 15,
//   },
//   card: {
//     backgroundColor: "#F8F9FA",
//     borderRadius: 12,
//     padding: 20,
//     width: '100%',
//     borderLeftWidth: 5,
//     borderLeftColor: "#3498DB",
//     shadowColor: "#000",
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.05,
//     shadowRadius: 4,
//     elevation: 2,
//   },
//   cardLabel: {
//     fontSize: 14,
//     color: "#7F8C8D",
//     marginBottom: 5,
//     fontWeight: "500",
//   },
//   cardValue: {
//     fontSize: 16,
//     color: "#2C3E50",
//     fontWeight: "600",
//     lineHeight: 24,
//   },
//   errorText: {
//     color: "#E74C3C",
//     textAlign: "center",
//     marginTop: 10,
//     fontSize: 16,
//   },
// });

// export default DiscoverArtifact;









































































=======
    flex: 1,
  },
  heroSection: {
    padding: 20,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    opacity: 0.8,
  },
  uploadSection: {
    padding: 20,
  },
  imageContainer: {
    alignItems: 'center',
  },
  previewImage: {
    width: 300,
    height: 300,
    resizeMode: 'contain',
    marginBottom: 20,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
  },
  uploadButtons: {
    gap: 10,
  },
  button: {
    padding: 15,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  uploadButton: {
    backgroundColor: '#B45309',
  },
  cameraButton: {
    backgroundColor: '#1D4ED8',
  },
  analyzeButton: {
    backgroundColor: '#B45309',
    flex: 1,
  },
  deleteButton: {
    backgroundColor: '#DC2626',
    paddingHorizontal: 20,
  },
  readButton: {
    backgroundColor: '#2563EB',
  },
  stopButton: {
    backgroundColor: '#DC2626',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  resultsSection: {
    padding: 20,
    gap: 15,
  },
  resultTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 10,
  },
  resultCard: {
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    backgroundColor: '#1F2937',
  },
  resultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    gap: 10,
  },
  resultKey: {
    fontSize: 18,
    fontWeight: '600',
  },
  resultValue: {
    fontSize: 16,
    opacity: 0.8,
  },
  expandButton: {
    marginTop: 10,
  },
  expandButtonText: {
    color: '#F59E0B',
    fontSize: 14,
    fontWeight: '600',
  },
  errorContainer: {
    backgroundColor: '#DC2626',
    padding: 15,
    margin: 20,
    borderRadius: 8,
  },
  errorText: {
    color: 'white',
    textAlign: 'center',
  },
});

export default DiscoverArtifact;
>>>>>>> 3007bbec377deb945723d3925bc6ac882042ed87
