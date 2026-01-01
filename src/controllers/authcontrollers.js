
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
      let user = await users.findOne({ email: userRes.data.email });

      /* ------------------ NEW USER ------------------ */
      if (!user) {
        // Redirect to app for signup completion
        return res.redirect(
          `${process.env.FRONTEND_MOBILE_SCHEME}google-callback?` +
          `email=${encodeURIComponent(userRes.data.email)}&` +
          `name=${encodeURIComponent(userRes.data.name)}&` +
          `picture=${encodeURIComponent(userRes.data.picture)}`
        );
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

    return res.redirect(
  `${process.env.FRONTEND_MOBILE_SCHEME}://auth-success?token=${token}&userId=${user.id}`
);

       } catch (error) {
    console.error(
      "Error during Google OAuth callback:",
      error.response?.data || error.message
    );
    return res.status(500).json({success:false,error:error.message})
  }
};

// user creation at db whith extra info 

export const googleauthcreation = async (req,res) => {
  
try{
    const {name,email,picture,accountType} = req.body;
    if(!name || !email || !picture){
      return res.status(400).json({success:false,error:"All fields are required"})
    }

  let user = await users.findOne({email:email});
 
   const generateUserId = (name) => {
  const prefix = "SH"; // short for  shrami
  const randomPart = Math.random().toString(36).substring(2, 7).toUpperCase(); // e.g. X4KQ1
  const namePart = name ? name.substring(0, 3).toUpperCase() : "USR"; // e.g. PAN
  return `${prefix}-${namePart}${randomPart}`; // e.g. SH-PANX4KQ1
  };

    // Generate unique referral code
    const userId = generateUserId(name);

  if(!user){
    user = await users.create({
      fullName:name,
      email:email,
      password:"GOOGLE",
      profilePhoto:picture,
      accountType,
    
      userId,
 
    })
  }

  const token = jwt.sign(
    {
      id: user.id,
      name: user.fullName,
      email: user.email,
      picture: user.profilePhoto,
      accountType: user?.accountType,
      userId: user?.userId,
  
    },
    process.env.JWT_SECRET,
    { expiresIn: "30d" }
  );

  res.cookie("token", token, cookieOptions);
     return res.json({
      success: true,
      message: "Google signup successful",
      token,
      user,
    });
  
}catch(err){
 return res.status(500).json({success:false,error:err.message})
}
}


 export const verifyOtpAndSignup =  async (req, res) => {
  try {
    const { fullName,  password, accountType, token } = req.body;
    
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
          accountType,
          password:hashedPassword,
           isVerified: true });
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



 