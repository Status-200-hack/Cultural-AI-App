import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, StyleSheet, ActivityIndicator } from 'react-native';
import { Audio } from 'expo-av';
import EventSource from 'react-native-sse';
import * as FileSystem from 'expo-file-system';
import { CONVAI_API_KEY, CONVAI_CHARACTER_ID } from '@env';

const API_KEY = CONVAI_API_KEY;
const CHARACTER_ID = CONVAI_CHARACTER_ID;
const API_URL = 'https://api.convai.com/character/getResponse';
const SUGGESTIONS_URL = 'https://api.convai.com/character/generate-starter-conversation';

interface Message {
  text: string;
  isUser: boolean;
  audio?: string;
}

export default function ChatInterface() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [sessionId, setSessionId] = useState('-1');
  const [isLoading, setIsLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const recording = useRef<Audio.Recording | null>(null);

  useEffect(() => {
    (async () => {
      await Audio.requestPermissionsAsync();
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });
      fetchConversationSuggestions();
    })();
  }, []);

  const fetchConversationSuggestions = async () => {
    try {
      const response = await fetch(SUGGESTIONS_URL, {
        method: 'POST',
        headers: {
          'CONVAI-API-KEY': API_KEY,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          charId: CHARACTER_ID,
          sessionId: '-1'
        }),
      });

      const eventSource = new EventSource(response);
      eventSource.addEventListener('message', (event: { data: string; }) => {
        if (event.data) {
          setSuggestions(prev => [...prev, event.data]);
        }
      });
    } catch (error) {
      console.error('Suggestions error:', error);
    }
  };

  const sendMessage = async (text?: string) => {
    const messageText = text || inputText;
    if (!messageText.trim()) return;

    setIsLoading(true);
    setInputText('');
    setSuggestions([]);

    // Add user message
    setMessages(prev => [...prev, { text: messageText, isUser: true }]);

    try {
      const formData = new FormData();
      formData.append('userText', messageText);
      formData.append('charID', CHARACTER_ID);
      formData.append('sessionID', sessionId);
      formData.append('voiceResponse', 'true');

      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'CONVAI-API-KEY': API_KEY,
          'Content-Type': 'multipart/form-data',
        },
        body: formData,
      });

      const data = await response.json();
      setSessionId(data.sessionID);

      // Add bot response
      const botMessage: Message = {
        text: data.text,
        isUser: false,
        audio: data.audio
      };
      setMessages(prev => [...prev, botMessage]);

      if (data.audio) {
        playAudio(data.audio);
      }

      fetchConversationSuggestions();
    } catch (error) {
      console.error('API Error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const startRecording = async () => {
    try {
      setIsRecording(true);
      const { Recording } = Audio;
      const recordingInstance = new Recording();
      
      await recordingInstance.prepareToRecordAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      
      await recordingInstance.startAsync();
      recording.current = recordingInstance;
    } catch (error) {
      console.error('Recording failed', error);
      setIsRecording(false);
    }
  };

  const stopRecording = async () => {
    try {
      setIsRecording(false);
      await recording.current?.stopAndUnloadAsync();
      
      const uri = recording.current?.getURI();
      if (uri) {
        await sendAudioMessage(uri);
      }
    } catch (error) {
      console.error('Stop recording failed', error);
    }
  };

  const sendAudioMessage = async (audioUri: string) => {
    setIsLoading(true);
    setSuggestions([]);

    try {
      const formData = new FormData();
      formData.append('file', {
        uri: audioUri,
        name: 'audio.wav',
        type: 'audio/wav',
      } as any);
      formData.append('charID', CHARACTER_ID);
      formData.append('sessionID', sessionId);
      formData.append('voiceResponse', 'true');

      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'CONVAI-API-KEY': API_KEY,
          'Content-Type': 'multipart/form-data',
        },
        body: formData,
      });

      const data = await response.json();
      setSessionId(data.sessionID);

      const botMessage: Message = {
        text: data.text,
        isUser: false,
        audio: data.audio
      };
      setMessages(prev => [...prev, botMessage]);

      if (data.audio) {
        playAudio(data.audio);
      }

      fetchConversationSuggestions();
    } catch (error) {
      console.error('Audio API Error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const playAudio = async (base64Audio: string) => {
    try {
      const uri = `${FileSystem.cacheDirectory}temp_audio.wav`;
      await FileSystem.writeAsStringAsync(uri, base64Audio, {
        encoding: FileSystem.EncodingType.Base64,
      });

      const { sound } = await Audio.Sound.createAsync(
        { uri },
        { shouldPlay: true }
      );
      await sound.playAsync();
    } catch (error) {
      console.error('Audio playback error:', error);
    }
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={messages}
        keyExtractor={(_, index) => index.toString()}
        renderItem={({ item }) => (
          <View style={[
            styles.messageContainer,
            item.isUser ? styles.userMessage : styles.botMessage
          ]}>
            <Text style={styles.messageText}>{item.text}</Text>
            {!item.isUser && item.audio && (
              <TouchableOpacity onPress={() => playAudio(item.audio!)}>
                <Text style={styles.audioIndicator}>▶️ Play Audio</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
        ListFooterComponent={
          <View style={styles.suggestionsContainer}>
            {suggestions.map((suggestion, index) => (
              <TouchableOpacity
                key={index}
                style={styles.suggestionButton}
                onPress={() => sendMessage(suggestion)}
              >
                <Text style={styles.suggestionText}>{suggestion}</Text>
              </TouchableOpacity>
            ))}
          </View>
        }
      />

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          value={inputText}
          onChangeText={setInputText}
          placeholder="Type your message..."
          editable={!isLoading}
        />

        {!isRecording ? (
          <TouchableOpacity
            style={styles.recordButton}
            onPress={startRecording}
            disabled={isLoading}
          >
            <Text>🎤</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[styles.recordButton, styles.recording]}
            onPress={stopRecording}
          >
            <Text>⏹</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={styles.sendButton}
          onPress={() => sendMessage()}
          disabled={isLoading || !inputText.trim()}
        >
          {isLoading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text style={styles.sendText}>Send</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f0f4f8',
  },
  messageContainer: {
    maxWidth: '80%',
    padding: 12,
    borderRadius: 12,
    marginVertical: 8,
  },
  userMessage: {
    alignSelf: 'flex-end',
    backgroundColor: '#007bff',
  },
  botMessage: {
    alignSelf: 'flex-start',
    backgroundColor: '#ffffff',
  },
  messageText: {
    fontSize: 16,
    color: '#333',
  },
  audioIndicator: {
    color: '#007bff',
    marginTop: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 12,
  },
  input: {
    flex: 1,
    backgroundColor: 'white',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginRight: 8,
    elevation: 2,
  },
  sendButton: {
    backgroundColor: '#007bff',
    borderRadius: 20,
    paddingVertical: 12,
    paddingHorizontal: 20,
    marginLeft: 8,
  },
  sendText: {
    color: 'white',
    fontWeight: 'bold',
  },
  recordButton: {
    backgroundColor: '#e3f2fd',
    borderRadius: 20,
    padding: 12,
    marginRight: 8,
  },
  recording: {
    backgroundColor: '#ffebee',
  },
  suggestionsContainer: {
    marginVertical: 8,
  },
  suggestionButton: {
    backgroundColor: '#e8f4f8',
    borderRadius: 12,
    padding: 12,
    marginVertical: 4,
  },
  suggestionText: {
    color: '#2d6187',
    fontSize: 14,
  },
});