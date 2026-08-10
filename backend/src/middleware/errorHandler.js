const errorHandler= (err,req,res,next)=>{
    console.log(err,"error");
    const statusCode = err.statusCode || 500;
    res.status(statusCode).json({
        statusddd:false,
        message:err.message || "Internal server error"
    })
}
module.exports=errorHandler;