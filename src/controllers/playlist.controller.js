import mongoose, {isValidObjectId} from "mongoose"
import {Playlist} from "../models/playlist.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"


const createPlaylist = asyncHandler(async (req, res) => {
    //TODO: create playlist ans save that particular video in that created playlist
    const {name, description} = req.body;

    if(!name || !description) {
        throw new ApiError(401, "Both field are required.")
    }

    const responce = await Playlist.create(
        {
            name,
            description,
            owner: new mongoose.Types.ObjectId(`${req.user?._id}`)
        }
    )

    if(!responce) {
        throw new ApiError(500, "Something went wrong while making playlist")
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200, responce, "Playlist created succesfully.")
    )
})

const getUserPlaylists = asyncHandler(async (req, res) => {
    //TODO: get user playlists
    const {userId} = req.params

    if(!isValidObjectId(userId)) {
        throw new ApiError(400, "Invalid userID")
    }

    const playlists = await Playlist.aggregate([
        {
            $match: {
                owner: new mongoose.Types.ObjectId(`${userId}`)
            }
        },
            {
            $lookup: {
                from: "videos",
                localField: "videos",
                foreignField: "_id",
                as: "details",
                pipeline: [
                    {
                        $project: {
                            thumbnail: 1
                        }
                    }
                ]
            }
        },
    ])

    return res
    .status(200)
    .json(
        playlists.length ?
        new ApiResponse(200, playlists, "User playlist data fetched succesfully.")
        :
        new ApiResponse(200, playlists, "No playlist found.")

    )
    
})

const getPlaylistById = asyncHandler(async (req, res) => {
    //TODO: get playlist by id
    const {playlistId} = req.params

    if(!isValidObjectId(playlistId)) {
        throw new ApiError(401, "Invalid playlistID")
    }

    const playlist = await Playlist.aggregate([
        {
            $match: {
                _id: new mongoose.Types.ObjectId(`${playlistId}`)
            }
        },
            {
                $lookup: {
                from: "videos",
                localField: "videos",
                foreignField: "_id",
                as: "details",
                pipeline: [
                    {
                        $lookup: {
                            from: "users",
                            localField: "owner",
                            foreignField: "_id",
                            as: "userInfo",
                            pipeline: [
                                {
                                    $project:{
                                        fullname: 1,
                                        username: 1,
                                        avatar: 1
                                    }
                                }
                            ]
                        }
                    },
                    {
                        $addFields: {
                            userInfo: {
                                $first: "$userInfo"
                            }
                        }
                    }
                ]
            }
        }
    ])

    if(!playlist) {
        throw new ApiError(500, "Something went wrong while getting playlist.")
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200, playlist, "Success")
    )

})

const addVideoToPlaylist = asyncHandler(async (req, res) => {
    const {playlistId, videoId} = req.params;

    if(!isValidObjectId(playlistId) && !isValidObjectId(videoId)) {
        throw new ApiError(401,"Invalid PlaylistID and videoID")
    }

    const playlist = await Playlist.findById(playlistId)

    if(!playlist) {
        throw new ApiError(400, "Cannout find playlist")
    }

    
    const responce = await Playlist.findByIdAndUpdate(
        playlistId,
        {
            $addToSet: {
                videos: videoId
            }
        },
        {
            new: true
        }
    )

    if(!responce) {
        throw new ApiError(500, "Something went wrong while adding Video to playlist.")
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200, responce, "Video added to playlist succesfully.")
    )

})

const removeVideoFromPlaylist = asyncHandler(async (req, res) => {

    const {playlistId, videoId} = req.params

    if(!isValidObjectId(playlistId) && !isValidObjectId(videoId)) {
        throw new ApiError(401,"Invalid PlaylistID and videoID")
    }

    const playlist = await Playlist.findById(playlistId)

    if(!playlist) {
        throw new ApiError(400, "Cannout find playlist")
    }

    
    const responce = await Playlist.findByIdAndUpdate(
        playlistId,
        {
            $pull: {
                videos: {
                    $in: [`${videoId}`]
                }
            }
        },
        {
            new: true
        }
    )

    if(!responce) {
        throw new ApiError(500, "Something went wrong while removing  Video from playlist.")
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200, responce, "Video removed from playlist succesfully.")
    )

})

const deletePlaylist = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    // TODO: delete playlist

    if(!isValidObjectId(playlistId)) {
        throw new ApiError(401,"Invalid PlaylistID.")
    }

    const playlist = await Playlist.findById(playlistId)

    if(!playlist) {
        throw new ApiError(400, "Cannout find playlist")
    }

    
    const responce = await Playlist.findByIdAndDelete(playlistId);

    if(!responce) {
        throw new ApiError(500, "Something went wrong while deleting playlist.")
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200, responce, "Playlist deleted succesfully.")
    )

})

const updatePlaylist = asyncHandler(async (req, res) => {
    //TODO: update playlist

    const {playlistId} = req.params

    if(!isValidObjectId(playlistId)) {
        throw new ApiError(401, "Invalid playlistID")
    }

    const {name, description} = req.body

    if(!name && !description) {
        throw new ApiError(401, "Atleast one of the field is required.")
    }

    const playlist = await Playlist.findByIdAndUpdate(
        playlistId,
        {
            $set: {
                name,
                description
            }
        },{new: true}
    )

    if(!playlist) {
        throw new ApiError(500, "Something went wrong while updating playlist.")
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200, playlist, "Playlist updates succesfully.")
    )
})

export {
    createPlaylist,
    getUserPlaylists,
    getPlaylistById,
    addVideoToPlaylist,
    removeVideoFromPlaylist,
    deletePlaylist,
    updatePlaylist
}
