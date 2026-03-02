
import User from "../models/user.js";
import jwt from 'jsonwebtoken'; // Import the jsonwebtoken library for JWT operations

// Register a new user
export const register = async (req, res) => {
    try {
        // Check if the user already exists
        const isUser = await User.findOne({ email: req.body.email });

        if (isUser) {
            return res.status(400).json({ error: 'User already exists' });
        }

        // Create a new user instance
        const user = new User(req.body);

        // Save the user to the database
        await user.save();
        
        // Generate authentication token with expiration
        const token = await user.generateAuthToken(3600); // Token expires in 1 hour

        // Send response with user data and token
        res.status(201).send({ user, token });
    } catch (error) {
        // Handle internal server error
        console.error(error);
        res.status(400).json({ error: 'Internal server error' });
    }
}

// User login
export const login = async (req, res) => {
    try {
        // authenticate user if exist
        const user = await User.findByCred(req.body.email, req.body.password)
        // get user token
        const token = await user.generateAuthToken(3600); // Token expires in 1 hour
        
        // Send response with user data
        res.status(200).send({ user, token }); // Token should be defined before sending response
    } catch (error) {
        // Handle internal server error
        console.error(error);
        res.status(400).json({error: "No user found"})
    }
}

// User logout
export const logout = async (req, res) => {
    try {
        // Remove the token from the user's tokens array
        req.user.tokens = req.user.tokens.filter((token) => {
            return token.token !== req.token;
        });

        // Save the updated user data
        await req.user.save();

        // Send success response
        res.status(200).json({Message: 'Logged Out!'});
    } catch (error) {
        // Handle internal server error
        console.error(error);
        res.status(500).json({ Error: 'Internal server error'});
    }
}

// logging out all sessions
export const logoutAll = async (req, res) => {
    try {
        req.user.tokens = []
        await req.user.save()
        res.status(200).json({Message: "All session logged out!"})
    } catch (e) {
        res.status(500).send(e)
    }
};
