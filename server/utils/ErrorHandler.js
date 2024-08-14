class ErrorHandler extends Error {
    constructor(
        statusCode,
        message= "Something went wrong",
        errors = [],
        stack = ""
    ){
     
        super(message)
        
        this.statusCode = statusCode
        this.data = null
        this.message = message
        this.success = false;
        this.errors = errors
     
        if (stack) {
            this.stack = stack
        } else{
            console.log('this.constructor: ', this.constructor);
           Error.captureStackTrace(this, this.constructor)
        }

    }

    toJSON() {
        return {
            success: this.success,
            statusCode: this.statusCode,
            message: this.message,
            errors: this.errors
        };
    }
   
}

export { ErrorHandler } 