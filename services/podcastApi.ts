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

      // Generate an image for the podcast
      const imageUrl = await this.generatePodcastImage(text);

      return {
        audioUrl: fileUri,
        imageUrl,
        title: text,
        duration: parseInt(duration),
      };
    } catch (error) {
      console.error('Error in generatePodcast:', error);
      throw error;
    }
  }

  /**
   * Generate an image for a podcast based on its title
   * @param title The podcast title to generate an image for
   * @returns The URL of the generated image
   */
  static async generatePodcastImage(title: string): Promise<string> {
    try {
      console.log('Generating image for podcast:', title);
      const response = await fetch(`${API_BASE_URL}/generate-image`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: title,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Image generation failed:', errorData);
        throw new Error(errorData.error || 'Failed to generate image');
      }

      // Get the image as a blob
      const blob = await response.blob();
      console.log('Received image blob:', blob.size, 'bytes');

      // Convert the blob to a base64 string
      const base64data = await this.blobToBase64(blob);
      console.log('Converted image to base64');

      // Save the base64 string as a file in the device's file system
      const fileUri = FileSystem.documentDirectory + `podcast-image-${Date.now()}.jpg`;
      await FileSystem.writeAsStringAsync(fileUri, base64data, {
        encoding: FileSystem.EncodingType.Base64,
      });
      console.log('Saved image to:', fileUri);

      return fileUri;
    } catch (error) {
      console.error('Error generating podcast image:', error);
      // Return a default image if generation fails
      return 'https://via.placeholder.com/300';
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