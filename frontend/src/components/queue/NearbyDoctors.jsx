import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useGeolocation from '../../hooks/useGeolocation';

const NearbyDoctors = ({ doctors = [], limit = 5 }) => {
    const navigate = useNavigate();
    const {
        location,
        loading: locationLoading,
        getCurrentPosition,
        sortDoctorsByDistance,
        formatDistance,
        calculateDistance,
        error: locationError
    } = useGeolocation();

    const [nearbyDoctors, setNearbyDoctors] = useState([]);

    useEffect(() => {
        if (location && doctors.length > 0) {
            const sorted = sortDoctorsByDistance(doctors, location);
            // Filter doctors with location and limit results
            const withLocation = sorted.filter(doc => doc.location?.lat && doc.location?.lng);
            setNearbyDoctors(withLocation.slice(0, limit));
        } else if (!location && doctors.length > 0) {
            // If no location, show doctors without distance
            setNearbyDoctors(doctors.slice(0, limit).map(doc => ({ ...doc, distance: null })));
        }
    }, [location, doctors, sortDoctorsByDistance, limit]);

    const getDoctorDistance = (doc) => {
        if (!location || !doc.location?.lat) return null;
        return calculateDistance(location.lat, location.lng, doc.location.lat, doc.location.lng);
    };

    const handleDoctorClick = (docId) => {
        navigate(`/appointment/${docId}`);
    };

    if (doctors.length === 0) {
        return null;
    }

    return (
        <div className="bg-white rounded-xl border border-gray-200 p-4">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-800">Nearby Doctors</h3>

                {!location && (
                    <button
                        onClick={getCurrentPosition}
                        className="flex items-center gap-1 text-sm text-primary hover:underline"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        Enable Location
                    </button>
                )}
            </div>

            {/* Location Status */}
            {locationLoading && (
                <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
                    <div className="animate-spin w-4 h-4 border-2 border-primary border-t-transparent rounded-full"></div>
                    Getting your location...
                </div>
            )}

            {locationError && (
                <div className="flex items-center gap-2 text-sm text-primary mb-4">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {locationError}
                </div>
            )}

            {/* Doctor List */}
            {location && (
                <div className="flex items-center gap-2 text-xs text-gray-500 mb-3">
                    <span className="w-2 h-2 bg-primary rounded-full"></span>
                    Showing doctors near you
                </div>
            )}

            <div className="space-y-3">
                {nearbyDoctors.map((doctor) => {
                    const distance = getDoctorDistance(doctor);

                    return (
                        <div
                            key={doctor._id}
                            onClick={() => handleDoctorClick(doctor._id)}
                            className="flex items-center gap-3 p-3 rounded-lg border border-gray-100 hover:border-primary hover:bg-primary/5 cursor-pointer transition-all"
                        >
                            {/* Doctor Image */}
                            <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-100 flex-shrink-0">
                                <img
                                    src={doctor.image || '/default-doctor.png'}
                                    alt={doctor.name}
                                    className="w-full h-full object-cover"
                                    onError={(e) => {
                                        e.target.src = 'https://via.placeholder.com/48?text=Dr';
                                    }}
                                />
                            </div>

                            {/* Doctor Info */}
                            <div className="flex-1 min-w-0">
                                <h4 className="font-medium text-gray-900 truncate">{doctor.name}</h4>
                                <p className="text-sm text-gray-500 truncate">{doctor.speciality}</p>
                            </div>

                            {/* Distance & Availability */}
                            <div className="text-right flex-shrink-0">
                                {distance !== null ? (
                                    <span className="text-sm font-medium text-primary">
                                        {formatDistance(distance)}
                                    </span>
                                ) : (
                                    <span className="text-sm text-gray-400">-- km</span>
                                )}
                                <p className={`text-xs ${doctor.available ? 'text-green-500' : 'text-gray-500'}`}>
                                    {doctor.available ? 'Available' : 'Busy'}
                                </p>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* View All Link */}
            {doctors.length > limit && (
                <button
                    onClick={() => navigate('/doctors')}
                    className="w-full mt-4 py-2 text-sm text-primary font-medium hover:underline"
                >
                    View all {doctors.length} doctors
                </button>
            )}
        </div>
    );
};

export default NearbyDoctors;
