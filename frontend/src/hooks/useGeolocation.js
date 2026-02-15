import { useState, useEffect, useCallback } from 'react';

export const useGeolocation = () => {
    const [location, setLocation] = useState(null);
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);
    const [permissionGranted, setPermissionGranted] = useState(false);

    // Check if geolocation is available
    const isGeolocationAvailable = typeof window !== 'undefined' && 'geolocation' in navigator;

    // Request location permission
    const requestPermission = useCallback(async () => {
        if (!isGeolocationAvailable) {
            setError('Geolocation is not supported by your browser');
            return false;
        }

        try {
            // Request permission (for browsers that support it)
            const permission = await navigator.permissions.query({ name: 'geolocation' });
            if (permission.state === 'granted') {
                setPermissionGranted(true);
                return true;
            } else if (permission.state === 'prompt') {
                // We'll get permission when we actually request location
                setPermissionGranted(false);
                return true;
            } else {
                setPermissionGranted(false);
                return false;
            }
        } catch (err) {
            // Fallback for browsers that don't support permissions API
            setPermissionGranted(true);
            return true;
        }
    }, [isGeolocationAvailable]);

    // Get current position
    const getCurrentPosition = useCallback(() => {
        if (!isGeolocationAvailable) {
            setError('Geolocation is not supported by your browser');
            return;
        }

        setLoading(true);
        setError(null);

        navigator.geolocation.getCurrentPosition(
            (position) => {
                const newLocation = {
                    lat: position.coords.latitude,
                    lng: position.coords.longitude,
                    accuracy: position.coords.accuracy,
                    timestamp: position.timestamp
                };
                setLocation(newLocation);
                setLoading(false);
                setPermissionGranted(true);
                
                // Store in localStorage for persistence
                localStorage.setItem('userLocation', JSON.stringify(newLocation));
                console.log('📍 Location obtained:', newLocation);
            },
            (err) => {
                setLoading(false);
                switch (err.code) {
                    case err.PERMISSION_DENIED:
                        setError('Location permission denied');
                        break;
                    case err.POSITION_UNAVAILABLE:
                        setError('Location information unavailable');
                        break;
                    case err.TIMEOUT:
                        setError('Location request timed out');
                        break;
                    default:
                        setError('An unknown error occurred');
                }
                console.error('Geolocation error:', err);
            },
            {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 300000 // 5 minutes cache
            }
        );
    }, [isGeolocationAvailable]);

    // Calculate distance between two coordinates (Haversine formula)
    const calculateDistance = useCallback((lat1, lng1, lat2, lng2) => {
        const R = 6371; // Earth's radius in km
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLng = (lng2 - lng1) * Math.PI / 180;
        
        const a = 
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLng / 2) * Math.sin(dLng / 2);
        
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        const distance = R * c;
        
        return distance;
    }, []);

    // Sort doctors by distance
    const sortDoctorsByDistance = useCallback((doctors, userLocation) => {
        if (!userLocation || !doctors) return doctors;

        return [...doctors].sort((a, b) => {
            const distA = a.location?.lat 
                ? calculateDistance(userLocation.lat, userLocation.lng, a.location.lat, a.location.lng)
                : Infinity;
            const distB = b.location?.lat 
                ? calculateDistance(userLocation.lat, userLocation.lng, b.location.lat, b.location.lng)
                : Infinity;
            
            return distA - distB;
        });
    }, [calculateDistance]);

    // Get formatted distance string
    const formatDistance = useCallback((distanceKm) => {
        if (distanceKm < 1) {
            return `${Math.round(distanceKm * 1000)} m`;
        } else if (distanceKm < 10) {
            return `${distanceKm.toFixed(1)} km`;
        } else {
            return `${Math.round(distanceKm)} km`;
        }
    }, []);

    // Load cached location on mount
    useEffect(() => {
        const cachedLocation = localStorage.getItem('userLocation');
        if (cachedLocation) {
            try {
                const parsed = JSON.parse(cachedLocation);
                // Check if cached location is less than 1 hour old
                if (Date.now() - parsed.timestamp < 3600000) {
                    setLocation(parsed);
                }
            } catch (err) {
                console.error('Error parsing cached location:', err);
            }
        }
    }, []);

    // Watch position (for continuous updates)
    const watchPosition = useCallback(() => {
        if (!isGeolocationAvailable) return null;

        const watchId = navigator.geolocation.watchPosition(
            (position) => {
                const newLocation = {
                    lat: position.coords.latitude,
                    lng: position.coords.longitude,
                    accuracy: position.coords.accuracy,
                    timestamp: position.timestamp
                };
                setLocation(newLocation);
            },
            (err) => {
                console.error('Watch position error:', err);
            },
            {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 60000
            }
        );

        return watchId;
    }, [isGeolocationAvailable]);

    // Clear location
    const clearLocation = useCallback(() => {
        setLocation(null);
        localStorage.removeItem('userLocation');
    }, []);

    return {
        location,
        loading,
        error,
        permissionGranted,
        isGeolocationAvailable,
        getCurrentPosition,
        requestPermission,
        calculateDistance,
        sortDoctorsByDistance,
        formatDistance,
        watchPosition,
        clearLocation
    };
};

export default useGeolocation;
