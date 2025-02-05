import React from 'react';
import { View, StyleSheet } from 'react-native';
import ChatbotComponent from './components/ChatbotComponent';

const App = () => {
  return (
    <View style={styles.container}>
      <ChatbotComponent />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
});

export default App;
