module.exports = apiAuthMiddleware

/**
 * Google auth server API-KEY auth middleware that grants access to /googlelogin routes
 * 
 * @param {*} req 
 * @param {*} res 
 * @param {*} next 
 * @returns 
 */
function apiAuthMiddleware(req, res, next){
    const authHeader = req.headers['authorization'];
    const apiKeyHeader = req.headers['authorization-key'];
    const validApiKey = process.env.MICROSERVICE_GOOGLELOGIN_API_KEY;

    // Check for Bearer token
    if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.split(' ')[1];
        
        // Here you would typically verify the token, we'll just check for simulation
        if (token === validApiKey) {
            return next();
        }
    }

    // Check for API key
    if (apiKeyHeader && apiKeyHeader === validApiKey) {
        return next();
    }

    // If neither check passed, respond with 403 Forbidden
    return res.status(403).json({ error: 'Forbidden: Invalid API Key or Token' });
};