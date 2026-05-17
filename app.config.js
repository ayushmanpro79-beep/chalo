const config = {
  name: 'Chalo',
  slug: 'chalo',
  version: '0.1.0',
  orientation: 'portrait',
  userInterfaceStyle: 'dark',
  scheme: 'chalo',
  icon: './assets/icon.png',

  splash: {
    image: './assets/icon.png',
    backgroundColor: '#050811',
    resizeMode: 'contain'
  },

  ios: {
    supportsTablet: false,
    infoPlist: {
      NSLocationWhenInUseUsageDescription:
        'Chalo uses your location to track private walking trips and detect arrivals.',
      NSLocationAlwaysAndWhenInUseUsageDescription:
        'Chalo can keep recording your walk while a trip is active.',
      NSCameraUsageDescription:
        'Chalo uses the camera to save a memory photo for each stop.',
      NSPhotoLibraryUsageDescription:
        'Chalo lets you upload a memory photo for each stop.'
    }
  },

  android: {
    package: 'com.chalo.freewalking',
    adaptiveIcon: {
      foregroundImage: './assets/icon.png',
      backgroundColor: '#050811'
    },
    permissions: [
      'ACCESS_FINE_LOCATION',
      'ACCESS_COARSE_LOCATION',
      'ACCESS_BACKGROUND_LOCATION',
      'FOREGROUND_SERVICE',
      'CAMERA',
      'READ_MEDIA_IMAGES',
      'POST_NOTIFICATIONS'
    ]
  },

  plugins: [
    [
      'expo-location',
      {
        locationAlwaysAndWhenInUsePermission:
          'Allow Chalo to keep tracking your active walking trip.'
      }
    ],
    [
      'expo-image-picker',
      {
        photosPermission:
          'Chalo lets you upload a memory photo for each stop.',
        cameraPermission:
          'Chalo uses the camera to save a memory photo for each stop.'
      }
    ],
    'expo-notifications',
    [
      'expo-camera',
      {
        cameraPermission:
          'Allow Chalo to take destination memory photos.'
      }
    ]
  ],

  extra: {
    supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL,
    supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
    placesProvider: process.env.EXPO_PUBLIC_PLACES_PROVIDER || 'overpass',
    eas: {
      projectId: '79284368-e02a-453b-932e-eede2c666a79'
    }
  }
};

module.exports = config;
