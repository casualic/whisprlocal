import * as FileSystem from 'expo-file-system';

const API_BASE_URL = 'https://9631-98-187-250-156.ngrok-free.app';

export class PodcastApi {
  /**
   * Generate a podcast with the given prompt and duration
   * @param text The prompt for the podcast
   * @param duration The duration in minutes
   * @returns The generated podcast data
   */
  static async generatePodcast(text: string, duration: string): Promise<any> {
    try {
      const response = await fetch(`${API_BASE_URL}/generate-audio`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text,
          podcast_length: duration,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate podcast');
      }

      // Get the audio file as a blob
      const blob = await response.blob();

      // Convert the blob to a base64 string
      const base64data = await this.blobToBase64(blob);

      // Save the base64 string as a file in the device's file system
      const fileUri = FileSystem.documentDirectory + `podcast-${Date.now()}.mp3`;
      await FileSystem.writeAsStringAsync(fileUri, base64data, {
        encoding: FileSystem.EncodingType.Base64,
      });

      return {
        audioUrl: fileUri,
        title: text,
        duration: parseInt(duration),
      };
    } catch (error) {
      console.error('Error in generatePodcast:', error);
      throw error;
    }
  }

  /**
   * Convert a Blob to a Base64 string
   * @param blob The Blob to convert
   * @returns A promise that resolves to the Base64 string
   */
  private static blobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64data = reader.result?.toString().split(',')[1];
        resolve(base64data || '');
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }
}