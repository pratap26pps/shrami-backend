
import users from "../models/users.js";
import axios from "axios";
import jwt from "jsonwebtoken";
 import bcrypt from "bcryptjs";
 import admin from "../config/firebaseAdmin.js";
 

const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "strict",
};

export const googleLogin = (_req, res) => {
  const redirectUrl =
    `https://accounts.google.com/o/oauth2/v2/auth?` +
    `client_id=${process.env.GOOGLE_CLIENT_ID}` +
    `&redirect_uri=${process.env.GOOGLE_REDIRECT_URI}` +
    `&response_type=code` +
    `&scope=openid%20email%20profile`;
  console.log("redirectUrl",redirectUrl)
  res.redirect(redirectUrl);
};

export const callback = async (req, res) => {
  try {
    const code = req.query.code;
    const tokenRes = await axios.post(process.env.TOKEN_URI, {
      code,
      client_id: process.env.GOOGLE_CLIENT_ID,
      client_secret: process.env.GOOGLE_CLIENT_SECRET,
      redirect_uri: process.env.GOOGLE_REDIRECT_URI,
      grant_type: "authorization_code",
    });

    const access_token = tokenRes.data.access_token;

    const userRes = await axios.get(
      "https://www.googleapis.com/oauth2/v2/userinfo",
      {
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      }
    );

    const { email, name, picture } = userRes.data;
      let user = await users.findOne({ email});

   const generateUserId = (name) => {
      const prefix = "SH";
      const randomPart = Math.random().toString(36).substring(2, 7).toUpperCase();
      const namePart = name?.substring(0, 3).toUpperCase() || "USR";
      return `${prefix}-${namePart}${randomPart}`;
    };
      /* ------------------ NEW USER ------------------ */
      if (!user) { 
         user = await users.create({
        fullName: name,
        email,
        password: "GOOGLE",
        profilePhoto: picture,
        provider: "google",
        userId: generateUserId(name),
      }); 

      }

      /* ------------------ EXISTING USER ------------------ */
      const token = jwt.sign(
        {
          id: user._id,
          name: user.fullName,
          email: user.email,
          picture: user.profilePhoto,
          accountType: user.accountType,
          provider: user.provider,
        },
        process.env.JWT_SECRET,
        { expiresIn: "30d" }
      );

      res.cookie("token", token, cookieOptions);

    const scheme = process.env.FRONTEND_MOBILE_SCHEME || "shramiapp";
    const appUrl = `${scheme}://auth-success?token=${encodeURIComponent(token)}&userId=${user.id}`;
    const baseUrl = process.env.BACKEND_URL || "https://shrami-backend.onrender.com";
    return res.redirect(`${baseUrl}/api/auth/open-app?redirect=${encodeURIComponent(appUrl)}`);
  } catch (error) {
    console.error(
      "Error during Google OAuth callback:",
      error.response?.data || error.message
    );
    return res.status(500).json({success:false,error:error.message})
  }
};

