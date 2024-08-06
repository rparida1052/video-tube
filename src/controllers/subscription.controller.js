import mongoose, {isValidObjectId} from "mongoose"
import {User} from "../models/user.model.js"
import { Subscription } from "../models/subscription.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"


const toggleSubscription = asyncHandler(async (req, res) => {
  const {channelId} = req.params;
  const {sub} = req.query;

  if(!isValidObjectId(channelId)) {
      throw new ApiError(500, "ChannelID is required.")
  }

  if(sub === "true") {
      await Subscription.deleteOne(
          {
              channel: channelId,
              subscriber: req.user?._id
          }
      )
  }else{
      await Subscription.create({
          subscriber: req.user?._id,
          channel: channelId
      })
  }

  return res
  .status(200)
  .json(
      new ApiResponse(200, {}, "Subscriptiion toggled succesfully.")
  )
})

// controller to return subscriber list of a channel
const getUserChannelSubscribers = asyncHandler(async (req, res) => {
    const {channelId} = req.params;

    if(!isValidObjectId(channelId)) {
        throw new ApiError(400, "ChannelID is required.")
    }

    const channel = await Subscription.aggregate([
        {
            $match: {
                channel: new mongoose.Types.ObjectId(`${channelId}`)
            }
        }
    ])

    const subscriberCount = channel.length;

    return res
    .status(200)
    .json(
        new ApiResponse(200, subscriberCount, "Succesfully fetched number of subscriber of the given channelID.")
    )
})

// controller to return channel list to which user has subscribed
const getSubscribedChannels = asyncHandler(async (req, res) => {
    const {channelId} = req.params;

    if(!isValidObjectId(channelId)) {
        throw new ApiError(400, "SubscriberID is required.")
    }


    const channel = await Subscription.aggregate([
        {
            $match: {
                $and: [
                    {
                        channel: new mongoose.Types.ObjectId(`${channelId}`),
                        subscriber: new mongoose.Types.ObjectId(`${req.user._id}`)
                    }
                ]
            }
        }
    ])

    const isSubscribed = channel.length;

    return res
    .status(200)
    .json(
        new ApiResponse(200, isSubscribed, "User subscribed or not is checked.")
    )

})

export {
    toggleSubscription,
    getUserChannelSubscribers,
    getSubscribedChannels
}