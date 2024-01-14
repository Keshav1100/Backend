import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
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

  //trying some consoles for more info
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

export { registerUser };
