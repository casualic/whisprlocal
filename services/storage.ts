import * as SecureStore from 'expo-secure-store';

const PODCASTS_KEY = 'podcasts';

/**
 * Save a podcast to SecureStore
 * @param podcast The podcast object to save
 */
export async function savePodcast(podcast: any): Promise<void> {
  try {
    const existingData = await SecureStore.getItemAsync(PODCASTS_KEY);
    const podcasts = existingData ? JSON.parse(existingData) : [];
    podcasts.push(podcast);
    await SecureStore.setItemAsync(PODCASTS_KEY, JSON.stringify(podcasts));
  } catch (error) {
    console.error('Error saving podcast:', error);
    throw error;
  }
}

/**
 * Retrieve all podcasts from SecureStore
 * @returns An array of podcasts
 */
export async function getPodcasts(): Promise<any[]> {
  try {
    const data = await SecureStore.getItemAsync(PODCASTS_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Error retrieving podcasts:', error);
    throw error;
  }
}