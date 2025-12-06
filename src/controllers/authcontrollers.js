
import users from "../models/users.js";
import axios from "axios";
import jwt from "jsonwebtoken";
 

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
      let user = await users.findOne({email:userRes.data.email});
      if(!user){
   return res.redirect(
  `${process.env.FRONTEND_SERVICE}/google-callback?email=${userRes.data.email}&name=${userRes.data.name}&picture=${userRes.data.picture}`
   );
      }
      else{
      const token = jwt.sign(
        {
          id: user.id,
          name: user.fullName,
          email: user.email,
          picture: user.profilePhoto,
          accountType: user.accountType,
          provider: user.provider,
          userId: user.userId,
          referralCode: user.referralCode,
          totalcoins: user.totalcoins,
          portfolio: user.portfolio,
          supporting: user.supporting,
          supporters: user.supporters,
        },
        process.env.JWT_SECRET,
        { expiresIn: "30d" }
      );
      res.cookie("token", token, cookieOptions);

      return res.redirect(`${process.env.FRONTEND_SERVICE}/dashboard/${user?.id}`);
         }

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
    const {name,email,picture,accountType,referralCode,userId} = req.body;
    if(!name || !email || !picture){
      return res.status(400).json({success:false,error:"All fields are required"})
    }

  let user = await users.findOne({email:email});

  if(!user){
    user = await users.create({
      fullName:name,
      email:email,
      password:"GOOGLE",
      profilePhoto:picture,
      accountType,
      referralCode,
      userId,
      provider:"google",
    })
  }

  const token = jwt.sign(
    {
      id: user.id,
      name: user.fullName,
      email: user.email,
      picture: user.profilePhoto,
      accountType: user.accountType,
      provider: user.provider,
      userId: user.userId,
      referralCode: user.referralCode,
      totalcoins: user.totalcoins,
      portfolio: user.portfolio,
      supporting: user.supporting,
      supporters: user.supporters,
    },
    process.env.JWT_SECRET,
    { expiresIn: "30d" }
  );

  res.cookie("token", token, cookieOptions);
     return res.json({
      success: true,
      message: "Google signup successful",
      user: user,
    });

}catch(err){
 return res.status(500).json({success:false,error:err.message})
}
}