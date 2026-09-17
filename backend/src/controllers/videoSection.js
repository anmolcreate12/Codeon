const cloudinary = require('cloudinary').v2;
const Problem = require("../models/problem");
const User = require("../models/user");
const SolutionVideo = require("../models/solutionVideo");

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const generateUploadSignature = async (req, res) => {
  try {
    const { problemId } = req.params;
    const userId = req.result._id;

    // Verify problem exists
    const problem = await Problem.findById(problemId);
    if (!problem) {
      return res.status(404).json({ error: 'Problem not found', message: 'Problem not found' });
    }

    // Generate unique public_id for the video
    const timestamp = Math.round(new Date().getTime() / 1000);
    const publicId = `leetcode-solutions/${problemId}/${userId}_${timestamp}`;
    
    // Upload parameters
    const uploadParams = {
      timestamp: timestamp,
      public_id: publicId,
    };

    // Generate signature
    const signature = cloudinary.utils.api_sign_request(
      uploadParams,
      process.env.CLOUDINARY_API_SECRET
    );

    return res.status(200).json({
      signature,
      timestamp,
      public_id: publicId,
      api_key: process.env.CLOUDINARY_API_KEY,
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      upload_url: `https://api.cloudinary.com/v1_1/${process.env.CLOUDINARY_CLOUD_NAME}/video/upload`,
    });

  } catch (error) {
    console.error('Error generating upload signature:', error);
    return res.status(500).json({ error: error.message, message: 'Failed to generate upload credentials' });
  }
};


const saveVideoMetadata = async (req, res) => {
  try {
    const {
      problemId,
      cloudinaryPublicId,
      secureUrl,
      duration,
    } = req.body;

    const userId = req.result._id;

    if (!problemId || !cloudinaryPublicId || !secureUrl) {
      return res.status(400).json({ error: 'Missing required video fields', message: 'Missing required video fields' });
    }

    // Verify problem exists
    const problem = await Problem.findById(problemId);
    if (!problem) {
      return res.status(404).json({ error: 'Problem not found', message: 'Problem not found' });
    }

    // Generate image thumbnail URL for the video
    const thumbnailUrl = cloudinary.url(cloudinaryPublicId, {
      resource_type: 'video',
      format: 'jpg',
      transformation: [
        { width: 640, height: 360, crop: 'fill' },
        { quality: 'auto' }
      ]
    });

    let videoDuration = duration || 0;

    // Try fetching Cloudinary metadata if available
    try {
      const cloudinaryResource = await cloudinary.api.resource(
        cloudinaryPublicId,
        { resource_type: 'video' }
      );
      if (cloudinaryResource?.duration) {
        videoDuration = cloudinaryResource.duration;
      }
    } catch (e) {
      console.warn('Cloudinary resource fetch info (resource may still be processing):', e.message);
    }

    // Check if video already exists for this problem and update or create
    let videoSolution = await SolutionVideo.findOne({ problemId });

    if (videoSolution) {
      videoSolution.cloudinaryPublicId = cloudinaryPublicId;
      videoSolution.secureUrl = secureUrl;
      videoSolution.duration = videoDuration;
      videoSolution.thumbnailUrl = thumbnailUrl;
      videoSolution.userId = userId;
      await videoSolution.save();
    } else {
      videoSolution = await SolutionVideo.create({
        problemId,
        userId,
        cloudinaryPublicId,
        secureUrl,
        duration: videoDuration,
        thumbnailUrl
      });
    }

    return res.status(201).json({
      message: 'Video solution saved successfully',
      videoSolution: {
        id: videoSolution._id,
        thumbnailUrl: videoSolution.thumbnailUrl,
        duration: videoSolution.duration,
        uploadedAt: videoSolution.createdAt
      }
    });

  } catch (error) {
    console.error('Error saving video metadata:', error);
    return res.status(500).json({ error: error.message, message: 'Failed to save video metadata' });
  }
};


const deleteVideo = async (req, res) => {
  try {
    const { problemId } = req.params;

    const video = await SolutionVideo.findOneAndDelete({ problemId });

    if (!video) {
      return res.status(404).json({ error: 'Video not found', message: 'Video not found' });
    }

    if (video.cloudinaryPublicId) {
      try {
        await cloudinary.uploader.destroy(video.cloudinaryPublicId, {
          resource_type: 'video',
          invalidate: true
        });
      } catch (cloudErr) {
        console.error('Error deleting from Cloudinary:', cloudErr);
      }
    }

    return res.status(200).json({ message: 'Video deleted successfully' });

  } catch (error) {
    console.error('Error deleting video:', error);
    return res.status(500).json({ error: error.message, message: 'Failed to delete video' });
  }
};

module.exports = { generateUploadSignature, saveVideoMetadata, deleteVideo };