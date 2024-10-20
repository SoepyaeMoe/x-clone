import Post from "../models/post.model.js";
import User from "../models/user.model.js";
import Notification from "../models/notification.mode.js";
import { v2 as cloudinary } from 'cloudinary';

export const createPost = async (req, res) => {
    try {
        const userId = req.user._id;
        const user = await User.findById(userId);
        const { text } = req.body;
        let { img } = req.body;

        if (!user) {
            return res.status(401).json({ error: "Unauthentorize:  Unknown user" });
        }

        if (!text && !img) return res.status(400).json({ error: "Post must have text or images" });

        if (img) {
            const uploadedResponse = await cloudinary.uploader.upload(img);
            img = uploadedResponse.secure_url;
        }

        const newPost = new Post({
            user: userId,
            text,
            img
        });
        await newPost.save();

        return res.status(201).json(newPost);
    } catch (error) {
        console.log("Error in creating post: ", error.message);
        return res.status(500).json({ error: 'Internal server error' });
    }
}

export const deletePost = async (req, res) => {
    try {
        const userId = req.user._id;
        const { postId } = req.params;
        const post = await Post.findById(postId);
        if (!post) return res.status(404).json({ error: "Post not found" });
        if (post.user.toString() !== userId.toString()) return res.status(400).json({ error: "You are not authorize to delete this post" });
        if (post.img) {
            const imgId = post.img.split("/").pop().split(".")[0];
            await cloudinary.uploader.destroy(imgId);
        }
        await Post.findByIdAndDelete(postId);
        return res.status(200).json({ message: 'Post deleted successfully' });
    } catch (error) {
        console.log("Error in delete post: ", error.message);
        return res.status(500).json({ error: "Internal server error" });
    }
}

export const commentOnPost = async (req, res) => {
    try {
        const userId = req.user._id;
        const { postId } = req.params;
        const { text } = req.body;
        const post = await Post.findById(postId);
        if (!post) return res.status(404).json({ error: "Post not found" });
        if (!text) return res.status(400).json({ error: "Text field is require" });
        post.comments.push({ user: userId, text });
        await post.save();

        const updatedPost = await Post.findById(postId)
            .populate({
                path: "user",
                select: "-password",
            })
            .populate({
                path: "comments.user",
                select: "-password",
            });

        return res.status(201).json(updatedPost);

    } catch (error) {
        console.log('Error in comment on post: ', error.message)
        return res.status(500).json({ error: "Internal server error" });
    }
}

export const likeUnlikePost = async (req, res) => {
    try {
        const userId = req.user._id;
        const { postId } = req.params;
        const post = await Post.findById(postId);
        if (!post) return res.status(404).json({ error: "Post not found" });
        const isLikedPost = post.likes.includes(userId);

        if (isLikedPost) {
            // unlike post
            await Post.updateOne({ _id: postId }, { $pull: { likes: userId } });
            await User.updateOne({ _id: userId }, { $pull: { likedPosts: postId } });
            const updatedLikes = post.likes.filter(like => like.toString() != userId.toString());
            return res.status(200).json(updatedLikes);
        } else {
            // like post
            post.likes.push(userId);
            await User.updateOne({ _id: userId }, { $push: { likedPosts: postId } });
            await post.save();
            if (userId.toString() !== post.user._id.toString()) {
                const noti = new Notification({
                    from: userId,
                    to: post.user,
                    type: 'like'
                });
                await noti.save();
            }
            const updatedLikes = post.likes;
            return res.status(200).json(updatedLikes);
        }
    } catch (error) {
        console.log("Error in like unlike post ", error.message);
        return res.status(500).json({ error: "Internal server error" });
    }

}

export const getAllPosts = async (req, res) => {
    try {
        const posts = await Post.find()
            .sort({ createdAt: -1 })
            .populate({
                path: "user",
                select: "-password",
            })
            .populate({
                path: "comments.user",
                select: "-password",
            });
        if (!posts) return res.status(200).json([]);
        return res.status(200).json(posts);
    } catch (error) {
        console.log("Error in get all post controller: ", error.message);
        return res.status(500).json({ error: "Internal server error" });
    }
}

export const getLikedPosts = async (req, res) => {
    try {
        const { username } = req.params;
        const user = await User.findOne({ username });

        if (!user) return res.status(404).json({ error: 'User not found' });

        const posts = await Post.find({ _id: { $in: user.likedPosts } }).sort({ createdAt: -1 })
            .populate({
                path: "user",
                select: "-password"
            })
            .populate({
                path: "comments.user",
                select: "-password"
            });

        if (!posts) return res.status(200).json([]);
        return res.status(200).json(posts);

    } catch (error) {
        console.log("Error in get liked post by user: ", error.message);
        return res.status(500).json({ error: 'Internal server error' });
    }
}

export const followingPosts = async (req, res) => {
    try {
        const user = req.user;
        const posts = await Post.find({ user: { $in: user.following } })
            .sort({ createdAt: -1 })
            .populate({
                path: 'user',
                select: '-password'
            })
            .populate({
                path: 'comments.user',
                select: '-password'
            });
        return res.status(200).json(posts);
    } catch (error) {
        console.log("Error in following posts: ", error.message);
        return res.status(500).json({ error: 'Internal server error' });
    }
}

export const getUserPosts = async (req, res) => {
    try {
        const { username } = req.params;
        const user = await User.findOne({ username });
        const posts = await Post.find({ user })
            .sort({ createdAt: -1 })
            .populate({
                path: 'user',
                select: '-password'
            })
            .populate({
                path: 'comments.user',
                select: '-password'
            });
        return res.status(200).json(posts);
    } catch (error) {
        console.log("Error in user's posts: ", error.message);
        return res.status(500).json({ error: 'Internal server error' });
    }
}