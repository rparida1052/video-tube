import mongoose, {isValidObjectId} from "mongoose"
import {Like} from "../models/like.model.js"
import {Video} from "../models/video.model.js"
import {Comment} from "../models/comment.model.js"
import {Tweet} from "../models/tweet.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"


const toggleLike = async (Model, resourceID, userID) => {
    if (!isValidObjectId(resourceID) || !isValidObjectId(userID)) {
        throw new ApiError("Invalid ResourceID or UserID");
    }

    const model = Model.modelName;

    const isLiked = await Likes.findOne({
        [model.toLowerCase()]: resourceID,
        likedBy: userID,
    });

    let responce;
    try {
        if (!isLiked) {
            responce = await Likes.create({
                [model.toLowerCase()]: resourceID,
                likedBy: userID,
            });
        } else {
            responce = await Likes.deleteOne({
                [model.toLowerCase()]: resourceID,
                likedBy: userID,
            });
        }
    } catch (error) {
        throw new ApiError(
            500,
            error?.message || "Something went wrong in ToggleLike."
        );
    }

    const totalLikes = await Likes.countDocuments({
        [model.toLowerCase()]: resourceID,
    });

    return { responce, isLiked, totalLikes };
};

const toggleVideoLike = asyncHandler(async (req, res) => {
    //TODO: toggle like on video
    const { videoId } = req.params;

    const { isLiked, totalLikes } = await toggleLike(
        Video,
        videoId,
        req.user?._id
    );

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                { totalLikes },
                !isLiked 
                    ? "Liked Succesfully"
                    : "Liked removed Succesfully"
            )
        );
})

const toggleCommentLike = asyncHandler(async (req, res) => {
    const { commentId } = req.params;
    //TODO: toggle like on comment

    const { responce, isLiked, totalLikes } = await toggleLike(
        Comment,
        commentId,
        req.user?._id
    );

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                { totalLikes },
                !isLiked
                    ? "Liked Succesfully"
                    : "Liked removed Succesfully"
            )
        );
})

const toggleTweetLike = asyncHandler(async (req, res) => {
    const { tweetId } = req.params;
    //TODO: toggle like on tweet

    const { responce, isLiked, totalLikes } = await toggleLike(
        Tweet,
        tweetId,
        req.user?._id
    );

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                { totalLikes },
                !isLiked
                    ? "Liked Succesfully"
                    : "Liked removed Succesfully"
            )
        );
}
)

const getLikedVideos = asyncHandler(async (req, res) => {
  //TODO: get all liked videos
  const userID = req.user?._id;

  if (!isValidObjectId(userID)) {
      throw new ApiError(401, "Invalid userID");
  }

  const likedVideo = await Like.aggregate([
      {
          $match: {
              $and: [
                  {likedBy: new mongoose.Types.ObjectId(`${userID}`)},
                  {video: {$exists: true}}
              ]
          },
      },
      {
          $lookup: {
              from: "videos",
              localField: "video",
              foreignField: "_id",
              as: "video",
              pipeline: [
                  {
                      $lookup: {
                          from: "users",
                          localField: "owner",
                          foreignField: "_id",
                          as: "owner",
                          pipeline: [
                              {
                                  $project: {
                                      fullname: 1,
                                      username: 1,
                                      avatar: 1,
                                  },
                              },
                          ],
                      },
                  },
                  {
                      $addFields: {
                          owner: {
                              $first: "$owner",
                          },
                      },
                  },
              ],
          },
      },
      {
          $addFields: {
              details: {
                  $first: "$video"
              }
          }
      },
  ]);

  return res
      .status(200)
      .json(
          new ApiResponse(200, likedVideo, "Succesfully fetched liked videos")
      );
})

export {
    toggleCommentLike,
    toggleTweetLike,
    toggleVideoLike,
    getLikedVideos
}