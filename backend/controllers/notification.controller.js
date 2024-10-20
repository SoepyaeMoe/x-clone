import Notification from '../models/notification.mode.js';

export const getNotifications = async (req, res) => {
    try {
        const { user } = req;
        const notifications = await Notification.find({ to: user._id })
            .sort({ createdAt: -1 })
            .populate({
                path: 'from',
                select: '-password'
            });
        return res.status(200).json(notifications);
    } catch (error) {
        console.log("Error in get notification: ", error.message);
        return res.status(500).json({ error: "Internal server error" });
    }
}

export const deleteNotifications = async (req, res) => {
    try {
        const { user } = req;
        await Notification.deleteMany({ to: user._id });
        return res.status(200).json({ message: "Notification delete successfully" })
    } catch (error) {
        console.log('Error in delete notifications: ', error.message);
        return res.status(500).json({ error: 'Internal server error' });
    }
}