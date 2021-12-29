// Error handler Class
class ErrorHandler extends Error { //Error is parent class (inheritence)
    constructor(message, statusCode) {
        super(message);
        this.statusCode = statusCode

        Error.captureStackTrace(this, this.constructor)
    }
}

module.exports = ErrorHandler;