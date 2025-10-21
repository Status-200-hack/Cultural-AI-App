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
import { GEMINI_API_KEY } from '@env';

// Replace direct API usage with:
const API_KEY = GEMINI_API_KEY;

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
    } finally {
      setLoading(false);
    }
  };

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
  );
};

const styles = StyleSheet.create({
  container: {
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
