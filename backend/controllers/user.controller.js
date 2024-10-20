import Notification from "../models/notification.mode.js";
import User from "../models/user.model.js";
import { isValidObjectId } from "mongoose";
import bcrypt from "bcryptjs";
import { v2 as cloudinary } from 'cloudinary';

export const getUserProfile = async (req, res) => {
    try {
        const { username } = req.params;
        const user = await User.findOne({ username }).select('-password');
        return res.status(200).json(user);
    } catch (error) {
        console.log("Error in user controller: ", error.message);
        return res.status(500).json({ error: "Internal server error" });
    }
}

export const followUnfollowUser = async (req, res) => {
    try {
        const { id } = req.params;
        if (!isValidObjectId(id)) {
            return res.status(400).json({ message: 'Invalid user id' });
        }
        const userToModify = await User.findById(id);
        const currentUser = req.user;
        console.log(currentUser)
        if (id === currentUser._id.toString()) return res.status(400).json({ message: "You cannot follow yourself" });
        if (!userToModify || !currentUser) return res.status(400).json({ message: "User not found" });

        const isFollow = userToModify.followers.includes(currentUser._id);
        if (isFollow) {
            // unfollow user
            await User.findByIdAndUpdate(id, { $pull: { followers: currentUser._id } });
            await User.findByIdAndUpdate(currentUser._id, { $pull: { following: id } });
            return res.status(200).json({ message: "User unfollow successfully" });
        } else {
            // follow user
            await User.findByIdAndUpdate(id, { $push: { followers: currentUser._id } });
            await User.findByIdAndUpdate(currentUser._id, { $push: { following: id } });

            // send noti
            const newNotification = new Notification({
                from: currentUser._id,
                to: id,
                type: 'follow'
            });

            await newNotification.save();
            return res.status(200).json({ message: "User follow successfully" });
        }
    } catch (error) {
        console.log("Error in follow unfollow controller ", error.message);
        return res.status(500).json({ error: "Internal server error" });
    }
}

export const getSuggestedUsers = async (req, res) => {
    try {
        const userId = req.user._id;
        const usersFollowByMe = await User.findById(userId).select('following');
        const users = await User.aggregate([
            {
                $match: { _id: { $ne: userId } },
            },
            { $sample: { size: 10 } }
        ]);
        const filteredUser = users.filter((user) => !usersFollowByMe.following.includes(user._id));
        const suggestedUsers = filteredUser.slice(0, 4);
        suggestedUsers.forEach((user) => user.password = null);
        res.status(200).json(suggestedUsers);
    } catch (error) {
        console.log("Error in get suggest users :", error.message);
        return res.status(500).json({ error: "Internal server error" });
    }
}

export const updateUser = async (req, res) => {
    try {
        const userId = req.user._id;
        const user = await User.findById(userId);
        if (!user) res.status(400).json({ error: "User not found" });

        const { username, fullname, bio, link, email, currentPassword, newPassword } = req.body;
        let { profileImg, coverImg } = req.body;
        if ((currentPassword && !newPassword) || (!currentPassword && newPassword)) {
            return res.status(400).json({ error: "Please provide both current password and new password" });
        }

        if (currentPassword && newPassword) {
            const isCorrect = await bcrypt.compare(currentPassword, user.password);
            if (isCorrect) {
                const salt = await bcrypt.genSalt(10);
                const hasedPasswored = await bcrypt.hash(newPassword, salt);
                user.password = hasedPasswored;
            } else {
                return res.status(400).json({ error: "Current password is incorrect" });
            }
        }

        if (profileImg) {
            if (user.profileImg) {
                // https://res.cloudinary.com/dyfqon1v6/image/upload/v1712997552/zmxorcxexpdbh8r0bkjb.png
                await cloudinary.uploader.destroy(user.profileImg.split("/").pop().split(".")[0]);
            }

            const uploadedResponse = await cloudinary.uploader.upload(profileImg);
            profileImg = uploadedResponse.secure_url;
        }

        if (coverImg) {
            if (user.coverImg) {
                await cloudinary.uploader.destroy(user.coverImg.split("/").pop().split(".")[0]);
            }

            const uploadedResponse = await cloudinary.uploader.upload(coverImg);
            coverImg = uploadedResponse.secure_url;
        }

        user.username = username || user.username;
        user.fullname = fullname || user.fullname;
        user.email = email || user.email;
        user.bio = bio || user.bio;
        user.link = link || user.link;
        user.profileImg = profileImg || user.profileImg;
        user.coverImg = coverImg || user.coverImg;

        await user.save();

        user.password = null //password should be null in response

        return res.status(200).json(user);

    } catch (error) {
        console.log("Error in update user", error.message);
        return res.status(500).json({ error: "Internal server error" });
    }
}