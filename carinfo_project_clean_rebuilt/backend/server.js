import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import nodemailer from 'nodemailer';

dotenv.config();
const app = express();
app.use(express.json());
app.use(cors());

mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/carinfo', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB error:', err));

let transporter;
async function initMailer() {
  try {
    if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
      transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT) || 587,
        secure: process.env.SMTP_SECURE === 'true',
        auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
      });
      console.log('SMTP transporter configured');
    } else {
      const testAccount = await nodemailer.createTestAccount();
      transporter = nodemailer.createTransport({
        host: testAccount.smtp.host,
        port: testAccount.smtp.port,
        secure: testAccount.smtp.secure,
        auth: { user: testAccount.user, pass: testAccount.pass }
      });
      console.log('Using Ethereal test account');
      console.log('Ethereal user:', testAccount.user);
    }
  } catch (err) { console.error('Mailer init error', err); }
}
initMailer();

const userSchema = new mongoose.Schema({ name:String, email:{type:String,unique:true}, password:String, role:{type:String,enum:['user','admin'],default:'user'} });
const partSchema = new mongoose.Schema({ name:String, price:Number, compatibleWith:[String], image:String, description:String, installGuide:String, youtubeUrl:String, inStock:Boolean, createdAt:{type:Date,default:Date.now} });
const bookingSchema = new mongoose.Schema({ partId:{type:mongoose.Schema.Types.ObjectId,ref:'Part'}, userName:String, contact:String, preferredDate:String, status:{type:String,enum:['pending','confirmed','done'],default:'pending'}, createdAt:{type:Date,default:Date.now} });
const carSchema = new mongoose.Schema({ name:String, brand:String, price:Number, image:String, power:String, range:String, type:{type:String,enum:['New','Used'],default:'New'}, description:String, features:[String], createdAt:{type:Date,default:Date.now} });

const User = mongoose.model('User', userSchema);
const Part = mongoose.model('Part', partSchema);
const Booking = mongoose.model('Booking', bookingSchema);
const Car = mongoose.model('Car', carSchema);

const auth = (req,res,next)=>{ const token=req.header('Authorization')?.replace('Bearer ',''); if(!token) return res.status(401).json({message:'Access Denied'}); try{ req.user=jwt.verify(token, process.env.JWT_SECRET||'devsecret'); next(); }catch(e){res.status(400).json({message:'Invalid Token'})}};

app.post('/api/seed', async (req,res)=>{
  try{
    const carCount = await Car.countDocuments();
    if(carCount>0) return res.status(400).json({message:'Seed already run'});
    const sampleCars=[{name:'Tesla Model S Plaid',brand:'Tesla',price:120000,image:'https://cdn.motor1.com/images/mgl/3x6qR/s1/tesla-model-s-plaid.jpg',power:'1020 hp',range:'390 mi',type:'New'},{name:'Toyota Corolla 2018',brand:'Toyota',price:15000,image:'https://example.com/corolla.jpg',power:'132 hp',range:'N/A',type:'Used'}];
    const sampleParts=[{name:'Brake Pads - Ceramic',price:79.99,compatibleWith:['Honda Civic','Toyota Corolla'],image:'https://example.com/brakepads.jpg',description:'High-performance ceramic brake pads.',installGuide:'# Brake Pad Replacement\n\n1. Jack up the car.\n2. Remove wheel.\n3. Replace pads.',youtubeUrl:'https://www.youtube.com/watch?v=dQw4w9WgXcQ'}];
    await Car.insertMany(sampleCars);
    await Part.insertMany(sampleParts);
    res.json({message:'Seed data inserted'});
  }catch(err){ res.status(500).json({message:'Seed error', error:err.message}); }
});

app.get('/api/parts', async (req,res)=>{ const parts = await Part.find().sort({createdAt:-1}); res.json(parts); });
app.post('/api/bookings', async (req,res)=>{ try{ const {partId,userName,contact,preferredDate}=req.body; const booking=new Booking({partId,userName,contact,preferredDate}); await booking.save(); // send email if transporter
  try{ const populated = await Booking.findById(booking._id).populate('partId'); if(transporter){ const mailOptions={ from: process.env.EMAIL_FROM||'no-reply@carinfo.com', to: process.env.BOOKING_NOTIFY_EMAIL||process.env.SMTP_USER, subject:`New booking ${booking._id}`, html:`<p>Part: ${populated.partId?.name||partId}</p><p>Name: ${booking.userName}</p><p>Contact: ${booking.contact}</p>` }; const info=await transporter.sendMail(mailOptions); console.log('Mail sent', info.messageId); if(nodemailer.getTestMessageUrl){ const preview=nodemailer.getTestMessageUrl(info); if(preview) console.log('Preview URL:', preview); } } }catch(e){console.error('mail error',e);} res.json({message:'Booking received',booking}); }catch(err){ res.status(400).json({message:'Error creating booking',error:err.message}); }});

app.listen(process.env.PORT||5000, ()=>console.log('Server running'));