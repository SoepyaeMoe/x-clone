import jwt from "jsonwebtoken";

export const generateTokenAndSetCookies = (userId, res) => {
    const token = jwt.sign({ userId }, process.env.JWT_SECRET, {
        expiresIn: "15d",
    });

    res.cookie("token", token, {
        httpOnly: true, //to prevent XSS attack 
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict", //to prevent CSRF attack 
        maxAge: 15 * 24 * 60 * 60 * 1000, // 15 days in milliseconds
    });
}