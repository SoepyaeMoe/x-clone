import { generateTokenAndSetCookies } from "../libs/utils/generateToken.js";
import User from "../models/user.model.js";
import bcrypt from "bcryptjs";

export const signup = async (req, res) => {
    try {
        const { username, fullname, email, password } = req.body;

        if (!username || !fullname || !email || !password) {
            return res.status(400).json({ error: "Please provide for all fields" });
        }

        // email format validation 
        const regex = /^([\w-]+(?:\.[\w-]+)*)@((?:[\w-]+\.)*\w[\w-]{0,66})\.([a-z]{2,6}(?:\.[a-z]{2})?)$/;
        if (!regex.test(email)) {
            return res.status(400).json({ error: "Invalid email" });
        }

        const existingUser = await User.findOne({ username });
        const existingEmail = await User.findOne({ email });

        if (existingUser) {
            return res.status(400).json({ error: "Username already exists" });
        }

        if (existingEmail) {
            return res.status(400).json({ error: "Email already exists" });
        }

        if (password.length < 6) {
            return res.status(400).json({ error: "Password must have at least 6 characters" });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        const newUser = new User({ username, fullname, email, password: hashedPassword });

        if (newUser) {
            generateTokenAndSetCookies(newUser._id, res);
            await newUser.save();
            res.status(201).json({
                _id: newUser._id,
                username: newUser.username,
                fullname: newUser.fullname,
                email: newUser.email,
                followers: newUser.followers,
                following: newUser.following,
                profileImg: newUser.profileImg,
                coverImg: newUser.coverImg
            });
        } else {
            res.status(400).json({ error: 'Invalid user data' })
        }
    } catch (error) {
        console.log(`Error in signup user ${error.message}`);
        res.status(500).json({ error: 'Internal server error' })
    }
}

export const login = async (req, res) => {
    try {
        const { username, password } = req.body;
        const user = await User.findOne({ username });
        const isPasswordCorrect = await bcrypt.compare(password, user?.password || '');

        if (!user || !isPasswordCorrect) {
            res.status(401).json({ error: 'Invalid username or password' });
        }

        if (isPasswordCorrect) {
            generateTokenAndSetCookies(user._id, res);
            res.status(200).json({
                _id: user._id,
                fullName: user.fullName,
                username: user.username,
                email: user.email,
                followers: user.followers,
                following: user.following,
                profileImg: user.profileImg,
                coverImg: user.coverImg,
            });
        }
    } catch (error) {
        console.log('Error in login ', error.message);
        res.status(500).json({ error: "Internal server error" });
    }
}

export const logout = async (req, res) => {
    try {
        res.clearCookie('token');
        res.status(200).json({ message: "Logged out successfully" });
    } catch (error) {
        console.log('Error in logout ', error.message);
        res.status(500).json({ error: "Internal server error" });
    }
}

export const getMe = async (req, res) => {
    try {
        const user = req.user;
        return res.status(200).json(user);
    } catch (error) {
        console.log("Error in get me controller", error.message);
    }
}
