import React from 'react';

const SeverityBadge = ({ score, size = 'md' }) => {
    // Determine severity level label
    const getSeverityLabel = (score) => {
        if (score >= 76) return 'Critical';
        if (score >= 51) return 'High';
        if (score >= 26) return 'Medium';
        return 'Low';
    };

    const label = getSeverityLabel(score);

    // Unified color scheme - strictly Primary & White
    // We use Primary for all text/icons and Primary/5 for background
    const getSeverityStyles = (score) => {
        if (score >= 76) return { bg: 'bg-red-100', text: 'text-red-800', border: 'border-red-200', dot: 'bg-red-500' };
        if (score >= 51) return { bg: 'bg-orange-100', text: 'text-orange-800', border: 'border-orange-200', dot: 'bg-orange-500' };
        if (score >= 26) return { bg: 'bg-yellow-100', text: 'text-yellow-800', border: 'border-yellow-200', dot: 'bg-yellow-500' };
        return { bg: 'bg-green-100', text: 'text-green-800', border: 'border-green-200', dot: 'bg-green-500' };
    };
    const severityStyles = getSeverityStyles(score);

    // Size variants
    const sizeClasses = {
        sm: 'text-xs px-2 py-1',
        md: 'text-sm px-3 py-1.5',
        lg: 'text-base px-4 py-2'
    };

    const dotSizes = {
        sm: 'w-2 h-2',
        md: 'w-3 h-3',
        lg: 'w-4 h-4'
    };

    return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${severityStyles.bg} ${severityStyles.text} ${severityStyles.border} ${className}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${severityStyles.dot} animate-pulse`}></span>
            <span>{label}</span>
            {size !== 'sm' && (
                <span className="opacity-75">({score})</span>
            )}
        </span>
    );
};

export default SeverityBadge;


