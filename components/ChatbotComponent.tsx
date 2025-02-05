import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, PermissionsAndroid, Platform, NativeModules, NativeEventEmitter, Animated } from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import LottieView from 'lottie-react-native';

// Import the native module for voice recognition
const { VoiceToTextModule } = NativeModules;
const voiceModuleEmitter = new NativeEventEmitter(VoiceToTextModule);

const ChatbotComponent: React.FC = () => {
  const [isChatOpen, setIsChatOpen] = useState<boolean>(false);
  const [transcribedText, setTranscribedText] = useState<string>('');
  const [isListening, setIsListening] = useState<boolean>(false);
  const animatedSoundLevel = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const subscription = voiceModuleEmitter.addListener('onPartialResults', (data) => {
      setTranscribedText(data[0]); // Update UI with partial results
    });
    const soundLevelSubscription = voiceModuleEmitter.addListener('onSoundLevelChange', (data) => {
      // Animate the sound level to the new value smoothly
      Animated.timing(animatedSoundLevel, {
        toValue: data.level, // New sound level
        duration: 200,       // Duration of the animation in ms
        useNativeDriver: true,
      }).start();
    });
    return () => {
      subscription.remove();
      soundLevelSubscription.remove();
    };
  }, [animatedSoundLevel]);

  const requestPermission = async () => {
    if (Platform.OS !== 'android') return true;
    
    try {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
        {
          title: "Microphone Permission",
          message: "App needs access to your microphone for speech recognition",
          buttonNeutral: "Ask Me Later",
          buttonNegative: "Cancel",
          buttonPositive: "OK"
        }
      );
      return granted === PermissionsAndroid.RESULTS.GRANTED;
    } catch (err) {
      console.warn(err);
      return false;
    }
  };

  const startListening = async () => {
    try {
      const hasPermission = await requestPermission();
      if (!hasPermission) {
        console.error('Permission denied');
        return;
      }
      setIsListening(true); // Start animation
      const result = await VoiceToTextModule.startListening();
      setTranscribedText(result); // Final result
      setIsListening(false); // Stop animation
    } catch (error) {
      console.error(error);
      setIsListening(false); // Stop animation on error
    }
  };

  const toggleChat = (): void => {
    setIsChatOpen(!isChatOpen);
  };

  return (
    <View style={styles.container}>
      {!isChatOpen ? (
        <TouchableOpacity style={styles.chatIcon} onPress={toggleChat}>
          <MaterialIcons name="chat" size={30} color="#fff" />
        </TouchableOpacity>
      ) : (
        <View style={styles.chatBox}>
          <View style={styles.header}>
            <Text style={styles.headerText}>Hello! I'm listening to you.</Text>
          </View>
          <View style={styles.messageBubble}>
            <Text style={styles.messageText}>{transcribedText || "Click the microphone to start."}</Text>
          </View>
          <View style={styles.inputContainer}>
            <TouchableOpacity style={styles.iconButton} onPress={startListening}>
              <MaterialIcons name="mic" size={24} color="#007BFF" />
            </TouchableOpacity>
            <TextInput
              style={styles.input}
              placeholder="Type your message..."
              placeholderTextColor="#666"
            />
            <TouchableOpacity style={styles.iconButton}>
              <MaterialIcons name="send" size={24} color="#007BFF" />
            </TouchableOpacity>
          </View>
          <TouchableOpacity style={styles.closeIcon} onPress={toggleChat}>
            <MaterialIcons name="close" size={24} color="#fff" />
          </TouchableOpacity>
          {isListening && (
            <Animated.View
              style={[
                styles.lottieContainer,
                {
                  transform: [
                    {
                      scale: animatedSoundLevel.interpolate({
                        inputRange: [0, 1],
                        outputRange: [1, 1.5], // Scale the animation between 1 and 1.5
                      }),
                    },
                  ],
                },
              ]}
            >
              <LottieView
                source={require('../assets/sound.json')}
                autoPlay
                loop
                style={styles.lottieAnimation}
              />
            </Animated.View>
          )}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'flex-end',
    alignItems: 'flex-start',
  },
  chatIcon: {
    backgroundColor: '#007BFF',
    padding: 15,
    borderRadius: 50,
    position: 'absolute',
    bottom: 20,
    left: 20,
    elevation: 5,
  },
  chatBox: {
    width: '100%',
    height: '50%',
    backgroundColor: '#f5f5f5',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    overflow: 'hidden',
  },
  header: {
    backgroundColor: '#007BFF',
    padding: 15,
  },
  headerText: {
    color: '#fff',
    fontSize: 16,
  },
  messageBubble: {
    backgroundColor: '#e0e0e0',
    padding: 10,
    margin: 10,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  messageText: {
    color: '#333',
    fontSize: 14,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderTopWidth: 1,
    borderTopColor: '#ddd',
    backgroundColor: '#fff',
  },
  input: {
    flex: 1,
    backgroundColor: '#f1f1f1',
    borderRadius: 20,
    paddingHorizontal: 15,
    marginHorizontal: 10,
  },
  iconButton: {
    padding: 5,
  },
  closeIcon: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    backgroundColor: '#007BFF',
    padding: 10,
    borderRadius: 50,
  },
  lottieContainer: {
    position: 'absolute',
    bottom: 100,
    left: '50%',
    transform: [{ translateX: -50 }],
  },
  lottieAnimation: {
    width: 100,
    height: 100,
  },
});

export default ChatbotComponent;
