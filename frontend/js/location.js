/**
 * WeatherSphere - Location Service (location.js)
 * Wraps the browser Geolocation API with robust error handling,
 * permissions checks, and fallback coordinate normalization.
 */

export function getUserCoordinates() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported by your browser.'));
      return;
    }

    const options = {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 300000 // Cache for 5 minutes
    };

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude, accuracy } = position.coords;
        if (typeof latitude !== 'number' || typeof longitude !== 'number') {
          reject(new Error('Invalid coordinates received from browser.'));
          return;
        }

        resolve({
          latitude: parseFloat(latitude.toFixed(4)),
          longitude: parseFloat(longitude.toFixed(4)),
          accuracy
        });
      },
      (error) => {
        let message = 'Unable to retrieve your location.';
        switch (error.code) {
          case error.PERMISSION_DENIED:
            message = 'Location access denied. Please allow location access in your browser settings to use this feature.';
            break;
          case error.POSITION_UNAVAILABLE:
            message = 'Location information is currently unavailable. Try searching for your city instead.';
            break;
          case error.TIMEOUT:
            message = 'Location request timed out. Please check your network or try searching manually.';
            break;
        }
        reject(new Error(message));
      },
      options
    );
  });
}
