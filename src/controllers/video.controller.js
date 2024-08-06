import mongoose, {isValidObjectId} from "mongoose"
import {Video} from "../models/video.model.js"
import {User} from "../models/user.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import {uploadOnCloudinary} from "../utils/cloudinary.js"


const getAllVideos = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10} = req.query
    let getAllVideo;
    try {
        getAllVideo = Video.aggregate([
            {
                $sample: {
                    size: parseInt(limit),
                },
            },
            {
                $lookup: {
                    from: "users",
                    localField: "owner",
                    foreignField: "_id",
                    as: "details",
                    pipeline: [
                        {
                            $project: {
                                fullname: 1,
                                avatar: 1,
                                username: 1,
                            },
                        },

                    ],
                },
            },

            {
                $addFields: {
                    details: {
                        $first: "$details",
                    },
                },
            },
        ]);
    } catch (error) {
        throw new ApiError(
            500,
            "Something went wrong while fetching Videos !!"
        );
    }

    const result = await Video.aggregatePaginate(getAllVideo, { page, limit });

    if (result.docs.length == 0) {
        return res.status(200).json(new ApiResponse(200, [], "No Video Found"));
    }

    return res
        .status(200)
        .json(
            new ApiResponse(200, result.docs, "Videos fetched Succesfully !")
        );

})

const publishAVideo = asyncHandler(async (req, res) => {
    const { title, description} = req.body;

    const thumbnailLocalPath = req.files?.thumbnail[0]?.path;
    const videoFileLocalPath = req.files?.videoFile[0]?.path;

    if (
        [title, description, thumbnailLocalPath, videoFileLocalPath].some(
            (field) => field?.trim() === ""
        )
    ) {
        throw new ApiError(400, "All field are required!");
    }

    const thumbnail = await uploadCloudinary(thumbnailLocalPath);
    const videoFile = await uploadCloudinary(videoFileLocalPath);

    if (!thumbnail) {
        throw new ApiError(400, "Thumbnail link is required");
    }

    if (!videoFile) {
        throw new ApiError(400, "VideoFile link is required");
    }

    const video = await Video.create({
        videoFile: videoFile.url,
        thumbnail: thumbnail.url,
        title,
        description,
        duration: videoFile.duration,
        isPublished: true,
        owner: req.user?._id,
    });

    if (!video) {
        throw new ApiError(
            500,
            "Something went wrong while uploading the video."
        );
    }

    return res
        .status(200)
        .json(new ApiResponse(200, video, "Video published succesfully."));
})

const getVideoById = asyncHandler(async (req, res) => {
    const { videoId } = req.params;
    //TODO: get video by id
    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid VideoID.");
    }

    const responce = await Video.findById(videoId);

    console.log("Printing responce of updateVideo: ", responce);
    if (!responce) {
        throw new ApiError(400, "Failed to get Video details.");
    }

    return res
        .status(200)
        .json(
            new ApiResponse(200, responce, "Video details fetched succesfully.")
        );
})

const updateVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params;
    const { title, description } = req.body;

    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid VideoID.");
    }
    const thumbnailLocalPath = req.file?.path;

    if (!title && !description && !thumbnailLocalPath) {
        throw new ApiError(400, "At lease one field is required.");
    }

    let thumbnail;
    if (thumbnailLocalPath) {
        thumbnail = await uploadCloudinary(thumbnailLocalPath);

        if (!thumbnail.url) {
            throw new ApiError(
                400,
                "Error while updating thumbnail in cloudinary."
            );
        }
    }

    const responce = await Video.findByIdAndUpdate(
        videoId,
        {
            $set: {
                title,
                description,
                thumbnail,
            },
        },
        { new: true }
    );

    if (!responce) {
        throw new ApiError(401, "Video details not found.");
    }

    return res
        .status(200)
        .json(
            new ApiResponse(200, responce, "Video details updated succesfully.")
        );

})

const deleteVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params;

    if (!isValidObjectId(videoId)) {
        throw new ApiError(402, "Invalid VideoID.");
    }

    const deleteResponce = await Video.deleteOne({
        _id: ObjectID(`${videoId}`),
    });

    console.log("Printing delete Responce: ", deleteResponce);
    if (!deleteResponce.acknowledged) {
        throw new ApiError(400, "Error while deteing video from db");
    }

    return res
        .status(200)
        .json(
            new ApiResponse(200, deleteResponce, "Video deleted succesfully.")
        );
})

const togglePublishStatus = asyncHandler(async (req, res) => {
    const { videoId } = req.params;

    if (!isValidObjectId(videoId)) {
        throw new ApiError(401, "Invalid VideoID");
    }

    const responce = await Video.findById(videoId);

    if (!responce) {
        throw new ApiError(401, "Video not found.");
    }

    responce.isPublished = !responce.isPublished;
    await responce.save({ validateBeforeSave: false });

    return res
        .status(200)
        .json(new ApiResponse(200, responce, "Published toggled succesfully."));
})

export {
    getAllVideos,
    publishAVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus
}