/** Serves a small HTML page that redirects to the app (shramiapp://auth-success?token=...). */
export const openAppPage = (req, res) => {
  const redirect = req.query.redirect || "";
  const safeRedirect = redirect.startsWith("shramiapp://") ? redirect : "";
  const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/"/g, "&quot;");
  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Opening Shrami...</title>
  ${safeRedirect ? `<meta http-equiv="refresh" content="0;url=${esc(safeRedirect)}">` : ""}
</head>
<body>
  <p style="font-family:sans-serif;text-align:center;padding:2rem;">Opening Shrami app...</p>
  ${safeRedirect ? `<p style="font-family:sans-serif;text-align:center;"><a href="${esc(safeRedirect)}">Tap here if the app doesn't open</a></p>
  <script>window.location.href = ${JSON.stringify(safeRedirect)};</script>` : ""}
</body>
</html>`;
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.send(html);
};

 export const verifyOtpAndSignup =  async (req, res) => {
  try {
    const { fullName,  password, token } = req.body;
    
    const decoded = await admin.auth().verifyIdToken(token);
    const ContactNumber = decoded.phone_number;

    let user = await users.findOne({ ContactNumber });

    const generateUserId = (fullName) => {
      const prefix = "SH";
      const randomPart = Math.random().toString(36).substring(2, 7).toUpperCase();
      const namePart = fullName.substring(0, 3).toUpperCase();
      return `${prefix}-${namePart}${randomPart}`;
    };

    const userId = generateUserId(fullName);
      // 🔐 HASH PASSWORD HERE
      const hashedPassword = await bcrypt.hash(password, 10);

    if (!user) {
      user = await users.create(
        {fullName, 
          ContactNumber,
          userId,
          password:hashedPassword,
          sVerified: true });
    }

    const appToken = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );
      res.cookie("token", appToken, { httpOnly: true });
    res.json({ success: true, message: "Signup verified successfully", token: appToken, user });
  } catch (err) {
    res.status(401).json({ success: false, error: err.message });
  }
};



export const LoginHandler = async (req, res) => {
  try {
    const { ContactNumber, password } = req.body;

    // 1️⃣ Validate input
    if (!ContactNumber || !password) {
      return res.status(400).json({
        success: false,
        error: "Contact number and password are required",
      });
    }

    // 2️⃣ Find user
    const user = await users.findOne({ ContactNumber });
    if (!user) {
      return res.status(401).json({
        success: false,
        error: "Invalid contact number",
      });
    }

    // 3️⃣ Compare password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        error: "Invalid password",
      });
    }

    // 4️⃣ Generate JWT
    const appToken = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    // 5️⃣ Set cookie (optional for web)
    res.cookie("token", appToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
    });

    // 6️⃣ Success response
    res.status(200).json({
      success: true,
      message: "Login successful",
      token: appToken,
      user: {
        _id: user._id,
        fullName: user.fullName,
        ContactNumber: user.ContactNumber,
        accountType: user.accountType,
      },
    });
  } catch (err) {
    console.error("LOGIN ERROR 👉", err);
    res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
};

/** GET /me – return current user from Bearer token (for app startup / profile) */
export const getMe = async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ success: false, error: "Token required" });
    }
    const token = authHeader.replace("Bearer ", "");
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.userId || decoded.id;
    if (!userId) {
      return res.status(401).json({ success: false, error: "Invalid token" });
    }
    const user = await users.findById(userId).select("-password -resetOtp -resetOtpExpiry");
    if (!user) {
      return res.status(404).json({ success: false, error: "User not found" });
    }
    res.json({
      success: true,
      user: {
        _id: user._id,
        fullName: user.fullName,
        ContactNumber: user.ContactNumber,
        profilePhoto: user.profilePhoto,
        email: user.email,
        accountType: user.accountType,
        userId: user.userId,
      },
    });
  } catch (err) {
    if (err.name === "JsonWebTokenError" || err.name === "TokenExpiredError") {
      return res.status(401).json({ success: false, error: "Invalid or expired token" });
    }
    return res.status(500).json({ success: false, error: err.message });
  }
};

export const LogoutHandler = async (req, res) => {
  try {
    // Clear cookie (for web support)
    res.clearCookie("token", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
    });

    return res.status(200).json({
      success: true,
      message: "Logged out successfully",
    });
  } catch (error) {
    console.error("LOGOUT ERROR 👉", error);
    return res.status(500).json({
      success: false,
      error: "Logout failed",
    });
  }
};


export const forgotPassword = async (req, res) => {
  try {
    const { token } = req.body;

    // 🔐 Verify Firebase token
    const decoded = await admin.auth().verifyIdToken(token);
    const ContactNumber = decoded.phone_number.replace("+91", "");

    const user = await users.findOne({ ContactNumber });
    if (!user) {
      return res.status(404).json({
        success: false,
        error: "User not found",
      });
    }

    res.json({
      success: true,
      message: "OTP verified, proceed to reset password",
    });
  } catch (err) {
    res.status(401).json({
      success: false,
      error: "Invalid or expired token",
    });
  }
};


export const resetPassword = async (req, res) => {
  try {
    const { resetToken, password } = req.body;

    const decoded = jwt.verify(resetToken, process.env.JWT_SECRET);

    const user = await users.findOne({
      ContactNumber: decoded.ContactNumber,
    });

    if (!user) {
      return res.status(404).json({ success: false, error: "User not found" });
    }

    user.password = await bcrypt.hash(password, 10);
    user.resetOtp = undefined;
    user.resetOtpExpiry = undefined;
    await user.save();

    res.json({ success: true, message: "Password reset successful" });
  } catch (err) {
    res.status(401).json({ success: false, error: "Invalid or expired token" });
  }
};



 