import express from "express";
import { uploadFile, listFiles, deleteFile, updateFile, getFile } from "../controller/file.js";
import { auth } from "../middleware/auth.js";
import { upload } from '../controller/fileUpload.js';

const router = express.Router();

/**
 * @swagger
 * /file/{bucketId}/files:
 *   post:
 *     summary: Upload File
 *     description: Upload a file to a specific bucket
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: bucketId
 *         required: true
 *         description: ID of the bucket to upload the file to
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *     responses:
 *       '201':
 *         description: Successfully uploaded file
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 filename:
 *                   type: string
 *                 path:
 *                   type: string
 *                 mimetype:
 *                   type: string
 *                 bucket:
 *                   type: string
 *                 owner:
 *                   type: string
 *                 _id:
 *                   type: string
 *                 __v:
 *                   type: number
 *       '400':
 *         description: Bad request
 */
router.post("/:bucketId/files", auth, upload.single('file'), uploadFile);

/**
 * @swagger
 * /file/list/{page}/{pageSize}:
 *   get:
 *     summary: List Files
 *     description: Retrieve a list of files
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: page
 *         required: true
 *         description: Page number
 *         schema:
 *           type: integer
 *       - in: path
 *         name: pageSize
 *         required: true
 *         description: Number of files per page
 *         schema:
 *           type: integer
 *     responses:
 *       '200':
 *         description: Successfully retrieved list of files
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   _id:
 *                     type: string
 *                   filename:
 *                     type: string
 *                   bucketId:
 *                     type: string
 *                   bucketName:
 *                     type: string
 *       '500':
 *         description: Internal server error
 */
router.get("/list/:page/:pageSize", auth, listFiles);

/**
 * @swagger
 * /file/{fileId}:
 *   get:
 *     summary: Get File
 *     description: Retrieve a specific file
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: fileId
 *         required: true
 *         description: ID of the file to retrieve
 *         schema:
 *           type: string
 *     responses:
 *       '200':
 *         description: Successfully retrieved file
 *         content:
 *           application/octet-stream:
 *             schema:
 *               type: string
 *               format: binary
 *       '404':
 *         description: File not found
 *       '500':
 *         description: Internal server error
 */
router.get("/:fileId", auth, getFile);

/**
 * @swagger
 * /file/delete/{bucketId}/{fileId}:
 *   delete:
 *     summary: Delete File
 *     description: Delete a specific file
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: fileId
 *         required: true
 *         description: ID of the file to delete
 *         schema:
 *           type: string
 *       - in: path
 *         name: bucketId
 *         required: true
 *         description: ID of the bucket that the file belongs to
 *         schema:
 *           type: string
 *     responses:
 *       '200':
 *         description: Successfully deleted file
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: Message indicating the success of the deletion operation
 *                   example: File deleted successfully
 *       '409':
 *         description: File does not exist
 *       '500':
 *         description: Internal server error
 */
router.delete("/delete/:bucketId/:fileId", auth, deleteFile);

/**
 * @swagger
 * /file/update/{bucketId}/{fileId}:
 *   put:
 *     summary: Update File
 *     description: Update a specific file
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: bucketId
 *         required: true
 *         description: ID of the bucket that the file belongs to
 *         schema:
 *           type: string
 *       - in: path
 *         name: fileId
 *         required: true
 *         description: ID of the file to update
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *     responses:
 *       '200':
 *         description: File updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: Message indicating the success of the update operation
 *                   example: File updated successfully
 *       '400':
 *         description: Bad request
 *       '404':
 *         description: File not found
 *       '500':
 *         description: Internal server error
 */
router.put("/update/:bucketId/:fileId", auth, upload.single('file'), updateFile);


export default router;