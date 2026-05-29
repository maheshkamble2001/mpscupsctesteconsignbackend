module.exports = {
    hasAccess: (userId, modeleName) => {
        return true;
    },

    base64Encode : (request) => {
        var res = Buffer.from(request).toString('base64');
    
        return res;
    },
    
    base64Decode :  (request) => {
        var res = Buffer.from(request, 'base64').toString('ascii')
    
        return res;
    }
}