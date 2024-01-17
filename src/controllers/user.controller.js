import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";

const generateAccessandRefreshTokens = async (userId) => {
  try {
    const user = await User.findOne(userId);
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();
    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });
    return { accessToken, refreshToken };
  } catch (error) {
    throw new ApiError(
      500,
      "Something went wrong while generating refresh and access tokens at the server."
    );
  }
};

const registerUser = asyncHandler(async (req, res) => {
  // get the user details from the frontend
  // validation - not empty
  // check if user already exists: username, email
  // check for avatar, check for coverImage
  // upload them to cloudinary, check for avatar on cloudinary once again
  // create user object - create entry in db
  // remove password and refreshToken field from response
  // check for user creation
  // return res
  // check for user creation
  // return res

  // Here it starts
  // get the user details from the frontend
  const { userName, email, fullName, password } = req.body;
  // console.log(email);
  // validation - not empty
  if (
    [userName, email, fullName, password].some((field) => {
      return field?.trim() === "";
    })
  ) {
    throw new ApiError(400, "All fields are required.");
  }
  // check if user already exists: username, email
  const existingUser = await User.findOne({
    $or: [{ userName }, { email }],
  });
  // try consoles of some variables
  if (existingUser) {
    throw new ApiError(409, "User already exists.");
  }

  // trying some consoles for more info
  // console.log(req.files);
  // console.log(req.body);

  // check for avatar, check for coverImage
  const avatarLocalPath = req.files?.avatar[0]?.path;
  let coverImageLocalPath;
  if (
    req.files &&
    Array.isArray(req.files.coverImage) &&
    req.files.coverImage.length > 0
  ) {
    coverImageLocalPath = req.files.coverImage[0].path;
  }
  if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar file is required.");
  }
  // upload them to cloudinary, check for avatar on cloudinary once again
  const avatar = await uploadOnCloudinary(avatarLocalPath);
  const coverImage = await uploadOnCloudinary(coverImageLocalPath);
  if (!avatar) {
    throw new ApiError(400, "Avatar file is required.");
  }
  // create user object - create entry in db
  const user = await User.create({
    userName: userName.toLowerCase(),
    fullName,
    email,
    password,
    avatar: avatar.url,
    coverImage: coverImage.url || "",
  });

  // remove password and refreshToken field from response
  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );
  if (!createdUser) {
    throw new ApiError(500, "Something went wrong during registration.");
  }

  return res
    .status(201)
    .json(new ApiResponse(200, createdUser, "User registered successfully"));
});

const loginUser = asyncHandler(async (req, res) => {
  // get the username/email and password from the user
  // check if the email/ username exists
  // if exists, check the password
  // give the accessToken and refresh token to the user
  // send cookies

  // get the username/email and password from the user
  const { userName, email, password } = req.body;
  if (!userName && !email) {
    throw (new ApiError(400), "Username or email is required.");
  }
  // check if the email/ username exists
  const user = await User.findOne({
    $or: [{ userName }, { email }],
  });
  if (!user) {
    throw new ApiError(404, "The user does not exist.");
  }
  // if exists, check the password
  const isPasswordCorrect = user.isPasswordCorrect(password);
  if (!isPasswordCorrect) {
    throw new ApiError(401, "Password is incorrect");
  }

  // give the accessToken and refresh token to the user
  const { accessToken, refreshToken } = await generateAccessandRefreshTokens(
    user._id
  );

  const loggedInUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );
  // Sending required data as cookies to the user
  const options = {
    httpOnly: true,
    secure: true,
  };
  // above options ensure the the cookies are not editable by the frontend and can only be editted by the server

  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new ApiResponse(
        200,

        {
          user: loggedInUser,
          accessToken,
          refreshToken,
        }, // Here we are sending tokens again so that if the user wnats to use them for some reason like creating a mobile app,etc. , so its a good practice.
        "User logged in successfully"
      )
    );
});

const logoutUser = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(
    req.user._id,
    {
      $set: {
        refreshToken: undefined,
      },
    },
    {
      new: true,
    }
  );
  const options = {
    httpOnly: true,
    secure: true,
  };
  return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(200, {}, "User logged out successfully");
});
export { registerUser, loginUser, logoutUser };
