import { useStorage } from '@/hooks/useStorage';
import { formatDate } from '@/utils/dateFormatter';
import { formatDuration } from '@/utils/timeFormatter';
import * as FileSystem from 'expo-file-system';
import { router } from 'expo-router';
import { Calendar, ChevronRight, Clock3, Trash2 } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';

export default function LibraryScreen() {
  const [podcasts, setPodcasts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { getAllPodcasts, deletePodcast } = useStorage();

  useEffect(() => {
    loadPodcasts();
  }, []);

  const loadPodcasts = async () => {
    try {
      setLoading(true);
      const podcastData = await getAllPodcasts();
      setPodcasts(podcastData);
    } catch (error) {
      console.error('Error loading podcasts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (podcast: any) => {
    Alert.alert(
      'Delete Podcast',
      'Are you sure you want to delete this podcast? This action cannot be undone.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              // Delete the audio file
              if (podcast.audioUrl) {
                try {
                  await FileSystem.deleteAsync(podcast.audioUrl);
                } catch (error) {
                  console.error('Error deleting audio file:', error);
                }
              }

              // Delete from storage
              await deletePodcast(podcast.id);
              
              // Refresh the list
              await loadPodcasts();
            } catch (error) {
              console.error('Error deleting podcast:', error);
              Alert.alert('Error', 'Failed to delete podcast');
            }
          },
        },
      ],
    );
  };

  const navigateToPlayer = (id: string) => {
    router.push({
      pathname: '/(tabs)/player',
      params: { id }
    });
  };

  const renderRightActions = (podcast: any) => {
    return (
      <TouchableOpacity
        style={styles.deleteAction}
        onPress={() => handleDelete(podcast)}
      >
        <Trash2 size={24} color="#FFFFFF" />
      </TouchableOpacity>
    );
  };

  const renderPodcastItem = ({ item }: { item: any }) => {
    return (
      <Swipeable
        renderRightActions={() => renderRightActions(item)}
        rightThreshold={40}
      >
        <TouchableOpacity
          style={styles.podcastItem}
          onPress={() => navigateToPlayer(item.id)}
        >
          <View style={styles.podcastInfo}>
            <Text style={styles.podcastTitle} numberOfLines={1}>
              {item.title}
            </Text>
            
            <View style={styles.metadataContainer}>
              <View style={styles.metadataItem}>
                <Calendar size={14} color="#9CA3AF" />
                <Text style={styles.metadataText}>
                  {formatDate(item.createdAt)}
                </Text>
              </View>
              
              <View style={styles.metadataItem}>
                <Clock3 size={14} color="#9CA3AF" />
                <Text style={styles.metadataText}>
                  {formatDuration(item.duration)}
                </Text>
              </View>
            </View>
          </View>
          
          <ChevronRight size={20} color="#6B7280" />
        </TouchableOpacity>
      </Swipeable>
    );
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator color="#3B82F6" size="large" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.headerContainer}>
        <Text style={styles.headerTitle}>Your Podcasts</Text>
      </View>

      {podcasts.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>
            You haven't created any podcasts yet.
          </Text>
          <TouchableOpacity 
            style={styles.createButton}
            onPress={() => router.push('/(tabs)/index')}
          >
            <Text style={styles.createButtonText}>Create Your First Podcast</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={podcasts}
          renderItem={renderPodcastItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerContainer: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#272727',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  listContainer: {
    padding: 16,
  },
  podcastItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#1F2937',
    borderRadius: 8,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  podcastInfo: {
    flex: 1,
    marginRight: 12,
  },
  podcastTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  metadataContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metadataItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  metadataText: {
    fontSize: 12,
    color: '#9CA3AF',
    marginLeft: 4,
  },
  deleteAction: {
    backgroundColor: '#EF4444',
    justifyContent: 'center',
    alignItems: 'center',
    width: 80,
    height: '100%',
    borderTopRightRadius: 8,
    borderBottomRightRadius: 8,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 16,
    color: '#9CA3AF',
    textAlign: 'center',
    marginBottom: 20,
  },
  createButton: {
    backgroundColor: '#3B82F6',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  createButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});