import express from "express";
import fs from 'fs-extra'; // Import fs-extra for file system operations
import path from 'path'; // Import path module for dealing with file paths
import Files from "../models/file.js";
import Buckets from "../models/bucket.js";
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Upload a file to a bucket
export const uploadFile = async (req, res) => {
    try {
        // Check if the bucket exists and belongs to the authenticated user
        const bucket = await Buckets.findOne({ _id: req.params.bucketId, owner: req.user._id });

        if (!bucket) return res.status(404).json({ error: 'Bucket not found or unauthorized' });

        // Check if a file with the same name already exists in the bucket
        const existingFile = await Files.findOne({ filename: req.file.originalname, bucket: req.params.bucketId });

        if (existingFile) return res.status(409).json({ error: 'File already exists in the bucket' });

        // Create a new file object
        const file = new Files({
            filename: req.file.originalname,
            path: req.file.path,
            bucket: req.params.bucketId,
            owner: req.user._id,
            mimetype: req.file.mimetype
        });

        // Save the file to the database
        await file.save();
        
        // Add file reference to the bucket
        await Buckets.findByIdAndUpdate(req.params.bucketId, { $push: { files: file._id } });

        res.status(201).send(file);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// List files belonging to the authenticated user
export const listFiles = async (req, res) => {
    try {
        const page = parseInt(req.params.page) || 1;
        const pageSize = parseInt(req.params.pageSize) || 10;

        const skip = (page - 1) * pageSize;

        // Fetch files for the current page, limiting the results to pageSize and skipping skip number of documents
        const files = await Files.find({ owner: req.user._id }, { filename: 1, _id: 1 })
                        .populate('bucket', 'bucketName')
                        .skip(skip)
                        .limit(pageSize);

        if (!files || files.length == 0) return res.status(200).json({ message: 'No files found' });

        const modifiedFiles = files.map(file => ({
            _id: file._id,
            filename: file.filename,
            bucketId: file.bucket._id,
            bucketName: file.bucket.bucketName,
        }));

        res.status(200).send(modifiedFiles);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
}

// Delete a file
export const deleteFile = async (req, res) => {
    try {
        const file = await Files.findOne({ _id: req.params.fileId, owner: req.user._id, bucket: req.params.bucketId }).populate('bucket', 'bucketName');

        if (!file) return res.status(404).json({ error: 'File not found' });

        const deletedFile = await Files.findOneAndDelete({ _id: req.params.fileId, owner: req.user._id, bucket: req.params.bucketId });

        if (!deletedFile) return res.status(500).json({ error: 'Failed to delete file' });

        // Remove the file reference from the bucket
        await Buckets.findByIdAndUpdate(
            file.bucket._id,
            { $pull: { files: deletedFile._id } },
            { new: true }
        );

        const filePath = path.join(__dirname, '..', 'uploads', file.bucket.bucketName, file.filename);
        
        // Delete the file from the file system
        await fs.rm(filePath, { recursive: true });

        res.status(200).json({ message: 'File deleted successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
}

// Update a file
export const updateFile = async (req, res) => {
    try {
        const file = await Files.findOne({ _id: req.params.fileId, owner: req.user._id, bucket: req.params.bucketId }).populate('bucket', 'bucketName _id');

        if (!file) return res.status(404).json({ warning: 'File not found' });

        const isDuplicateFile = await Files.findOne({ filename: req.file.originalname, owner: req.user._id, bucket: req.params.bucketId }).populate('bucket', 'bucketName _id');

        if (isDuplicateFile && isDuplicateFile._id != req.params.fileId) return res.status(404).json({ warning: 'Same file already exists under different id' });

        if (isDuplicateFile && isDuplicateFile.bucket._id != req.params.bucketId) return res.status(404).json({ warning: 'File does not exist in the given bucket' });
        if (file.filename != req.file.originalname) {
            const filePath = path.join(__dirname, '..', 'uploads', file.bucket.bucketName, file.filename);
            await fs.rm(filePath, { recursive: true });
        }

        // Update file information
        file.filename = req.file.originalname;
        file.mimetype = req.file.mimetype;
        file.path = req.file.path

        await file.save();

        res.status(200).json({ message: 'File updated successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Get a file for download or streaming
export const getFile = async (req, res) => {
    try {
        const file = await Files.findOne({ _id: req.params.fileId, owner: req.user._id });

        if (!file) return res.status(404).json({ warning: 'File not found' });

        const filePath = file.path;

        // Create a readable stream for the file
        const fileStream = fs.createReadStream(filePath);

        // Set the appropriate headers for streaming
        res.setHeader('Content-Type', file.mimetype);

        // Stream the file to the response object
        fileStream.pipe(res);

        // Handle errors during streaming
        fileStream.on('error', (error) => {
            console.error('Error streaming file:', error);
            res.status(500).json({ error: 'Internal server error' });
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
};