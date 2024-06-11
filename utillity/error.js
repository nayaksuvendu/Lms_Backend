class AppError extends Error{
    constructor(message,statusCode){
        super(message);
        this.statusCode=statusCode;
        Error.captureStackTrace(this,this.constructor);
        // above line define paticular line and file where error occured
    }
}
module.exports= AppError;