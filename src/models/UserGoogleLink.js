const mongoose = require('mongoose');

// Define the schema for User Google Link
const userGoogleLinkSchema = new mongoose.Schema({
    externalUserId: { 
        type: String, 
        required: true 
    },
    googleEmail: { 
        type: String, 
        required: true 
    },
    googleMetadata: { 
        type: Object, 
        default: {} 
    },
    appId: { 
        type: String, 
        required: true 
    }
}, {
    timestamps: true // Optional: Add timestamps for createdAt and updatedAt
});

// Create a compound index for unique combination of appId, externalUserId and googleEmail
userGoogleLinkSchema.index({ appId: 1, externalUserId: 1, googleEmail: 1 }, { unique: true });

// Create a compound index for appId and googleEmail for improved search performance
userGoogleLinkSchema.index({ appId: 1, googleEmail: 1 }); // Index for appId and googleEmail

// Export the model
module.exports = mongoose.model('UserGoogleLink', userGoogleLinkSchema);

async function getUserGoogleLinkByGoogleEmail(googleEmail) {
    try {
        // Search for the UserGoogleLink document by the provided googleEmail
        const userGoogleLink = await mongoose.model('UserGoogleLink').findOne({ googleEmail });
        
        // Return the found document or null if not found
        return userGoogleLink || null; // Return null if no document found
    } catch (error) {
        // Handle any errors that may occur during the query
        console.error('Error retrieving user by Google email:', error);
        throw error; // Rethrow the error for further handling, if necessary
    }
}

async function linkExternalUser(appId,externalUserId, googleEmail, googleMetadata = {}) {
    try {
        // Check if a link already exists for the provided combination
        const existingLink = await mongoose.model('UserGoogleLink').findOne({
            appId,
            externalUserId,
            googleEmail
        });

        if (existingLink) {
            // If an existing link is found, you can return it or handle the situation as needed
            return { message: 'User already linked', userGoogleLink: existingLink };
        }

        // Create a new UserGoogleLink document
        const newLink = new mongoose.model('UserGoogleLink')({
            externalUserId,
            googleEmail,
            googleMetadata,
            appId
        });

        // Save the new link to the database
        const savedLink = await newLink.save();

        // Return the saved document
        return { message: 'User linked successfully', userGoogleLink: savedLink };
    } catch (error) {
        // Handle any errors that may occur during the database operations
        console.error('Error linking external user:', error);
        throw error; // Rethrow the error for further handling, if necessary
    }
}


global.getUserGoogleLinkByGoogleEmail = getUserGoogleLinkByGoogleEmail
global.linkExternalUser = linkExternalUser
