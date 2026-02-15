import { Server } from 'socket.io';
import chatModel from './models/chatModel.js';

let io;

// Initialize Socket.io server
export const initializeSocket = (server) => {
    io = new Server(server, {
        cors: {
            origin: ["http://localhost:5173", "http://localhost:5174"],
            methods: ["GET", "POST"],
            credentials: true
        }
    });

    // Store online users
    const onlineUsers = new Map();

    io.on('connection', (socket) => {
        console.log('✅ User connected:', socket.id);

        // User joins with their ID
        socket.on('join', (userId) => {
            onlineUsers.set(userId, socket.id);
            socket.join(userId);
            console.log(`User ${userId} joined with socket ${socket.id}`);

            // Broadcast online status to all
            io.emit('user_online', userId);
        });

        // Doctor joins their queue room
        socket.on('join_doctor_queue', (docId) => {
            socket.join(`queue_${docId}`);
            console.log(`Doctor ${docId} joined queue room`);
        });

        // Patient joins their queue status room
        socket.on('join_patient_queue', (appointmentId) => {
            socket.join(`patient_${appointmentId}`);
            console.log(`Patient joined queue status room: ${appointmentId}`);
        });

        // Send message event
        socket.on('send_message', async (data) => {
            try {
                const { senderId, senderName, senderRole, receiverId, receiverName, receiverRole, message } = data;

                const conversationId = [senderId, receiverId].sort().join('_');

                const chatData = {
                    conversationId,
                    senderId,
                    senderName,
                    senderRole,
                    receiverId,
                    receiverName,
                    receiverRole,
                    message
                };

                const newMessage = new chatModel(chatData);
                await newMessage.save();

                // Send to receiver if online
                const receiverSocketId = onlineUsers.get(receiverId);
                if (receiverSocketId) {
                    io.to(receiverSocketId).emit('receive_message', newMessage);
                }

                // Send back to sender as confirmation
                socket.emit('message_sent', newMessage);

            } catch (error) {
                console.error('Error sending message:', error);
                socket.emit('message_error', { error: error.message });
            }
        });

        // Queue updated event - notify doctor and all patients in queue
        socket.on('queue_updated', (data) => {
            const { docId, appointment } = data;
            // Notify doctor about queue update
            io.to(`queue_${docId}`).emit('queue_updated', data);
            // Notify specific patient
            if (appointment.userId) {
                io.to(appointment.userId).emit('queue_updated', data);
            }
            console.log(`Queue updated for doctor ${docId}`);
        });

        // Priority updated event
        socket.on('priority_updated', (data) => {
            const { appointmentId, docId } = data;
            io.to(`queue_${docId}`).emit('priority_updated', data);
            io.to(`patient_${appointmentId}`).emit('priority_updated', data);
            console.log(`Priority updated for appointment ${appointmentId}`);
        });

        // Emergency booking event
        socket.on('emergency_booked', (data) => {
            const { success, appointment } = data;
            if (appointment?.userId) {
                io.to(appointment.userId).emit('emergency_booked', data);
            }
            // Also notify doctor
            io.to(`queue_${appointment.docId}`).emit('emergency_booked', data);
            console.log(`Emergency booking processed for user ${appointment?.userId}`);
        });

        // Patient removed from queue (appointment completed/cancelled)
        socket.on('patient_removed', (data) => {
            const { appointmentId, docId } = data;
            io.to(`queue_${docId}`).emit('patient_removed', data);
            io.to(`patient_${appointmentId}`).emit('patient_removed', data);
            socket.leave(`patient_${appointmentId}`);
            console.log(`Patient ${appointmentId} removed from queue`);
        });

        // Typing indicator
        socket.on('typing', (data) => {
            const { senderId, receiverId } = data;
            const receiverSocketId = onlineUsers.get(receiverId);
            if (receiverSocketId) {
                io.to(receiverSocketId).emit('typing_indicator', { userId: senderId });
            }
        });

        // Stop typing indicator
        socket.on('stop_typing', (data) => {
            const { senderId, receiverId } = data;
            const receiverSocketId = onlineUsers.get(receiverId);
            if (receiverSocketId) {
                io.to(receiverSocketId).emit('stop_typing_indicator', { userId: senderId });
            }
        });

        // Mark messages as read
        socket.on('mark_read', async (data) => {
            try {
                const { conversationId, receiverId } = data;

                await chatModel.updateMany(
                    { conversationId, receiverId, isRead: false },
                    { $set: { isRead: true } }
                );

                // Notify sender that messages were read
                const senderId = conversationId.replace(receiverId, '').replace('_', '');
                const senderSocketId = onlineUsers.get(senderId);
                if (senderSocketId) {
                    io.to(senderSocketId).emit('messages_read', { conversationId });
                }

            } catch (error) {
                console.error('Error marking as read:', error);
            }
        });

        // Handle disconnection
        socket.on('disconnect', () => {
            console.log('❌ User disconnected:', socket.id);

            // Find and remove user from online users
            for (let [userId, socketId] of onlineUsers.entries()) {
                if (socketId === socket.id) {
                    onlineUsers.delete(userId);
                    io.emit('user_offline', userId);
                    console.log(`User ${userId} went offline`);
                    break;
                }
            }
        });
    });

    console.log('✅ Socket.io server initialized');
    return io;
};

// Get Socket.io instance
export const getIO = () => {
    if (!io) {
        throw new Error('Socket.io not initialized');
    }
    return io;
};
