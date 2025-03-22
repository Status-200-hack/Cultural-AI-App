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
  scriptType: string;
  language: string;
  content: string;
  historicalPeriod: string;
  material: string;
  preservation: string;
  translation: string;
  culturalContext: string;
  significance: string;
  uploadFirst: string;
  error: string;
  languageName: string;
  promptLanguage: string; // Added this field for specifying language in the prompt
}

interface ResultItem {
  label: string;
  value: string;
}

const AnalyzeManuscript: React.FC = () => {
  const [image, setImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [resultItems, setResultItems] = useState<ResultItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isReading, setIsReading] = useState(false);
  const [language, setLanguage] = useState<LanguageCode>("en");

  const languageConfig: Record<LanguageCode, LanguageConfig> = {
    en: {
      title: "Ancient Manuscript Analyzer",
      description: "Decipher ancient scripts using AI analysis",
      analyze: "Analyze",
      upload: "Upload Image",
      capture: "Capture Image",
      remove: "Remove",
      resultTitle: "Analysis Results",
      readAloud: "Read Aloud",
      stop: "Stop",
      scriptType: "Script Type",
      language: "Language",
      content: "Content Summary",
      historicalPeriod: "Historical Period",
      material: "Material",
      preservation: "Preservation",
      translation: "Translation",
      culturalContext: "Cultural Context",
      significance: "Significance",
      uploadFirst: "Please upload an image first",
      error: "Analysis failed. Try again.",
      languageName: "English",
      promptLanguage: "English"
    },
    hi: {
      title: "प्राचीन पांडुलिपि विश्लेषक",
      description: "कृत्रिम बुद्धिमत्ता से प्राचीन लिपियों का विश्लेषण",
      analyze: "विश्लेषण करें",
      upload: "छवि अपलोड करें",
      capture: "छवि लें",
      remove: "हटाएं",
      resultTitle: "विश्लेषण परिणाम",
      readAloud: "जोर से पढ़ें",
      stop: "रोकें",
      scriptType: "लिपि प्रकार",
      language: "भाषा",
      content: "सामग्री सारांश",
      historicalPeriod: "ऐतिहासिक काल",
      material: "सामग्री",
      preservation: "संरक्षण",
      translation: "अनुवाद",
      culturalContext: "सांस्कृतिक संदर्भ",
      significance: "महत्व",
      uploadFirst: "कृपया पहले छवि अपलोड करें",
      error: "विश्लेषण विफल। पुनः प्रयास करें।",
      languageName: "हिन्दी",
      promptLanguage: "Hindi"
    },
    mr: {
      title: "प्राचीन हस्तलिखित विश्लेषक",
      description: "कृत्रिम बुद्धिमत्ता वापरून प्राचीन लिपीचे विश्लेषण",
      analyze: "विश्लेषण करा",
      upload: "प्रतिमा अपलोड करा",
      capture: "प्रतिमा कॅप्चर करा",
      remove: "काढून टाका",
      resultTitle: "विश्लेषण परिणाम",
      readAloud: "मोठ्याने वाचा",
      stop: "थांबवा",
      scriptType: "लिपी प्रकार",
      language: "भाषा",
      content: "मजकूर सारांश",
      historicalPeriod: "ऐतिहासिक कालखंड",
      material: "साहित्य",
      preservation: "संरक्षण",
      translation: "भाषांतर",
      culturalContext: "सांस्कृतिक संदर्भ",
      significance: "महत्त्व",
      uploadFirst: "कृपया प्रथम प्रतिमा अपलोड करा",
      error: "विश्लेषण अयशस्वी. पुन्हा प्रयत्न करा.",
      languageName: "मराठी",
      promptLanguage: "Marathi"
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
      Speech.speak(fullText, { 
        language: language === 'mr' ? 'mr-IN' : language,
        onDone: () => setIsReading(false)
      });
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
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

      const response = await fetch(image);
      const blob = await response.blob();
      const base64Data = await convertBlobToBase64(blob);

      const config = languageConfig[language];
      
      const prompt = 
`Analyze this ancient manuscript and provide the results in ${config.promptLanguage} language:
${config.scriptType}: [Script Identification]
${config.language}: [Language Detection]
${config.content}: [Content Summary]
${config.translation}: [Key Translation]
${config.historicalPeriod}: [Historical Context]

Format strictly as:
${config.scriptType}: ...
${config.language}: ...
${config.content}: ...
${config.translation}: ...
${config.historicalPeriod}: ...`;

      const result = await model.generateContent([
        { text: prompt },
        { inlineData: { mimeType: "image/jpeg", data: base64Data } },
      ]);

      const text = result.response.text();
      const parsedItems = parseResponse(text, config);
      setResultItems(parsedItems);
    } catch (error) {
      console.error("Error:", error);
      setError(languageConfig[language].error);
    } finally {
      setLoading(false);
    }
  };

  const parseResponse = (text: string, config: LanguageConfig): ResultItem[] => {
    const expectedLabels = [
      config.scriptType,
      config.language,
      config.content,
      config.translation,
      config.historicalPeriod
    ];

    return expectedLabels.map(label => {
      const regex = new RegExp(`${label}:\\s*(.*)`);
      const match = text.match(regex);
      return {
        label,
        value: match ? match[1].trim() : "Information not available"
      };
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
            <Text style={styles.buttonText}>
              {languageConfig[code].languageName}
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

export default AnalyzeManuscript;






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
//   scriptType: string;
//   language: string;
//   content: string;
//   historicalPeriod: string;
//   material: string;
//   preservation: string;
//   translation: string;
//   culturalContext: string;
//   significance: string;
//   uploadFirst: string;
//   error: string;
//   languageName: string;
// }

// interface ResultItem {
//   label: string;
//   value: string;
// }

// const AnalyzeManuscript: React.FC = () => {
//   const [image, setImage] = useState<string | null>(null);
//   const [loading, setLoading] = useState(false);
//   const [resultItems, setResultItems] = useState<ResultItem[]>([]);
//   const [error, setError] = useState<string | null>(null);
//   const [isReading, setIsReading] = useState(false);
//   const [language, setLanguage] = useState<LanguageCode>("en");

//   const languageConfig: Record<LanguageCode, LanguageConfig> = {
//     en: {
//       title: "Ancient Manuscript Analyzer",
//       description: "Decipher ancient scripts using AI analysis",
//       analyze: "Analyze",
//       upload: "Upload Image",
//       capture: "Capture Image",
//       remove: "Remove",
//       resultTitle: "Analysis Results",
//       readAloud: "Read Aloud",
//       stop: "Stop",
//       scriptType: "Script Type",
//       language: "Language",
//       content: "Content Summary",
//       historicalPeriod: "Historical Period",
//       material: "Material",
//       preservation: "Preservation",
//       translation: "Translation",
//       culturalContext: "Cultural Context",
//       significance: "Significance",
//       uploadFirst: "Please upload an image first",
//       error: "Analysis failed. Try again.",
//       languageName: "English"
//     },
//     hi: {
//       title: "प्राचीन पांडुलिपि विश्लेषक",
//       description: "कृत्रिम बुद्धिमत्ता से प्राचीन लिपियों का विश्लेषण",
//       analyze: "विश्लेषण करें",
//       upload: "छवि अपलोड करें",
//       capture: "छवि लें",
//       remove: "हटाएं",
//       resultTitle: "विश्लेषण परिणाम",
//       readAloud: "जोर से पढ़ें",
//       stop: "रोकें",
//       scriptType: "लिपि प्रकार",
//       language: "भाषा",
//       content: "सामग्री सारांश",
//       historicalPeriod: "ऐतिहासिक काल",
//       material: "सामग्री",
//       preservation: "संरक्षण",
//       translation: "अनुवाद",
//       culturalContext: "सांस्कृतिक संदर्भ",
//       significance: "महत्व",
//       uploadFirst: "कृपया पहले छवि अपलोड करें",
//       error: "विश्लेषण विफल। पुनः प्रयास करें।",
//       languageName: "हिन्दी"
//     },
//     mr: {
//       title: "प्राचीन हस्तलिखित विश्लेषक",
//       description: "कृत्रिम बुद्धिमत्ता वापरून प्राचीन लिपीचे विश्लेषण",
//       analyze: "विश्लेषण करा",
//       upload: "प्रतिमा अपलोड करा",
//       capture: "प्रतिमा कॅप्चर करा",
//       remove: "काढून टाका",
//       resultTitle: "विश्लेषण परिणाम",
//       readAloud: "मोठ्याने वाचा",
//       stop: "थांबवा",
//       scriptType: "लिपी प्रकार",
//       language: "भाषा",
//       content: "मजकूर सारांश",
//       historicalPeriod: "ऐतिहासिक कालखंड",
//       material: "साहित्य",
//       preservation: "संरक्षण",
//       translation: "भाषांतर",
//       culturalContext: "सांस्कृतिक संदर्भ",
//       significance: "महत्त्व",
//       uploadFirst: "कृपया प्रथम प्रतिमा अपलोड करा",
//       error: "विश्लेषण अयशस्वी. पुन्हा प्रयत्न करा.",
//       languageName: "मराठी"
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
//       Speech.speak(fullText, { 
//         language: language === 'mr' ? 'mr-IN' : language,
//         onDone: () => setIsReading(false)
//       });
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
//       const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

//       const response = await fetch(image);
//       const blob = await response.blob();
//       const base64Data = await convertBlobToBase64(blob);

//       const prompt = 
// `Analyze this ancient manuscript and provide in ${language}:
// ${languageConfig[language].scriptType}: [Script Identification]
// ${languageConfig[language].language}: [Language Detection]
// ${languageConfig[language].content}: [Content Summary]
// ${languageConfig[language].translation}: [Key Translation]
// ${languageConfig[language].historicalPeriod}: [Historical Context]

// Format strictly as:
// ${languageConfig[language].scriptType}: ...
// ${languageConfig[language].language}: ...
// ${languageConfig[language].content}: ...
// ${languageConfig[language].translation}: ...
// ${languageConfig[language].historicalPeriod}: ...`;

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
//     const expectedLabels = [
//       config.scriptType,
//       config.language,
//       config.content,
//       config.translation,
//       config.historicalPeriod
//     ];

//     return expectedLabels.map(label => {
//       const regex = new RegExp(`${label}:\\s*(.*)`);
//       const match = text.match(regex);
//       return {
//         label,
//         value: match ? match[1].trim() : "Information not available"
//       };
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
//               {languageConfig[code].languageName}
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

// export default AnalyzeManuscript;



//Working code 
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
//   scriptType: string;
//   language: string;
//   content: string;
//   historicalPeriod: string;
//   material: string;
//   preservation: string;
//   translation: string;
//   culturalContext: string;
//   significance: string;
//   uploadFirst: string;
//   error: string;
//   languageName: string;
// }

// interface ResultItem {
//   label: string;
//   value: string;
// }

// const AnalyzeManuscript: React.FC = () => {
//   const [image, setImage] = useState<string | null>(null);
//   const [loading, setLoading] = useState(false);
//   const [resultItems, setResultItems] = useState<ResultItem[]>([]);
//   const [error, setError] = useState<string | null>(null);
//   const [isReading, setIsReading] = useState(false);
//   const [language, setLanguage] = useState<LanguageCode>("en");

//   const languageConfig: Record<LanguageCode, LanguageConfig> = {
//     en: {
//       title: "Analyze Ancient Manuscripts",
//       description: "Decipher ancient scripts and manuscripts using AI analysis",
//       analyze: "Analyze",
//       upload: "Upload Image",
//       capture: "Capture Image",
//       remove: "Remove Image",
//       resultTitle: "Manuscript Analysis",
//       readAloud: "Read Aloud",
//       stop: "Stop",
//       scriptType: "Script Type",
//       language: "Language",
//       content: "Content Summary",
//       historicalPeriod: "Historical Period",
//       material: "Material",
//       preservation: "Preservation State",
//       translation: "Key Translation",
//       culturalContext: "Cultural Context",
//       significance: "Historical Significance",
//       uploadFirst: "Please upload or capture an image first.",
//       error: "Failed to analyze the manuscript. Please try again.",
//       languageName: "English"
//     },
//     hi: {
//       title: "प्राचीन पांडुलिपियों का विश्लेषण",
//       description: "एआई का उपयोग करके प्राचीन लिपियों और पांडुलिपियों को समझें",
//       analyze: "विश्लेषण करें",
//       upload: "छवि अपलोड करें",
//       capture: "छवि कैप्चर करें",
//       remove: "छवि हटाएं",
//       resultTitle: "पांडुलिपि विश्लेषण",
//       readAloud: "जोर से पढ़ें",
//       stop: "रोकें",
//       scriptType: "लिपि प्रकार",
//       language: "भाषा",
//       content: "सामग्री सारांश",
//       historicalPeriod: "ऐतिहासिक काल",
//       material: "सामग्री",
//       preservation: "संरक्षण स्थिति",
//       translation: "मुख्य अनुवाद",
//       culturalContext: "सांस्कृतिक संदर्भ",
//       significance: "ऐतिहासिक महत्व",
//       uploadFirst: "कृपया पहले एक छवि अपलोड या कैप्चर करें।",
//       error: "पांडुलिपि का विश्लेषण करने में विफल। कृपया पुनः प्रयास करें।",
//       languageName: "हिन्दी"
//     },
//     mr: {
//       title: "प्राचीन हस्तलिखितांचे विश्लेषण",
//       description: "कृत्रिम बुद्धिमत्तेचा वापर करून प्राचीन लिपी आणि हस्तलिखिते समजून घ्या",
//       analyze: "विश्लेषण करा",
//       upload: "प्रतिमा अपलोड करा",
//       capture: "प्रतिमा कॅप्चर करा",
//       remove: "प्रतिमा काढून टाका",
//       resultTitle: "हस्तलिखित विश्लेषण",
//       readAloud: "मोठ्याने वाचा",
//       stop: "थांबवा",
//       scriptType: "लिपी प्रकार",
//       language: "भाषा",
//       content: "सामग्री सारांश",
//       historicalPeriod: "ऐतिहासिक कालखंड",
//       material: "साहित्य",
//       preservation: "संरक्षण स्थिती",
//       translation: "मुख्य भाषांतर",
//       culturalContext: "सांस्कृतिक संदर्भ",
//       significance: "ऐतिहासिक महत्त्व",
//       uploadFirst: "कृपया प्रथम एक प्रतिमा अपलोड किंवा कॅॅप्चर करा.",
//       error: "हस्तलिखिताचे विश्लेषण करण्यात अयशस्वी. कृपया पुन्हा प्रयत्न करा.",
//       languageName: "मराठी"
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
//       const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

//       const response = await fetch(image);
//       const blob = await response.blob();
//       const base64Data = await convertBlobToBase64(blob);

//       const prompt = 
// `Analyze this ancient manuscript/image comprehensively and provide detailed information in this exact format:
// ${languageConfig[language].scriptType}: [Identify script type (e.g., Brahmi, Hieroglyphic, Cuneiform)]
// ${languageConfig[language].language}: [Detected language(s) with confidence percentage]
// ${languageConfig[language].content}: [Summary of content/meaning]
// ${languageConfig[language].historicalPeriod}: [Estimated time period with dating rationale]
// ${languageConfig[language].material}: [Writing surface material and ink/pigment analysis]

// Provide response in ${language} language. Include specific technical details about the script, linguistic analysis, and historical context. 
// Maintain strict format without markdown. Use complete sentences for descriptions.`;

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
//               {languageConfig[code].languageName}
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

// export default AnalyzeManuscript;



