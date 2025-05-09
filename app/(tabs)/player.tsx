import React, { useEffect, useState } from 'react';
import { View, Text, Button, StyleSheet } from 'react-native';
import { Audio } from 'expo-av';
import { useLocalSearchParams } from 'expo-router';
import { getPodcasts } from '../../services/storage';

export default function PlayerScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [podcast, setPodcast] = useState<any | null>(null);
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    const loadPodcast = async () => {
      try {
        const podcasts = await getPodcasts();
        const selectedPodcast = podcasts.find((p) => p.id === id);
        setPodcast(selectedPodcast);
      } catch (error) {
        console.error('Error loading podcast:', error);
      }
    };

    loadPodcast();

    return () => {
      // Unload sound when the component unmounts
      if (sound) {
        sound.unloadAsync();
      }
    };
  }, [id]);

  const playPauseAudio = async () => {
    if (!sound && podcast?.audioUrl) {
      // Load the audio file
      const { sound: newSound } = await Audio.Sound.createAsync(
        { uri: podcast.audioUrl },
        { shouldPlay: true }
      );
      setSound(newSound);
      setIsPlaying(true);
    } else if (sound) {
      if (isPlaying) {
        await sound.pauseAsync();
        setIsPlaying(false);
      } else {
        await sound.playAsync();
        setIsPlaying(true);
      }
    }
  };

  if (!podcast) {
    return (
      <View style={styles.container}>
        <Text>Loading podcast...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{podcast.title}</Text>
      <Button title={isPlaying ? 'Pause' : 'Play'} onPress={playPauseAudio} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#121212',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 20,
  },
});