const express = require('express');
const {register, login, logout, adminRegister, deleteProfile} = require('../controllers/userAuthent')

const authRouter = express.Router();
const userMiddleware = require('../middleware/userMiddleware')
const adminMiddleware = require('../middleware/adminMiddleware')

// register
authRouter.post('/register', register);
authRouter.post('/login', login);
authRouter.post('/logout',userMiddleware,logout)
authRouter.post('/admin/register',adminMiddleware,adminRegister);
authRouter.delete('/deleteProfile', userMiddleware, deleteProfile);
authRouter.get('/check', userMiddleware, (req,res)=>{
  
  const reply = {
    firstName: req.result.firstName,
    emailId: req.result.emailId,
    _id: req.result._id,
    role: req.result.role || 'user'
  }

  res.status(200).json({
    user:reply,
    message:"Valid user"
  })
})
//authRouter.get('getProfile', getProfile);

module.exports = authRouter;
// login
// logout
// getpro