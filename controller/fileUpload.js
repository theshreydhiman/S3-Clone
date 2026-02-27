import multer from 'multer'; // Import multer for handling file uploads
import Buckets from '../models/bucket.js'; // Import the Buckets model
import Files from '../models/file.js'; // Import the Files model

// Allow only alphanumeric, dash, underscore, dot, and space characters in names
// used as filesystem paths to prevent directory traversal attacks.
const isSafeName = (name) => /^[a-zA-Z0-9._\- ]+$/.test(name);

// Multer storage configuration for file uploads
const storage = multer.diskStorage({
    destination: async function (req, file, cb) {
        try {
            if (!isSafeName(file.originalname)) {
                return cb(new Error('Invalid file name. Avoid path separators and special characters.'));
            }

            // Find the bucket associated with the upload
            const bucket = await Buckets.findOne({ _id: req.params.bucketId, owner: req.user._id });
            
            // If bucket doesn't exist for the authenticated user, throw an error
            if (!bucket) {
                throw new Error('Bucket not found for the authenticated user');
            }

            // Check if the upload is for creating a new file or updating an existing one
            if (!req.params?.fileId) {
                // If creating a new file, check if a file with the same name already exists in the bucket
                const files = await Files.findOne({ filename: file.originalname, owner: req.user._id, bucket: bucket._id  });
                if (files) {
                    throw new Error('File already exists in the bucket. Please patch if you want to change!');
                }
            } else {
                // If updating an existing file, perform additional checks
                let files = await Files.findOne({ _id: req.params.fileId, owner: req.user._id, bucket: req.params.bucketId });
                
                if (!files) throw new Error('File not found');

                files = await Files.findOne({ filename: file.originalname, owner: req.user._id, bucket: req.params.bucketId }).populate('bucket', 'bucketName _id');
                
                if(files && files._id != req.params.fileId) throw new Error('Same file already exists under different id!');
                if(files && files.bucket._id != req.params.bucketId) throw new Error('File does not exist in the given bucket!');
            }

            // Set destination folder based on bucket name
            cb(null, `uploads/${bucket.bucketName}/`);
        } catch (error) {
            cb(error);
        }
    },
    filename: function (req, file, cb) {
        cb(null, file.originalname); // Set filename to the original filename
    }
});

// Create multer instance with the configured storage
export const upload = multer({ storage: storage });