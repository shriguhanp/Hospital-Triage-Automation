import React, { useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { AppContext } from '../../context/AppContext';
import { useContext } from 'react';

const ReportsTab = ({ appointmentId, onUpdate }) => {
    const { backendUrl, token, userData } = useContext(AppContext);
    const [uploading, setUploading] = useState(false);
    const [files, setFiles] = useState({
        woundImage: null,
        labReport: null,
        xRayImage: null,
        ecgData: null
    });

    const handleFileChange = (e, type) => {
        setFiles({ ...files, [type]: e.target.files[0] });
    };

    const handleUpload = async (type) => {
        if (!files[type]) return toast.error("Please select a file first");

        // Determine upload mode: Appointment vs Health Profile
        const isAppointmentUpload = !!appointmentId;
        const targetUrl = isAppointmentUpload
            ? backendUrl + '/api/user/upload-reports'
            : backendUrl + '/api/health/upload-report'; // Correct endpoint for health profile

        setUploading(true);
        const formData = new FormData();

        if (isAppointmentUpload) {
            formData.append('appointmentId', appointmentId);
            formData.append(type, files[type]);
        } else {
            // Health Profile Upload Mode
            if (!userData) {
                setUploading(false);
                return toast.error("User data not found. Please login.");
            }
            formData.append('userId', userData._id);
            // Map frontend type to backend healthProfile reportType
            // frontend: woundImage, labReport, xRayImage, ecgData
            // backend: woundImages, labReportPDFs, xrayImages, ecgCSVs
            let reportType = '';
            if (type === 'woundImage') reportType = 'woundImages';
            else if (type === 'labReport') reportType = 'labReportPDFs';
            else if (type === 'xRayImage') reportType = 'xrayImages';
            else if (type === 'ecgData') reportType = 'ecgCSVs';

            formData.append('reportType', reportType);
            formData.append('reports', files[type]); // Backend expects 'reports' array/field
        }

        try {
            const { data } = await axios.post(targetUrl, formData, {
                headers: { token, 'Content-Type': 'multipart/form-data' }
            });

            if (data.success) {
                toast.success(data.message);
                setFiles({ ...files, [type]: null });
                if (data.analysis) {
                    toast.info(`AI Analysis: ${data.analysis.severity} Severity (Score: ${data.analysis.score})`);
                }
                if (onUpdate) onUpdate();
            } else {
                toast.error(data.message);
            }
        } catch (error) {
            console.log(error);
            toast.error(error.message);
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-semibold text-gray-900">Medical Reports</h2>
            <p className="text-gray-600">Upload medical reports and images for AI analysis.</p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                {/* Wound Images */}
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-primary transition-colors">
                    <h3 className="font-medium text-gray-900 mb-1">Wound Images</h3>
                    <p className="text-sm text-gray-500 mb-4">Upload photos of injuries for AI Severity Analysis</p>
                    <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleFileChange(e, 'woundImage')}
                        className="mb-4 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-white hover:file:bg-gray-700"
                    />
                    <button
                        onClick={() => handleUpload('woundImage')}
                        disabled={uploading || !files.woundImage}
                        className={`px-4 py-2 rounded-lg text-white ${uploading || !files.woundImage ? 'bg-gray-400' : 'bg-primary hover:bg-gray-800'}`}
                    >
                        {uploading ? 'Uploading...' : 'Upload & Analyze'}
                    </button>
                    {files.woundImage && <p className="mt-2 text-xs text-green-600">Selected: {files.woundImage.name}</p>}
                </div>

                {/* Lab Reports */}
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-primary transition-colors">
                    <h3 className="font-medium text-gray-900 mb-1">Lab Reports</h3>
                    <p className="text-sm text-gray-500 mb-4">Upload PDF lab reports</p>
                    <input
                        type="file"
                        accept=".pdf"
                        onChange={(e) => handleFileChange(e, 'labReport')}
                        className="mb-4 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-white hover:file:bg-gray-700"
                    />
                    <button
                        onClick={() => handleUpload('labReport')}
                        disabled={uploading || !files.labReport}
                        className={`px-4 py-2 rounded-lg text-white ${uploading || !files.labReport ? 'bg-gray-400' : 'bg-primary hover:bg-gray-800'}`}
                    >
                        {uploading ? 'Uploading...' : 'Upload Report'}
                    </button>
                    {files.labReport && <p className="mt-2 text-xs text-green-600">Selected: {files.labReport.name}</p>}
                </div>

                {/* X-Ray Images */}
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-primary transition-colors">
                    <h3 className="font-medium text-gray-900 mb-1">X-Ray Images</h3>
                    <p className="text-sm text-gray-500 mb-4">Upload X-ray scans</p>
                    <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleFileChange(e, 'xRayImage')}
                        className="mb-4 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-white hover:file:bg-gray-700"
                    />
                    <button
                        onClick={() => handleUpload('xRayImage')}
                        disabled={uploading || !files.xRayImage}
                        className={`px-4 py-2 rounded-lg text-white ${uploading || !files.xRayImage ? 'bg-gray-400' : 'bg-primary hover:bg-gray-800'}`}
                    >
                        {uploading ? 'Uploading...' : 'Upload X-Ray'}
                    </button>
                    {files.xRayImage && <p className="mt-2 text-xs text-green-600">Selected: {files.xRayImage.name}</p>}
                </div>

                {/* ECG Data */}
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-primary transition-colors">
                    <h3 className="font-medium text-gray-900 mb-1">ECG Data</h3>
                    <p className="text-sm text-gray-500 mb-4">Upload ECG CSV or Image files</p>
                    <input
                        type="file"
                        accept=".csv, .pdf, image/*"
                        onChange={(e) => handleFileChange(e, 'ecgData')}
                        className="mb-4 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-white hover:file:bg-gray-700"
                    />
                    <button
                        onClick={() => handleUpload('ecgData')}
                        disabled={uploading || !files.ecgData}
                        className={`px-4 py-2 rounded-lg text-white ${uploading || !files.ecgData ? 'bg-gray-400' : 'bg-primary hover:bg-gray-800'}`}
                    >
                        {uploading ? 'Uploading...' : 'Upload ECG'}
                    </button>
                    {files.ecgData && <p className="mt-2 text-xs text-green-600">Selected: {files.ecgData.name}</p>}
                </div>
            </div>
        </div>
    );
};

export default ReportsTab;
