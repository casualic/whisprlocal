import { PodcastApi } from '@/services/podcastApi';
import { router } from 'expo-router';
import React, { useState } from 'react';
import {
    ActivityIndicator,
    Keyboard,
    KeyboardAvoidingView,
    Platform,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    TouchableWithoutFeedback,
    View
} from 'react-native';

export default function GenerateScreen() {
  const [prompt, setPrompt] = useState('');
  const [duration, setDuration] = useState('1');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      setError('Please enter a topic for your podcast');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await PodcastApi.generatePodcast(prompt, duration);
      
      // Create a temporary podcast object
      const podcast = {
        id: Date.now().toString(),
        title: prompt,
        audioUrl: response.audioUrl,
        imageUrl: response.imageUrl,
        createdAt: new Date().toISOString(),
        duration: parseInt(duration), // in minutes
      };
      
      // Navigate to the player with the new podcast
      router.push({
        pathname: '/(tabs)/player',
        params: { id: podcast.id, podcast: JSON.stringify(podcast) }
      });
    } catch (err) {
      console.error('Error generating podcast:', err);
      setError('Failed to generate podcast. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={styles.container}>
          <View style={styles.headerContainer}>
            <Text style={styles.title}>Create New Podcast</Text>
            <Text style={styles.subtitle}>Use AI to generate a podcast on any topic</Text>
          </View>

          <View style={styles.formContainer}>
            <Text style={styles.label}>Topic</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter a podcast topic..."
              placeholderTextColor="#6B7280"
              value={prompt}
              onChangeText={setPrompt}
              multiline
            />

            <Text style={styles.label}>Duration (minutes)</Text>
            <TextInput
              style={[styles.input, styles.durationInput]}
              placeholder="1"
              placeholderTextColor="#6B7280"
              value={duration}
              onChangeText={setDuration}
              keyboardType="numeric"
            />

            {error && <Text style={styles.errorText}>{error}</Text>}

            <TouchableOpacity
              style={styles.generateButton}
              onPress={handleGenerate}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.buttonText}>Generate Podcast</Text>
              )}
            </TouchableOpacity>
          </View>

          <View style={styles.infoContainer}>
            <Text style={styles.infoText}>
              Our AI will create a conversational podcast based on your topic. The generation process typically takes 1-2 minutes.
            </Text>
          </View>
        </View>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  headerContainer: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#272727',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#9CA3AF',
  },
  formContainer: {
    padding: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#1F2937',
    borderRadius: 8,
    padding: 12,
    color: '#FFFFFF',
    fontSize: 16,
    marginBottom: 20,
  },
  durationInput: {
    marginBottom: 20,
  },
  generateButton: {
    backgroundColor: '#3B82F6',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginTop: 20,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  errorText: {
    color: '#EF4444',
    fontSize: 14,
    marginTop: 8,
  },
  infoContainer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#272727',
  },
  infoText: {
    color: '#9CA3AF',
    fontSize: 14,
    lineHeight: 20,
  },
});