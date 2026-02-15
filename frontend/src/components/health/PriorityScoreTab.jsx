import React, { useEffect, useState, useContext } from 'react';
import { AppContext } from '../../context/AppContext';
import axios from 'axios';

const PriorityScoreTab = ({ profile }) => {
    const { backendUrl, token, userData } = useContext(AppContext);
    const [priorityData, setPriorityData] = useState(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (profile && userData) {
            fetchPriorityScore();
        }
    }, [profile]);

    const fetchPriorityScore = async () => {
        try {
            setLoading(true);
            const { data } = await axios.get(
                `${backendUrl}/api/health/priority-score/${userData._id}`,
                { headers: { token } }
            );

            if (data.success) {
                setPriorityData(data.priorityData);
            }
        } catch (error) {
            console.error('Error fetching priority score:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
        );
    }

    const score = priorityData?.score || profile?.priorityScore || 0;
    const level = priorityData?.level || profile?.priorityLevel || 'LOW';
    const colorCode = priorityData?.colorCode || profile?.colorCode || '#10B981';
    const breakdown = priorityData?.breakdown || {};

    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-semibold text-gray-900">Priority Score</h2>
            <p className="text-gray-600">Your medical priority score based on your health profile</p>

            {/* Main Score Display */}
            <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl p-8 text-center">
                <div className="text-6xl font-bold mb-4" style={{ color: colorCode }}>
                    {score}
                </div>
                <div className="text-sm text-gray-600 mb-4">out of 100</div>
                <div
                    className="inline-block px-6 py-3 rounded-full text-white font-bold text-lg"
                    style={{ backgroundColor: colorCode }}
                >
                    {level}
                </div>
            </div>

            {/* Progress Bar */}
            <div>
                <div className="flex justify-between text-sm text-gray-600 mb-2">
                    <span>Priority Level</span>
                    <span>{score}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-4">
                    <div
                        className="h-4 rounded-full transition-all duration-500"
                        style={{ width: `${score}%`, backgroundColor: colorCode }}
                    ></div>
                </div>
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>LOW</span>
                    <span>MEDIUM</span>
                    <span>HIGH</span>
                    <span>CRITICAL</span>
                </div>
            </div>

            {/* Score Breakdown */}
            {breakdown && Object.keys(breakdown).length > 0 && (
                <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Score Breakdown</h3>
                    <div className="space-y-3">
                        {Object.entries(breakdown).map(([category, value]) => (
                            <div key={category} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                <span className="text-sm font-medium text-gray-700 capitalize">{category}</span>
                                <span className="text-sm font-bold text-gray-900">{value} points</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Information */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-medium text-blue-900 mb-2">How is this calculated?</h4>
                <p className="text-sm text-blue-800">
                    Your priority score is calculated based on multiple factors including:
                </p>
                <ul className="list-disc list-inside text-sm text-blue-800 mt-2 space-y-1">
                    <li>Severity of symptoms (35%)</li>
                    <li>Chronic conditions (20%)</li>
                    <li>Symptom characteristics (20%)</li>
                    <li>Age factors (10%)</li>
                    <li>Vital signs (10%)</li>
                    <li>Medical history (5%)</li>
                </ul>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <p className="text-sm text-yellow-800">
                    <strong>Note:</strong> This score is automatically calculated and cannot be manually edited.
                    Update your health information in other tabs to recalculate your priority score.
                </p>
            </div>
        </div>
    );
};

export default PriorityScoreTab;
