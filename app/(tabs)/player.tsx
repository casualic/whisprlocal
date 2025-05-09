import { useStorage } from '@/hooks/useStorage';
import { formatTime } from '@/utils/timeFormatter';
import { Audio } from 'expo-av';
import { router, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, Pause, Play, Save, SkipBack, SkipForward } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function PlayerScreen() {
  const { id, podcast: podcastParam } = useLocalSearchParams<{ id: string; podcast?: string }>();
  const [podcast, setPodcast] = useState<any | null>(null);
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [position, setPosition] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isSaved, setIsSaved] = useState(false);
  const { getPodcast, savePodcast } = useStorage();

  useEffect(() => {
    const loadPodcast = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // If we have a podcast param, it's a newly generated podcast
        if (podcastParam) {
          const newPodcast = JSON.parse(podcastParam);
          setPodcast(newPodcast);
          setIsSaved(false);
        } else {
          // Otherwise, try to load from storage
          const savedPodcast = await getPodcast(id);
          if (!savedPodcast) {
            setError('Podcast not found');
            return;
          }
          setPodcast(savedPodcast);
          setIsSaved(true);
        }
      } catch (error) {
        console.error('Error loading podcast:', error);
        setError('Failed to load podcast');
      } finally {
        setIsLoading(false);
      }
    };

    loadPodcast();

    return () => {
      if (sound) {
        sound.unloadAsync();
      }
    };
  }, [id, podcastParam]);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;

    if (sound && isPlaying) {
      interval = setInterval(async () => {
        const status = await sound.getStatusAsync();
        if (status.isLoaded) {
          setPosition(status.positionMillis);
          setDuration(status.durationMillis || 0);
        }
      }, 1000);
    }

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [sound, isPlaying]);

  const loadAndPlayAudio = async () => {
    try {
      if (!podcast?.audioUrl) {
        setError('No audio URL available');
        return;
      }

      // Unload previous sound if it exists
      if (sound) {
        await sound.unloadAsync();
      }

      // Configure audio mode
      await Audio.setAudioModeAsync({
        playsInSilentModeIOS: true,
        staysActiveInBackground: true,
        shouldDuckAndroid: true,
      });

      // Load and play the new sound
      const { sound: newSound } = await Audio.Sound.createAsync(
        { uri: podcast.audioUrl },
        { shouldPlay: false }, // Don't play immediately
        onPlaybackStatusUpdate
      );

      setSound(newSound);
      
      // Wait for the sound to be loaded
      const status = await newSound.getStatusAsync();
      if (!status.isLoaded) {
        throw new Error('Failed to load audio');
      }

      // Now play the sound
      await newSound.playAsync();
      setIsPlaying(true);
    } catch (error) {
      console.error('Error loading audio:', error);
      setError('Failed to load audio. Please try again.');
      setIsPlaying(false);
    }
  };

  const onPlaybackStatusUpdate = (status: any) => {
    if (status.isLoaded) {
      setPosition(status.positionMillis);
      setDuration(status.durationMillis || 0);
    }
  };

  const playPauseAudio = async () => {
    try {
      if (!sound) {
        await loadAndPlayAudio();
        return;
      }

      const status = await sound.getStatusAsync();
      if (!status.isLoaded) {
        // If sound is not loaded, try to reload it
        await loadAndPlayAudio();
        return;
      }

      if (isPlaying) {
        await sound.pauseAsync();
        setIsPlaying(false);
      } else {
        await sound.playAsync();
        setIsPlaying(true);
      }
    } catch (error) {
      console.error('Error controlling playback:', error);
      setError('Failed to control playback. Please try again.');
      setIsPlaying(false);
    }
  };

  const seekAudio = async (seconds: number) => {
    try {
      if (!sound) return;
      
      const status = await sound.getStatusAsync();
      if (!status.isLoaded) {
        throw new Error('Sound is not loaded');
      }
      
      const newPosition = Math.max(0, Math.min(position + seconds * 1000, duration));
      await sound.setPositionAsync(newPosition);
      setPosition(newPosition);
    } catch (error) {
      console.error('Error seeking audio:', error);
      setError('Failed to seek audio. Please try again.');
    }
  };

  const handleSave = async () => {
    try {
      if (!podcast) {
        console.error('No podcast to save');
        return;
      }
      
      // Ensure we have all required fields
      const podcastToSave = {
        id: podcast.id,
        title: podcast.title,
        audioUrl: podcast.audioUrl,
        createdAt: podcast.createdAt || new Date().toISOString(),
        duration: podcast.duration || 0
      };
      
      console.log('Saving podcast:', podcastToSave);
      const savedPodcast = await savePodcast(podcastToSave);
      console.log('Podcast saved successfully:', savedPodcast);
      setIsSaved(true);
      
      // Navigate back to library screen
      router.replace('/(tabs)/library');
    } catch (error) {
      console.error('Error saving podcast:', error);
      setError('Failed to save podcast');
    }
  };

  if (isLoading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#3B82F6" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!podcast) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Podcast not found</Text>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <ArrowLeft size={24} color="#FFFFFF" />
        </TouchableOpacity>
        {!isSaved && (
          <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
            <Save size={24} color="#3B82F6" />
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.content}>
        <View style={styles.artworkContainer}>
          <Image
            source={{ uri: podcast.imageUrl || 'https://via.placeholder.com/300' }}
            style={styles.artwork}
          />
        </View>

        <Text style={styles.title}>{podcast.title}</Text>
        
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View 
              style={[
                styles.progressFill,
                { width: `${(position / duration) * 100}%` }
              ]} 
            />
          </View>
          <View style={styles.timeContainer}>
            <Text style={styles.timeText}>{formatTime(position)}</Text>
            <Text style={styles.timeText}>{formatTime(duration)}</Text>
          </View>
        </View>

        <View style={styles.controls}>
          <TouchableOpacity onPress={() => seekAudio(-10)}>
            <SkipBack size={32} color="#FFFFFF" />
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.playButton} onPress={playPauseAudio}>
            {isPlaying ? (
              <Pause size={32} color="#FFFFFF" />
            ) : (
              <Play size={32} color="#FFFFFF" />
            )}
          </TouchableOpacity>
          
          <TouchableOpacity onPress={() => seekAudio(10)}>
            <SkipForward size={32} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backButton: {
    padding: 8,
  },
  saveButton: {
    padding: 8,
  },
  backButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
  },
  artworkContainer: {
    width: 300,
    height: 300,
    marginBottom: 30,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  artwork: {
    width: '100%',
    height: '100%',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 30,
    paddingHorizontal: 20,
  },
  progressContainer: {
    width: '100%',
    marginBottom: 20,
  },
  progressBar: {
    height: 4,
    backgroundColor: '#333',
    borderRadius: 2,
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#3B82F6',
    borderRadius: 2,
  },
  timeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  timeText: {
    color: '#9CA3AF',
    fontSize: 12,
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 40,
  },
  playButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#3B82F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorText: {
    color: '#EF4444',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
  },
});