import { Config } from '@remotion/cli/config';

// Use JPEG for video frames - smaller file size, faster processing
Config.setVideoImageFormat('jpeg');

// Allow overwriting existing output files
Config.setOverwriteOutput(true);

// Number of browser tabs to use for rendering
Config.setConcurrency(4);

// Use H.264 codec for broad compatibility
Config.setCodec('h264');

// Constant Rate Factor (CRF) for quality control (23 = high quality)
Config.setCrf(23);

// Pixel format for H.264 encoding - best compatibility
Config.setPixelFormat('yuv420p');
